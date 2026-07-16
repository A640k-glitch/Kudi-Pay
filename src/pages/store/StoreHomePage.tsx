import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ShoppingBag, X, Plus, Minus, Package, ArrowRight } from 'lucide-react';
import { Business, Product } from '../../lib/types';
import { productService } from '../../lib/services/productService';
import { businessService, getDefaultHeroImageUrl, getDefaultThemeConfig } from '../../lib/services/businessService';
import { useCartStore } from '../../lib/store';
import { useToast } from '../../components/Toast';
import { getRegistry } from '../../lib/config/productRegistries';
import LoadingProgress from '../../components/ui/LoadingProgress';

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
};

// ─── SHARED: Product Detail Modal ──────────────────────────────────────────────
function ProductModal({
  product,
  onClose,
  onAdd,
  theme,
  business
}: {
  product: Product | null;
  onClose: () => void;
  onAdd: (p: Product, qty: number) => void;
  theme: string;
  business: Business;
}) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) setQuantity(1);
  }, [product]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!product || !mounted) return null;

  const isDarkMode = theme === 'modern';
  const isLight = !isDarkMode;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-4xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden rounded-[32px] shadow-2xl border ${isLight ? 'bg-white border-slate-200/60' : 'bg-[#18181B] border-[#27272A]'}`}>
        
        <button onClick={onClose} className={`absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full shadow-sm border ${isLight ? 'bg-white/80 text-slate-500 border-slate-200/60 hover:bg-white hover:text-primary' : 'bg-[#121212]/80 text-[#9CA3AF] border-[#27272A] hover:bg-[#121212] hover:text-white'}`}>
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className={`w-full md:w-1/2 aspect-square md:aspect-auto relative flex items-center justify-center border-b md:border-b-0 md:border-r ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#121212] border-[#27272A]'}`}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className={`w-20 h-20 ${isLight ? 'text-slate-300' : 'text-[#3F3F46]'}`} strokeWidth={1} />
          )}
        </div>

        <div className={`w-full md:w-1/2 p-4 md:p-6 lg:p-8 flex flex-col overflow-y-auto ${isLight ? 'bg-white text-primary' : 'bg-[#18181B] text-white'}`}>
          <div className="flex-1">
            <h2 className="text-3xl font-bold font-display mb-3">
              {product.name}
            </h2>
            <p className={`text-2xl font-bold mb-6 ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {formatNaira(product.price)}
            </p>

            {product.description && (
              <div className={`text-base sm:text-lg font-medium mb-8 leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#9CA3AF]'}`}>
                {product.description}
              </div>
            )}

            {!product.isAvailable && (
              <div className="inline-flex items-center px-3 py-1.5 mb-5 bg-amber-50 text-amber-600 rounded-full font-semibold text-xs border border-amber-100">
                Sold Out
              </div>
            )}
          </div>

          <div className={`pt-6 mt-auto border-t ${isLight ? 'border-slate-200/60' : 'border-[#27272A]'}`}>
            
            {/* Modal Attribute Display */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-4 bg-black/5 rounded-xl p-4">
                {Object.entries(product.attributes).map(([key, val]) => {
                  if (!val) return null;
                  const field = getRegistry(business.category).fields.find(f => f.key === key);
                  const label = field ? field.label : key;
                  return (
                    <div key={key}>
                      <span className={`block text-xs uppercase tracking-wider font-bold mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
                      <span className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{val}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5">
              <span className={`font-semibold text-sm ${isLight ? 'text-slate-700' : 'text-[#9CA3AF]'}`}>Quantity</span>
              <div className={`flex items-center gap-1.5 border rounded-xl p-1 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#3F3F46] bg-[#121212]'}`}>
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!product.isAvailable || quantity <= 1}
                  className={`rounded-lg disabled:opacity-50 w-8 h-8 flex items-center justify-center ${isLight ? 'text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm' : 'text-[#9CA3AF] hover:bg-[#27272A] hover:text-white'}`}
                >
                  <Minus className="w-4 h-4" strokeWidth={2} />
                </button>
                <span className={`w-8 sm:w-10 text-center font-bold text-sm ${isLight ? 'text-primary' : 'text-white'}`}>{quantity}</span>
                <button 
                  onClick={() => {
                    const maxVal = product.stockCount !== undefined ? product.stockCount : 9999;
                    if (product.isAvailable && quantity < maxVal) {
                      setQuantity(quantity + 1); 
                    }
                  }}
                  disabled={!product.isAvailable || (product.stockCount !== undefined && quantity >= product.stockCount)}
                  className={`rounded-lg disabled:opacity-50 w-8 h-8 flex items-center justify-center ${isLight ? 'text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm' : 'text-[#9CA3AF] hover:bg-[#27272A] hover:text-white'}`}
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            <button
              onClick={() => onAdd(product, quantity)}
              disabled={!product.isAvailable}
              className="w-full h-12 md:h-14 flex items-center justify-center transition-all bg-[var(--s-accent)] text-[var(--s-accent-text)] font-semibold rounded-[16px] shadow-sm hover:brightness-110 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {product.isAvailable ? `${business.themeConfig?.ctaText || getDefaultThemeConfig(business.category).ctaText} • ${formatNaira(product.price * quantity)}` : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── DARK MODE STOREFRONT ──────────────────────────────────────────────────────────
function ModernStorefront({ 
  business, 
  products, 
  onOpenProduct,
  onAddDirect
}: { 
  business: Business; 
  products: Product[]; 
  onOpenProduct: (p: Product) => void;
  onAddDirect: (p: Product) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  
  const registry = getRegistry(business.category);
  const filterableFields = registry.fields.filter(f => f.isFilterable);

  // Extract all categories from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    for (const [key, val] of Object.entries(activeFilters)) {
      if (val && p.attributes?.[key] !== val) return false;
    }
    return true;
  });

  const heroImage = business.themeConfig?.heroImageUrl || getDefaultHeroImageUrl(business.category);

  return (
    <div className="min-h-screen bg-[#121212] pb-20 selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)] text-[#F3F4F6] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden mb-12 md:mb-16 bg-[#18181B] border border-[#27272A] h-[500px] flex items-center group">
        <div className="absolute inset-0 bg-cover bg-center w-full h-full transition-transform duration-1000 opacity-60 group-hover:scale-[1.02]" style={{ backgroundImage: `url('${heroImage}')` }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#121212]/90 via-[#121212]/50 to-transparent"></div>
        <div className="relative z-10 p-6 md:p-12 lg:p-16 max-w-2xl text-left">
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold bg-[#27272A]/80 text-[#E5E7EB] rounded-full backdrop-blur-md border border-[#3F3F46] tracking-widest uppercase font-sans">
            {business.themeConfig?.heroLabel || getDefaultThemeConfig(business.category).heroLabel}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold font-display text-white mb-4 leading-tight whitespace-pre-wrap">
            {business.themeConfig?.heroHeading || getDefaultThemeConfig(business.category).heroHeading}
          </h1>
          <p className="text-base sm:text-lg text-white/80 mb-8 max-w-md font-light leading-relaxed font-sans whitespace-pre-wrap">
            {business.themeConfig?.heroSubheading || getDefaultThemeConfig(business.category).heroSubheading}
          </p>
          <button 
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-[var(--s-accent)] text-[var(--s-accent-text)] font-semibold text-sm px-8 py-4 rounded-full flex items-center gap-3 hover:opacity-90 transition-opacity shadow-sm"
          >
            Shop Collection
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Categories & Filters */}
      <div id="products" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6 border-b border-[#27272A] pb-6">
        <h2 className="text-3xl font-bold font-display text-white">Our Collection</h2>
        <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full md:w-auto gap-2">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${selectedCategory === cat ? 'bg-white text-[#121212]' : 'bg-transparent text-[#9CA3AF] hover:bg-[#18181B] border border-transparent hover:border-[#27272A]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filterableFields.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-10">
          {filterableFields.map(field => (
            <div key={field.key} className="flex items-center gap-2">
              <select 
                className="bg-[#18181B] text-sm text-[#E5E7EB] border border-[#3F3F46] rounded-full px-4 py-2 outline-none focus:border-[var(--s-accent)] cursor-pointer hover:bg-[#27272A] transition-colors [color-scheme:dark]"
                value={activeFilters[field.key] || ''}
                onChange={(e) => setActiveFilters(prev => ({...prev, [field.key]: e.target.value}))}
              >
                <option value="">{field.label}: All</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
        {filteredProducts.map(product => {
          const isSale = product.attributes?.isSale === 'true' || false;
          const originalPrice = product.attributes?.originalPrice ? parseFloat(product.attributes.originalPrice) : null;

          return (
            <div 
              key={product.id}
              onClick={() => onOpenProduct(product)}
              className="bg-[#18181B] rounded-2xl overflow-hidden flex flex-col group border border-[#3F3F46]/80 shadow-sm hover:shadow-lg hover:border-[#52525B] cursor-pointer transition-all duration-300"
            >
              <div className="relative aspect-[4/5] bg-[#121212] overflow-hidden mb-4 border-b border-[#27272A]">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!product.isAvailable ? 'opacity-40 grayscale' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#3F3F46]">
                    <Package className="w-12 h-12" strokeWidth={1} />
                  </div>
                )}

                
                {!product.isAvailable ? (
                  <div className="absolute inset-0 bg-[#121212]/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-4 py-2 text-xs font-bold bg-[#18181B] text-white rounded-full shadow-sm tracking-widest uppercase border border-[#27272A]">
                      {business.category === 'Services' ? 'Unavailable' : 'Out of Stock'}
                    </span>
                  </div>
                ) : (
                  isSale && (
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1.5 text-xs font-bold bg-white text-[#121212] rounded-full shadow-sm tracking-wider uppercase">Sale</span>
                    </div>
                  )
                )}
              </div>
              <div className="flex flex-col flex-grow px-5 pb-5">
                <h3 className="text-base sm:text-lg font-bold font-display text-white mb-2 line-clamp-1">{product.name}</h3>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {registry.fields.map(field => {
                    if (product.attributes?.[field.key]) {
                      return (
                         <span key={field.key} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-[#27272A] text-gray-300">
                           {field.label}: {product.attributes[field.key]}
                         </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <p className="text-sm sm:text-base text-[#9CA3AF] mb-5 flex-grow line-clamp-2">{product.description || "Premium skincare essential."}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">{formatNaira(product.price)}</span>
                    {originalPrice && (
                      <span className="text-xs text-[#6B7280] line-through">{formatNaira(originalPrice)}</span>
                    )}
                  </div>
                  {product.isAvailable ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddDirect(product);
                      }}
                      className="px-4 py-2 rounded-full bg-[var(--s-accent)] text-[var(--s-accent-text)] text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
                    >
                      {business.themeConfig?.ctaText || getDefaultThemeConfig(business.category).ctaText}
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="px-4 py-2 rounded-full border border-[#3F3F46] text-[#9CA3AF] text-xs font-semibold hover:border-[#6B7280] hover:text-[#E5E7EB] transition-colors"
                    >
                      {business.category === 'Services' ? 'Unavailable' : 'Notify Me'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-24 bg-[#18181B] rounded-2xl border border-[#27272A]">
          <Package className="w-16 h-16 text-[#3F3F46] mx-auto mb-4" strokeWidth={1} />
          <h3 className="text-xl font-bold font-display text-white mb-2">No products yet</h3>
          <p className="text-[#9CA3AF] text-sm">Check back later for new arrivals.</p>
        </div>
      )}
    </div>
  );
}

// ─── BRUTAL STOREFRONT ──────────────────────────────────────────────────────────
// ─── LIGHT STOREFRONT ──────────────────────────────────────────────────────────
function LightStorefront({ 
  business, 
  products, 
  onOpenProduct,
  onAddDirect
}: { 
  business: Business; 
  products: Product[]; 
  onOpenProduct: (p: Product) => void;
  onAddDirect: (p: Product) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  
  const registry = getRegistry(business.category);
  const filterableFields = registry.fields.filter(f => f.isFilterable);

  // Extract all categories from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    for (const [key, val] of Object.entries(activeFilters)) {
      if (val && p.attributes?.[key] !== val) return false;
    }
    return true;
  });

  const heroImage = business.themeConfig?.heroImageUrl || getDefaultHeroImageUrl(business.category);

  return (
    <div className="min-h-screen bg-white pb-20 selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)] text-[#111111] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden mb-12 md:mb-16 bg-slate-100 h-[500px] flex items-center group">
        <div className="absolute inset-0 bg-cover bg-center w-full h-full transition-transform duration-1000 group-hover:scale-[1.02]" style={{ backgroundImage: `url('${heroImage}')` }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>
        <div className="relative z-10 p-6 md:p-12 lg:p-16 max-w-2xl text-left">
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold bg-white/10 text-white rounded-full backdrop-blur-md border border-white/20 tracking-widest uppercase">
            {business.themeConfig?.heroLabel || getDefaultThemeConfig(business.category).heroLabel}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold font-display text-white mb-4 leading-tight whitespace-pre-wrap">
            {business.themeConfig?.heroHeading || getDefaultThemeConfig(business.category).heroHeading}
          </h1>
          <p className="text-base sm:text-lg text-white/90 mb-8 max-w-md font-light leading-relaxed whitespace-pre-wrap">
            {business.themeConfig?.heroSubheading || getDefaultThemeConfig(business.category).heroSubheading}
          </p>
          <button 
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-black font-semibold text-sm px-8 py-4 rounded-full flex items-center gap-3 hover:bg-gray-100 transition-colors shadow-sm"
          >
            Shop Collection
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Categories & Filters */}
      <div id="products" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200/50 pb-4">
        <h2 className="text-2xl font-bold tracking-tight font-display text-[#111111]">Trending</h2>
        <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full md:w-auto gap-2">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${selectedCategory === cat ? 'bg-[#111111] text-white' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filterableFields.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {filterableFields.map(field => (
            <div key={field.key} className="flex items-center gap-2">
              <select 
                className="bg-slate-50 text-sm text-slate-700 border border-slate-200 rounded-full px-4 py-2 outline-none focus:border-slate-900 appearance-none cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
                value={activeFilters[field.key] || ''}
                onChange={(e) => setActiveFilters(prev => ({...prev, [field.key]: e.target.value}))}
              >
                <option value="">{field.label}: All</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
        {filteredProducts.map(product => {
          const isSale = product.attributes?.isSale === 'true' || false;
          const originalPrice = product.attributes?.originalPrice ? parseFloat(product.attributes.originalPrice) : null;

          return (
            <div 
              key={product.id}
              onClick={() => onOpenProduct(product)}
              className="bg-white rounded-2xl overflow-hidden hover-lift flex flex-col group border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer transition-all duration-300"
            >
              <div className="relative aspect-[4/5] bg-slate-50 overflow-hidden mb-5 border-b border-slate-100">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                    <Package className="w-12 h-12" strokeWidth={1} />
                  </div>
                )}

                
                {!product.isAvailable ? (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className={`px-4 py-2 text-xs font-bold rounded-full shadow-sm tracking-widest uppercase border ${business.theme === 'brutal' ? 'bg-black text-white border-black shadow-[2px_2px_0px_#E0FF4F]' : 'bg-white text-slate-800 border-slate-200'}`}>
                      {business.category === 'Services' ? 'Unavailable' : 'Out of Stock'}
                    </span>
                  </div>
                ) : (
                  isSale && (
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1.5 text-xs font-bold bg-black text-white rounded-full shadow-sm tracking-wider uppercase">Sale</span>
                    </div>
                  )
                )}
              </div>
              <div className="flex flex-col flex-grow px-5 pb-5">
                <h3 className="text-base sm:text-lg font-bold font-display text-[#111111] mb-2 line-clamp-1">{product.name}</h3>

                <div className="flex flex-wrap gap-2 mb-3">
                  {registry.fields.map(field => {
                    if (product.attributes?.[field.key]) {
                      return (
                         <span key={field.key} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                           {field.label}: {product.attributes[field.key]}
                         </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <p className="text-sm sm:text-base text-slate-500 mb-5 flex-grow line-clamp-2">{product.description || "Premium skincare essential."}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-[#111111]">{formatNaira(product.price)}</span>
                    {originalPrice && (
                      <span className="text-xs text-slate-400 line-through">{formatNaira(originalPrice)}</span>
                    )}
                  </div>
                  {product.isAvailable ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddDirect(product);
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all ${business.theme === 'brutal' ? 'bg-white text-black border-2 border-black hover:-translate-y-0.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-[var(--s-accent)] text-[var(--s-accent-text)] hover:opacity-90 hover:-translate-y-0.5'}`}
                    >
                      {business.themeConfig?.ctaText || 'Add to Bag'}
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className={`px-4 py-2 text-xs font-semibold transition-all ${business.theme === 'brutal' ? 'bg-white text-black border-2 border-black rounded-[8px]' : 'rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      {business.category === 'Services' ? 'Unavailable' : 'Notify Me'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-24 bg-slate-50 rounded-2xl border border-slate-100">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" strokeWidth={1} />
          <h3 className="text-xl font-bold font-display text-[#111111] mb-2">No products yet</h3>
          <p className="text-slate-500 text-sm">Check back later for new arrivals.</p>
        </div>
      )}
    </div>
  );
}

export default function StoreHomePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { business } = useOutletContext<{ business: Business }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { items, addItem, clearCart } = useCartStore();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchProds = async () => {
      if (!business) return;
      const p = await productService.getProducts(business.id);
      setProducts(p);
      setLoading(false);
    };
    fetchProds();

    const channel = new BroadcastChannel('inventory_updates');
    channel.onmessage = (e) => {
      if (e.data.type === 'inventory_changed' && e.data.slug === slug) {
        fetchProds();
      }
    };
    return () => channel.close();
  }, [business?.id, business?.category, slug]);

  if (loading) return <LoadingProgress />;
  if (!business) return <div className="min-h-screen flex items-center justify-center font-black text-2xl uppercase">Store not found</div>;

  const handleAdd = (p: Product, qty: number) => {
    if (business.category === 'Services') {
      clearCart();
      addItem({
        productId: p.id,
        productName: p.name,
        quantity: qty,
        unitPrice: p.price,
        imageUrl: p.imageUrl
      });
      navigate(`/store/${slug}/checkout`);
      return;
    }

    const existingCartItem = items.find(item => item.productId === p.id);
    const currentQtyInCart = existingCartItem ? existingCartItem.quantity : 0;
    const maxAvailable = p.stockCount !== undefined ? p.stockCount : 9999;

    if (currentQtyInCart + qty > maxAvailable) {
      addToast(`Cannot add more. Only ${maxAvailable} items in stock (${currentQtyInCart} already in cart).`, 'error');
      return;
    }

    addItem({
      productId: p.id,
      productName: p.name,
      quantity: qty,
      unitPrice: p.price,
      imageUrl: p.imageUrl
    });
    addToast('Added to cart', 'success');
    setSelectedProduct(null);
  };

  const handleAddDirect = (p: Product) => {
    if (business.category === 'Services') {
      clearCart();
      addItem({
        productId: p.id,
        productName: p.name,
        quantity: 1,
        unitPrice: p.price,
        imageUrl: p.imageUrl
      });
      navigate(`/store/${slug}/checkout`);
      return;
    }

    const existingCartItem = items.find(item => item.productId === p.id);
    const currentQtyInCart = existingCartItem ? existingCartItem.quantity : 0;
    const maxAvailable = p.stockCount !== undefined ? p.stockCount : 9999;

    if (currentQtyInCart + 1 > maxAvailable) {
      addToast(`Cannot add more. Only ${maxAvailable} items in stock (${currentQtyInCart} already in cart).`, 'error');
      return;
    }

    addItem({
      productId: p.id,
      productName: p.name,
      quantity: 1,
      unitPrice: p.price,
      imageUrl: p.imageUrl
    });
    addToast('Added to cart', 'success');
  };

  const theme = business.theme || 'light';

  return (
    <>
      {theme === 'modern' && (
        <ModernStorefront 
          business={business} 
          products={products} 
          onOpenProduct={setSelectedProduct} 
          onAddDirect={handleAddDirect}
        />
      )}
      {(theme === 'light' || theme === 'brutal') && (
        <LightStorefront 
          business={business} 
          products={products} 
          onOpenProduct={setSelectedProduct} 
          onAddDirect={handleAddDirect} 
        />
      )}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={handleAdd} theme={theme} business={business} />
    </>
  );
}
