import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Copy, QrCode, Download, ShieldAlert, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Business, Order, Product } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { orderService } from '../../lib/services/orderService';
import { productService } from '../../lib/services/productService';
import { Button } from '../../components/Button';
import { formatNaira } from '../../lib/utils';
import { Modal } from '../../components/Modal';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);

  useEffect(() => {
    async function load() {
      const phone = authService.getCurrentPhone();
      if (!phone) return;
      const b = await businessService.getBusinessByPhone(phone);
      if (b) {
        setBusiness(b);
        const [o, p] = await Promise.all([
          orderService.getOrders(b.id),
          productService.getProducts(b.id)
        ]);
        setOrders(o);
        setProducts(p);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="p-3 md:p-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="h-48 bg-gray-200 rounded-2xl mb-4"></div>
        <div className="h-48 bg-gray-200 rounded-2xl mb-4"></div>
      </div>
    );
  }

  if (!business) return null;

  const storeLink = `${window.location.origin}/store/${business.storefrontSlug}`;
  const recentOrders = orders.slice(0, 5);

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(dateStr => {
    const dailyTotal = orders
      .filter(o => o.status !== 'cancelled' && o.createdAt.startsWith(dateStr))
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const date = new Date(dateStr);
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      total: dailyTotal
    };
  });

  const downloadQR = () => {
    const svg = document.getElementById('store-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('new');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${business.storefrontSlug}-qr.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="p-3 md:p-4 max-w-5xl mx-auto">
      {business.kycTier === 0 && !hideBanner && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Get verified to start accepting payments</h4>
              <p className="text-sm text-gray-600">Takes about 2 minutes to complete.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button onClick={() => navigate('/dashboard/account?verify=true')} className="flex-1 sm:flex-none">Get Verified</Button>
            <button onClick={() => setHideBanner(true)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-orange-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {business.businessName}</h1>
          <div className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            Tier {business.kycTier === 1 ? '1 — Verified' : '0'}
          </div>
        </div>
      </header>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center mb-4">
          <div className="w-16 h-16 bg-orange-50 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <StoreIcon />
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to CODA!</h2>
          <p className="text-gray-500 mb-4 max-w-sm mx-auto">Your store is set up, but it's empty. Add your first product to start selling.</p>
          <Link to="/dashboard/products">
            <Button>Add Your First Product</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sales Trends</h3>
            <div className="text-sm font-medium text-gray-500">Last 7 Days</div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F9D58" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0F9D58" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₦${val/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatNaira(value), 'Sales']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="total" stroke="#0F9D58" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Store Link Card */}
      <div id="store-link-card" className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 md:p-5 border border-green-100 shadow-sm mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Your Store Link</h3>
        <div className="flex flex-col lg:flex-row items-stretch gap-2">
          <div className="flex-1 bg-white rounded-lg pl-3 pr-1.5 py-1.5 flex items-center justify-between border border-green-200 overflow-hidden shadow-sm h-10">
            <span className="text-gray-600 text-sm truncate mr-2 whitespace-nowrap overflow-hidden text-ellipsis block min-w-0">{storeLink}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(storeLink)}
              className="w-7 h-7 text-primary bg-white hover:bg-green-50 rounded-md transition-colors flex items-center justify-center shrink-0 border border-transparent hover:border-green-100"
              title="Copy Link"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              to={`/store/${business.storefrontSlug}`}
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center h-10 px-3 bg-white text-gray-600 rounded-lg border border-green-200 hover:bg-green-50 transition-colors shadow-sm shrink-0 whitespace-nowrap text-sm font-medium"
              title="Visit Store"
            >
              Visit Store
            </Link>
            <button 
              onClick={() => setShowQR(true)}
              className="flex items-center justify-center h-10 w-10 bg-white text-gray-600 rounded-lg border border-green-200 hover:bg-green-50 transition-colors shadow-sm shrink-0"
              title="View QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <a 
              href={`https://wa.me/?text=${encodeURIComponent(`Check out my store on CODA: ${storeLink}`)}`}
              target="_blank" rel="noreferrer"
              className="flex-1 lg:flex-none flex items-center justify-center px-4 h-10 bg-[#25D366] text-white font-medium rounded-lg hover:bg-[#20bd5a] transition-colors shadow-sm whitespace-nowrap text-sm"
            >
              Share to WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-gray-900">Recent Orders</h3>
          {orders.length > 0 && (
            <Link to="/dashboard/orders" className="text-primary font-medium text-sm flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center shadow-sm">
            <p className="text-gray-500">No orders yet. Share your link to get started!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentOrders.map(order => (
              <Link key={order.id} to="/dashboard/orders" className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:border-gray-200 transition-colors shadow-sm">
                <div>
                  <div className="font-medium text-gray-900">{order.customerName}</div>
                  <div className="text-sm text-gray-500">{order.items.length} item(s) • {formatNaira(order.totalAmount)}</div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize
                  ${order.status === 'new' ? 'bg-blue-50 text-blue-700' : ''}
                  ${order.status === 'paid' ? 'bg-green-50 text-green-700' : ''}
                  ${order.status === 'fulfilled' ? 'bg-gray-100 text-gray-700' : ''}
                  ${order.status === 'cancelled' ? 'bg-red-50 text-red-700' : ''}
                `}>
                  {order.status}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Store QR Code">
        <div className="flex flex-col items-center py-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 shadow-sm">
            <QRCodeSVG id="store-qr-code" value={storeLink} size={200} />
          </div>
          <p className="text-gray-500 text-center mb-4 max-w-xs">Customers can scan this code to visit your store directly.</p>
          <div className="w-full flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowQR(false)}>Close</Button>
            <Button className="flex-1 flex items-center justify-center gap-2" onClick={downloadQR}>
              <Download className="w-4 h-4" /> Download
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StoreIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
  );
}
