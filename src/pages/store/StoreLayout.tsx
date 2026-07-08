import React, { useEffect, useState } from 'react';
import { Outlet, useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Phone, MapPin, ArrowRight } from 'lucide-react';
import { businessService } from '../../lib/services/businessService';
import { Business } from '../../lib/types';
import { useCartStore } from '../../lib/store';
import { Logo } from '../../components/Logo';
import CartDrawer from '../../components/CartDrawer';

// ─── Per-theme CSS variable sets ───────────────────────────────────────────
function themeVars(theme: string, config?: any): string {
  const primary = config?.primaryColor || (theme === 'brutal' ? '#E0FF4F' : '#10b981');
  const secondary = config?.secondaryColor || (theme === 'brutal' ? '#FF6666' : '#0f172a');

  if (theme === 'brutal') {
    return `
      :root {
        --s-bg: #000000;
        --s-surface: #000000;
        --s-card: #000000;
        --s-border: #ffffff;
        --s-text: #ffffff;
        --s-text-muted: #a3a3a3;
        --s-accent: ${primary};
        --s-accent-text: #000000;
        --s-secondary: ${secondary};
      }
      body {
        background-color: var(--s-bg);
        color: var(--s-text);
      }
    `;
  }

  // modern
  return `
    :root {
      --s-bg: #f8fafc;
      --s-surface: #ffffff;
      --s-card: #ffffff;
      --s-border: #e2e8f0;
      --s-text: #0f172a;
      --s-text-muted: #64748b;
      --s-accent: ${primary};
      --s-accent-text: #ffffff;
      --s-secondary: ${secondary};
    }
    body {
      background-color: var(--s-bg);
      color: var(--s-text);
      font-family: 'Inter', sans-serif;
    }
    h1, h2, h3, h4, h5, h6, .font-display {
      font-family: 'Space Grotesk', sans-serif;
    }
  `;
}

