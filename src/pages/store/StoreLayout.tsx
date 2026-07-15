import React, { useEffect, useState } from 'react';
import { Outlet, useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Phone, MapPin, ArrowRight, ArrowLeft, Lock, X, Package } from 'lucide-react';
import { businessService } from '../../lib/services/businessService';
import { productService } from '../../lib/services/productService';
import { Business, Product } from '../../lib/types';
import { useCartStore } from '../../lib/store';
import { Logo } from '../../components/Logo';
import CartDrawer from '../../components/CartDrawer';
import { useToast } from '../../components/Toast';

const getContrastYIQ = (hexcolor: string) => {
  if (!hexcolor) return '#000000';
  hexcolor = hexcolor.replace("#", "");
  if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(c => c + c).join('');
  const r = parseInt(hexcolor.substring(0, 2), 16) || 0;
  const g = parseInt(hexcolor.substring(2, 2), 16) || 0;
  const b = parseInt(hexcolor.substring(4, 2), 16) || 0;
  return (((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128) ? '#000000' : '#ffffff';
};

// ─── Per-theme CSS variable sets ───────────────────────────────────────────
function themeVars(theme: string, config?: any): string {
  let primary = config?.primaryColor || (theme === 'light' || theme === 'brutal' ? '#111111' : '#10b981');

  // If in dark mode and the user's primary color is extremely dark (like #000000 or #111111),
  // fallback to the default emerald or a readable color so it doesn't blend into the dark background.
  if (theme === 'modern' && (primary === '#111111' || primary === '#000000' || primary === '#121212' || primary === '#18181B')) {
    primary = '#10b981'; // The "logo" green color
  }

  const accentText = getContrastYIQ(primary);

  if (theme === 'light' || theme === 'brutal') {
    return `
      :root {
        --s-bg: #ffffff;
        --s-surface: #ffffff;
        --s-card: #ffffff;
        --s-border: #e5e7eb;
        --s-text: #111111;
        --s-text-muted: #4b5563;
        --s-accent: ${primary};
        --s-accent-text: ${accentText};
      }
      body {
        background-color: var(--s-bg);
        color: var(--s-text);
        font-family: 'Outfit', sans-serif;
      }
      h1, h2, h3, h4, h5, h6, .font-display {
        font-family: 'Plus Jakarta Sans', sans-serif;
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
  const location = useLocation();
  const { addToast } = useToast();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartItemCount = useCartStore(state => state.getItemCount());

  // Stock Alert Modal State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [outofStockItems, setOutofStockItems] = useState<{ name: string; originalQty: number; newQty: number; isOut: boolean; category?: string }[]>([]);
  const [alternatives, setAlternatives] = useState<Product[]>([]);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
  };

  const checkCartStock = async () => {
    if (!business) return;
    try {
      const freshProducts = await productService.getProducts(business.id);
      const cartItems = useCartStore.getState().items;

      const affected: { name: string; originalQty: number; newQty: number; isOut: boolean; category?: string }[] = [];
      const updatedItems = [...cartItems];
      let cartChanged = false;

      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        const fresh = freshProducts.find(p => p.id === item.productId);

        if (!fresh) {
          affected.push({
            name: item.productName,
            originalQty: item.quantity,
            newQty: 0,
            isOut: true,
            category: undefined
          });
          updatedItems.splice(i, 1);
          i--;
          cartChanged = true;
          continue;
        }

        const isOut = !fresh.isAvailable || (fresh.stockCount !== undefined && fresh.stockCount <= 0);
        const maxAvailable = fresh.stockCount !== undefined ? fresh.stockCount : 9999;

        if (isOut) {
          affected.push({
            name: item.productName,
            originalQty: item.quantity,
            newQty: 0,
            isOut: true,
            category: fresh.category
          });
          updatedItems.splice(i, 1);
          i--;
          cartChanged = true;
        } else if (item.quantity > maxAvailable) {
          affected.push({
            name: item.productName,
            originalQty: item.quantity,
            newQty: maxAvailable,
            isOut: false,
            category: fresh.category
          });
          updatedItems[i] = { ...item, quantity: maxAvailable };
          cartChanged = true;
        }
      }

      if (cartChanged) {
        // Update store directly
        useCartStore.setState({ items: updatedItems });
        if (typeof window !== 'undefined') {
          localStorage.setItem('kudi_store_cart_items', JSON.stringify(updatedItems));
        }

        // Find recommended alternatives from same category
        const categoriesOfAffected = affected.map(a => a.category).filter(Boolean);
        const altRecommendations = freshProducts.filter(p =>
          p.isAvailable &&
          (p.stockCount === undefined || p.stockCount > 0) &&
          !updatedItems.some(item => item.productId === p.id) &&
          categoriesOfAffected.includes(p.category)
        ).slice(0, 3);

        setAlternatives(altRecommendations);
        setOutofStockItems(affected);
        setIsNotificationOpen(true);
      }
    } catch (err) {
      console.error('Failed to sync cart inventory:', err);
    }
  };

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

  useEffect(() => {
    const inventoryChannel = new BroadcastChannel('inventory_updates');
    inventoryChannel.onmessage = (event) => {
      if (event.data.type === 'inventory_changed' && event.data.slug === slug) {
        checkCartStock();
      }
    };

    if (business) {
      checkCartStock();
    }

    return () => inventoryChannel.close();
  }, [business?.id, slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!business) return <div className="min-h-screen flex items-center justify-center font-black text-xl sm:text-2xl uppercase">Store not found</div>;

  const theme = business.theme || 'light';
  const isDarkMode = theme === 'modern';
  const isLight = !isDarkMode;
  const primary = business.themeConfig?.primaryColor || (isLight ? '#111111' : '#2563EB');
  const accentText = getContrastYIQ(primary);
  const initial = business.businessName.charAt(0).toUpperCase();
  const isCheckoutPage = location.pathname.endsWith('/checkout');

  return (
    <div className={`min-h-screen flex flex-col ${isLight ? 'selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)] bg-white' : 'selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)] bg-[#121212]'}`}>
      <style>{themeVars(theme, business.themeConfig)}</style>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-40 ${isLight ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/30' : 'bg-[#18181B]/90 backdrop-blur-md border-b border-[#27272A]'}`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between gap-4 ${isLight ? 'px-4 lg:px-8 h-16 lg:h-20' : 'px-4 sm:px-6 lg:px-8 h-16 sm:h-20'}`}>

          {isCheckoutPage ? (
            <>
              {/* Back to Store link */}
              <Link to={`/store/${slug}`} className="flex items-center gap-2 text-slate-500 hover:text-[#111111] transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="font-semibold text-sm hidden sm:inline">Back to Store</span>
              </Link>

              {/* Logo / Brand Centered */}
              <div className="flex items-center gap-3 shrink-0">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.businessName} className={`w-8 h-8 object-cover rounded-xl border ${isLight ? 'border-slate-100' : 'border-[#27272A]'}`} />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center text-sm font-black bg-[var(--s-accent)] text-[var(--s-accent-text)] rounded-xl border border-transparent">
                    {initial}
                  </div>
                )}
                <span className={`font-display font-semibold text-base sm:text-lg tracking-tight truncate max-w-[150px] ${isLight ? 'text-[#111111]' : 'text-white font-serif'} `} style={!isLight ? { fontFamily: '"Playfair Display", "Source Serif Pro", serif' } : {}}>{business.businessName}</span>
              </div>

              {/* Secured checkout and cart */}
              <div className="flex items-center gap-3 text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Secured Checkout</span>
                </div>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative flex items-center justify-center p-2 text-slate-500 hover:text-[#111111] transition-colors"
                >
                  <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 flex items-center justify-center text-[9px] font-bold bg-[#111111] text-white min-w-[16px] h-4 px-1 rounded-full">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Logo / Brand */}
              <Link to={`/store/${slug}`} className="flex items-center gap-3 shrink-0 group">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.businessName} className={`w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-xl border ${isLight ? 'border-slate-100' : 'border-[#27272A]'} transition-all hover:scale-105`} />
                ) : (
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-lg transition-transform font-black bg-[var(--s-accent)] text-[var(--s-accent-text)] rounded-xl group-hover:scale-105`}>
                    {initial}
                  </div>
                )}
                <span className={`truncate max-w-[150px] lg:max-w-[300px] font-semibold text-lg sm:text-xl tracking-tight ${isLight ? 'text-[#111111] font-display' : 'text-white font-serif'}`} style={!isLight ? { fontFamily: '"Playfair Display", "Source Serif Pro", serif' } : {}}>{business.businessName}</span>
              </Link>

              {/* Cart */}
              <div className="flex items-center gap-4 text-slate-600">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className={`relative flex items-center justify-center p-2 transition-colors hover:text-[var(--s-accent)] ${isLight ? 'text-slate-500' : 'text-[#9CA3AF]'}`}
                >
                  <ShoppingBag className={`w-5 h-5 ${isLight ? '' : 'text-white'}`} strokeWidth={1.5} />
                  {!isLight && <span className="hidden sm:inline ml-2 text-xs uppercase tracking-wider font-semibold text-white">CART</span>}
                  {cartItemCount > 0 && (
                    isLight ? (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center text-[9px] font-bold bg-[#111111] text-white min-w-[16px] h-4 px-1 rounded-full">
                        {cartItemCount}
                      </span>
                    ) : (
                      <span className={`flex items-center justify-center text-[10px] sm:text-xs min-w-[20px] h-[20px] px-1 bg-accent text-white rounded-full font-bold shadow-sm ml-1`}>
                        {cartItemCount}
                      </span>
                    )
                  )}
                </button>
              </div>
            </>
          )}

        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <main className="flex-1 pt-16 sm:pt-20">
        <Outlet context={{ business, setIsCartOpen }} />
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className={isLight ? 'bg-slate-50 text-slate-500 border-t border-slate-200/30' : 'bg-[#18181B] border-t border-[#27272A] text-[#9CA3AF]'}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-10">
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.businessName} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-[10px] shadow-sm border border-slate-100" />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-base font-bold bg-[var(--s-accent)] text-[var(--s-accent-text)] rounded-[10px] shadow-sm">
                    {initial}
                  </div>
                )}
                <span className={`text-lg sm:text-xl font-bold font-display ${isLight ? 'text-primary' : 'text-white'}`}>{business.businessName}</span>
              </div>
              <p className={`max-w-xs text-sm font-medium leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#9CA3AF]'}`}>
                Quality products. Secure checkout. Direct from {business.businessName}.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p className={`font-bold font-display mb-3 text-sm ${isLight ? 'text-[#111111]' : 'text-white'}`}>Shop</p>
              <ul className={`flex flex-col gap-2.5 font-medium text-sm ${isLight ? 'text-slate-500' : 'text-[#9CA3AF]'}`}>
                <li><Link to={`/store/${slug}`} className="hover:text-accent transition-colors">Home</Link></li>
                <li><Link to={`/store/${slug}`} className="hover:text-accent transition-colors">All Products</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className={`font-bold font-display mb-3 text-sm ${isLight ? 'text-[#111111]' : 'text-white'}`}>Contact</p>
              <ul className={`flex flex-col gap-2.5 font-medium text-sm ${isLight ? 'text-slate-500' : 'text-[#9CA3AF]'}`}>
                {business.ownerPhone && (
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" strokeWidth={2} />
                    <a href={`tel:${business.ownerPhone}`} className="hover:text-accent transition-colors truncate">{business.ownerPhone}</a>
                  </li>
                )}
                {(business.lga || business.state) && (
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" strokeWidth={2} />
                    <span className="truncate">{[business.lga, business.state].filter(Boolean).join(', ')}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className={isLight 
            ? "pt-6 pb-6 px-4 -mx-4 sm:-mx-6 lg:-mx-8 mt-10 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-4"
            : "py-4 px-6 mt-10 mb-4 bg-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
          }>
            <p className={`font-medium text-xs text-center md:text-left ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              © {new Date().getFullYear()} {business.businessName}. ALL RIGHTS RESERVED.
            </p>
            <Link to="/" className="flex items-center gap-2 group">
              <span className={`font-bold text-[10px] sm:text-xs tracking-wider transition-colors ${isLight ? 'group-hover:text-primary' : 'text-slate-800'}`}>POWERED BY</span>
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

      {/* Stock Alert Modal */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNotificationOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-left text-slate-800">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold font-display text-red-600 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Stock Alert!
              </h3>
              <button
                onClick={() => setIsNotificationOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Some items in your cart have run out of stock or have limited availability. We have updated your cart to prevent checkout failures.
            </p>

            {/* Affected Items List */}
            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {outofStockItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800 max-w-[180px] truncate">{item.name}</span>
                  <span className="font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                    {item.isOut ? 'Out of Stock (Removed)' : `Adjusted to ${item.newQty} left`}
                  </span>
                </div>
              ))}
            </div>

            {/* Alternatives Section */}
            {alternatives.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Recommended Alternatives</h4>
                <div className="space-y-3">
                  {alternatives.map(alt => (
                    <div key={alt.id} className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          {alt.imageUrl && <img src={alt.imageUrl} className="w-full h-full object-cover" alt={alt.name} />}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-800 truncate max-w-[140px]">{alt.name}</span>
                          <span className="block text-[10px] text-slate-500">{formatNaira(alt.price)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          useCartStore.getState().addItem({
                            productId: alt.id,
                            productName: alt.name,
                            quantity: 1,
                            unitPrice: alt.price,
                            imageUrl: alt.imageUrl
                          });
                          // Remove from recommended list
                          setAlternatives(prev => prev.filter(p => p.id !== alt.id));
                          addToast('Alternative added to cart!', 'success');
                        }}
                        className="px-3 py-1.5 bg-[#111111] hover:bg-slate-800 text-white rounded-full text-[10px] font-semibold transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setIsNotificationOpen(false)}
                className="w-full py-3 bg-[#111111] hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors text-center shadow-sm"
              >
                Keep Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
