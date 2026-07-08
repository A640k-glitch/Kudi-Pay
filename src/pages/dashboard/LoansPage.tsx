import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, CheckCircle2, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { ledgerService } from '../../lib/services/ledgerService';
import { formatNaira } from '../../lib/utils';
import { Input } from '../../components/FormInputs';

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
  { id: 't1', name: 'Tier 1 — Micro starter', amountText: '₦10,000 - ₦20,000', amountMax: 20000, term: '7 days', interest: 3, requiredScore: 300, unlocked: true },
  { id: 't2', name: 'Tier 2 — Inventory booster', amountText: '₦50,000', amountMax: 50000, term: '14 days', interest: 5, requiredScore: 500, unlocked: true },
  { id: 't3', name: 'Tier 3 — Growth catalyst', amountText: '₦100,000', amountMax: 100000, term: '30 days', interest: 8, requiredScore: 700, unlocked: false },
  { id: 't4', name: 'Tier 4 — Expansion scale', amountText: '₦250,000', amountMax: 250000, term: '60 days', interest: 10, requiredScore: 800, unlocked: false },
  { id: 't5', name: 'Tier 5 — Custom partner', amountText: '₦500,000+', amountMax: 500000, term: 'Negotiated', interest: 12, requiredScore: 900, unlocked: false },
];

export default function LoansPage() {
  const [businessId, setBusinessId] = useState('');
  const [balance, setBalance] = useState(86000);
  const [activeLoan, setActiveLoan] = useState<{ amount: number; tierId: string; repayment: number; dueAt: string } | null>(null);
  const [applyingTier, setApplyingTier] = useState<LoanTier | null>(null);
  
  // Form values
  const [inputAmount, setInputAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadBalance = async (bId: string) => {
    const stats = await ledgerService.getStats(bId);
    setBalance(stats.balance);
  };

  useEffect(() => {
    // Get business session details
    const str = localStorage.getItem('coda_businesses');
    const phone = localStorage.getItem('coda_session_phone');
    if (str && phone) {
      const businesses = JSON.parse(str);
      const b = businesses.find((b: any) => b.ownerPhone === phone);
      if (b) {
        setBusinessId(b.id);
        loadBalance(b.id);
        
        // Check active loan
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
    const amt = parseFloat(inputAmount);
    if (isNaN(amt) || amt <= 0 || amt > applyingTier.amountMax) {
      alert("Invalid application amount");
      return;
    }

    setIsSubmitting(true);
    // Simulate approval duration
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

      // Record to ledger as revenue (disbursement)
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
      setSuccessMsg(`₦${amt.toLocaleString()} has been disbursed to your Kudi balance.`);
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
    // Simulate transaction delay
    setTimeout(async () => {
      // Record payment transaction
      await ledgerService.addEntry({
        businessId,
        type: 'expense',
        amount: activeLoan.repayment,
        source: 'loan_repayment',
        metadata: { description: `Repayment of Tiered Loan` }
      });

      // Award +100 trust score points
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
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 bg-[#F5F5F4] min-h-screen pb-24">
      {/* Title Header */}
      <header className="mb-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#059669]">
          Lending Marketplace
        </span>
        <h1 className="text-xl md:text-2xl font-bold font-display text-gray-900 mt-1 leading-tight">
          Progressive Loan Tiers
        </h1>
        <p className="text-xs md:text-[13px] text-gray-500 mt-0.5">
          Unlock higher financing limits automatically as your Capital Readiness Score increases.
        </p>
      </header>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-[#059669] p-4 rounded-xl flex gap-3 items-start text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Application Approved!</span> {successMsg}
            <button className="block underline font-semibold mt-2" onClick={() => setSuccessMsg('')}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Active Loan Details */}
      {activeLoan ? (
        <div className="bg-white rounded-xl border border-indigo-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Active Business Loan
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
              Due {activeLoan.dueAt}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-gray-400 block">Disbursed Amount</span>
              <span className="text-lg font-bold text-gray-900">{formatNaira(activeLoan.amount)}</span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">Total Repayment Due</span>
              <span className="text-lg font-bold text-gray-900">{formatNaira(activeLoan.repayment)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-4">
            <p className="text-[11px] text-gray-500">
              Liquid Balance: <span className="font-semibold text-gray-800">{formatNaira(balance)}</span>
            </p>
            <Button 
              className="text-xs font-semibold px-4 h-9" 
              onClick={handleRepayLoan}
              isLoading={isSubmitting}
            >
              Repay Loan
            </Button>
          </div>
        </div>
      ) : null}

      {/* Loan Form / Application screen */}
      {applyingTier && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm">Apply for {applyingTier.name}</h3>
            <button className="text-xs text-gray-500 hover:underline" onClick={() => setApplyingTier(null)}>Cancel</button>
          </div>

          <form onSubmit={handleApplySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div>
                <span className="text-gray-400 block">Interest Rate:</span>
                <span className="font-bold text-gray-800">{applyingTier.interest}% flat</span>
              </div>
              <div>
                <span className="text-gray-400 block">Repayment Term:</span>
                <span className="font-bold text-gray-800">{applyingTier.term}</span>
              </div>
            </div>

            <Input
              type="number"
              label={`Amount to request (Max: ₦${applyingTier.amountMax.toLocaleString()})`}
              min={1000}
              max={applyingTier.amountMax}
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              required
            />

            <Button type="submit" className="w-full text-xs font-semibold h-10" isLoading={isSubmitting}>
              Submit Application &amp; Disburse
            </Button>
          </form>
        </div>
      )}

      {/* Lending Tiers Catalog */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Available Lending Limits</h3>
          <p className="text-xs text-gray-500 mt-0.5">Tiers open dynamically based on your credit score status.</p>
        </div>

        <div className="divide-y divide-gray-100">
          {LOAN_TIERS.map(tier => (
            <div key={tier.id} className="py-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 text-xs flex items-center gap-1.5">
                  {tier.name}
                  {!tier.unlocked && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-gray-100 text-gray-500">
                      Score {tier.requiredScore}+
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Limit: {tier.amountText} • Term: {tier.term} • Interest: {tier.interest}%
                </div>
              </div>

              {tier.unlocked ? (
                <button
                  disabled={!!activeLoan || !!applyingTier}
                  onClick={() => handleOpenApply(tier)}
                  className={`text-[12px] font-bold px-4 py-1.5 rounded-lg transition-all select-none
                    ${!!activeLoan || !!applyingTier
                      ? 'bg-gray-50 text-gray-300 border border-transparent'
                      : 'bg-indigo-50 border border-indigo-100 text-primary hover:bg-indigo-100/50 cursor-pointer'
                    }
                  `}
                >
                  Apply
                </button>
              ) : (
                <button
                  disabled
                  className="text-[11px] font-semibold px-3 py-1 bg-gray-50 border border-transparent text-gray-400 rounded-lg"
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
