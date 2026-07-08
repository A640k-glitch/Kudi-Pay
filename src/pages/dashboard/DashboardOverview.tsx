import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, QrCode, Sparkles, Receipt, PlusCircle, CheckCircle, Loader, ArrowRight } from 'lucide-react';
import { NeoStore } from '../../components/icons/NeoIcons';
import { QRCodeSVG } from 'qrcode.react';
import { Business, Order, Product } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { orderService } from '../../lib/services/orderService';
import { productService } from '../../lib/services/productService';
import { ledgerService } from '../../lib/services/ledgerService';
import BrutalButton from '../../components/ui/BrutalButton';
import { BrutalCard } from '../../components/ui/BrutalCard';
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
        <Loader className="w-10 h-10 animate-spin" />
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
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col gap-2 pb-4 border-b-[4px] border-black">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
            Hello, {business.businessName}
          </h1>
          <span className="shrink-0 inline-flex items-center px-4 py-1 border-[3px] border-black bg-[#E0FF4F] font-black uppercase tracking-wider text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)] rotate-3">
            Lvl 1
          </span>
        </div>
        <p className="text-sm md:text-base font-bold text-gray-700">
          {business.lga || 'Nigeria'} • <span className="text-black uppercase underline decoration-[3px] underline-offset-4">{business.storefrontSlug}</span>
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Readiness Score Card */}
        <div className="lg:col-span-2 bg-[#FF6666] border-[4px] border-black p-6 md:p-8 flex flex-col justify-between shadow-[8px_8px_0px_rgba(0,0,0,1)] relative overflow-hidden text-black">
          <div className="flex flex-col md:flex-row items-start justify-between relative z-10 gap-6">
            <div className="flex-1">
              <span className="inline-block bg-white border-[3px] border-black px-3 py-1 font-black uppercase text-xs mb-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] -rotate-2">
                Capital Readiness
              </span>
              <h2 className="text-2xl md:text-4xl font-black uppercase leading-none mb-3">
                Score: {readinessScore}/500
              </h2>
              <p className="font-bold text-lg leading-snug max-w-sm">
                You're <span className="bg-[#E0FF4F] px-1 border-black border-2">{readinessPercent}%</span> of the way to a ₦50,000 overdraft. Log 3 more sales!
              </p>
            </div>
            
            {/* Giant Graphic Number */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white border-[4px] border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] shrink-0 self-center md:self-start">
               <span className="text-4xl md:text-5xl font-black">{readinessPercent}%</span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t-[4px] border-black flex items-center justify-between relative z-10">
            <Link to="/dashboard/trust" className="font-black uppercase flex items-center gap-2 hover:underline decoration-4 underline-offset-4">
              View Breakdown <ArrowRight className="w-5 h-5" strokeWidth={3} />
            </Link>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="bg-[#4D9DE0] border-[4px] border-black p-6 md:p-8 flex flex-col justify-between shadow-[8px_8px_0px_rgba(0,0,0,1)] text-white">
          <div>
            <span className="bg-white text-black border-[3px] border-black px-3 py-1 font-black uppercase text-xs shadow-[2px_2px_0px_rgba(0,0,0,1)] rotate-2 inline-block mb-4">
              Total Balance
            </span>
            <div className="text-4xl font-black tracking-tight tabular-nums mt-2 text-black">
              {formatNaira(ledgerStats.balance)}
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-8 pt-6 border-t-[4px] border-black">
            <div className="flex items-center justify-between bg-white text-black border-[3px] border-black px-3 py-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <span className="font-black uppercase text-xs">7D Revenue</span>
              <span className="font-black text-sm tabular-nums">{formatNaira(ledgerStats.revenue)}</span>
            </div>
            <div className="flex items-center justify-between bg-white text-black border-[3px] border-black px-3 py-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <span className="font-black uppercase text-xs">Trust Score</span>
              <span className="font-black text-sm tabular-nums text-[#06D6A0]">640</span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Link Card */}
      <div className="bg-[#E0FF4F] border-[4px] border-black p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-6 transform rotate-[0.5deg]">
        <div>
          <h4 className="text-2xl font-black uppercase mb-2">Store is LIVE! 🚀</h4>
          <p className="font-bold">Share this unique link to start accepting orders immediately.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
          <div className="bg-white border-[3px] border-black px-4 py-3 flex items-center font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] max-w-sm truncate">
            {storeLink}
          </div>
          <div className="flex gap-3">
            <BrutalButton color="#FFFFFF" className="text-sm font-black" onClick={handleCopyLink}>
              {isCopied ? 'COPIED!' : 'COPY'}
            </BrutalButton>
            <BrutalButton color="#FFFFFF" className="px-4" onClick={() => setShowQR(true)}>
              <QrCode className="w-5 h-5" strokeWidth={3} />
            </BrutalButton>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border-[4px] border-black p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-[4px] border-black">
            <h3 className="text-2xl font-black uppercase">Recent Orders</h3>
            <Link to="/dashboard/orders" className="font-black uppercase underline decoration-4 underline-offset-4 hover:bg-[#E0FF4F] px-2 py-1 transition-colors border-2 border-transparent hover:border-black">
              View All
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-10 bg-gray-100 border-[3px] border-black border-dashed">
              <span className="font-black uppercase text-gray-500">No orders yet.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {recentOrders.map(order => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-[3px] border-black hover:bg-[#FDFBF7] hover:translate-x-1 transition-transform">
                  <div>
                    <div className="font-black uppercase text-lg">{order.customerName}</div>
                    <div className="font-bold text-gray-600 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black tabular-nums bg-[#E0FF4F] px-2 py-1 border-2 border-black">{formatNaira(order.totalAmount)}</span>
                    <span className={`px-3 py-1 border-[3px] border-black font-black uppercase text-xs shadow-[2px_2px_0px_rgba(0,0,0,1)]
                      ${order.status === 'paid' ? 'bg-[#06D6A0] text-black' : 'bg-[#FFD166] text-black'}
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
                className="bg-[#FFD166] border-[4px] border-black p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <PlusCircle className="w-8 h-8 mb-2" strokeWidth={3} />
                <span className="font-black uppercase text-sm">Get Paid</span>
              </button>
              
              <button 
                onClick={() => setShowOCRModal(true)}
                className="bg-[#06D6A0] border-[4px] border-black p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <Receipt className="w-8 h-8 mb-2" strokeWidth={3} />
                <span className="font-black uppercase text-sm">Scan Receipt</span>
              </button>
           </div>

           <button 
             onClick={() => navigate('/dashboard/products')}
             className="bg-white border-[4px] border-black p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all w-full"
           >
             <NeoStore className="w-8 h-8 mb-2" strokeWidth={3} />
             <span className="font-black uppercase text-sm">Inventory</span>
           </button>

           {/* WhatsApp Assistant */}
           <div className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex-1 flex flex-col">
              <h3 className="text-xl font-black uppercase mb-2">WhatsApp Bot</h3>
              <p className="font-bold text-sm mb-4">Log cash transactions and check summaries via WhatsApp text.</p>
              
              <div className="bg-gray-100 border-[3px] border-black p-3 mb-6 font-mono text-xs font-bold space-y-2 relative">
                 <div className="absolute -top-3 -right-3 bg-[#FF6666] text-black border-[3px] border-black px-2 py-0.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] rotate-6">
                   TRY IT!
                 </div>
                 <div className="flex items-center gap-2"><span className="w-2 h-2 bg-black shrink-0"></span>"Sold 2 bags of rice for 20k"</div>
                 <div className="flex items-center gap-2"><span className="w-2 h-2 bg-black shrink-0"></span>"How much did I make today?"</div>
              </div>

              <Link to="/dashboard/whatsapp" className="mt-auto">
                <BrutalButton className="w-full h-12 text-sm">Open Simulator</BrutalButton>
              </Link>
           </div>
        </div>
      </div>

      {/* QR MODAL */}
      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Scan to Shop">
        <div className="flex flex-col items-center pb-4 max-w-sm mx-auto">
          <div className="bg-white p-4 border-[4px] border-black mb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <QRCodeSVG value={storeLink} size={200} />
          </div>
          <p className="font-bold text-center mb-6 text-sm">Customers can scan this QR code to browse items and checkout immediately.</p>
          <BrutalButton className="w-full" onClick={() => setShowQR(false)}>Close</BrutalButton>
        </div>
      </Modal>

      {/* GET PAID MODAL */}
      <Modal isOpen={showGetPaid} onClose={() => setShowGetPaid(false)} title="Get Paid">
        <div className="flex flex-col gap-4">
          <div className="bg-[#E0FF4F] border-[3px] border-black p-4 mb-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] -rotate-1">
            <label className="font-black uppercase text-xs block mb-2">Customer Payment Link</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly
                value={`${storeLink}/checkout`}
                className="flex-1 bg-white border-[3px] border-black px-3 py-2 font-bold text-sm outline-none"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${storeLink}/checkout`);
                  alert("Copied invoice link!");
                }}
                className="bg-black text-white px-3 border-[3px] border-black hover:bg-gray-800 transition-colors"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleLogSale} className="space-y-4">
            <h4 className="font-black uppercase text-sm border-b-[3px] border-black pb-2">Record Cash Sale</h4>
            
            <div>
              <label className="block font-black uppercase text-xs mb-1">Amount (₦)</label>
              <input
                type="number"
                required
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                className="w-full border-[3px] border-black p-3 font-bold uppercase outline-none focus:bg-[#E0FF4F] transition-colors"
                placeholder="15000"
              />
            </div>

            <div>
              <label className="block font-black uppercase text-xs mb-1">Transaction Note (Optional)</label>
              <input
                type="text"
                value={saleDesc}
                onChange={(e) => setSaleDesc(e.target.value)}
                className="w-full border-[3px] border-black p-3 font-bold outline-none focus:bg-[#E0FF4F] transition-colors"
                placeholder="e.g. 2x Ankara lace fabrics"
              />
            </div>

            <BrutalButton type="submit" className="w-full h-14 mt-4 text-base" isLoading={isLoggingSale}>
              Log Sale & Post to Ledger
            </BrutalButton>
          </form>
        </div>
      </Modal>

      {/* OCR MODAL */}
      <Modal isOpen={showOCRModal} onClose={() => { setShowOCRModal(false); setOcrStage('idle'); setSelectedReceipt(null); }} title="Scan Receipt">
         <div className="flex flex-col gap-4">
           {ocrStage === 'idle' && (
             <div className="space-y-6">
                <div className="border-[4px] border-black border-dashed bg-gray-50 p-8 text-center cursor-pointer hover:bg-[#E0FF4F] transition-colors group">
                  <Receipt className="w-10 h-10 mx-auto mb-4 group-hover:scale-110 transition-transform" strokeWidth={3} />
                  <h4 className="font-black uppercase text-lg mb-2">Upload Receipt</h4>
                  <p className="font-bold text-sm">JPG, PNG, PDF</p>
                </div>
                
                <div className="border-t-[4px] border-black pt-6">
                  <h5 className="font-black uppercase text-xs mb-4">Mock Templates (For Testing)</h5>
                  <div className="flex flex-col gap-3">
                    {MOCK_RECEIPT_TEMPLATES.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectMockReceipt(item)}
                        className="p-3 border-[3px] border-black flex justify-between items-center hover:bg-black hover:text-white transition-colors text-left shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                      >
                        <div>
                          <div className="font-black uppercase text-sm">{item.vendor}</div>
                          <div className="font-bold text-xs opacity-80">{item.desc}</div>
                        </div>
                        <span className="font-black">{formatNaira(item.amount)}</span>
                      </button>
                    ))}
                  </div>
                </div>
             </div>
           )}

           {ocrStage === 'scanning' && (
             <div className="flex flex-col items-center justify-center py-12 text-center">
               <Loader className="w-12 h-12 animate-spin mb-6" strokeWidth={3} />
               <h4 className="font-black uppercase text-xl mb-2">Processing Image...</h4>
               <p className="font-bold text-sm">Extracting data with AI OCR</p>
             </div>
           )}

           {ocrStage === 'review' && (
             <form onSubmit={handlePostOCRExpense} className="space-y-4">
                <div className="bg-[#06D6A0] border-[3px] border-black p-3 font-bold text-sm flex gap-3 items-start shadow-[4px_4px_0px_rgba(0,0,0,1)] mb-6 -rotate-1">
                  <CheckCircle className="w-6 h-6 shrink-0" strokeWidth={3} />
                  <span>Parsed successfully! Review before saving.</span>
                </div>

                <div>
                  <label className="block font-black uppercase text-xs mb-1">Vendor Name</label>
                  <input
                    type="text" required value={ocrVendor} onChange={(e) => setOcrVendor(e.target.value)}
                    className="w-full border-[3px] border-black p-3 font-bold outline-none focus:bg-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-black uppercase text-xs mb-1">Amount (₦)</label>
                    <input
                      type="number" required value={ocrAmount} onChange={(e) => setOcrAmount(e.target.value)}
                      className="w-full border-[3px] border-black p-3 font-bold outline-none focus:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block font-black uppercase text-xs mb-1">Category</label>
                    <input
                      type="text" required value={ocrCategory} onChange={(e) => setOcrCategory(e.target.value)}
                      className="w-full border-[3px] border-black p-3 font-bold outline-none focus:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-black uppercase text-xs mb-1">Description</label>
                  <input
                    type="text" value={ocrDesc} onChange={(e) => setOcrDesc(e.target.value)}
                    className="w-full border-[3px] border-black p-3 font-bold outline-none focus:bg-gray-100"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t-[4px] border-black mt-6">
                  <BrutalButton color="#FFFFFF" className="flex-1" type="button" onClick={() => { setOcrStage('idle'); setSelectedReceipt(null); }}>
                    Back
                  </BrutalButton>
                  <BrutalButton className="flex-[2]" type="submit" isLoading={isLoggingSale}>
                    Save Expense
                  </BrutalButton>
                </div>
             </form>
           )}
         </div>
      </Modal>
    </div>
  );
}
