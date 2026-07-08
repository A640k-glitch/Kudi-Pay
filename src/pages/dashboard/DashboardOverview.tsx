import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Receipt, PlusCircle, CheckCircle, Loader } from 'lucide-react';
import { QrCode, ArrowRight, Copy } from '@phosphor-icons/react';
import { NeoStore } from '../../components/icons/NeoIcons';
import { QRCodeSVG } from 'qrcode.react';
import { Business, Order, Product } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { orderService } from '../../lib/services/orderService';
import { productService } from '../../lib/services/productService';
import { ledgerService } from '../../lib/services/ledgerService';
import { formatNaira } from '../../lib/utils';
import { Modal } from '../../components/Modal';

const MOCK_RECEIPT_TEMPLATES = [
  { id: '1', vendor: 'Alaba Textile Wholesalers', amount: 48000, category: 'Raw Materials', desc: 'Fabric rolls purchase' },
  { id: '2', vendor: 'Oando Filling Station', amount: 15000, category: 'Operations', desc: 'Generator fuel' },
  { id: '3', vendor: 'DHL Express Nigeria', amount: 24500, category: 'Logistics', desc: 'Store delivery dispatch' },
];

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ledgerStats, setLedgerStats] = useState({ revenue: 148000, expenses: 62000, profit: 86000, balance: 86000 });
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [showQR, setShowQR] = useState(false);
  const [showGetPaid, setShowGetPaid] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);

  // Get Paid Sale Log state
  const [saleAmount, setSaleAmount] = useState('');
  const [saleDesc, setSaleDesc] = useState('');
  const [isLoggingSale, setIsLoggingSale] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // OCR Simulator state
  const [ocrStage, setOcrStage] = useState<'idle' | 'scanning' | 'review'>('idle');
  const [selectedReceipt, setSelectedReceipt] = useState<typeof MOCK_RECEIPT_TEMPLATES[0] | null>(null);
  const [ocrVendor, setOcrVendor] = useState('');
  const [ocrAmount, setOcrAmount] = useState('');
  const [ocrCategory, setOcrCategory] = useState('');
  const [ocrDesc, setOcrDesc] = useState('');

  // Score Points progress
  const [readinessScore, setReadinessScore] = useState(350); // out of 500 (70%)

  const refreshData = async (bId: string) => {
    const [o, p, stats] = await Promise.all([
      orderService.getOrders(bId),
      productService.getProducts(bId),
      ledgerService.getStats(bId)
    ]);
    setOrders(o);
    setProducts(p);
    setLedgerStats(stats);
    
    // Load points
    const pts = localStorage.getItem(`aza_trust_points_${bId}`);
    if (pts) setReadinessScore(Number(pts));
  };

  useEffect(() => {
    async function load() {
      const phone = authService.getCurrentPhone();
      if (!phone) return;
      const b = await businessService.getBusinessByPhone(phone);
      if (b) {
        setBusiness(b);
        await refreshData(b.id);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-10 h-10 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!business) return null;

  const storeLink = `${window.location.origin}/store/${business.storefrontSlug}`;
  const recentOrders = orders.slice(0, 5);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLogSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleAmount) return;
    setIsLoggingSale(true);
    try {
      await ledgerService.addEntry({
        businessId: business.id,
        type: 'revenue',
        amount: parseFloat(saleAmount),
        source: 'manual',
        metadata: { description: saleDesc || 'Cash sale logged' }
      });
      setSaleAmount('');
      setSaleDesc('');
      setShowGetPaid(false);
      await refreshData(business.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingSale(false);
    }
  };

  const handleSelectMockReceipt = (receipt: typeof MOCK_RECEIPT_TEMPLATES[0]) => {
    setSelectedReceipt(receipt);
    setOcrStage('scanning');
    
    setTimeout(() => {
      setOcrVendor(receipt.vendor);
      setOcrAmount(receipt.amount.toString());
      setOcrCategory(receipt.category);
      setOcrDesc(receipt.desc);
      setOcrStage('review');
    }, 2000);
  };

  const handlePostOCRExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocrAmount || !ocrVendor) return;
    setIsLoggingSale(true);
    try {
      await ledgerService.addEntry({
        businessId: business.id,
        type: 'expense',
        amount: parseFloat(ocrAmount),
        source: 'receipt_ocr',
        metadata: { vendor: ocrVendor, category: ocrCategory, description: ocrDesc }
      });
      setShowOCRModal(false);
      setOcrStage('idle');
      setSelectedReceipt(null);
      await refreshData(business.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingSale(false);
    }
  };

  const readinessPercent = Math.min(100, Math.round((readinessScore / 500) * 100));

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col gap-2 pb-6 border-b-2 border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight">
            Hello, {business.businessName}
          </h1>
          <span className="shrink-0 inline-flex items-center px-4 py-1.5 bg-[#E0FF4F] border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-slate-900 font-bold rounded-full text-sm">
            Lvl 1
          </span>
        </div>
        <p className="text-sm font-bold text-slate-500">
          {business.lga || 'Nigeria'} • <span className="text-slate-900">{business.storefrontSlug}</span>
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Readiness Score Card */}
        <div className="lg:col-span-2 glass-panel p-3 sm:p-4 md:p-5 flex flex-col justify-between">
          <div className="flex flex-col md:flex-row items-start justify-between relative z-10 gap-6">
            <div className="flex-1">

              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 mb-3">
                Score: {readinessScore}/500
              </h2>
              <p className="font-medium text-slate-600 text-lg leading-snug max-w-sm">
                You're <span className="font-bold text-[#10B981]">{readinessPercent}%</span> of the way to a ₦50,000 overdraft. Log 3 more sales!
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
              Total Balance
            </span>
            <div className="text-4xl md:text-5xl font-display font-black tracking-tight mt-2 text-[#E0FF4F]">
              {formatNaira(ledgerStats.balance)}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-8 pt-6 border-t-2 border-slate-700 relative z-10">
            <div className="flex items-center justify-between bg-slate-800 border-2 border-slate-700 rounded-[12px] px-4 py-3">
              <span className="font-bold text-sm text-slate-300">7D Revenue</span>
              <span className="font-bold text-base tabular-nums">{formatNaira(ledgerStats.revenue)}</span>
            </div>
            <div className="flex items-center justify-between bg-slate-800 border-2 border-slate-700 rounded-[12px] px-4 py-3">
              <span className="font-bold text-sm text-slate-300">Trust Score</span>
              <span className="font-bold text-base tabular-nums text-[#10B981]">640</span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Link Card */}
      <div className="glass-panel p-3 sm:p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#E0FF4F]">
        <div>
          <h4 className="text-xl md:text-2xl font-display font-black text-slate-900 mb-2 flex items-center gap-2">Store is LIVE! <span className="text-2xl">🚀</span></h4>
          <p className="font-bold text-slate-700">Share this unique link to start accepting orders immediately.</p>
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
        
        {/* Recent Orders */}
        <div className="lg:col-span-2 glass-panel p-3 sm:p-4 md:p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-100">
            <h3 className="text-2xl font-display font-black text-slate-900">Recent Orders</h3>
            <Link to="/dashboard/orders" className="font-bold text-slate-500 hover:text-slate-900 transition-colors">
              View All
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-12 flex-1 flex items-center justify-center bg-slate-50 rounded-[16px] border-2 border-slate-200 border-dashed">
              <span className="font-bold text-slate-400">No orders yet.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {recentOrders.map(order => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[16px] border-2 border-slate-900 bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#0f172a] transition-all">
                  <div>
                    <div className="font-bold text-slate-900 text-lg">{order.customerName}</div>
                    <div className="font-medium text-slate-600 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black tabular-nums text-slate-900">{formatNaira(order.totalAmount)}</span>
                    <span className={`px-3 py-1 border-2 border-slate-900 rounded-full font-bold text-xs shadow-sm
                      ${order.status === 'paid' ? 'bg-[#10B981] text-white' : 'bg-[#FFD166] text-slate-900'}
                    `}>
                      {order.status}
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
              <button 
                onClick={() => setShowGetPaid(true)}
                className="glass-panel p-3 sm:p-4 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform"
              >
                <div className="bg-slate-100 p-3 rounded-full mb-3 border-2 border-slate-900">
                  <PlusCircle className="w-6 h-6 text-slate-900" strokeWidth={2} />
                </div>
                <span className="font-bold text-sm text-slate-900">Get Paid</span>
              </button>
              
              <button 
                onClick={() => setShowOCRModal(true)}
                className="glass-panel p-3 sm:p-4 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform"
              >
                <div className="bg-slate-100 p-3 rounded-full mb-3 border-2 border-slate-900">
                  <Receipt className="w-6 h-6 text-slate-900" strokeWidth={2} />
                </div>
                <span className="font-bold text-sm text-slate-900">Scan Receipt</span>
              </button>
           </div>

           <button 
             onClick={() => navigate('/dashboard/products')}
             className="glass-panel p-4 flex items-center justify-center gap-3 text-center hover:-translate-y-1 transition-transform w-full"
           >
             <NeoStore className="w-6 h-6 text-slate-900" strokeWidth={2} />
             <span className="font-bold text-sm text-slate-900">Manage Inventory</span>
           </button>

           {/* WhatsApp Assistant */}
           <div className="glass-panel p-3 sm:p-4 flex-1 flex flex-col relative overflow-hidden bg-[#10B981] text-white">
              <h3 className="text-xl font-display font-black text-white mb-2">WhatsApp Bot</h3>
              <p className="font-medium text-white/90 text-sm mb-6">Log cash transactions and check summaries via WhatsApp text.</p>
              
              <div className="bg-white/10 border-2 border-white/20 rounded-[16px] p-4 mb-6 font-mono text-xs font-bold space-y-3 relative text-white">
                 <div className="absolute -top-3 -right-3 bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-[2px_2px_0px_#E0FF4F] flex items-center gap-1 animate-pulse">
                   <Sparkles className="w-3 h-3" /> TRY IT!
                 </div>
                 <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E0FF4F] shrink-0"></span>"Sold 2 bags of rice for 20k"</div>
                 <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>"How much did I make today?"</div>
              </div>

              <Link to="/dashboard/whatsapp" className="mt-auto block">
                <button className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-[12px] shadow-[4px_4px_0px_#E0FF4F] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all border-2 border-slate-900">
                  Open Simulator
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

      {/* GET PAID MODAL */}
      <Modal isOpen={showGetPaid} onClose={() => setShowGetPaid(false)} title="Get Paid" theme="brutal" headerClassName="bg-[#4D9FFF]">
        <div className="flex flex-col gap-5">
          <div className="bg-slate-50 rounded-[16px] border-2 border-slate-200 p-4 mb-2">
            <label className="font-bold text-slate-600 text-xs block mb-2 uppercase tracking-wide">Customer Payment Link</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly
                value={`${storeLink}/checkout`}
                className="flex-1 bg-white border-2 border-slate-900 rounded-[12px] px-3 py-2 font-bold text-sm outline-none text-slate-900 shadow-sm"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${storeLink}/checkout`);
                  alert("Copied invoice link!");
                }}
                className="bg-slate-900 text-white px-4 rounded-[12px] border-2 border-slate-900 shadow-[2px_2px_0px_#E0FF4F] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all"
              >
                <Copy weight="bold" className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleLogSale} className="space-y-4">
            <h4 className="font-display font-black text-slate-900 text-base border-b-2 border-slate-100 pb-2">Record Cash Sale</h4>
            
            <div>
              <label className="block font-bold text-slate-900 text-sm mb-1.5">Amount (₦)</label>
              <input
                type="text"
                required
                value={saleAmount ? Number(saleAmount).toLocaleString() : ''}
                onChange={(e) => setSaleAmount(e.target.value.replace(/\D/g, ''))}
                className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]"
                placeholder="15,000"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 text-sm mb-1.5">Transaction Note (Optional)</label>
              <input
                type="text"
                value={saleDesc}
                onChange={(e) => setSaleDesc(e.target.value)}
                className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]"
                placeholder="e.g. 2x Ankara lace fabrics"
              />
            </div>

            <button type="submit" disabled={isLoggingSale} className="w-full bg-[#E0FF4F] text-slate-900 font-bold py-3.5 mt-2 rounded-[12px] shadow-[4px_4px_0px_#0f172a] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">
              {isLoggingSale ? 'Logging...' : 'Log Sale & Post to Ledger'}
            </button>
          </form>
        </div>
      </Modal>

      {/* OCR MODAL */}
      <Modal isOpen={showOCRModal} onClose={() => { setShowOCRModal(false); setOcrStage('idle'); setSelectedReceipt(null); }} title="Scan Receipt" theme="brutal" headerClassName="bg-[#B388FF]">
         <div className="flex flex-col gap-4">
           {ocrStage === 'idle' && (
             <div className="space-y-6">
                <div className="border-4 border-slate-900 border-dashed rounded-[24px] bg-slate-50 p-8 text-center cursor-pointer hover:bg-[#E0FF4F] hover:border-solid transition-all group">
                  <Receipt className="w-10 h-10 mx-auto mb-4 text-slate-900" strokeWidth={2} />
                  <h4 className="font-black text-slate-900 text-lg mb-1">Upload Receipt</h4>
                  <p className="font-bold text-slate-600 text-sm">JPG, PNG, PDF</p>
                </div>
                
                <div className="border-t-2 border-slate-100 pt-6">
                  <h5 className="font-bold text-slate-500 text-xs mb-4 uppercase tracking-wide">Mock Templates (For Testing)</h5>
                  <div className="flex flex-col gap-3">
                    {MOCK_RECEIPT_TEMPLATES.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectMockReceipt(item)}
                        className="p-4 rounded-[16px] border-2 border-slate-900 bg-white flex justify-between items-center hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] transition-all text-left"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{item.vendor}</div>
                          <div className="font-medium text-slate-600 text-xs mt-0.5">{item.desc}</div>
                        </div>
                        <span className="font-black text-slate-900">{formatNaira(item.amount)}</span>
                      </button>
                    ))}
                  </div>
                </div>
             </div>
           )}

           {ocrStage === 'scanning' && (
             <div className="flex flex-col items-center justify-center py-12 text-center">
               <Loader className="w-10 h-10 animate-spin mb-6 text-slate-900" strokeWidth={3} />
               <h4 className="font-display font-black text-slate-900 text-xl mb-2">Processing Image...</h4>
               <p className="font-bold text-slate-600 text-sm">Extracting data with AI OCR</p>
             </div>
           )}

           {ocrStage === 'review' && (
             <form onSubmit={handlePostOCRExpense} className="space-y-4">
                <div className="bg-[#10B981] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[12px] p-3 text-white font-bold text-sm flex gap-3 items-start mb-6">
                  <CheckCircle className="w-5 h-5 shrink-0" strokeWidth={2} />
                  <span>Parsed successfully! Review before saving.</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 text-sm mb-1.5">Vendor Name</label>
                  <input
                    type="text" required value={ocrVendor} onChange={(e) => setOcrVendor(e.target.value)}
                    className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-900 text-sm mb-1.5">Amount (₦)</label>
                    <input
                      type="text" required 
                      value={ocrAmount ? Number(ocrAmount).toLocaleString() : ''} 
                      onChange={(e) => setOcrAmount(e.target.value.replace(/\D/g, ''))}
                      className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 text-sm mb-1.5">Category</label>
                    <input
                      type="text" required value={ocrCategory} onChange={(e) => setOcrCategory(e.target.value)}
                      className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 text-sm mb-1.5">Description</label>
                  <input
                    type="text" value={ocrDesc} onChange={(e) => setOcrDesc(e.target.value)}
                    className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t-2 border-slate-100 mt-6">
                  <button type="button" className="flex-1 bg-slate-100 text-slate-900 border-2 border-slate-900 font-bold py-3.5 rounded-[12px] shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all" onClick={() => { setOcrStage('idle'); setSelectedReceipt(null); }}>
                    Back
                  </button>
                  <button type="submit" disabled={isLoggingSale} className="flex-[2] bg-slate-900 text-white font-bold py-3.5 rounded-[12px] border-2 border-slate-900 shadow-[4px_4px_0px_#E0FF4F] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">
                    {isLoggingSale ? 'Saving...' : 'Save Expense'}
                  </button>
                </div>
             </form>
           )}
         </div>
      </Modal>
    </div>
  );
}
