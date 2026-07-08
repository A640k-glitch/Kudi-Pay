import React, { useEffect, useState } from 'react';
import { Outlet, useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Phone, MapPin, ArrowRight } from 'lucide-react';
import { businessService } from '../../lib/services/businessService';
import { Business } from '../../lib/types';
import { useCartStore } from '../../lib/store';
import { Logo } from '../../components/Logo';
import CartDrawer from '../../components/CartDrawer';

// ─── Per-theme CSS variable sets ───────────────────────────────────────────
function themeVars(theme: string): string {
  if (theme === 'brutal') {
    return `
      :root {
        --s-bg: #000000;
        --s-surface: #000000;
        --s-card: #000000;
        --s-border: #ffffff;
        --s-text: #ffffff;
        --s-text-muted: #a3a3a3;
        --s-accent: #E0FF4F;
        --s-accent-text: #000000;
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
      --s-bg: #ffffff;
      --s-surface: #f9fafb;
      --s-card: #ffffff;
      --s-border: #e5e7eb;
      --s-text: #111827;
      --s-text-muted: #6b7280;
      --s-accent: #000000;
      --s-accent-text: #ffffff;
    }
    body {
      background-color: var(--s-bg);
      color: var(--s-text);
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
        window.location.reload();
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
      <style>{themeVars(theme)}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-colors duration-300 ${isBrutal ? 'border-b-[4px] border-white' : 'border-b border-gray-200'}`}
        style={{ background: isBrutal ? '#000000' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to={`/store/${slug}`} className="flex items-center gap-3 shrink-0 group">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.businessName} className={`w-10 h-10 sm:w-12 sm:h-12 object-cover ${isBrutal ? 'border-[3px] border-white' : 'rounded-full border border-gray-200'}`} />
            ) : (
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-black ${isBrutal ? 'border-[3px] border-white bg-[#E0FF4F] text-black shadow-[4px_4px_0px_rgba(255,255,255,1)] group-hover:translate-x-1 transition-transform' : 'rounded-full bg-black text-white'}`}
              >
                {initial}
              </div>
            )}
            <span className={`${isBrutal ? 'font-black text-xl sm:text-2xl uppercase tracking-tighter' : 'font-bold text-lg sm:text-xl tracking-tight'}`} style={{ color: 'var(--s-text)' }}>
              {business.businessName}
            </span>
          </Link>

          {/* Cart */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative flex items-center gap-2 px-5 py-2.5 transition-all ${isBrutal ? 'border-[3px] border-white bg-[#E0FF4F] text-black font-black uppercase hover:-translate-y-1 shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'bg-black text-white font-medium rounded-full hover:bg-gray-800'}`}
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={isBrutal ? 3 : 2} />
              <span className="hidden sm:inline">CART</span>
              {cartItemCount > 0 && (
                <span className={`w-6 h-6 flex items-center justify-center text-xs ${isBrutal ? 'bg-black text-[#E0FF4F] border-[2px] border-white font-black' : 'bg-white text-black rounded-full font-bold'}`}>
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
      <footer className={`${isBrutal ? 'border-t-[4px] border-white' : 'border-t border-gray-200'}`} style={{ background: isBrutal ? '#000000' : '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.businessName} className={`w-10 h-10 object-cover ${isBrutal ? 'border-[2px] border-white' : 'rounded-full'}`} />
                ) : (
                  <div className={`w-10 h-10 flex items-center justify-center font-black text-lg ${isBrutal ? 'bg-[#E0FF4F] text-black border-[2px] border-white' : 'bg-black text-white rounded-full'}`}>
                    {initial}
                  </div>
                )}
                <span className={`${isBrutal ? 'font-black text-xl uppercase tracking-tighter' : 'font-bold text-lg'}`} style={{ color: 'var(--s-text)' }}>{business.businessName}</span>
              </div>
              <p className={`${isBrutal ? 'text-sm font-bold uppercase leading-relaxed text-gray-400' : 'text-gray-500 leading-relaxed'}`}>
                Quality products. Secure checkout. Direct from {business.businessName}.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p className={`${isBrutal ? 'font-black uppercase tracking-widest text-white mb-6 border-b-[2px] border-white pb-2 inline-block' : 'font-semibold text-gray-900 mb-4'}`}>Shop</p>
              <ul className={`flex flex-col gap-4 ${isBrutal ? 'font-bold uppercase text-sm text-gray-400' : 'text-gray-500'}`}>
                <li><Link to={`/store/${slug}`} className="hover:text-[var(--s-text)] transition-colors">Home</Link></li>
                <li><Link to={`/store/${slug}`} className="hover:text-[var(--s-text)] transition-colors">All Products</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className={`${isBrutal ? 'font-black uppercase tracking-widest text-white mb-6 border-b-[2px] border-white pb-2 inline-block' : 'font-semibold text-gray-900 mb-4'}`}>Contact</p>
              <ul className={`flex flex-col gap-4 ${isBrutal ? 'font-bold uppercase text-sm text-gray-400' : 'text-gray-500'}`}>
                {business.ownerPhone && (
                  <li className="flex items-center gap-3">
                    <Phone className="w-5 h-5" strokeWidth={isBrutal ? 3 : 2} />
                    <a href={`tel:${business.ownerPhone}`} className="hover:text-[var(--s-text)] transition-colors">{business.ownerPhone}</a>
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
          <div className={`pt-8 flex flex-col md:flex-row items-center justify-between gap-4 ${isBrutal ? 'border-t-[4px] border-white' : 'border-t border-gray-200'}`}>
            <p className={`${isBrutal ? 'font-bold uppercase text-xs text-gray-400' : 'text-sm text-gray-500'}`}>
              © {new Date().getFullYear()} {business.businessName}. ALL RIGHTS RESERVED.
            </p>
            <Link to="/" className="flex items-center gap-2">
              <span className={`${isBrutal ? 'font-black uppercase text-xs text-white' : 'text-sm text-gray-400 font-medium'}`}>POWERED BY</span>
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
