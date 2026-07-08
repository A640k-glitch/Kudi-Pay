import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, CheckCircle, Percent, AlertCircle } from 'lucide-react';
import { Button } from '../../components/Button';

interface FactorItemProps {
  label: string;
  weight: number;
  score: number; // 0-100
  status: string;
}

function FactorItem({ label, weight, score, status }: FactorItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-gray-900">{label}</span>
        <span className="text-gray-500 text-xs">Weight: {weight}%</span>
      </div>
      <div className="flex items-center gap-3">
        {/* Rating Bar */}
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${score}%` }} 
          />
        </div>
        <span className="text-xs font-bold text-gray-900 w-10 text-right">{score}/100</span>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shrink-0
          ${score >= 80 ? 'bg-emerald-50 text-[#059669]' : ''}
          ${score >= 50 && score < 80 ? 'bg-indigo-50 text-primary' : ''}
          ${score < 50 ? 'bg-amber-50 text-amber-700' : ''}
        `}>
          {status}
        </span>
      </div>
    </div>
  );
}

export default function TrustScorePage() {
  const navigate = useNavigate();
  const [points, setPoints] = useState(350); // out of 500

  useEffect(() => {
    // Read local trust points
    const str = localStorage.getItem('coda_businesses');
    const phone = localStorage.getItem('coda_session_phone');
    if (str && phone) {
      const businesses = JSON.parse(str);
      const b = businesses.find((b: any) => b.ownerPhone === phone);
      if (b) {
        const pts = localStorage.getItem(`aza_trust_points_${b.id}`);
        if (pts) setPoints(Number(pts));
      }
    }
  }, []);

  const readinessPercent = Math.round((points / 500) * 100);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 bg-[#F5F5F4] min-h-screen pb-24">
      {/* Title */}
      <header className="mb-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#059669]">
          Credit &amp; Analytics
        </span>
        <h1 className="text-xl md:text-2xl font-bold font-display text-gray-900 mt-1 leading-tight">
          Credit Health Summary
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Your weighted rating determines loan eligibility and virtual account limits.
        </p>
      </header>

      {/* Main Score Board */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-4">
        <div>
          <div className="text-[48px] font-bold font-display text-gray-900 leading-none">
            640
          </div>
          <div className="text-xs font-semibold text-gray-400 mt-1">out of 1000 points</div>
        </div>

        <div className="max-w-xs mx-auto text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
          Your credit profile is rated <span className="font-semibold text-primary">Good</span>. 
          You qualify for Tier 1 &amp; 2 micro-business loans.
        </div>

        <div className="pt-2">
          <Button className="w-full text-xs font-semibold flex items-center justify-center gap-1.5" onClick={() => navigate('/dashboard/loans')}>
            View Loan Eligibility <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Weighted Factors Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Score Breakdown</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Six dimensions defined by Kudi to measure transaction consistency.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <FactorItem 
            label="Revenue Stability" 
            weight={25} 
            score={78} 
            status="Good" 
          />
          <FactorItem 
            label="Expense Tracking" 
            weight={20} 
            score={62} 
            status="Good" 
          />
          <FactorItem 
            label="Repayment History" 
            weight={20} 
            score={90} 
            status="Excellent" 
          />
          <FactorItem 
            label="Inventory Movement" 
            weight={15} 
            score={55} 
            status="Fair" 
          />
          <FactorItem 
            label="Account Activity" 
            weight={10} 
            score={70} 
            status="Good" 
          />
          <FactorItem 
            label="Business Age" 
            weight={10} 
            score={45} 
            status="New" 
          />
        </div>
      </div>

      {/* Reward Points / Overdraft tracker */}
      <div className="bg-gradient-to-br from-emerald-50/50 to-indigo-50/20 p-5 border border-emerald-100 rounded-xl flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-gray-900 text-xs">Capital Readiness Overdraft Progress</h4>
          <p className="text-[11px] text-gray-500">
            Earn points by logging sales (+5pt) and scanning receipts (+10pt) to unlock Level 2 virtual accounts.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-[11px] font-bold text-gray-800">{points}/500 points</span>
            <span className="text-[10px] text-gray-400">({readinessPercent}%)</span>
          </div>
        </div>
        
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 flex items-center justify-center font-display font-bold text-xs text-[#059669] shrink-0">
          {readinessPercent}%
        </div>
      </div>
    </div>
  );
}
