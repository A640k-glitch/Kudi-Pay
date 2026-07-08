import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Receipt, RefreshCw, CheckCircle, Loader, Landmark } from 'lucide-react';
import { QrCode, ArrowRight, ShieldCheck, WarningCircle } from '@phosphor-icons/react';
import { NeoStore } from '../../components/icons/NeoIcons';
import { QRCodeSVG } from 'qrcode.react';
import { Business, Order, Product, BankAccount, BankTransaction, TrustScoreBreakdown } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { bankAccountService } from '../../lib/services/bankAccountService';
import { trustScoreService } from '../../lib/services/trustScoreService';
import { businessVerificationService } from '../../lib/services/businessVerificationService';
import { formatNaira } from '../../lib/utils';
import { Modal } from '../../components/Modal';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [scoreData, setScoreData] = useState<TrustScoreBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  // Modals state
  const [showQR, setShowQR] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const refreshData = async (bId: string, biz: Business) => {
    try {
      const acc = await bankAccountService.getAccount(bId);
      setAccount(acc);

      if (acc) {
        const txs = await bankAccountService.getTransactions(bId);
        setTransactions(txs);

        const cacVerification = await businessVerificationService.getCACVerification(bId) || undefined;
        const productsStr = localStorage.getItem('kudi_products');
        const products = productsStr ? JSON.parse(productsStr).filter((p: any) => p.businessId === bId) : [];
        setProducts(products);
        const loans = trustScoreService.getLoans(bId);

        const score = trustScoreService.computeScore({
          businessId: bId,
          businessCreatedAt: biz.createdAt,
          cacVerification,
          transactions: txs,
          products,
          loans
        });
        
        setScoreData(score);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function load() {
      const phone = authService.getCurrentPhone();
      if (!phone) return;
      const b = await businessService.getBusinessByPhone(phone);
      if (b) {
        setBusiness(b);
        await refreshData(b.id, b);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  const handleSyncTransactions = async () => {
    if (!business || !account) return;
    setIsSyncing(true);
    try {
      await bankAccountService.syncTransactions(business.id);
      await refreshData(business.id, business);
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-10 h-10 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!business) return null;

  const storeLink = `${window.location.origin}/store/${business.storefrontSlug}`;
  const recentTransactions = transactions.slice(0, 5);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const readinessPercent = scoreData ? Math.min(100, Math.round((scoreData.totalScore / 1000) * 100)) : 0;
  
  // Calculate 7D revenue from transactions
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const sevenDayRevenue = transactions
    .filter(t => t.type === 'credit' && new Date(t.date).getTime() >= sevenDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-5 md:space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <header className="flex flex-col gap-2 pb-6 border-b-2 border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight">
            Hello, {business.businessName}
          </h1>
          <span className="shrink-0 inline-flex items-center px-4 py-1.5 bg-[#E0FF4F] border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-slate-900 font-bold rounded-full text-sm">
            Lvl {business.kycTier || 1}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-500">
          {business.lga || 'Nigeria'} • <span className="text-slate-900">{business.storefrontSlug}</span>
        </p>
      </header>

      {/* KYC / Verification Status Strip */}
      {business.kycTier < 2 && (
        <Link to="/dashboard/account?verify=true">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-[12px] border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transition-all hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#0f172a] ${
            business.kycTier === 0 ? 'bg-[#FF6666] text-white' : 'bg-[#FFD166] text-slate-900'
          }`}>
            {business.kycTier === 0
              ? <WarningCircle className="w-5 h-5 shrink-0" weight="fill" />
              : <ShieldCheck className="w-5 h-5 shrink-0" weight="fill" />}
            <div className="flex-1 min-w-0">
              <span className="font-black text-sm block">
                {business.kycTier === 0 ? 'Identity Not Verified' : 'Verification Incomplete'}
              </span>
              <span className="text-xs font-medium opacity-80">
                {business.kycTier === 0
                  ? 'Verify your BVN and NIN to unlock full trust scoring and loan access.'
                  : 'Add your CAC registration to reach KYC Tier 3 and unlock higher loan limits.'}
              </span>
            </div>
            <ArrowRight className="w-5 h-5 shrink-0" weight="bold" />
          </div>
        </Link>
      )}
      {business.kycTier >= 2 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] border-2 border-[#10B981] bg-[#10B981]/10 text-[#10B981]">
          <ShieldCheck className="w-5 h-5 shrink-0" weight="fill" />
          <span className="font-black text-sm">KYC Tier {business.kycTier} Verified</span>
          {business.kycTier === 3 && <span className="ml-auto text-xs font-bold bg-[#10B981] text-white px-2 py-0.5 rounded-full">CAC Verified</span>}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Trust Score Card */}
        <div className="lg:col-span-2 glass-panel p-3 sm:p-4 md:p-5 flex flex-col justify-between">
          <div className="flex flex-col md:flex-row items-start justify-between relative z-10 gap-6">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 mb-3">
                Score: {scoreData ? scoreData.totalScore : '0'}/1000
              </h2>
              <p className="font-medium text-slate-600 text-lg leading-snug max-w-sm">
                {!account 
                  ? "Link your bank account to activate your trust score."
                  : scoreData?.isBuilding 
                    ? "Your score is building. Keep transacting to unlock loans."
                    : `You qualify for ${scoreData?.tier} tier benefits. Check eligibility below.`
                }
              </p>
            </div>
            
            {/* Giant Graphic Number */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-[#10B981] border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[4px_4px_0px_#0f172a] shrink-0 self-center md:self-start">
               <span className="text-3xl md:text-5xl font-display font-black text-white">{readinessPercent}%</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-slate-100 flex items-center justify-between relative z-10">
            <Link to="/dashboard/trust" className="font-bold text-slate-900 flex items-center gap-2 hover:text-[#4F46E5] transition-colors">
              View Breakdown <ArrowRight className="w-5 h-5" weight="bold" />
            </Link>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="glass-panel p-3 sm:p-4 md:p-5 flex flex-col justify-between bg-slate-900 text-white">
          <div className="relative z-10">
            <span className="bg-slate-800 border-2 border-slate-700 text-white px-3 py-1 font-bold rounded-full text-xs inline-block mb-4">
              Bank Balance
            </span>
            <div className="text-4xl md:text-5xl font-display font-black tracking-tight mt-2 text-[#E0FF4F]">
              {account ? formatNaira(account.balance) : '₦0'}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-8 pt-6 border-t-2 border-slate-700 relative z-10">
            <div className="flex items-center justify-between bg-slate-800 border-2 border-slate-700 rounded-[12px] px-4 py-3">
              <span className="font-bold text-sm text-slate-300">7D Revenue</span>
              <span className="font-bold text-base tabular-nums">{formatNaira(sevenDayRevenue)}</span>
            </div>
            <div className="flex items-center justify-between bg-slate-800 border-2 border-slate-700 rounded-[12px] px-4 py-3">
              <span className="font-bold text-sm text-slate-300">Trust Tier</span>
              <span className={`font-bold text-base tabular-nums ${scoreData?.tier === 'Excellent' || scoreData?.tier === 'Very Good' ? 'text-[#10B981]' : scoreData?.tier === 'Good' ? 'text-[#E0FF4F]' : 'text-white'}`}>
                {scoreData?.tier || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Link Card */}
      <div className={`glass-panel p-3 sm:p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${products.length > 0 ? 'bg-[#E0FF4F]' : 'bg-slate-100'}`}>
        <div>
          <h4 className="text-xl md:text-2xl font-display font-black text-slate-900 mb-2 flex items-center gap-2">
            {products.length > 0 ? <>Store is LIVE! <span className="text-2xl">🚀</span></> : <>Finish Setting Up <span className="text-2xl">⚙️</span></>}
          </h4>
          <p className="font-bold text-slate-700">
            {products.length > 0
              ? 'Share this unique link to start accepting orders immediately.'
              : 'Add your first product to go live and start accepting orders.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
          <div className="bg-white border-2 border-slate-900 px-4 py-3 rounded-[12px] flex items-center font-bold text-slate-900 max-w-sm truncate">
            {storeLink}
          </div>
          <div className="flex gap-2">
            <button className="bg-slate-900 text-white px-6 font-bold rounded-[12px] shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all" onClick={handleCopyLink}>
              {isCopied ? 'COPIED!' : 'COPY'}
            </button>
            <button className="bg-white text-slate-900 border-2 border-slate-900 px-4 rounded-[12px] shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center" onClick={() => setShowQR(true)}>
              <QrCode weight="bold" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Recent Transactions */}
        <div className="lg:col-span-2 glass-panel p-3 sm:p-4 md:p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-100">
            <div>
              <h3 className="text-2xl font-display font-black text-slate-900">Recent Transactions</h3>
              {account && <p className="text-xs font-bold text-slate-500 mt-1">Synced from {account.institution} • {account.accountNumber}</p>}
            </div>
            
            <div className="flex items-center gap-3">
              {account && (
                <button 
                  onClick={handleSyncTransactions}
                  disabled={isSyncing}
                  className="flex items-center gap-2 font-bold text-sm bg-slate-100 px-3 py-1.5 rounded-[8px] hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </button>
              )}
            </div>
          </div>

          {!account ? (
             <div className="text-center py-12 flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-[16px] border-2 border-slate-200 border-dashed">
                <Landmark className="w-12 h-12 text-slate-300 mb-4" />
                <h4 className="font-black text-slate-900 text-lg mb-2">No Bank Connected</h4>
                <p className="font-bold text-slate-500 text-sm max-w-xs mb-6">Connect your bank account to automatically import transactions and build your trust score.</p>
                <Link to="/dashboard/account">
                  <button className="bg-[#E0FF4F] text-slate-900 px-6 py-3 font-bold rounded-[12px] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] transition-all">
                    Link Bank Account
                  </button>
                </Link>
             </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 flex-1 flex items-center justify-center bg-slate-50 rounded-[16px] border-2 border-slate-200 border-dashed">
              <span className="font-bold text-slate-400">No recent transactions.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[16px] border-2 border-slate-900 bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#0f172a] transition-all">
                  <div>
                    <div className="font-bold text-slate-900 text-sm truncate max-w-[200px] sm:max-w-[300px]">{tx.narration}</div>
                    <div className="font-medium text-slate-600 text-xs mt-1 flex items-center gap-2">
                      {new Date(tx.date).toLocaleDateString()}
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold border border-blue-200">
                        <CheckCircle className="w-3 h-3" /> VERIFIED
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-lg font-black tabular-nums ${tx.type === 'credit' ? 'text-[#10B981]' : 'text-slate-900'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions / WhatsApp */}
        <div className="flex flex-col gap-6 md:gap-8">
           
           {/* Actions Grid */}
           <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/dashboard/orders"
                className="glass-panel p-3 sm:p-4 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform"
              >
                <div className="bg-slate-100 p-3 rounded-full mb-3 border-2 border-slate-900">
                  <Receipt className="w-6 h-6 text-slate-900" strokeWidth={2} />
                </div>
                <span className="font-bold text-sm text-slate-900">View Orders</span>
              </Link>
              
              <Link 
                to="/dashboard/products"
                className="glass-panel p-3 sm:p-4 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform"
              >
                <div className="bg-slate-100 p-3 rounded-full mb-3 border-2 border-slate-900">
                  <NeoStore className="w-6 h-6 text-slate-900" strokeWidth={2} />
                </div>
                <span className="font-bold text-sm text-slate-900">Inventory</span>
              </Link>
           </div>

           {/* WhatsApp Assistant Mock Card */}
           <div className="glass-panel p-0 flex-1 flex flex-col relative overflow-hidden bg-slate-50 min-h-[260px] border-2 border-slate-200">
              {/* Header */}
              <div className="bg-slate-900 border-b-2 border-slate-900 text-white p-3 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-white text-slate-900 flex items-center justify-center font-display font-black text-sm rounded-full shadow-sm">
                  KD
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold text-sm text-white">Kudi Assistant</div>
                  <div className="text-[10px] font-medium text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-[#E0FF4F] rounded-full inline-block animate-pulse"></span>
                    Online
                  </div>
                </div>
                <div className="bg-[#E0FF4F] text-slate-900 px-2 py-0.5 rounded-full text-[10px] font-black shadow-[2px_2px_0px_#fff] flex items-center gap-1 animate-pulse mr-2">
                  <Sparkles className="w-3 h-3" /> TRY IT!
                </div>
              </div>
              
              {/* Chat Bubbles */}
              <div className="p-4 space-y-4 bg-slate-100 flex-1 overflow-hidden relative">
                <div className="flex w-full justify-end">
                  <div className="max-w-[85%] p-3 text-xs font-medium leading-relaxed bg-[#E0FF4F] text-slate-900 rounded-[16px] rounded-tr-[4px] shadow-[2px_2px_0px_#0f172a] border-2 border-slate-900">
                    "How much revenue this week?"
                  </div>
                </div>
                <div className="flex w-full justify-start">
                  <div className="max-w-[85%] p-3 text-xs font-medium leading-relaxed bg-white text-slate-900 rounded-[16px] rounded-tl-[4px] shadow-[2px_2px_0px_#0f172a] border-2 border-slate-900">
                    You made ₦150,000 this week. Great job! 🚀
                  </div>
                </div>
                <div className="flex w-full justify-end">
                  <div className="max-w-[85%] p-3 text-xs font-medium leading-relaxed bg-[#E0FF4F] text-slate-900 rounded-[16px] rounded-tr-[4px] shadow-[2px_2px_0px_#0f172a] border-2 border-slate-900">
                    "What is my score breakdown?"
                  </div>
                </div>
                <div className="flex w-full justify-start">
                  <div className="max-w-[85%] p-3 text-xs font-medium leading-relaxed bg-white text-slate-900 rounded-[16px] rounded-tl-[4px] shadow-[2px_2px_0px_#0f172a] border-2 border-slate-900">
                    Your score is 420 (Good). You need 100 more points for a loan. Keep selling!
                  </div>
                </div>
              </div>

              <Link to="/dashboard/whatsapp" className="mt-auto block p-4 bg-gradient-to-t from-white to-transparent">
                <button className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-[12px] shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all border-2 border-slate-900">
                  Open Chat
                </button>
              </Link>
           </div>
        </div>
      </div>

      {/* QR MODAL */}
      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Scan to Shop" theme="brutal" headerClassName="bg-[#FF99CC]">
        <div className="flex flex-col items-center pb-4 max-w-sm mx-auto">
          <div className="bg-white p-4 rounded-[16px] border-2 border-slate-900 mb-6 shadow-[4px_4px_0px_#0f172a]">
            <QRCodeSVG value={storeLink} size={200} />
          </div>
          <p className="font-bold text-slate-600 text-center mb-6 text-sm">Customers can scan this QR code to browse items and checkout immediately.</p>
          <button className="w-full bg-slate-100 text-slate-900 border-2 border-slate-900 font-bold py-3.5 rounded-[12px] shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all" onClick={() => setShowQR(false)}>
            Close
          </button>
        </div>
      </Modal>

    </div>
  );
}
