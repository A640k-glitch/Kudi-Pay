import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingBag, Settings, User } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { QRCodeSVG } from 'qrcode.react';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, path: '/dashboard' },
  { label: 'Orders', icon: ShoppingBag, path: '/dashboard/orders' },
  { label: 'Products', icon: Package, path: '/dashboard/products' },
  { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
];

export default function DashboardLayout() {
  const location = useLocation();
  const [showCelebration, setShowCelebration] = useState(false);
  const [storeLink, setStoreLink] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('celebrate') === 'true') {
      setShowCelebration(true);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
    
    // Get business info for link
    const str = localStorage.getItem('coda_businesses');
    const phone = localStorage.getItem('coda_session_phone');
    if (str && phone) {
      const businesses = JSON.parse(str);
      const b = businesses.find((b: any) => b.ownerPhone === phone);
      if (b) {
        setStoreLink(`${window.location.origin}/store/${b.storefrontSlug}`);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0">
        <div className="p-4">
          <div className="text-primary font-bold text-2xl tracking-tight mb-6">CODA</div>
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive ? 'bg-green-50 text-primary font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Link
            to="/dashboard/account"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              location.pathname === '/dashboard/account' ? 'bg-green-50 text-primary font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <User className="w-5 h-5" />
            Account
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-3 pb-safe z-40">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'fill-green-50' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Celebration Modal */}
      <Modal isOpen={showCelebration} onClose={() => setShowCelebration(false)}>
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-green-100 text-primary rounded-full flex items-center justify-center mb-6">
            🎉
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your store is live!</h2>
          <p className="text-gray-500 mb-6 max-w-sm">Share your link with customers so they can start buying from you.</p>
          
          <div className="bg-gray-50 rounded-xl p-4 w-full flex items-center justify-between mb-6">
            <span className="text-sm font-medium truncate pr-4">{storeLink}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(storeLink)}
              className="text-primary font-semibold text-sm shrink-0 uppercase tracking-wide"
            >
              Copy
            </button>
          </div>

          <div className="flex justify-center mb-6">
             <QRCodeSVG value={storeLink || 'https://coda.ng'} size={120} />
          </div>

          <a 
            href={`https://wa.me/?text=Shop my store online! ${encodeURIComponent(storeLink)}`}
            target="_blank" rel="noreferrer"
            className="w-full mb-3"
          >
            <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">Share to WhatsApp</Button>
          </a>
          <Button variant="ghost" className="w-full" onClick={() => setShowCelebration(false)}>Go to Dashboard</Button>
        </div>
      </Modal>
    </div>
  );
}
