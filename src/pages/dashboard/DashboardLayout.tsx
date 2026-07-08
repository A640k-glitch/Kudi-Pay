import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingBag, Settings, User, MessageSquare, Menu, MoreHorizontal, PaintRoller } from 'lucide-react';
import { NeoStore, NeoStar, NeoCoins, NeoActivity } from '../../components/icons/NeoIcons';
import { WhatsAppIcon } from '../../components/WhatsAppIcon';
import { Modal } from '../../components/Modal';
import { Logo } from '../../components/Logo';
import { QRCodeSVG } from 'qrcode.react';
import BrutalButton from '../../components/ui/BrutalButton';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { label: 'Home',        icon: Home,         path: '/dashboard' },
  { label: 'Orders',      icon: ShoppingBag,  path: '/dashboard/orders' },
  { label: 'Products',    icon: Package,      path: '/dashboard/products' },
  { label: 'Themes',      icon: PaintRoller,  path: '/dashboard/themes' },
  { label: 'Trust Score', icon: NeoStar,      path: '/dashboard/trust' },
  { label: 'Loans',       icon: NeoCoins,     path: '/dashboard/loans' },
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
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row font-sans text-black selection:bg-[#E0FF4F] selection:text-black">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r-[4px] border-black h-screen sticky top-0 shadow-[4px_0px_0px_rgba(0,0,0,1)] z-30">
        <div className="p-6 flex flex-col justify-between h-full overflow-y-auto">
          <div>
            <div className="mb-10 flex items-center">
              <Logo className="h-8" />
            </div>
            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 border-[3px] font-black uppercase text-sm transition-all",
                      isActive 
                        ? "bg-[#E0FF4F] text-black border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]" 
                        : "bg-white text-black border-transparent hover:border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                    )}
                  >
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 3 : 2} />
                    {item.label === 'Bot' ? 'WhatsApp Bot' : item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="pt-6 border-t-[4px] border-black mt-6">
            <Link
              to="/dashboard/account"
              className={cn(
                "flex items-center gap-3 px-4 py-3 border-[3px] font-black uppercase text-sm transition-all",
                location.pathname === '/dashboard/account'
                  ? "bg-[#4D9DE0] text-white border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black border-transparent hover:border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              )}
            >
              <User className="w-5 h-5" strokeWidth={2.5} />
              Account
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#E0FF4F] border-b-[4px] border-black flex items-center justify-between px-4 h-16 shadow-[0px_4px_0px_rgba(0,0,0,1)]">
        <Logo className="h-8" />
        <Link
          to="/dashboard/account"
          className={cn(
            "flex items-center justify-center w-10 h-10 border-[3px] border-black transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]",
            location.pathname === '/dashboard/account'
              ? 'bg-[#FF6666] text-white'
              : 'bg-white text-black hover:bg-black hover:text-[#E0FF4F]'
          )}
          aria-label="Account"
        >
          <User className="w-5 h-5" strokeWidth={2.5} />
        </Link>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 pt-16 md:pt-0 pb-20 md:pb-0 overflow-y-auto">
        <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[4px] border-black flex items-center justify-around px-2 pt-3 pb-safe z-40 safe-pb shadow-[0px_-4px_0px_rgba(0,0,0,1)]">
        {NAV_ITEMS.filter(item => ['Home', 'Orders', 'Products', 'Bot'].includes(item.label)).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMoreMenuOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 min-w-0 flex-1 border-[3px] transition-all mb-2",
                isActive 
                  ? 'bg-[#E0FF4F] border-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] -translate-y-1' 
                  : 'bg-transparent border-transparent text-gray-600 hover:text-black hover:border-black'
              )}
            >
              <item.icon className="w-6 h-6 shrink-0" strokeWidth={isActive ? 3 : 2} />
              <span className="text-[10px] font-black uppercase truncate w-full text-center">
                {item.label === 'Bot' ? 'Bot' : item.label}
              </span>
            </Link>
          );
        })}
        {/* 'More' Button */}
        <button
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 min-w-0 flex-1 border-[3px] transition-all mb-2",
            isMoreMenuOpen || !['/dashboard', '/dashboard/orders', '/dashboard/products', '/dashboard/whatsapp'].includes(location.pathname)
              ? 'bg-[#E0FF4F] border-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] -translate-y-1'
              : 'bg-transparent border-transparent text-gray-600 hover:text-black hover:border-black'
          )}
        >
          <Menu className="w-6 h-6 shrink-0" strokeWidth={isMoreMenuOpen ? 3 : 2} />
          <span className="text-[10px] font-black uppercase truncate w-full text-center">More</span>
        </button>
      </nav>

      {/* ── Mobile More Bottom Sheet (Slide-Up Menu) ── */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsMoreMenuOpen(false)} />
          <div className="bg-[#4D9DE0] border-t-[4px] border-black p-4 sm:p-6 z-10 space-y-4 sm:space-y-6 animate-in slide-in-from-bottom duration-300 shadow-[0px_-10px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-[4px] border-black pb-3 sm:pb-4 mb-2">
              <span className="font-black text-black text-lg sm:text-xl uppercase">More Options</span>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="text-xs sm:text-sm font-black uppercase border-[3px] border-black bg-white px-3 sm:px-4 py-1.5 sm:py-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-6 sm:pb-8">
              {NAV_ITEMS.filter(item => ['Themes', 'Trust Score', 'Loans', 'Settings'].includes(item.label)).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 border-[3px] border-black transition-all",
                      isActive 
                        ? 'bg-[#E0FF4F] text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                        : 'bg-white text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                    )}
                  >
                    <item.icon className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={isActive ? 3 : 2} />
                    <span className="text-[10px] sm:text-sm font-black uppercase text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Store Live Celebration Modal ── */}
      <Modal isOpen={showCelebration} onClose={() => setShowCelebration(false)} title="You are live!">
        <div className="flex flex-col items-center text-center pb-4">
          <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mb-6 text-4xl shadow-[4px_4px_0px_rgba(255,102,102,1)] rotate-12">
            🚀
          </div>
          <p className="text-sm sm:text-lg font-bold text-black mb-8 border-b-[4px] border-black pb-4">Share your link to start selling instantly.</p>

          <div className="bg-white border-[3px] border-black p-3 sm:p-4 w-full flex items-center justify-between mb-8 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <span className="text-xs sm:text-sm font-black truncate pr-4">{storeLink}</span>
            <button
              onClick={() => navigator.clipboard.writeText(storeLink)}
              className="bg-[#4D9DE0] text-white px-3 sm:px-4 py-2 border-[3px] border-black font-black uppercase text-[10px] sm:text-xs shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)]"
            >
              Copy
            </button>
          </div>

          <div className="flex justify-center mb-8 border-[4px] border-black bg-white p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-[-2deg]">
            <QRCodeSVG value={storeLink || 'https://kudi.ng'} size={140} />
          </div>

          <a
            href={`https://wa.me/?text=Shop my store online! ${encodeURIComponent(storeLink)}`}
            target="_blank" rel="noreferrer"
            className="w-full mb-4"
          >
            <BrutalButton color="#06D6A0" className="w-full text-lg sm:text-xl py-3 sm:py-4">Share to WhatsApp</BrutalButton>
          </a>
          <button className="font-black uppercase text-black hover:underline mt-2 text-xs sm:text-sm" onClick={() => setShowCelebration(false)}>Back to Dashboard</button>
        </div>
      </Modal>
    </div>
  );
}
