import React, { useState, useEffect } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { ledgerService } from '../../lib/services/ledgerService';
import { formatNaira } from '../../lib/utils';

interface LoanTier {
  id: string;
  name: string;
  amountText: string;
  amountMax: number;
  term: string;
  interest: number;
  requiredScore: number;
  unlocked: boolean;
}

const LOAN_TIERS: LoanTier[] = [
  { id: 't1', name: 'Micro starter', amountText: '₦10,000 - ₦20,000', amountMax: 20000, term: '7 days', interest: 3, requiredScore: 300, unlocked: true },
  { id: 't2', name: 'Inventory booster', amountText: '₦50,000', amountMax: 50000, term: '14 days', interest: 5, requiredScore: 500, unlocked: true },
  { id: 't3', name: 'Growth catalyst', amountText: '₦100,000', amountMax: 100000, term: '30 days', interest: 8, requiredScore: 700, unlocked: false },
  { id: 't4', name: 'Expansion scale', amountText: '₦250,000', amountMax: 250000, term: '60 days', interest: 10, requiredScore: 800, unlocked: false },
  { id: 't5', name: 'Custom partner', amountText: '₦500,000+', amountMax: 500000, term: 'Negotiated', interest: 12, requiredScore: 900, unlocked: false },
];

export default function LoansPage() {
  const [businessId, setBusinessId] = useState('');
  const [balance, setBalance] = useState(86000);
  const [activeLoan, setActiveLoan] = useState<{ amount: number; tierId: string; repayment: number; dueAt: string } | null>(null);
  const [applyingTier, setApplyingTier] = useState<LoanTier | null>(null);
  
  const [inputAmount, setInputAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadBalance = async (bId: string) => {
    const stats = await ledgerService.getStats(bId);
    setBalance(stats.balance);
  };

  useEffect(() => {
    const str = localStorage.getItem('coda_businesses');
    const phone = localStorage.getItem('coda_session_phone');
    if (str && phone) {
      const businesses = JSON.parse(str);
      const b = businesses.find((b: any) => b.ownerPhone === phone);
      if (b) {
        setBusinessId(b.id);
        loadBalance(b.id);
        
        const loanStr = localStorage.getItem(`aza_active_loan_${b.id}`);
        if (loanStr) {
          setActiveLoan(JSON.parse(loanStr));
        }
      }
    }
  }, []);

  const handleOpenApply = (tier: LoanTier) => {
    setApplyingTier(tier);
    setInputAmount(tier.amountMax.toString());
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !applyingTier) return;
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
      dueDate.setDate(dueDate.getDate() + (applyingTier.id === 't1' ? 7 : 14));
      
      const loanObj = {
        amount: amt,
        tierId: applyingTier.id,
        repayment: repaymentAmt,
        dueAt: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      await ledgerService.addEntry({
        businessId,
        type: 'revenue',
        amount: amt,
        source: 'loan_disbursement',
        metadata: { description: `Disbursement of ${applyingTier.name}` }
      });

      localStorage.setItem(`aza_active_loan_${businessId}`, JSON.stringify(loanObj));
      setActiveLoan(loanObj);
      setApplyingTier(null);
      setIsSubmitting(false);
      setSuccessMsg(`₦${amt.toLocaleString()} has been disbursed to your ledger.`);
      await loadBalance(businessId);
    }, 2000);
  };

  const handleRepayLoan = async () => {
    if (!businessId || !activeLoan) return;
    
    if (balance < activeLoan.repayment) {
      alert("Insufficient ledger balance to repay this loan. Log more sales first!");
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      await ledgerService.addEntry({
        businessId,
        type: 'expense',
        amount: activeLoan.repayment,
        source: 'loan_repayment',
        metadata: { description: `Repayment of Tiered Loan` }
      });

      const scoreKey = `aza_trust_points_${businessId}`;
      const curPoints = Number(localStorage.getItem(scoreKey) || "350");
      localStorage.setItem(scoreKey, String(Math.min(500, curPoints + 100)));

      localStorage.removeItem(`aza_active_loan_${businessId}`);
      setActiveLoan(null);
      setIsSubmitting(false);
      alert("Loan successfully repaid! Awarded +100 Capital Readiness points!");
      await loadBalance(businessId);
    }, 1500);
  };

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

      {/* Active Loan Details */}
      {activeLoan ? (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <span className="text-xl font-display font-black text-slate-900">
              Active Loan
            </span>
            <span className="px-3 py-1 border-2 border-slate-900 text-xs font-black uppercase bg-[#FF6666] text-white shadow-[2px_2px_0px_#0f172a] rounded-[8px]">
              Due {activeLoan.dueAt}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">Disbursed</span>
              <span className="text-2xl md:text-3xl font-black text-slate-900">{formatNaira(activeLoan.amount)}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">Repayment Due</span>
              <span className="text-2xl md:text-3xl font-black text-slate-900">{formatNaira(activeLoan.repayment)}</span>
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
          <p className="text-sm font-bold text-slate-500">Tiers unlock automatically.</p>
        </div>

        <div className="divide-y-2 divide-slate-100">
          {LOAN_TIERS.map((tier, idx) => (
            <div key={tier.id} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="font-black text-base flex items-center gap-3 mb-1 text-slate-900">
                  <span className="bg-slate-900 text-[#E0FF4F] px-2 py-0.5 rounded-[6px] text-[10px] uppercase tracking-wider shadow-sm">TIER {idx + 1}</span>
                  {tier.name}
                  {!tier.unlocked && (
                    <span className="px-2 py-0.5 border-2 border-slate-200 text-[10px] font-bold bg-slate-50 text-slate-500 rounded-[6px]">
                      SCORE {tier.requiredScore}+
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-slate-600 mt-1">
                  Limit: <span className="font-bold text-slate-900">{tier.amountText}</span> • Term: <span className="font-bold text-slate-900">{tier.term}</span> • Interest: <span className="font-bold text-slate-900">{tier.interest}%</span>
                </div>
              </div>

              {tier.unlocked ? (
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
                  className="text-sm font-bold px-6 py-2.5 rounded-[12px] border-2 border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed shrink-0"
                >
                  Locked
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
