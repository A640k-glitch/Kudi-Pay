import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import BrutalButton from '../../components/ui/BrutalButton';
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
    const amt = parseFloat(inputAmount);
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
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-8 bg-[#FDFBF7] min-h-screen pb-24 selection:bg-black selection:text-white">
      {/* Title Header */}
      <header className="mb-4 border-b-[4px] border-black pb-4">
        <span className="inline-block bg-[#E0FF4F] border-[3px] border-black px-2 py-1 text-[10px] font-black uppercase tracking-widest text-black mb-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          Lending Marketplace
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-black uppercase leading-tight mb-2">
          Capital Limits
        </h1>
        <p className="text-sm font-bold uppercase text-gray-700">
          Unlock higher financing limits automatically as your credit score increases.
        </p>
      </header>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-[#E0FF4F] border-[4px] border-black text-black p-4 flex gap-4 items-start shadow-[4px_4px_0px_rgba(0,0,0,1)] -rotate-1">
          <CheckCircle2 className="w-8 h-8 shrink-0 mt-0.5" strokeWidth={2.5} />
          <div>
            <span className="font-black text-lg block uppercase">Approved!</span> 
            <span className="font-bold text-sm uppercase">{successMsg}</span>
            <button className="block underline decoration-[3px] font-black mt-2 hover:bg-black hover:text-[#E0FF4F] px-1" onClick={() => setSuccessMsg('')}>DISMISS</button>
          </div>
        </div>
      )}

      {/* Active Loan Details */}
      {activeLoan ? (
        <div className="bg-white border-[4px] border-black p-6 space-y-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
            <span className="text-xl font-black uppercase text-black">
              Active Loan
            </span>
            <span className="px-3 py-1 border-[3px] border-black text-xs font-black uppercase bg-[#FF6666] text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              Due {activeLoan.dueAt}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-xs font-black uppercase text-gray-500 block mb-1">Disbursed</span>
              <span className="text-2xl md:text-3xl font-black text-black">{formatNaira(activeLoan.amount)}</span>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-gray-500 block mb-1">Repayment Due</span>
              <span className="text-2xl md:text-3xl font-black text-black">{formatNaira(activeLoan.repayment)}</span>
            </div>
          </div>

          <div className="pt-6 border-t-[4px] border-black flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm font-bold uppercase text-gray-700 bg-gray-100 border-[3px] border-black px-3 py-2">
              Ledger Balance: <span className="font-black text-black ml-2">{formatNaira(balance)}</span>
            </p>
            <BrutalButton 
              className="w-full md:w-auto h-12" 
              onClick={handleRepayLoan}
              isLoading={isSubmitting}
            >
              REPAY LOAN
            </BrutalButton>
          </div>
        </div>
      ) : null}

      {/* Loan Form / Application screen */}
      {applyingTier && (
        <div className="bg-white border-[4px] border-black p-6 space-y-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between border-b-[4px] border-black pb-4">
            <h3 className="font-black text-xl uppercase text-black">Apply: {applyingTier.name}</h3>
            <button className="text-xs font-black uppercase text-gray-500 hover:text-black underline decoration-[3px]" onClick={() => setApplyingTier(null)}>CANCEL</button>
          </div>

          <form onSubmit={handleApplySubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm font-bold bg-[#E0FF4F] border-[3px] border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <div>
                <span className="text-black uppercase block mb-1">Interest Rate</span>
                <span className="font-black text-xl">{applyingTier.interest}% flat</span>
              </div>
              <div>
                <span className="text-black uppercase block mb-1">Term</span>
                <span className="font-black text-xl">{applyingTier.term}</span>
              </div>
            </div>

            <div>
              <label className="block font-black uppercase text-xs mb-2">Amount to request (Max: ₦{applyingTier.amountMax.toLocaleString()})</label>
              <input
                type="number"
                min={1000}
                max={applyingTier.amountMax}
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                required
                className="w-full border-[3px] border-black p-3 font-bold text-lg outline-none focus:bg-[#E0FF4F] transition-colors"
              />
            </div>

            <BrutalButton type="submit" className="w-full h-14" isLoading={isSubmitting}>
              SUBMIT &amp; DISBURSE
            </BrutalButton>
          </form>
        </div>
      )}

      {/* Lending Tiers Catalog */}
      <div className="bg-white border-[4px] border-black p-6 space-y-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="border-b-[4px] border-black pb-4">
          <h3 className="font-black text-xl uppercase text-black mb-1">Available Limits</h3>
          <p className="text-xs font-bold uppercase text-gray-600">Tiers unlock automatically.</p>
        </div>

        <div className="divide-y-[3px] divide-black">
          {LOAN_TIERS.map((tier, idx) => (
            <div key={tier.id} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="font-black uppercase text-sm flex items-center gap-2 mb-1">
                  <span className="bg-black text-[#E0FF4F] px-2 py-0.5">TIER {idx + 1}</span>
                  {tier.name}
                  {!tier.unlocked && (
                    <span className="px-2 py-0.5 border-[2px] border-gray-400 text-[10px] font-black bg-gray-100 text-gray-500">
                      SCORE {tier.requiredScore}+
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold uppercase text-gray-700">
                  Limit: {tier.amountText} • Term: {tier.term} • Interest: {tier.interest}%
                </div>
              </div>

              {tier.unlocked ? (
                <button
                  disabled={!!activeLoan || !!applyingTier}
                  onClick={() => handleOpenApply(tier)}
                  className={`text-sm font-black uppercase border-[3px] border-black px-6 py-2 transition-transform select-none
                    ${!!activeLoan || !!applyingTier
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-[#4D9DE0] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none'
                    }
                  `}
                >
                  APPLY
                </button>
              ) : (
                <button
                  disabled
                  className="text-xs font-black uppercase px-4 py-2 border-[3px] border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                >
                  LOCKED
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
