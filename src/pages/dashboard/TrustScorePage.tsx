import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';

interface FactorItemProps {
  label: string;
  weight: number;
  score: number; // 0-100
  status: string;
}

function FactorItem({ label, weight, score, status }: FactorItemProps) {
  return (
    <div className="space-y-2 border-b-2 border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <div className="flex justify-between text-sm font-bold">
        <span className="text-slate-900">{label}</span>
        <span className="text-slate-500">WT: {weight}%</span>
      </div>
      <div className="flex items-center gap-3">
        {/* Rating Bar */}
        <div className="flex-1 h-3 bg-slate-100 rounded-full relative overflow-hidden">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-[#E0FF4F] rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${score}%` }} 
          />
        </div>
        <span className="text-sm font-black text-slate-900 w-12 text-right">{score}/100</span>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[6px] shrink-0
          ${score >= 80 ? 'bg-[#10B981] text-white' : ''}
          ${score >= 50 && score < 80 ? 'bg-[#FFD166] text-slate-900' : ''}
          ${score < 50 ? 'bg-[#FF6666] text-white' : ''}
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
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-8 pb-24 selection:bg-[#E0FF4F] selection:text-slate-900">
      {/* Title */}
      <header className="mb-4 border-b-2 border-slate-200 pb-4">
        <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 leading-tight mb-2">
          Credit Health
        </h1>
        <p className="text-sm md:text-base font-bold text-slate-500">
          Your weighted rating determines loan eligibility and virtual account limits.
        </p>
      </header>

      {/* Main Score Board */}
      <div className="glass-panel p-6 md:p-8 text-center space-y-6">
        <div>
          <div className="text-6xl md:text-7xl font-display font-black text-slate-900 leading-none">
            640
          </div>
          <div className="text-sm font-bold text-slate-500 mt-2 tracking-widest uppercase">out of 1000 pts</div>
        </div>

        <div className="max-w-xs mx-auto text-sm font-medium text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-[12px] p-4 shadow-sm">
          Your credit profile is rated <span className="font-bold text-[#10B981]">Good</span>.<br/>
          You qualify for Tier 1 &amp; 2 loans.
        </div>

        <div className="pt-4">
          <button 
            className="w-full text-sm font-bold bg-[#E0FF4F] text-slate-900 flex items-center justify-center gap-2 h-14 rounded-[12px] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all" 
            onClick={() => navigate('/dashboard/loans')}
          >
            View Loan Eligibility <ArrowRight className="w-5 h-5" weight="bold" />
          </button>
        </div>
      </div>

      {/* Weighted Factors Breakdown */}
      <div className="glass-panel p-6 space-y-6">
        <div className="border-b-2 border-slate-100 pb-4">
          <h3 className="font-display font-black text-slate-900 text-xl mb-1">Score Breakdown</h3>
          <p className="text-sm font-bold text-slate-500">
            Six dimensions defined by Kudi to measure transaction consistency.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <FactorItem label="Revenue Stability" weight={25} score={78} status="Good" />
          <FactorItem label="Expense Tracking" weight={20} score={62} status="Good" />
          <FactorItem label="Repayment History" weight={20} score={90} status="Excellent" />
          <FactorItem label="Inventory Movement" weight={15} score={55} status="Fair" />
          <FactorItem label="Account Activity" weight={10} score={70} status="Good" />
          <FactorItem label="Business Age" weight={10} score={45} status="New" />
        </div>
      </div>

      {/* Reward Points / Overdraft tracker */}
      <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 text-white">
        <div className="space-y-3">
          <h4 className="font-bold text-lg inline-block bg-slate-800 text-white px-3 py-1 rounded-[8px] border-2 border-slate-700">Capital Readiness</h4>
          <p className="text-sm font-medium text-slate-300 leading-relaxed">
            Earn points by logging sales <span className="bg-slate-800 text-white px-1.5 py-0.5 rounded-[4px] text-xs font-bold border border-slate-700">+5pt</span> and scanning receipts <span className="bg-slate-800 text-white px-1.5 py-0.5 rounded-[4px] text-xs font-bold border border-slate-700">+10pt</span> to unlock Level 2 virtual accounts.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <span className="text-sm font-black bg-[#E0FF4F] text-slate-900 px-3 py-1 rounded-[8px] border-2 border-slate-900 shadow-[2px_2px_0px_#E0FF4F]">{points}/500 PTS</span>
            <span className="text-xs font-bold text-slate-400">({readinessPercent}%)</span>
          </div>
        </div>
        
        <div className="w-24 h-24 bg-[#E0FF4F] border-2 border-slate-900 rounded-full flex items-center justify-center font-display font-black text-3xl text-slate-900 shrink-0 shadow-[4px_4px_0px_#0f172a]">
          {readinessPercent}%
        </div>
      </div>
    </div>
  );
}
