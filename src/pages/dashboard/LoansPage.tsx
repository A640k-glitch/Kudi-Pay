import React, { useState, useEffect } from 'react';
import { CheckCircle, Info } from '@phosphor-icons/react';
import { ledgerService } from '../../lib/services/ledgerService';
import { trustScoreService } from '../../lib/services/trustScoreService';
import { bankAccountService } from '../../lib/services/bankAccountService';
import { businessVerificationService } from '../../lib/services/businessVerificationService';
import { formatNaira } from '../../lib/utils';
import type { LoanTier, ActiveLoan, TrustScoreBreakdown, Business } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';

export default function LoansPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [balance, setBalance] = useState(0);
  const [activeLoan, setActiveLoan] = useState<ActiveLoan | null>(null);
  const [scoreData, setScoreData] = useState<TrustScoreBreakdown | null>(null);
  const [applyingTier, setApplyingTier] = useState<LoanTier | null>(null);
  
  const [inputAmount, setInputAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [allLoans, setAllLoans] = useState<ActiveLoan[]>([]);

  const loadData = async (bId: string, biz: Business) => {
    // Ledger Balance
    const stats = await ledgerService.getStats(bId);
    setBalance(stats.balance);
    
    // Active Loan
    const loan = await trustScoreService.getActiveLoan(bId);
    setActiveLoan(loan);

    // Compute Score to get eligibility
    const transactions = await bankAccountService.getTransactions(bId);
    const cacVerification = await businessVerificationService.getCACVerification(bId) || undefined;
    const productsStr = localStorage.getItem('kudi_products');
    const products = productsStr ? JSON.parse(productsStr).filter((p: any) => p.businessId === bId) : [];
    const loans = await trustScoreService.getLoans(bId);
    setAllLoans(loans);

    // Orders
    const ordersStr = localStorage.getItem('kudi_orders');
    const orders = ordersStr ? JSON.parse(ordersStr).filter((o: any) => o.businessId === bId) : [];

    // Linked bank account status
    const hasLinkedAccount = await bankAccountService.hasLinkedAccount(bId);

    const score = trustScoreService.computeScore({
      businessId: bId,
      businessCreatedAt: biz.createdAt,
      cacVerification,
      transactions,
      products,
      loans,
      orders,
      hasLinkedAccount
    });
    setScoreData(score);
  };

  useEffect(() => {
    async function init() {
      const phone = authService.getCurrentPhone();
      if (!phone) return;
      const b = await businessService.getBusinessByPhone(phone);
      if (b) {
        setBusiness(b);
        await loadData(b.id, b);
      }
    }
    init();
  }, []);

  const handleOpenApply = (tier: LoanTier) => {
    setApplyingTier(tier);
    setInputAmount(tier.amountMax.toString());
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !applyingTier) return;
    const amt = parseFloat(inputAmount.replace(/\D/g, ''));
    if (isNaN(amt) || amt <= 0 || amt > applyingTier.amountMax) {
      alert("Invalid application amount");
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      const interestAmt = amt * (applyingTier.interest / 100);
      const repaymentAmt = amt + interestAmt;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + applyingTier.termDays);
      
      const loanObj: ActiveLoan = {
        id: `loan_${Math.floor(Math.random() * 1000000)}`,
        businessId: business.id,
        tierId: applyingTier.id,
        tierName: applyingTier.name,
        amount: amt,
        interestRate: applyingTier.interest,
        repaymentAmount: repaymentAmt,
        status: 'active',
        disbursedAt: new Date().toISOString(),
        dueAt: dueDate.toISOString(),
      };

      // Disburse funds to ledger
      await ledgerService.addEntry({
        businessId: business.id,
        type: 'revenue',
        amount: amt,
        source: 'loan_disbursement',
        verificationStatus: 'verified',
        verificationSource: 'bank_api',
        metadata: { description: `Disbursement of ${applyingTier.name}` }
      });

      // Save loan
      trustScoreService.saveLoan(loanObj);
      setActiveLoan(loanObj);
      setApplyingTier(null);
      setIsSubmitting(false);
      setSuccessMsg(`₦${amt.toLocaleString()} has been disbursed to your ledger.`);
      await loadData(business.id, business);
    }, 2000);
  };

  const handleRepayLoan = async () => {
    if (!business || !activeLoan) return;
    
    if (balance < activeLoan.repaymentAmount) {
      alert("Insufficient ledger balance to repay this loan. Log more sales first!");
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      // Deduct from ledger
      await ledgerService.addEntry({
        businessId: business.id,
        type: 'expense',
        amount: activeLoan.repaymentAmount,
        source: 'loan_repayment',
        verificationStatus: 'verified',
        verificationSource: 'bank_api',
        metadata: { description: `Repayment of ${activeLoan.tierId} Loan` }
      });

      // Mark loan repaid
      const repaidLoan: ActiveLoan = {
        ...activeLoan,
        status: 'repaid',
        repaidAt: new Date().toISOString()
      };
      trustScoreService.saveLoan(repaidLoan);
      
      setActiveLoan(null);
      setIsSubmitting(false);
      alert("Loan successfully repaid! Your repayment history score will improve.");
      await loadData(business.id, business);
    }, 1500);
  };

  const loanTiers = trustScoreService.getLoanTiers();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-8 pb-24 selection:bg-[#E0FF4F] selection:text-slate-900">
      {/* Title Header */}
      <header className="mb-4 border-b-2 border-slate-200 pb-4">
        <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 leading-tight mb-2">
          Capital Limits
        </h1>
        <p className="text-sm md:text-base font-bold text-slate-500">
          Unlock higher financing limits automatically as your credit score increases.
        </p>
      </header>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-[#E0FF4F] border-2 border-slate-900 text-slate-900 p-4 rounded-[16px] flex gap-4 items-start shadow-[4px_4px_0px_#0f172a]">
          <CheckCircle className="w-8 h-8 shrink-0 mt-0.5" weight="fill" />
          <div>
            <span className="font-black text-lg block">Approved!</span> 
            <span className="font-bold text-sm block mb-2">{successMsg}</span>
            <button className="text-sm font-black hover:opacity-70 transition-opacity underline decoration-2" onClick={() => setSuccessMsg('')}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Building Warning */}
      {scoreData?.isBuilding && !activeLoan && (
        <div className="max-w-md mx-auto text-sm font-medium text-amber-800 bg-amber-50 border-2 border-amber-200 rounded-[12px] p-4 shadow-sm flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" weight="bold" />
          <div>
            <span className="font-bold block mb-1">Score Profile Building</span>
            <span className="text-amber-700/80 block">Your trust score is still building. The system requires at least 4 weeks of bank data to offer full loan limits. Limits below are estimated.</span>
          </div>
        </div>
      )}

      {/* Active Loan Details */}
      {activeLoan ? (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <span className="text-xl font-display font-black text-slate-900">
              Active Loan
            </span>
            <span className={`px-3 py-1 border-2 border-slate-900 text-xs font-black uppercase shadow-[2px_2px_0px_#0f172a] rounded-[8px] ${
              activeLoan.status === 'overdue' ? 'bg-[#FF6666] text-white' : 'bg-[#FFD166] text-slate-900'
            }`}>
              Due {new Date(activeLoan.dueAt).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">Disbursed</span>
              <span className="text-2xl md:text-3xl font-black text-slate-900">{formatNaira(activeLoan.amount)}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">Repayment Due</span>
              <span className="text-2xl md:text-3xl font-black text-slate-900">{formatNaira(activeLoan.repaymentAmount)}</span>
            </div>
          </div>

          <div className="pt-6 border-t-2 border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm font-bold text-slate-600 bg-slate-50 border-2 border-slate-200 rounded-[12px] px-4 py-3">
              Ledger Balance: <span className="font-black text-slate-900 ml-2">{formatNaira(balance)}</span>
            </p>
            <button 
              className="w-full md:w-auto py-3.5 px-8 bg-slate-900 text-white font-bold rounded-[12px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50"
              onClick={handleRepayLoan}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Repay Loan'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Loan Form / Application screen */}
      {applyingTier && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <h3 className="font-display font-black text-xl text-slate-900">Apply: {applyingTier.name}</h3>
            <button className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors" onClick={() => setApplyingTier(null)}>Cancel</button>
          </div>

          <form onSubmit={handleApplySubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm font-bold bg-[#E0FF4F] border-2 border-slate-900 p-4 rounded-[12px] shadow-[4px_4px_0px_#0f172a]">
              <div>
                <span className="text-slate-800 block mb-1">Interest Rate</span>
                <span className="font-black text-xl text-slate-900">{applyingTier.interest}% flat</span>
              </div>
              <div>
                <span className="text-slate-800 block mb-1">Term</span>
                <span className="font-black text-xl text-slate-900">{applyingTier.term}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-900 text-sm mb-2">Amount to request (Max: ₦{applyingTier.amountMax.toLocaleString()})</label>
              <input
                type="text"
                value={inputAmount ? Number(inputAmount).toLocaleString() : ''}
                onChange={(e) => setInputAmount(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold text-slate-900 outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]"
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white font-bold rounded-[12px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50">
              {isSubmitting ? 'Processing...' : 'Submit & Disburse'}
            </button>
          </form>
        </div>
      )}

      {/* Lending Tiers Catalog */}
      <div className="glass-panel p-6 space-y-6">
        <div className="border-b-2 border-slate-100 pb-4">
          <h3 className="font-display font-black text-xl text-slate-900 mb-1">Available Limits</h3>
          <p className="text-sm font-bold text-slate-500">Tiers unlock automatically as your trust score increases.</p>
        </div>

        <div className="divide-y-2 divide-slate-100">
          {loanTiers.map((tier, idx) => {
            const eligibility = scoreData?.loanEligibility.find(e => e.tierId === tier.id);
            const isUnlocked = eligibility?.eligible ?? false;
            
            return (
              <div key={tier.id} className={`py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${!isUnlocked ? 'opacity-60 grayscale' : ''}`}>
                <div>
                  <div className="font-black text-base flex items-center gap-3 mb-1 text-slate-900">
                    <span className="bg-slate-900 text-[#E0FF4F] px-2 py-0.5 rounded-[6px] text-[10px] uppercase tracking-wider shadow-sm">TIER {idx + 1}</span>
                    {tier.name}
                    {!isUnlocked && (
                      <span className="px-2 py-0.5 border-2 border-slate-200 text-[10px] font-bold bg-slate-50 text-slate-500 rounded-[6px]">
                        SCORE {tier.requiredScore}+
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-600 mt-1">
                    Limit: <span className="font-bold text-slate-900">{tier.amountText}</span> • Term: <span className="font-bold text-slate-900">{tier.term}</span> • Interest: <span className="font-bold text-slate-900">{tier.interest}%</span>
                  </div>
                </div>

                {isUnlocked ? (
                  <button
                    disabled={!!activeLoan || !!applyingTier}
                    onClick={() => handleOpenApply(tier)}
                    className={`text-sm font-bold px-6 py-2.5 rounded-[12px] border-2 transition-all shrink-0
                      ${!!activeLoan || !!applyingTier
                        ? 'bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-white border-slate-900 text-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none'
                      }
                    `}
                  >
                    Apply Now
                  </button>
                ) : (
                  <button
                    disabled
                    className="text-sm font-bold px-6 py-2.5 rounded-[12px] border-2 border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed shrink-0 flex items-center justify-center gap-2"
                  >
                    Locked
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Past Loans History */}
      {(() => {
        const pastLoans = allLoans.filter(l => l.status === 'repaid' || l.status === 'overdue');
        if (pastLoans.length === 0) return null;
        return (
          <div className="glass-panel p-6 space-y-4">
            <div className="border-b-2 border-slate-100 pb-4">
              <h3 className="font-display font-black text-xl text-slate-900 mb-1">Loan History</h3>
              <p className="text-sm font-bold text-slate-500">Your past loan activity and repayment record.</p>
            </div>
            <div className="divide-y-2 divide-slate-100">
              {pastLoans.map(loan => (
                <div key={loan.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-slate-900 text-sm">{loan.tierName}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[6px] ${
                        loan.status === 'repaid'
                          ? 'bg-[#10B981] text-white'
                          : 'bg-[#FF6666] text-white'
                      }`}>
                        {loan.status === 'repaid' ? 'Repaid ✓' : 'Overdue'}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      Disbursed: {new Date(loan.disbursedAt).toLocaleDateString()}
                      {loan.repaidAt && ` · Repaid: ${new Date(loan.repaidAt).toLocaleDateString()}`}
                      {!loan.repaidAt && ` · Due: ${new Date(loan.dueAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900 tabular-nums">{formatNaira(loan.amount)}</div>
                    <div className="text-xs font-bold text-slate-500">{loan.interestRate}% interest</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
