import React, { useEffect, useState } from 'react';
import { Outlet, useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Phone, MapPin, Instagram, Twitter, ArrowRight } from 'lucide-react';
import { businessService } from '../../lib/services/businessService';
import { Business } from '../../lib/types';
import { useCartStore } from '../../lib/store';
import { Logo } from '../../components/Logo';
import CartDrawer from '../../components/CartDrawer';

// ─── Per-theme CSS variable sets ───────────────────────────────────────────
function themeVars(theme: string): string {
  if (theme === 'bold') {
    return `
      :root {
        --s-bg: #0a0a0a;
        --s-surface: #141414;
        --s-card: #1c1c1c;
        --s-border: #2a2a2a;
        --s-text: #f5f5f5;
        --s-text-muted: #737373;
        --s-accent: #FBBF24;
        --s-accent-soft: rgba(251,191,36,0.12);
        --s-hero-from: #1a0a00;
        --s-hero-to: #0a0a0a;
      }
    `;
  }

  // classic
  return `
    :root {
      --s-bg: #F7F6F2;
      --s-surface: #FAFAF8;
      --s-card: #ffffff;
      --s-border: #E8E6E0;
      --s-text: #1A1A1A;
      --s-text-muted: #6b7280;
      --s-accent: #059669;
      --s-accent-soft: rgba(5,150,105,0.08);
      --s-hero-from: #1E1B4B;
      --s-hero-to: #059669;
    }
  `;
}

export default function StoreLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        // Update favicon
        const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (favicon) {
          favicon.href = b.logoUrl || '/favicon.svg';
        }
      }
    }
    load();
  }, [slug]);

  // Listen for theme changes from dashboard
  useEffect(() => {
    const themeChannel = new BroadcastChannel('theme_updates');
    themeChannel.onmessage = (event) => {
      if (event.data.type === 'theme_changed' && event.data.slug === slug) {
        // Reload the page to apply the new theme
        window.location.reload();
      }
    };

    // Listen for inventory changes from dashboard
    const inventoryChannel = new BroadcastChannel('inventory_updates');
    inventoryChannel.onmessage = (event) => {
      if (event.data.type === 'inventory_changed' && event.data.slug === slug) {
        // Reload the page to reflect inventory changes
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-gray-200" />
          <div className="h-3 w-32 bg-gray-200 rounded-full" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8] p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-6">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-sm">This store doesn't exist or has been removed.</p>
        <Link to="/" className="text-[#059669] font-semibold hover:underline flex items-center gap-1">
          Create your own store <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const theme = business.theme || 'classic';
  const initial = business.businessName.charAt(0).toUpperCase();

  return (
    <div style={{ background: 'var(--s-bg)', color: 'var(--s-text)' }} className="min-h-screen flex flex-col font-sans">
      <style>{themeVars(theme)}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ borderColor: 'var(--s-border)', background: theme === 'bold' ? 'rgba(10,10,10,0.92)' : theme === 'minimal' ? 'rgba(255,255,255,0.92)' : 'rgba(247,246,242,0.92)', backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to={`/store/${slug}`} className="flex items-center gap-3 shrink-0">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.businessName} className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
                style={{ background: 'var(--s-accent)', color: theme === 'minimal' ? '#fff' : theme === 'bold' ? '#000' : '#fff' }}
              >
                {initial}
              </div>
            )}
            <span
              className="font-black text-lg tracking-tight"
              style={{ color: 'var(--s-text)' }}
            >
              {business.businessName}
            </span>
          </Link>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium" style={{ color: 'var(--s-text-muted)' }}>
            <Link to={`/store/${slug}`} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--s-text)' }}>Shop</Link>
            <a href={`tel:${business.ownerPhone}`} className="hover:opacity-70 transition-opacity">Contact</a>
          </nav>

          {/* Cart */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{ background: 'var(--s-accent)', color: theme === 'minimal' ? '#fff' : theme === 'bold' ? '#000' : '#fff' }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-[10px] font-black flex items-center justify-center" style={{ color: 'var(--s-accent)' }}>
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
      <footer className="border-t mt-20" style={{ borderColor: 'var(--s-border)', background: theme === 'bold' ? '#0a0a0a' : theme === 'minimal' ? '#f9fafb' : '#F7F6F2' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
            {/* Brand column */}
            <div className="sm:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.businessName} className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base" style={{ background: 'var(--s-accent)', color: theme === 'bold' ? '#000' : '#fff' }}>
                    {initial}
                  </div>
                )}
                <span className="font-black text-base tracking-tight" style={{ color: 'var(--s-text)' }}>{business.businessName}</span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--s-text-muted)' }}>
                Your trusted {business.category.toLowerCase()} store. Quality products, secure checkout.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--s-text-muted)' }}>Quick Links</p>
              <ul className="flex flex-col gap-3 text-[13px]" style={{ color: 'var(--s-text)' }}>
                <li><Link to={`/store/${slug}`} className="hover:opacity-70 transition-opacity">Home</Link></li>
                <li><Link to={`/store/${slug}`} className="hover:opacity-70 transition-opacity">All Products</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--s-text-muted)' }}>Contact</p>
              <ul className="flex flex-col gap-3 text-[13px]" style={{ color: 'var(--s-text-muted)' }}>
                {business.ownerPhone && (
                  <li className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <a href={`tel:${business.ownerPhone}`} className="hover:opacity-70 transition-opacity">{business.ownerPhone}</a>
                  </li>
                )}
                {(business.lga || business.state) && (
                  <li className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{[business.lga, business.state].filter(Boolean).join(', ')}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'var(--s-border)' }}>
            <p className="text-[12px]" style={{ color: 'var(--s-text-muted)' }}>
              © {new Date().getFullYear()} {business.businessName}. All rights reserved.
            </p>
            <Link to="/" className="flex items-center gap-1.5">
              <Logo className="h-5" />
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