export default function StoreLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartItemCount = useCartStore(state => state.getItemCount());

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const b = await businessService.getBusinessBySlug(slug);
      setBusiness(b);
      setIsLoading(false);
      if (b) {
        document.title = `${b.businessName} — Shop Online`;
        const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (favicon) {
          favicon.href = b.logoUrl || '/favicon.svg';
        }
      }
    }
    load();
  }, [slug]);

  useEffect(() => {
    const themeChannel = new BroadcastChannel('theme_updates');
    themeChannel.onmessage = (event) => {
      if (event.data.type === 'theme_changed' && event.data.slug === slug) {
        setBusiness(prev => prev ? { 
          ...prev, 
          theme: event.data.theme, 
          themeConfig: event.data.themeConfig 
        } : prev);
      }
    };

    const inventoryChannel = new BroadcastChannel('inventory_updates');
    inventoryChannel.onmessage = (event) => {
      if (event.data.type === 'inventory_changed' && event.data.slug === slug) {
        window.location.reload();
      }
    };

    return () => {
      themeChannel.close();
      inventoryChannel.close();
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center border-[8px] border-black m-4">
        <div className="w-20 h-20 bg-[#E0FF4F] border-[4px] border-black flex items-center justify-center text-black mb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <ShoppingBag className="w-10 h-10" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-black uppercase text-black mb-2">Store Not Found</h1>
        <p className="text-lg font-bold uppercase text-gray-600 mb-8 max-w-sm">This store doesn't exist or has been removed.</p>
        <Link to="/" className="bg-black text-[#E0FF4F] px-6 py-3 font-black uppercase border-[3px] border-black shadow-[4px_4px_0px_rgba(224,255,79,1)] hover:-translate-y-1 transition-transform">
          CREATE YOUR STORE <ArrowRight className="w-5 h-5 inline-block ml-2" />
        </Link>
      </div>
    );
  }

  const theme = business.theme || 'brutal';
  const isBrutal = theme === 'brutal';
  const initial = business.businessName.charAt(0).toUpperCase();

  return (
    <div style={{ background: 'var(--s-bg)', color: 'var(--s-text)' }} className={`min-h-screen flex flex-col ${isBrutal ? 'font-sans' : 'font-sans'}`}>
      <style>{themeVars(theme, business.themeConfig)}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-colors duration-300 ${isBrutal ? 'border-b-[4px] border-white' : 'glass-panel border-b border-slate-200/60 shadow-sm'}`}
        style={{ background: isBrutal ? '#000000' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to={`/store/${slug}`} className="flex items-center gap-3 shrink-0 group">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.businessName} className={`w-10 h-10 sm:w-12 sm:h-12 object-cover ${isBrutal ? 'border-[3px] border-white' : 'rounded-[16px] border border-slate-200 shadow-sm'}`} />
            ) : (
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl ${isBrutal ? 'font-black border-[3px] border-white bg-[#E0FF4F] text-black shadow-[4px_4px_0px_rgba(255,255,255,1)] group-hover:translate-x-1 transition-transform' : 'font-display font-bold rounded-[16px] bg-accent text-white shadow-md'}`}
              >
                {initial}
              </div>
            )}
            <span className={`${isBrutal ? 'font-black text-xl sm:text-2xl uppercase tracking-tighter' : 'font-display font-bold text-xl sm:text-2xl tracking-tight'}`} style={{ color: 'var(--s-text)' }}>
              {business.businessName}
            </span>
          </Link>

          {/* Cart */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative flex items-center gap-2 px-5 py-2.5 transition-all ${isBrutal ? 'border-[3px] border-white bg-[#E0FF4F] text-black font-black uppercase hover:-translate-y-1 shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'bg-slate-100 text-primary font-semibold rounded-[16px] hover:bg-slate-200 border border-slate-200/60 shadow-sm'}`}
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={isBrutal ? 3 : 2} />
              <span className="hidden sm:inline">CART</span>
              {cartItemCount > 0 && (
                <span className={`w-6 h-6 flex items-center justify-center text-xs ${isBrutal ? 'bg-black text-[#E0FF4F] border-[2px] border-white font-black' : 'bg-accent text-white rounded-full font-bold shadow-sm'}`}>
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ───────────────────────────────────────────────── */}
      <main className="flex-1 w-full">
        <Outlet context={{ business }} />
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className={`${isBrutal ? 'border-t-[4px] border-white' : 'border-t border-slate-200/60'}`} style={{ background: isBrutal ? '#000000' : '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.businessName} className={`w-10 h-10 object-cover ${isBrutal ? 'border-[2px] border-white' : 'rounded-[12px] shadow-sm border border-slate-100'}`} />
                ) : (
                  <div className={`w-10 h-10 flex items-center justify-center text-lg ${isBrutal ? 'font-black bg-[#E0FF4F] text-black border-[2px] border-white' : 'font-display font-bold bg-accent text-white rounded-[12px] shadow-sm'}`}>
                    {initial}
                  </div>
                )}
                <span className={`${isBrutal ? 'font-black text-xl uppercase tracking-tighter' : 'font-display font-bold text-xl'}`} style={{ color: 'var(--s-text)' }}>{business.businessName}</span>
              </div>
              <p className={`${isBrutal ? 'text-sm font-bold uppercase leading-relaxed text-gray-400' : 'text-sm font-medium text-slate-500 leading-relaxed'}`}>
                Quality products. Secure checkout. Direct from {business.businessName}.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p className={`${isBrutal ? 'font-black uppercase tracking-widest text-white mb-6 border-b-[2px] border-white pb-2 inline-block' : 'font-display font-bold text-primary mb-4'}`}>Shop</p>
              <ul className={`flex flex-col gap-4 ${isBrutal ? 'font-bold uppercase text-sm text-gray-400' : 'font-medium text-sm text-slate-500'}`}>
                <li><Link to={`/store/${slug}`} className="hover:text-accent transition-colors">Home</Link></li>
                <li><Link to={`/store/${slug}`} className="hover:text-accent transition-colors">All Products</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className={`${isBrutal ? 'font-black uppercase tracking-widest text-white mb-6 border-b-[2px] border-white pb-2 inline-block' : 'font-display font-bold text-primary mb-4'}`}>Contact</p>
              <ul className={`flex flex-col gap-4 ${isBrutal ? 'font-bold uppercase text-sm text-gray-400' : 'font-medium text-sm text-slate-500'}`}>
                {business.ownerPhone && (
                  <li className="flex items-center gap-3">
                    <Phone className="w-5 h-5" strokeWidth={isBrutal ? 3 : 2} />
                    <a href={`tel:${business.ownerPhone}`} className="hover:text-accent transition-colors">{business.ownerPhone}</a>
                  </li>
                )}
                {(business.lga || business.state) && (
                  <li className="flex items-center gap-3">
                    <MapPin className="w-5 h-5" strokeWidth={isBrutal ? 3 : 2} />
                    <span>{[business.lga, business.state].filter(Boolean).join(', ')}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className={`pt-8 flex flex-col md:flex-row items-center justify-between gap-4 ${isBrutal ? 'border-t-[4px] border-white' : 'border-t border-slate-200/60'}`}>
            <p className={`${isBrutal ? 'font-bold uppercase text-xs text-gray-400' : 'font-medium text-sm text-slate-400'}`}>
              © {new Date().getFullYear()} {business.businessName}. ALL RIGHTS RESERVED.
            </p>
            <Link to="/" className="flex items-center gap-2 group">
              <span className={`${isBrutal ? 'font-black uppercase text-xs text-white' : 'font-bold text-xs text-slate-400 tracking-wider group-hover:text-primary transition-colors'}`}>POWERED BY</span>
              <Logo className="h-6" />
            </Link>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      {business && (
        <CartDrawer
          business={business}
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onCheckout={() => navigate(`/store/${slug}/checkout`)}
        />
      )}
    </div>
  );
}
