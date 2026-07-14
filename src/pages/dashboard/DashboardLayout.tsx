import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Home, Package, ShoppingBag, Settings, User, Menu, MoreHorizontal, X } from 'lucide-react';
import { NeoStore, NeoStar, NeoCoins, NeoActivity } from '../../components/icons/NeoIcons';
import { WhatsAppIcon } from '../../components/WhatsAppIcon';
import { Modal } from '../../components/Modal';
import { Logo } from '../../components/Logo';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../../lib/utils';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { ArrowRight, PaintBrushBroad } from '@phosphor-icons/react';


const NAV_ITEMS = [
  { label: 'Dashboard',   icon: Home,         path: '/dashboard' },
  { label: 'Orders',      icon: ShoppingBag,  path: '/dashboard/orders' },
  { label: 'Products',    icon: Package,      path: '/dashboard/products' },
  { label: 'Themes',      icon: PaintBrushBroad,  path: '/dashboard/themes' },
  { label: 'Trust Score', icon: NeoStar,      path: '/dashboard/trust' },
  { label: 'Loans',       icon: NeoCoins,     path: '/dashboard/loans' },
  { label: 'Assistant',   icon: WhatsAppIcon, path: '/dashboard/whatsapp' },
  { label: 'Settings',    icon: Settings,     path: '/dashboard/settings' },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);
  const [storeLink, setStoreLink] = useState('');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('celebrate') === 'true') {
      setShowCelebration(true);
      window.history.replaceState({}, '', '/dashboard');
    }

    async function checkBusiness() {
      const phone = authService.getCurrentPhone();
      if (phone) {
        const b = await businessService.getBusinessByPhone(phone);
        if (b) {
          setStoreLink(`${window.location.origin}/store/${b.storefrontSlug}`);
        } else {
          // If they have a token but no business in DB, they haven't finished onboarding
          navigate('/onboarding/business', { replace: true });
        }
      }
    }
    checkBusiness();
  }, [location, navigate]);

  useEffect(() => {
    if (isMoreMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      const mainEl = document.getElementById('dashboard-main');
      if (mainEl) mainEl.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const mainEl = document.getElementById('dashboard-main');
      if (mainEl) mainEl.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const mainEl = document.getElementById('dashboard-main');
      if (mainEl) mainEl.style.overflow = '';
    };
  }, [isMoreMenuOpen]);

  return (
    <div className="h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 selection:bg-[#E0FF4F] selection:text-slate-900 overflow-hidden">
      
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r-2 border-slate-900 h-screen sticky top-0 z-30">
        <div className="p-6 flex flex-col justify-between h-full overflow-y-auto">
          <div>
            <div className="mb-10 flex items-center px-2">
              <Logo className="h-7 text-slate-900" />
            </div>
            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-sm font-bold transition-all",
                      isActive 
                        ? "bg-[#E0FF4F] text-slate-900 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]" 
                        : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-2 border-transparent hover:border-slate-200"
                    )}
                  >
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    {item.label === 'Bot' ? 'WhatsApp Bot' : item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="pt-6 border-t-2 border-slate-100 mt-6">
            <Link
              to="/dashboard/account"
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-sm font-bold transition-all",
                location.pathname === '/dashboard/account'
                  ? "bg-[#E0FF4F] text-slate-900 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]"
                  : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-2 border-transparent hover:border-slate-200"
              )}
            >
              <User className="w-5 h-5" strokeWidth={2} />
              Account
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b-2 border-slate-900 flex items-center justify-between px-4 h-[72px] shadow-[0_4px_0px_#0f172a]">
        <Logo className="h-7 text-slate-900" />
        <Link
          to="/dashboard/account"
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full border-2 border-slate-900 transition-colors shadow-[2px_2px_0px_#0f172a]",
            location.pathname === '/dashboard/account'
              ? 'bg-[#E0FF4F] text-slate-900'
              : 'bg-white text-slate-900 hover:bg-[#E0FF4F]'
          )}
          aria-label="Account"
        >
          <User className="w-5 h-5" strokeWidth={2} />
        </Link>
      </header>

      {/* ── Main Content ── */}
      <main id="dashboard-main" className="flex-1 pt-[72px] md:pt-0 pb-[80px] md:pb-0 overflow-y-auto h-full relative">
        <div className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-900 flex items-center justify-around px-2 pt-3 pb-safe z-40 safe-pb shadow-[0_-4px_0px_#0f172a]">
        {NAV_ITEMS.filter(item => ['Dashboard', 'Orders', 'Products', 'Assistant'].includes(item.label)).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMoreMenuOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 min-w-0 flex-1 transition-all mb-2 rounded-[12px]",
                isActive 
                  ? 'text-slate-900 bg-[#E0FF4F] border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]' 
                  : 'text-slate-500 hover:text-slate-900 border-2 border-transparent'
              )}
            >
              <item.icon className="w-6 h-6 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold truncate w-full text-center">
                {item.label === 'Bot' ? 'Bot' : item.label}
              </span>
            </Link>
          );
        })}
        {/* 'More' Button */}
        <button
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 min-w-0 flex-1 transition-all mb-2 rounded-[12px]",
            isMoreMenuOpen || !['/dashboard', '/dashboard/orders', '/dashboard/products', '/dashboard/whatsapp'].includes(location.pathname)
              ? 'text-slate-900 bg-[#E0FF4F] border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]'
              : 'text-slate-500 hover:text-slate-900 border-2 border-transparent'
          )}
        >
          <Menu className="w-6 h-6 shrink-0" strokeWidth={isMoreMenuOpen ? 2.5 : 2} />
          <span className="text-[10px] font-bold truncate w-full text-center">More</span>
        </button>
      </nav>

      {/* ── Mobile More Bottom Sheet (Slide-Up Menu) ── */}
      {isMoreMenuOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsMoreMenuOpen(false)} style={{ touchAction: 'none' }} />
          <div className="bg-white rounded-t-[32px] border-t-2 border-slate-900 p-4 sm:p-6 z-10 space-y-4 sm:space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
              <span className="font-display font-black text-slate-900 text-2xl">More Options</span>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-slate-900 bg-slate-100 text-slate-900 hover:bg-[#E0FF4F] shadow-[2px_2px_0px_#0f172a] transition-all"
              >
                <X className="w-5 h-5" weight="bold" />
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
                      "flex flex-col items-center gap-2 p-3 rounded-[12px] border-2 border-slate-900 transition-all",
                      isActive 
                        ? 'bg-[#E0FF4F] text-slate-900 shadow-[2px_2px_0px_#0f172a]' 
                        : 'bg-white text-slate-900 shadow-[2px_2px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none'
                    )}
                  >
                    <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-xs font-bold text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Store Live Celebration Modal ── */}
      <Modal isOpen={showCelebration} onClose={() => setShowCelebration(false)} title="You are live!" theme="brutal" headerClassName="bg-[#00E5FF]">
        <div className="flex flex-col items-center text-center pb-4">
          <div className="w-24 h-24 bg-[#E0FF4F] border-2 border-slate-900 rounded-full flex items-center justify-center mb-6 text-5xl shadow-[4px_4px_0px_#0f172a]">
            🚀
          </div>
          <p className="text-lg font-bold text-slate-900 mb-8">Share your link to start selling instantly.</p>

          <div className="bg-slate-50 border-2 border-slate-900 rounded-[12px] p-4 w-full flex items-center justify-between mb-8 shadow-inner">
            <span className="text-sm font-bold text-slate-700 truncate pr-4">{storeLink}</span>
            <button
              onClick={() => navigator.clipboard.writeText(storeLink)}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-[8px] font-bold text-sm hover:bg-slate-800 transition-colors shadow-[2px_2px_0px_#E0FF4F]"
            >
              Copy
            </button>
          </div>

          <div className="flex justify-center mb-8 bg-white p-4 rounded-[16px] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
            <QRCodeSVG value={storeLink || 'https://kudi.com'} size={160} />
          </div>

          <a
            href={`https://wa.me/?text=Shop my store online! ${encodeURIComponent(storeLink)}`}
            target="_blank" rel="noreferrer"
            className="w-full mb-4"
          >
            <button className="w-full flex items-center justify-center gap-2 bg-[#E0FF4F] text-slate-900 px-6 py-4 rounded-[12px] font-bold text-lg border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">
              Share to WhatsApp <ArrowRight weight="bold" />
            </button>
          </a>
          <button className="font-bold text-slate-500 hover:text-slate-900 mt-2 text-sm transition-colors underline decoration-2" onClick={() => setShowCelebration(false)}>Back to Dashboard</button>
        </div>
      </Modal>


    </div>
  );
}
