import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import BrutalButton from '../../components/ui/BrutalButton';

interface FactorItemProps {
  label: string;
  weight: number;
  score: number; // 0-100
  status: string;
}

function FactorItem({ label, weight, score, status }: FactorItemProps) {
  return (
    <div className="space-y-2 border-b-[3px] border-black pb-4 last:border-b-0 last:pb-0">
      <div className="flex justify-between text-sm uppercase font-black">
        <span className="text-black">{label}</span>
        <span className="text-gray-600">WT: {weight}%</span>
      </div>
      <div className="flex items-center gap-3">
        {/* Rating Bar */}
        <div className="flex-1 h-4 border-[3px] border-black bg-white relative overflow-hidden">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-[#E0FF4F] border-r-[3px] border-black transition-all duration-1000 ease-out" 
            style={{ width: `${score}%` }} 
          />
        </div>
        <span className="text-sm font-black text-black w-12 text-right">{score}/100</span>
        <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-1 border-[2px] border-black shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)]
          ${score >= 80 ? 'bg-[#E0FF4F] text-black' : ''}
          ${score >= 50 && score < 80 ? 'bg-[#4D9DE0] text-white' : ''}
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
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-8 bg-[#FDFBF7] min-h-screen pb-24 selection:bg-black selection:text-white">
      {/* Title */}
      <header className="mb-4 border-b-[4px] border-black pb-4">
        <span className="inline-block bg-[#E0FF4F] border-[3px] border-black px-2 py-1 text-[10px] font-black uppercase tracking-widest text-black mb-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          Credit &amp; Analytics
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-black uppercase leading-tight mb-2">
          Credit Health
        </h1>
        <p className="text-sm font-bold uppercase text-gray-700">
          Your weighted rating determines loan eligibility and virtual account limits.
        </p>
      </header>

      {/* Main Score Board */}
      <div className="bg-white border-[4px] border-black p-6 md:p-8 text-center space-y-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div>
          <div className="text-[64px] font-black text-black leading-none uppercase">
            640
          </div>
          <div className="text-sm font-black uppercase text-gray-500 mt-2 tracking-widest">out of 1000 pts</div>
        </div>

        <div className="max-w-xs mx-auto text-sm font-bold uppercase text-black bg-[#E0FF4F] border-[3px] border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] -rotate-1">
          Your credit profile is rated <span className="font-black bg-black text-[#E0FF4F] px-1">Good</span>.<br/>
          You qualify for Tier 1 &amp; 2 loans.
        </div>

        <div className="pt-4">
          <BrutalButton className="w-full text-sm flex items-center justify-center gap-2 h-14" onClick={() => navigate('/dashboard/loans')}>
            VIEW LOAN ELIGIBILITY <ArrowRight className="w-5 h-5" />
          </BrutalButton>
        </div>
      </div>

      {/* Weighted Factors Breakdown */}
      <div className="bg-white border-[4px] border-black p-6 space-y-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="border-b-[4px] border-black pb-4">
          <h3 className="font-black text-black text-xl uppercase mb-1">Score Breakdown</h3>
          <p className="text-xs font-bold uppercase text-gray-600">
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
      <div className="bg-white border-[4px] border-black p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="space-y-3">
          <h4 className="font-black text-black text-lg uppercase inline-block bg-[#4D9DE0] text-white px-2 py-1 border-[2px] border-black -rotate-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">Capital Readiness</h4>
          <p className="text-xs font-bold uppercase text-gray-700 leading-relaxed">
            Earn points by logging sales <span className="bg-[#E0FF4F] px-1 border border-black">+5pt</span> and scanning receipts <span className="bg-[#E0FF4F] px-1 border border-black">+10pt</span> to unlock Level 2 virtual accounts.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <span className="text-sm font-black uppercase bg-black text-[#E0FF4F] px-2 py-1 border-[2px] border-black shadow-[2px_2px_0px_rgba(224,255,79,1)]">{points}/500 PTS</span>
            <span className="text-xs font-black uppercase text-gray-500">({readinessPercent}%)</span>
          </div>
        </div>
        
        <div className="w-20 h-20 bg-[#E0FF4F] border-[4px] border-black flex items-center justify-center font-black text-xl text-black shrink-0 shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-3 hover:rotate-12 transition-transform">
          {readinessPercent}%
        </div>
      </div>
    </div>
  );
}
