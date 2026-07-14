import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ShoppingBag, X, Plus, Minus, Package, ArrowRight, Heart } from 'lucide-react';
import { Business, Product } from '../../lib/types';
import { productService } from '../../lib/services/productService';
import { businessService, getDefaultHeroImageUrl } from '../../lib/services/businessService';
import { useCartStore } from '../../lib/store';
import { useToast } from '../../components/Toast';

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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden bg-white rounded-[32px] shadow-2xl border border-slate-200/60">
        
        <button onClick={onClose} className="absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full text-slate-500 shadow-sm border border-slate-200/60 hover:bg-white hover:text-primary">
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className="w-full md:w-1/2 aspect-square md:aspect-auto relative flex items-center justify-center bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-20 h-20 text-slate-300" strokeWidth={1} />
          )}
        </div>

        <div className="w-full md:w-1/2 p-4 md:p-6 lg:p-8 flex flex-col overflow-y-auto bg-white text-primary">
          <div className="flex-1">
            <h2 className="text-2xl font-display font-semibold mb-2">
              {product.name}
            </h2>
            <p className="text-xl font-bold text-slate-800 mb-5">
              {formatNaira(product.price)}
            </p>

            {product.description && (
              <div className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                {product.description}
              </div>
            )}

            {!product.isAvailable && (
              <div className="inline-flex items-center px-3 py-1.5 mb-5 bg-amber-50 text-amber-600 rounded-full font-semibold text-xs border border-amber-100">
                Sold Out
              </div>
            )}
          </div>

          <div className="pt-6 mt-auto border-t border-slate-200/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5">
              <span className="font-semibold text-sm text-slate-700">Quantity</span>
              <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl p-1 bg-slate-50">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!product.isAvailable || quantity <= 1}
                  className="text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm rounded-lg disabled:opacity-50 w-8 h-8 flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" strokeWidth={2} />
                </button>
                <span className="w-8 sm:w-10 text-center font-bold text-sm text-primary">{quantity}</span>
                <button 
                  onClick={() => { if (product.isAvailable) setQuantity(quantity + 1); }}
                  disabled={!product.isAvailable}
                  className="text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm rounded-lg disabled:opacity-50 w-8 h-8 flex items-center justify-center"
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
              {product.isAvailable ? `${business.themeConfig?.ctaText || 'Add to Bag'} • ${formatNaira(product.price * quantity)}` : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── MODERN STOREFRONT ──────────────────────────────────────────────────────────
function ModernStorefront({ business, products, onOpenProduct }: { business: Business; products: Product[]; onOpenProduct: (p: Product) => void }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 selection:bg-accent selection:text-white">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200/60 pt-16 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-accent/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-primary tracking-tight mb-3 sm:mb-4">{business.businessName}</h1>
          <p className="text-sm sm:text-base md:text-lg font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Curated premium products from {business.businessName}. Secure checkout and fast delivery to your door.
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8 pb-3 border-b border-slate-200/60">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-primary">Shop All</h2>
          <span className="text-xs sm:text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{products.length} products</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map(product => (
            <div 
              key={product.id}
              onClick={() => onOpenProduct(product)}
              className="glass-panel group cursor-pointer flex flex-col bg-white rounded-2xl p-2 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300"
            >
              <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden mb-3 rounded-xl">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!product.isAvailable ? 'opacity-50 grayscale' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform duration-700">
                    <Package className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.5} />
                  </div>
                )}
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-white text-slate-800 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-slate-200">Sold Out</span>
                  </div>
                )}
                {product.isAvailable && (
                  <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button 
                      onClick={e => { e.stopPropagation(); onOpenProduct(product); }}
                      className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-[10px] sm:text-xs md:text-sm text-white transition-opacity hover:opacity-90 shadow-sm bg-[var(--s-accent)] flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {business.themeConfig?.ctaText || 'Add to Cart'}
                    </button>
                  </div>
                )}
              </div>
              <div className="px-1 pb-1">
                <h3 className="text-xs sm:text-sm font-semibold text-primary mb-0.5 line-clamp-1">{product.name}</h3>
                <p className="text-sm sm:text-base font-bold text-slate-700">{formatNaira(product.price)}</p>
              </div>
            </div>
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="glass-panel text-center py-32 bg-white/50 rounded-3xl border border-slate-200/60 shadow-sm">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-6" strokeWidth={1} />
            <h3 className="text-2xl font-display font-bold text-primary mb-2">No products yet</h3>
            <p className="text-slate-500 font-medium">Check back later for new arrivals.</p>
          </div>
        )}
      </div>
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
  
  // Extract all categories from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const heroImage = business.themeConfig?.heroImageUrl || getDefaultHeroImageUrl(business.category);

  return (
    <div className="min-h-screen bg-white pb-20 selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)] text-[#111111] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden mb-12 md:mb-16 bg-slate-100 h-[500px] flex items-center group">
        <div className="absolute inset-0 bg-cover bg-center w-full h-full transition-transform duration-1000 group-hover:scale-[1.02]" style={{ backgroundImage: `url('${heroImage}')` }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>
        <div className="relative z-10 p-6 md:p-12 lg:p-16 max-w-2xl text-left">
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold bg-white/10 text-white rounded-full backdrop-blur-md border border-white/20 tracking-widest uppercase">New Arrivals</span>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight font-display">Glow Naturally, <br/> Every Single Day.</h1>
          <p className="text-base sm:text-lg text-white/90 mb-8 max-w-md font-light leading-relaxed">Discover our curated collection of premium skincare essentials formulated for radiant, healthy skin.</p>
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
      <div id="products" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200/50 pb-4">
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

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
        {filteredProducts.map(product => {
          const isSale = product.attributes?.isSale === 'true' || false;
          const originalPrice = product.attributes?.originalPrice ? parseFloat(product.attributes.originalPrice) : null;

          return (
            <div 
              key={product.id}
              onClick={() => onOpenProduct(product)}
              className="bg-white rounded-xl overflow-hidden hover-lift flex flex-col group border border-transparent hover:border-slate-100 cursor-pointer transition-all duration-300"
            >
              <div className="relative aspect-[4/5] bg-slate-50 overflow-hidden rounded-xl mb-4">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                    <Package className="w-12 h-12" strokeWidth={1} />
                  </div>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); }}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 text-slate-700 hover:text-red-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                >
                  <Heart className="w-4 h-4" strokeWidth={2} />
                </button>
                
                {!product.isAvailable ? (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-4 py-2 text-xs font-bold bg-white/90 text-[#111111] rounded-full shadow-sm tracking-widest uppercase">Out of Stock</span>
                  </div>
                ) : (
                  isSale && (
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1.5 text-xs font-bold bg-black text-white rounded-full shadow-sm tracking-wider uppercase">Sale</span>
                    </div>
                  )
                )}
              </div>
              <div className="flex flex-col flex-grow px-2">
                <h3 className="text-sm font-semibold text-[#111111] mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-xs text-slate-500 mb-4 flex-grow line-clamp-2">{product.description || "Premium skincare essential."}</p>
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
                      className="px-4 py-2 rounded-full bg-[#111111] text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      {business.themeConfig?.ctaText || 'Add to Bag'}
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="px-4 py-2 rounded-full border border-slate-200 text-slate-400 text-xs font-semibold hover:border-slate-800 hover:text-slate-900 transition-colors"
                    >
                      Notify Me
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
          <h3 className="text-xl font-bold text-[#111111] mb-2 font-display">No products yet</h3>
          <p className="text-slate-500 text-sm">Check back later for new arrivals.</p>
        </div>
      )}
    </div>
  );
}

export default function StoreHomePage() {
  const { slug } = useParams();
  const { business } = useOutletContext<{ business: Business }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { items, addItem } = useCartStore();
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
  }, [business?.id, slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" /></div>;
  if (!business) return <div className="min-h-screen flex items-center justify-center font-black text-2xl uppercase">Store not found</div>;

  const handleAdd = (p: Product, qty: number) => {
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
      {theme === 'modern' && <ModernStorefront business={business} products={products} onOpenProduct={setSelectedProduct} />}
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
