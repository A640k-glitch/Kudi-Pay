import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Copy, QrCode, Download, ShieldAlert, Sparkles, Receipt, PlusCircle, CheckCircle, Store, Eye, Smartphone, AlertCircle, Loader } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Business, Order, Product } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { orderService } from '../../lib/services/orderService';
import { productService } from '../../lib/services/productService';
import { ledgerService, LedgerEntry } from '../../lib/services/ledgerService';
import { Button } from '../../components/Button';
import { Input } from '../../components/FormInputs';
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
  const [invoiceLink, setInvoiceLink] = useState('');
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
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 bg-[#F5F5F4] animate-pulse">
        {/* Header row */}
        <div className="flex flex-col gap-2 py-4">
          <div className="h-8 w-52 bg-gray-200 rounded-lg" />
          <div className="h-4 w-72 bg-gray-100 rounded" />
        </div>

        {/* Main grid — matches lg:grid-cols-3 with col-span-2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-48 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-200 rounded-2xl p-6 space-y-4">
          <div className="h-3 w-24 bg-gray-300 rounded" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-300 rounded-xl" />
            <div className="h-20 bg-gray-300 rounded-xl" />
            <div className="h-20 bg-gray-300 rounded-xl" />
          </div>
        </div>

        {/* Store link card */}
        <div className="h-20 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!business) return null;

  const storeLink = `${window.location.origin}/store/${business.storefrontSlug}`;
  const recentOrders = orders.slice(0, 5);

  // Generate 7 day trends based on ledger entries
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayVal = Math.floor(Math.random() * 20000) + 10000; // Mock trend
    return { name: dayStr, total: dayVal };
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Log sale
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

  // OCR Actions
  const handleSelectMockReceipt = (receipt: typeof MOCK_RECEIPT_TEMPLATES[0]) => {
    setSelectedReceipt(receipt);
    setOcrStage('scanning');
    
    // Simulate OCR scanning
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
    setIsLoggingSale(true); // Reuse loader state
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
    <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6 bg-[#F5F5F4]">
      {/* Dynamic Header */}
      <header className="flex flex-col gap-2 pt-3 pb-1">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-primary-dark leading-tight">
            Hello, {business.businessName}
          </h1>
          <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-indigo-50 border border-indigo-100 text-primary uppercase tracking-wider">
            Lvl 1
          </span>
        </div>
        <p className="text-[12px] sm:text-[13px] text-gray-500">
          {business.lga || 'Nigeria'} • <span className="font-bold text-primary">{business.storefrontSlug}</span>
        </p>
      </header>

      {/* Main Grid: Overview & Capital Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Capital Readiness Card */}
        <div className="lg:col-span-2 bg-primary-dark rounded-2xl border border-indigo-900/50 p-4 sm:p-5 md:p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-primary rounded-full opacity-20 blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-36 h-36 md:w-48 md:h-48 bg-[#059669] rounded-full opacity-20 blur-3xl -translate-x-1/2 translate-y-1/2" />
          <div className="flex items-start justify-between relative z-10 gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#059669]">
                Financial Growth
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1 leading-tight">
                Capital Readiness Score
              </h2>
              <p className="text-[12px] text-gray-300 mt-1.5 leading-relaxed">
                You're {readinessPercent}% of the way to a ₦50,000 overdraft. Log 3 more sales to build score.
              </p>
            </div>
            {/* Circular Progress Gauge */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#059669] transition-all duration-1000 ease-out"
                  strokeDasharray={`${readinessPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-[13px] text-white">
                {readinessPercent}%
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#059669]" />
              <span className="text-[11px] font-semibold text-gray-300">Points: {readinessScore}/500</span>
            </div>
            <Link to="/dashboard/trust" className="text-[11px] font-bold text-white hover:text-primary transition-colors inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10">
              Breakdown →
            </Link>
          </div>
        </div>

        {/* Financial Metrics Stack */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 md:p-6 flex flex-col justify-between gap-4 shadow-sm">
          {/* Total Balance */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Total Balance
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-[#1E1B4B] mt-1 tracking-tight tabular-nums">
              {formatNaira(ledgerStats.balance)}
            </div>
          </div>

          {/* Divider metrics */}
          <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">7D Revenue</span>
              <span className="text-[13px] sm:text-[15px] font-semibold text-gray-900 tabular-nums whitespace-nowrap">{formatNaira(ledgerStats.revenue)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">Trust Score</span>
              <span className="text-[13px] sm:text-[15px] font-semibold text-[#059669] tabular-nums whitespace-nowrap">640 / 1000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button 
            onClick={() => setShowGetPaid(true)}
            className="flex flex-col items-center justify-center py-3 sm:py-4 px-2 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-indigo-50/30 transition-all text-center group cursor-pointer bg-gray-50/50"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <span className="text-[11px] sm:text-[12px] font-semibold text-primary-dark">Get Paid</span>
          </button>
          
          <button 
            onClick={() => setShowOCRModal(true)}
            className="flex flex-col items-center justify-center py-3 sm:py-4 px-2 rounded-xl border border-gray-100 hover:border-[#059669]/30 hover:bg-emerald-50/30 transition-all text-center group cursor-pointer bg-gray-50/50"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-[#059669]" />
            </div>
            <span className="text-[11px] sm:text-[12px] font-semibold text-primary-dark">Scan Receipt</span>
          </button>
          
          <button 
            onClick={() => navigate('/dashboard/products')}
            className="flex flex-col items-center justify-center py-3 sm:py-4 px-2 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-100 transition-all text-center group cursor-pointer bg-gray-50/50"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <span className="text-[11px] sm:text-[12px] font-semibold text-primary-dark">Inventory</span>
          </button>
        </div>
      </div>

      {/* Store Link Card */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-emerald-50/30 rounded-2xl p-6 border border-indigo-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">Your public digital storefront is live!</h4>
          <p className="text-[13px] text-gray-500 mt-1">Share this unique link to accept orders and customer checkouts.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-2 shrink-0">
          <div className="bg-white rounded-lg px-3 py-2 flex items-center border border-indigo-100 overflow-hidden shadow-sm h-10 max-w-xs">
            <span className="text-[13px] text-gray-600 truncate">{storeLink}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none flex items-center justify-center h-10 px-4 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-all shadow-sm shrink-0"
            >
              {isCopied ? 'Copied!' : 'Copy Link'}
            </button>
            <button 
              onClick={() => setShowQR(true)}
              className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm shrink-0"
            >
              <QrCode className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity: sales list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold font-display text-primary-dark text-base sm:text-lg">Recent Orders</h3>
            <Link to="/dashboard/orders" className="text-[12px] font-bold text-primary hover:underline bg-indigo-50 px-2.5 py-1 rounded-full">
              View all →
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <span className="text-gray-400 text-[13px]">No storefront orders received yet.</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map(order => (
                <div key={order.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-primary-dark text-[13px] sm:text-[14px] truncate">{order.customerName}</div>
                    <div className="text-[11px] sm:text-[12px] text-gray-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[13px] font-bold text-gray-900 tabular-nums">{formatNaira(order.totalAmount)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize tracking-wider
                      ${order.status === 'paid' ? 'bg-emerald-50 text-[#059669]' : 'bg-amber-50 text-amber-700'}
                    `}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp widget */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full opacity-50 blur-2xl translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <h3 className="font-bold font-display text-primary-dark text-sm sm:text-base mb-2">WhatsApp Sales Assistant</h3>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Log cash transactions and check summaries via WhatsApp text or voice.
            </p>
            <div className="mt-4 p-3 bg-gray-50/80 border border-gray-100 rounded-xl text-[12px] space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Commands:</div>
              <div className="text-primary-dark font-medium flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0"></span>"Sold 2 bags of rice for 20k"</div>
              <div className="text-primary-dark font-medium flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0"></span>"How much did I make today?"</div>
            </div>
          </div>
          <Link to="/dashboard/whatsapp" className="w-full mt-4 relative z-10">
            <Button variant="secondary" className="w-full text-[12px] font-bold rounded-full h-10 bg-gray-50 hover:bg-gray-100 border-gray-200">
              Open WhatsApp Simulator
            </Button>
          </Link>
        </div>
      </div>

      {/* QR MODAL */}
      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Storefront QR Code">
        <div className="flex flex-col items-center py-4 text-center">
          <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4 shadow-sm">
            <QRCodeSVG value={storeLink} size={180} />
          </div>
          <p className="text-xs text-gray-500 mb-6 max-w-xs">
            Customers can scan this QR code on their device to browse your items and checkout immediately.
          </p>
          <div className="flex gap-2 w-full">
            <Button variant="secondary" className="flex-1 text-xs" onClick={() => setShowQR(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* GET PAID / LOG MANUAL SALE MODAL */}
      <Modal isOpen={showGetPaid} onClose={() => setShowGetPaid(false)} title="Get Paid / Log Transaction">
        <div className="space-y-5 py-2">
          {/* Quick Invoice Link */}
          <div className="p-4 bg-indigo-50/20 border border-indigo-100/50 rounded-lg">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Customer Payment Link
            </label>
            <p className="text-xs text-gray-500 mb-3">Copy invoice link to send directly to a customer for payment.</p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly
                value={`${storeLink}/checkout`}
                className="flex-1 bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${storeLink}/checkout`);
                  alert("Copied invoice link!");
                }}
                className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 shrink-0 text-gray-600"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleLogSale} className="space-y-4 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Record a Cash Sale</h4>
            
            <Input
              type="number"
              label="Amount (₦)"
              placeholder="e.g. 15000"
              required
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
            />

            <Input
              type="text"
              label="Transaction Note (Optional)"
              placeholder="e.g. 2x Ankara lace fabrics"
              value={saleDesc}
              onChange={(e) => setSaleDesc(e.target.value)}
            />

            <Button type="submit" className="w-full text-xs font-semibold mt-2" isLoading={isLoggingSale}>
              Log Cash Sale &amp; Post to Ledger
            </Button>
          </form>
        </div>
      </Modal>

      {/* AZA INVOICE SCANNER MODAL */}
      <Modal isOpen={showOCRModal} onClose={() => { setShowOCRModal(false); setOcrStage('idle'); setSelectedReceipt(null); }} title="Aza Invoice Scanner">
        {ocrStage === 'idle' && (
          <div className="space-y-5 py-2">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-all">
              <Receipt className="w-8 h-8 text-gray-400 mb-3" />
              <h4 className="font-semibold text-gray-900 text-sm">Upload Invoice / Receipt photo</h4>
              <p className="text-[11px] text-gray-500 mt-1 max-w-[200px] mx-auto">Supports JPG, PNG, PDF formats</p>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Try a Mock Receipt Template</h5>
              <div className="grid grid-cols-1 gap-2">
                {MOCK_RECEIPT_TEMPLATES.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMockReceipt(item)}
                    className="p-3 border border-gray-100 rounded-lg text-left hover:border-indigo-200 hover:bg-indigo-50/10 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-gray-900 text-xs">{item.vendor}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{item.desc} • {item.category}</div>
                    </div>
                    <span className="font-bold text-gray-900 text-xs">{formatNaira(item.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {ocrStage === 'scanning' && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <Loader className="w-8 h-8 text-primary animate-spin" />
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Aza AI processing image...</h4>
              <p className="text-[11px] text-gray-500 mt-1">Executing optical character analysis &amp; invoice parsing</p>
            </div>
            <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-progress-mock rounded-full"></div>
            </div>
          </div>
        )}

        {ocrStage === 'review' && (
          <form onSubmit={handlePostOCRExpense} className="space-y-4 py-2">
            <div className="bg-emerald-50 border border-emerald-100 text-[#059669] rounded-lg p-3 flex gap-2 items-start text-xs mb-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Invoice parsed successfully!</span> Review and edit details before writing to ledger.
              </div>
            </div>

            <Input
              type="text"
              label="Vendor Name"
              required
              value={ocrVendor}
              onChange={(e) => setOcrVendor(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Amount (₦)"
                required
                value={ocrAmount}
                onChange={(e) => setOcrAmount(e.target.value)}
              />

              <Input
                type="text"
                label="Category"
                required
                value={ocrCategory}
                onChange={(e) => setOcrCategory(e.target.value)}
              />
            </div>

            <Input
              type="text"
              label="Description Note"
              value={ocrDesc}
              onChange={(e) => setOcrDesc(e.target.value)}
            />

            <div className="flex gap-3 pt-2">
              <Button 
                variant="secondary" 
                className="flex-1 text-xs" 
                type="button"
                onClick={() => { setOcrStage('idle'); setSelectedReceipt(null); }}
              >
                Back
              </Button>
              <Button 
                className="flex-1 text-xs font-semibold" 
                type="submit"
                isLoading={isLoggingSale}
              >
                Post Expense &amp; Close
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
