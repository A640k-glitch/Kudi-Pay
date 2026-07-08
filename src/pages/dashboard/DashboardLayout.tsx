import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingBag, Settings, User, Sparkles, CreditCard, MessageSquare, Palette, Menu, MoreHorizontal } from 'lucide-react';
import { WhatsAppIcon } from '../../components/WhatsAppIcon';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { QRCodeSVG } from 'qrcode.react';

const NAV_ITEMS = [
  { label: 'Home',        icon: Home,         path: '/dashboard' },
  { label: 'Orders',      icon: ShoppingBag,  path: '/dashboard/orders' },
  { label: 'Products',    icon: Package,      path: '/dashboard/products' },
  { label: 'Themes',      icon: Palette,      path: '/dashboard/themes' },
  { label: 'Trust Score', icon: Sparkles,     path: '/dashboard/trust' },
  { label: 'Loans',       icon: CreditCard,   path: '/dashboard/loans' },
  { label: 'Bot',         icon: WhatsAppIcon, path: '/dashboard/whatsapp' },
  { label: 'Settings',    icon: Settings,     path: '/dashboard/settings' },
];

export default function DashboardLayout() {
  const location = useLocation();
  const [showCelebration, setShowCelebration] = useState(false);
  const [storeLink, setStoreLink] = useState('');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('celebrate') === 'true') {
      setShowCelebration(true);
      window.history.replaceState({}, '', '/dashboard');
    }

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

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0">
        <div className="p-4 flex flex-col justify-between h-full">
          <div>
            <div className="mb-8 flex items-center px-4">
              <Logo className="h-8" />
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm ${
                      isActive ? 'bg-indigo-50/50 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label === 'Bot' ? 'WhatsApp Bot' : item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <Link
              to="/dashboard/account"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${
                location.pathname === '/dashboard/account'
                  ? 'bg-indigo-50/50 text-primary font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              Account
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
        <Logo className="h-7" />
        <Link
          to="/dashboard/account"
          className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
            location.pathname === '/dashboard/account'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          aria-label="Account"
        >
          <User className="w-4 h-4" />
        </Link>
      </header>

      {/* ── Main Content ── */}
      {/* pt-14 on mobile to clear the top bar; pb-20 to clear the bottom nav */}
      <main className="flex-1 pt-14 md:pt-0 pb-20 md:pb-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-1 pt-2 pb-safe z-40 safe-pb">
        {NAV_ITEMS.filter(item => ['Home', 'Orders', 'Products', 'Bot'].includes(item.label)).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMoreMenuOpen(false)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-0 flex-1 ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <item.icon
                className={`w-5 h-5 shrink-0 ${isActive && item.label === 'Home' ? 'fill-indigo-50' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[9px] font-medium truncate w-full text-center leading-tight">
                {item.label === 'Bot' ? 'WhatsApp' : item.label}
              </span>
            </Link>
          );
        })}
        {/* 'More' Button */}
        <button
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-0 flex-1 ${
            isMoreMenuOpen || !['/dashboard', '/dashboard/orders', '/dashboard/products', '/dashboard/whatsapp'].includes(location.pathname)
              ? 'text-primary'
              : 'text-gray-400'
          }`}
        >
          <Menu className="w-5 h-5 shrink-0" strokeWidth={isMoreMenuOpen ? 2.5 : 2} />
          <span className="text-[9px] font-medium truncate w-full text-center leading-tight">More</span>
        </button>
      </nav>

      {/* ── Mobile More Bottom Sheet (Slide-Up Menu) ── */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/40 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsMoreMenuOpen(false)} />
          <div className="bg-white rounded-t-3xl p-5 z-10 space-y-4 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-1">
              <span className="font-bold text-gray-900 text-xs tracking-wider uppercase">More Options</span>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full font-semibold transition-colors"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-6">
              {NAV_ITEMS.filter(item => ['Themes', 'Trust Score', 'Loans', 'Settings'].includes(item.label)).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                      isActive 
                        ? 'bg-indigo-50/50 border-indigo-100 text-primary font-bold shadow-sm' 
                        : 'bg-gray-50/50 border-gray-100 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-[#312E81] text-white' : 'bg-white text-gray-400 shadow-sm border border-gray-50'
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[12px] font-semibold tracking-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Store Live Celebration Modal ── */}
      <Modal isOpen={showCelebration} onClose={() => setShowCelebration(false)}>
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-emerald-50 text-accent rounded-full flex items-center justify-center mb-6 text-3xl">
            🎉
          </div>
          <h2 className="text-2xl font-bold font-display text-gray-900 mb-2">Your store is live!</h2>
          <p className="text-xs text-gray-500 mb-6 max-w-sm">Share your link with customers so they can start buying from you.</p>

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
            <QRCodeSVG value={storeLink || 'https://kudi.ng'} size={120} />
          </div>

          <a
            href={`https://wa.me/?text=Shop my store online! ${encodeURIComponent(storeLink)}`}
            target="_blank" rel="noreferrer"
            className="w-full mb-3"
          >
            <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">Share to WhatsApp</Button>
          </a>
          <Button variant="ghost" className="w-full text-xs font-semibold" onClick={() => setShowCelebration(false)}>Go to Dashboard</Button>
        </div>
      </Modal>
    </div>
  );
}
