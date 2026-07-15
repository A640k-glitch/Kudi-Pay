import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info } from '@phosphor-icons/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { trustScoreService } from '../../lib/services/trustScoreService';
import { bankAccountService } from '../../lib/services/bankAccountService';
import { businessVerificationService } from '../../lib/services/businessVerificationService';
import type { TrustScoreBreakdown, FactorScore, ScoreSnapshot } from '../../lib/types';

interface FactorItemProps {
  key?: string;
  factor: FactorScore;
}

function FactorItem({ factor }: FactorItemProps) {
  return (
    <div className="space-y-2 border-b-2 border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <div className="flex justify-between text-sm font-bold items-center">
        <span className="text-slate-900">{factor.label}</span>
        <span className="text-slate-500 text-xs">WT: {factor.weight * 100}%</span>
      </div>
      <p className="text-xs font-medium text-slate-500 mb-2">{factor.description}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-slate-100 rounded-full relative overflow-hidden">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-[#E0FF4F] rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${factor.rawScore}%` }} 
          />
        </div>
        <span className="text-sm font-black text-slate-900 w-12 text-right">{factor.rawScore}/100</span>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[6px] shrink-0
          ${factor.status === 'Excellent' || factor.status === 'Good' ? 'bg-[#10B981] text-white' : ''}
          ${factor.status === 'Fair' || factor.status === 'Building' ? 'bg-[#FFD166] text-slate-900' : ''}
          ${factor.status === 'Poor' || factor.status === 'New' ? 'bg-[#FF6666] text-white' : ''}
        `}>
          {factor.status}
        </span>
      </div>
    </div>
  );
}

export default function TrustScorePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState<TrustScoreBreakdown | null>(null);
  const [historyData, setHistoryData] = useState<ScoreSnapshot[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const str = localStorage.getItem('kudi_businesses');
        const phone = localStorage.getItem('kudi_session_phone');
        
        if (!str || !phone) {
          navigate('/');
          return;
        }

        const businesses = JSON.parse(str);
        const b = businesses.find((biz: any) => biz.ownerPhone === phone);
        
        if (!b) return;

        // Fetch all required data for the scoring engine
        const transactions = await bankAccountService.getTransactions(b.id);
        const cacVerification = await businessVerificationService.getCACVerification(b.id) || undefined;
        
        // Products from localStorage
        const productsStr = localStorage.getItem('kudi_products');
        const products = productsStr ? JSON.parse(productsStr).filter((p: any) => p.businessId === b.id) : [];

        // Loans
        const loans = trustScoreService.getLoans(b.id);

        // Orders
        const ordersStr = localStorage.getItem('kudi_orders');
        const orders = ordersStr ? JSON.parse(ordersStr).filter((o: any) => o.businessId === b.id) : [];

        // Linked bank account status
        const hasLinkedAccount = await bankAccountService.hasLinkedAccount(b.id);

        // Compute the score
        const computedScore = trustScoreService.computeScore({
          businessId: b.id,
          businessCreatedAt: b.createdAt,
          cacVerification,
          transactions,
          products,
          loans,
          orders,
          hasLinkedAccount
        });

        setScoreData(computedScore);

        // Load score history for the chart
        const history = trustScoreService.getScoreHistory(b.id, 30, hasLinkedAccount); // Last 30 days
        setHistoryData(history.reverse()); // recharts expects chronological order
        
      } catch (err) {
        console.error("Error computing score:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-lg font-bold text-slate-500 animate-pulse">Computing Trust Score...</div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-black text-slate-900">Score Unavailable</h2>
        <p className="text-slate-500 mt-2">Could not compute your trust score at this time.</p>
      </div>
    );
  }

  // Find highest eligible tier
  const highestTier = [...scoreData.loanEligibility].reverse().find(t => t.eligible);
  const eligibilityMsg = highestTier 
    ? `You qualify for ${highestTier.tierName} (${highestTier.tierId}).`
    : 'Keep building your score to unlock loans.';

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-8 pb-24 selection:bg-[#E0FF4F] selection:text-slate-900">
      <header className="mb-4 border-b-2 border-slate-200 pb-4">
        <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 leading-tight mb-2">
          Trust Score
        </h1>
        <p className="text-sm md:text-base font-bold text-slate-500">
          Your bank-verified rating determines loan eligibility and account limits.
        </p>
      </header>

      {/* Main Score Board */}
      <div className="glass-panel p-6 md:p-8 text-center space-y-6">
        <div>
          <div className="text-6xl md:text-7xl font-display font-black text-slate-900 leading-none">
            {scoreData.totalScore}
          </div>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className={`text-sm font-black uppercase tracking-widest px-3 py-1 rounded-[8px]
              ${scoreData.tier === 'Excellent' || scoreData.tier === 'Very Good' ? 'bg-[#10B981] text-white' : ''}
              ${scoreData.tier === 'Good' || scoreData.tier === 'Fair' ? 'bg-[#FFD166] text-slate-900' : ''}
              ${scoreData.tier === 'Poor' ? 'bg-[#FF6666] text-white' : ''}
            `}>
              {scoreData.tier}
            </span>
            {scoreData.dailyDelta !== 0 && (
              <span className={`text-sm font-bold ${scoreData.dailyDelta > 0 ? 'text-[#10B981]' : 'text-[#FF6666]'}`}>
                {scoreData.dailyDelta > 0 ? '+' : ''}{scoreData.dailyDelta} pts today
              </span>
            )}
          </div>
          <div className="text-xs font-bold text-slate-500 mt-2 tracking-widest uppercase">out of 1000 pts</div>
        </div>

        {scoreData.isBuilding && (
          <div className="max-w-md mx-auto text-sm font-medium text-amber-800 bg-amber-50 border-2 border-amber-200 rounded-[12px] p-4 shadow-sm flex items-start gap-3 text-left">
            <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" weight="bold" />
            <div>
              <span className="font-bold">Building Profile</span>
              <p className="mt-1 text-amber-700/80">Your score is still building. The Kudi engine requires at least 4 weeks of bank data to establish a full baseline. Keep transacting normally.</p>
            </div>
          </div>
        )}

        <div className="max-w-xs mx-auto text-sm font-medium text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-[12px] p-4 shadow-sm">
          {eligibilityMsg}
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

      {/* History Chart */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6 border-b-2 border-slate-100 pb-4">
          <h3 className="font-display font-black text-slate-900 text-lg">Score History</h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Last 30 days</span>
        </div>

        {historyData.length > 1 ? (
          <div className="h-48 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E0FF4F" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#E0FF4F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={20}
                />
                <YAxis 
                  domain={['dataMin - 20', 'dataMax + 20']} 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '2px solid #0f172a', boxShadow: '4px 4px 0px #0f172a', fontWeight: 'bold' }}
                  labelStyle={{ color: '#64748b', fontSize: '12px' }}
                  itemStyle={{ color: '#0f172a', fontSize: '16px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#0f172a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#scoreGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-2xl mb-1">📈</div>
            <p className="font-black text-slate-900 text-base">Your chart will appear tomorrow</p>
            <p className="text-sm font-medium text-slate-500 max-w-xs">
              Kudi logs one score snapshot per day. Come back tomorrow to see your score trend over time. Keep transacting to build history.
            </p>
            <div className="mt-2 bg-[#E0FF4F] border-2 border-slate-900 px-4 py-2 rounded-[10px] shadow-[2px_2px_0px_#0f172a]">
              <span className="font-black text-sm text-slate-900">First snapshot: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        )}
      </div>

      {/* Loan Eligibility Progress */}
      <div className="glass-panel p-6 space-y-5">
        <div className="border-b-2 border-slate-100 pb-4">
          <h3 className="font-display font-black text-slate-900 text-xl mb-1">Loan Eligibility Progress</h3>
          <p className="text-sm font-bold text-slate-500">How close you are to unlocking each financing tier.</p>
        </div>

        <div className="space-y-5 pt-1">
          {scoreData.loanEligibility.map((tier) => {
            const pct = tier.eligible ? 100 : Math.round((scoreData.totalScore / tier.requiredScore) * 100);
            return (
              <div key={tier.tierId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${tier.eligible ? 'bg-[#10B981]' : 'bg-slate-300'}`} />
                    <span className="font-bold text-slate-900">{tier.tierName}</span>
                    {tier.eligible && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#10B981] text-white rounded-[6px]">Unlocked</span>
                    )}
                  </div>
                  <span className="font-bold text-slate-500 text-xs">
                    {tier.eligible ? `Score ${tier.requiredScore}+ ✓` : `${tier.gap} pts needed`}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${tier.eligible ? 'bg-[#10B981]' : 'bg-[#E0FF4F]'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-slate-400">
                  Required: <span className="font-bold text-slate-600">{tier.requiredScore} pts</span>
                  {!tier.eligible && ` · You have ${scoreData.totalScore}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weighted Factors Breakdown */}
      <div className="glass-panel p-6 space-y-6">
        <div className="border-b-2 border-slate-100 pb-4">
          <h3 className="font-display font-black text-slate-900 text-xl mb-1">Score Breakdown</h3>
          <p className="text-sm font-bold text-slate-500">
            6-factor analysis derived from your connected bank accounts and verified business data.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {scoreData.factors.map(factor => (
            <FactorItem key={factor.key} factor={factor} />
          ))}
        </div>
      </div>
    </div>
  );
}
