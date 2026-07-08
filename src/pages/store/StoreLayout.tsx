import React, { useEffect, useState } from 'react';
import { Outlet, useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Phone, MapPin, ArrowRight } from 'lucide-react';
import { businessService } from '../../lib/services/businessService';
import { Business } from '../../lib/types';
import { useCartStore } from '../../lib/store';
import { Logo } from '../../components/Logo';
import CartDrawer from '../../components/CartDrawer';

const getContrastYIQ = (hexcolor: string) => {
  if (!hexcolor) return '#000000';
  hexcolor = hexcolor.replace("#", "");
  if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(c => c + c).join('');
  const r = parseInt(hexcolor.substring(0,2),16) || 0;
  const g = parseInt(hexcolor.substring(2,2),16) || 0;
  const b = parseInt(hexcolor.substring(4,2),16) || 0;
  return (((r*299)+(g*587)+(b*114))/1000 >= 128) ? '#000000' : '#ffffff';
};

// ─── Per-theme CSS variable sets ───────────────────────────────────────────
function themeVars(theme: string, config?: any): string {
  const primary = config?.primaryColor || (theme === 'brutal' ? '#E0FF4F' : '#10b981');
  const accentText = getContrastYIQ(primary);
  
  if (theme === 'brutal') {
    const isLightMode = accentText === '#000000';
    const bg = isLightMode ? '#fdfbf7' : '#000000';
    const surface = isLightMode ? '#ffffff' : '#000000';
    const text = isLightMode ? '#000000' : '#ffffff';
    const border = isLightMode ? '#000000' : '#ffffff';
    const textMuted = isLightMode ? '#4b5563' : '#a3a3a3';

    return `
      :root {
        --s-bg: ${bg};
        --s-surface: ${surface};
        --s-card: ${surface};
        --s-border: ${border};
        --s-text: ${text};
        --s-text-muted: ${textMuted};
        --s-accent: ${primary};
        --s-accent-text: ${accentText};
      }
      body {
        background-color: var(--s-bg);
        color: var(--s-text);
        font-family: 'Space Grotesk', sans-serif;
      }
    `;
  }

  // modern
  const isDarkMode = accentText === '#ffffff';
  const mBg = isDarkMode ? '#0f172a' : '#f8fafc';
  const mSurface = isDarkMode ? '#1e293b' : '#ffffff';
  const mBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const mText = isDarkMode ? '#f8fafc' : '#0f172a';
  const mTextMuted = isDarkMode ? '#94a3b8' : '#64748b';

  return `
    :root {
      --s-bg: ${mBg};
      --s-surface: ${mSurface};
      --s-card: ${mSurface};
      --s-border: ${mBorder};
      --s-text: ${mText};
      --s-text-muted: ${mTextMuted};
      --s-accent: ${primary};
      --s-accent-text: ${accentText};
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
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartItemCount = useCartStore(state => state.getItemCount());

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const data = await businessService.getBusinessBySlug(slug!);
        setBusiness(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [slug]);

  useEffect(() => {
    const themeChannel = new BroadcastChannel('theme_updates');
    themeChannel.onmessage = (event) => {
      if (event.data.type === 'theme_changed' && event.data.slug === slug) {
        setBusiness(prev => prev ? { 
          ...prev, 
          theme: event.data.theme,
          themeConfig: event.data.themeConfig
        } : null);
      }
    };
    return () => themeChannel.close();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
    </div>;
  }
  
  if (!business) return <div className="min-h-screen flex items-center justify-center font-black text-xl sm:text-2xl uppercase">Store not found</div>;

  const theme = business.theme || 'modern';
  const isBrutal = theme === 'brutal';
  const primary = business.themeConfig?.primaryColor || (isBrutal ? '#E0FF4F' : '#10b981');
  const accentText = getContrastYIQ(primary);
  const isLightMode = isBrutal && accentText === '#000000';
  const isDarkMode = !isBrutal && accentText === '#ffffff';
  const initial = business.businessName.charAt(0).toUpperCase();

  return (
    <div className={`min-h-screen flex flex-col ${isBrutal ? 'selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)]' : 'selection:bg-accent selection:text-white'} ${isLightMode ? 'brutal-light-mode' : ''} ${isDarkMode ? 'modern-dark-mode' : ''}`}>
      <style>{themeVars(theme, business.themeConfig)}</style>
      
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-40 ${isBrutal ? 'bg-black border-b-[3px] border-white' : 'glass-panel bg-white/80 border-b border-slate-200/60 shadow-sm backdrop-blur-xl'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo / Brand */}
          <Link to={`/store/${slug}`} className="flex items-center gap-3 shrink-0 group">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.businessName} className={`w-8 h-8 sm:w-10 sm:h-10 object-cover ${isBrutal ? 'border-[2px] border-white transition-transform group-hover:-translate-y-1' : 'rounded-[10px] shadow-sm border border-slate-100 transition-all group-hover:scale-105'}`} />
            ) : (
              <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-lg transition-transform ${isBrutal ? 'font-black bg-[var(--s-accent)] text-[var(--s-accent-text)] border-[2px] border-white group-hover:-translate-y-1' : 'font-display font-bold bg-accent text-white rounded-[10px] shadow-sm group-hover:scale-105 group-hover:shadow-md'}`}>
                {initial}
              </div>
            )}
            <span className={`hidden sm:block truncate max-w-[150px] lg:max-w-[300px] ${isBrutal ? 'font-black text-lg sm:text-xl uppercase tracking-tighter text-[var(--s-accent)]' : 'font-display font-bold text-lg sm:text-xl text-slate-800'}`}>{business.businessName}</span>
          </Link>

          {/* Cart */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 transition-all ${isBrutal ? 'border-[2.5px] border-white bg-[var(--s-accent)] text-[var(--s-accent-text)] font-black uppercase text-sm sm:text-base hover:-translate-y-0.5 shadow-[3px_3px_0px_rgba(255,255,255,1)]' : 'bg-slate-100 text-primary font-semibold text-sm sm:text-base rounded-xl hover:bg-slate-200 border border-slate-200/60 shadow-sm'}`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={isBrutal ? 2.5 : 2} />
              <span className="hidden sm:inline">CART</span>
              {cartItemCount > 0 && (
                <span className={`flex items-center justify-center text-[10px] sm:text-xs min-w-[20px] h-[20px] px-1 ${isBrutal ? 'bg-black text-[var(--s-accent)] border-[2px] border-white font-black' : 'bg-accent text-white rounded-full font-bold shadow-sm ml-1'}`}>
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <main className="flex-1 pt-16 sm:pt-20">
        <Outlet context={{ business }} />
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className={`${isBrutal ? 'bg-black text-white border-t-[4px] border-white' : 'bg-white border-t border-slate-200/60 text-slate-600'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-10">
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.businessName} className={`w-8 h-8 sm:w-10 sm:h-10 object-cover ${isBrutal ? 'border-[2px] border-white' : 'rounded-[10px] shadow-sm border border-slate-100'}`} />
                ) : (
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-base ${isBrutal ? 'font-black bg-[var(--s-accent)] text-[var(--s-accent-text)] border-[2px] border-white' : 'font-display font-bold bg-accent text-white rounded-[10px] shadow-sm'}`}>
                    {initial}
                  </div>
                )}
                <span className={`${isBrutal ? 'font-black text-lg sm:text-xl uppercase tracking-tighter' : 'font-display font-bold text-lg sm:text-xl text-slate-800'}`}>{business.businessName}</span>
              </div>
              <p className={`max-w-xs ${isBrutal ? 'text-xs sm:text-sm font-bold uppercase leading-relaxed text-gray-300' : 'text-sm font-medium leading-relaxed'}`}>
                Quality products. Secure checkout. Direct from {business.businessName}.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p className={`${isBrutal ? 'font-black uppercase tracking-widest mb-4 border-b-[2px] border-white pb-1.5 inline-block text-sm' : 'font-display font-bold text-slate-800 mb-3 text-sm'}`}>Shop</p>
              <ul className={`flex flex-col gap-2.5 ${isBrutal ? 'font-bold uppercase text-xs sm:text-sm text-gray-300' : 'font-medium text-sm text-slate-500'}`}>
                <li><Link to={`/store/${slug}`} className="hover:text-accent transition-colors">Home</Link></li>
                <li><Link to={`/store/${slug}`} className="hover:text-accent transition-colors">All Products</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className={`${isBrutal ? 'font-black uppercase tracking-widest mb-4 border-b-[2px] border-white pb-1.5 inline-block text-sm' : 'font-display font-bold text-slate-800 mb-3 text-sm'}`}>Contact</p>
              <ul className={`flex flex-col gap-2.5 ${isBrutal ? 'font-bold uppercase text-xs sm:text-sm text-gray-300' : 'font-medium text-sm text-slate-500'}`}>
                {business.ownerPhone && (
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" strokeWidth={isBrutal ? 2.5 : 2} />
                    <a href={`tel:${business.ownerPhone}`} className="hover:text-accent transition-colors truncate">{business.ownerPhone}</a>
                  </li>
                )}
                {(business.lga || business.state) && (
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" strokeWidth={isBrutal ? 2.5 : 2} />
                    <span className="truncate">{[business.lga, business.state].filter(Boolean).join(', ')}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className={`pt-6 pb-6 px-4 -mx-4 sm:-mx-6 lg:-mx-8 mt-10 flex flex-col md:flex-row items-center justify-between gap-4 ${isBrutal ? 'bg-white border-t-[3px] border-black' : 'border-t border-slate-200/60'}`}>
            <p className={`${isBrutal ? 'font-bold uppercase text-[10px] sm:text-xs text-black text-center md:text-left' : 'font-medium text-xs text-slate-400 text-center md:text-left'}`}>
              © {new Date().getFullYear()} {business.businessName}. ALL RIGHTS RESERVED.
            </p>
            <Link to="/" className="flex items-center gap-2 group">
              <span className={`${isBrutal ? 'font-black uppercase text-black text-[10px] sm:text-xs' : 'font-bold text-[10px] sm:text-xs tracking-wider group-hover:text-primary transition-colors'}`}>POWERED BY</span>
              <Logo className="h-5 sm:h-6" />
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
