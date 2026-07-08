import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ShoppingBag, X, Plus, Minus, Package, ArrowRight } from 'lucide-react';
import { Business, Product } from '../../lib/types';
import { productService } from '../../lib/services/productService';
import { businessService } from '../../lib/services/businessService';
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
  const isBrutal = theme === 'brutal';

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
      <div className={`absolute inset-0 ${isBrutal ? 'bg-black/80' : 'bg-black/60'} backdrop-blur-sm`} onClick={onClose} />
      <div className={`relative w-full max-w-4xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden ${isBrutal ? 'bg-black border-[4px] border-white shadow-[8px_8px_0px_rgba(255,255,255,1)]' : 'glass-panel bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-slate-200/60'}`}>
        
        <button onClick={onClose} className={`absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center transition-transform ${isBrutal ? 'bg-white text-black border-[2px] border-black hover:-translate-y-1 shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'bg-white/80 backdrop-blur-md rounded-full text-slate-500 shadow-sm border border-slate-200/60 hover:bg-white hover:text-primary'}`}>
          <X className="w-5 h-5" strokeWidth={isBrutal ? 2 : 1.5} />
        </button>

        <div className={`w-full md:w-1/2 aspect-square md:aspect-auto relative flex items-center justify-center ${isBrutal ? 'bg-[var(--s-accent)] border-b-[3px] md:border-b-0 md:border-r-[3px] border-white' : 'bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100'}`}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className={`w-20 h-20 ${isBrutal ? 'text-black' : 'text-slate-300'}`} strokeWidth={isBrutal ? 1.5 : 1} />
          )}
        </div>

        <div className={`w-full md:w-1/2 p-4 md:p-6 lg:p-8 flex flex-col overflow-y-auto ${isBrutal ? 'bg-black text-white' : 'bg-transparent text-primary'}`}>
          <div className="flex-1">
            <h2 className={`${isBrutal ? 'text-2xl md:text-4xl font-black uppercase mb-3 tracking-tighter text-white' : 'text-2xl font-display font-bold mb-2'}`}>
              {product.name}
            </h2>
            <p className={`${isBrutal ? 'text-xl sm:text-2xl font-black bg-[var(--s-accent)] text-[var(--s-accent-text)] mb-5 px-3 py-1.5 inline-block border-[2px] border-white shadow-[3px_3px_0px_rgba(255,255,255,1)]' : 'text-xl font-bold text-slate-800 mb-5'}`}>
              {formatNaira(product.price)}
            </p>

            {product.description && (
              <div className={`${isBrutal ? 'text-sm sm:text-base font-bold uppercase text-gray-300 mb-6 leading-relaxed' : 'text-sm font-medium text-slate-500 mb-6 leading-relaxed'}`}>
                {product.description}
              </div>
            )}

            {!product.isAvailable && (
              <div className={`inline-flex items-center px-3 py-1.5 mb-5 ${isBrutal ? 'bg-[var(--s-secondary)] text-[var(--s-secondary-text)] border-[2px] border-[var(--s-secondary-text)] font-black uppercase text-sm shadow-[3px_3px_0px_var(--s-secondary-text)]' : 'bg-amber-50 text-amber-600 rounded-full font-semibold text-xs border border-amber-100'}`}>
                Sold Out
              </div>
            )}
          </div>

          <div className={`pt-6 mt-auto ${isBrutal ? 'border-t-[3px] border-white' : 'border-t border-slate-200/60'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5">
              <span className={`${isBrutal ? 'font-black uppercase text-lg' : 'font-semibold text-sm text-slate-700'}`}>Quantity</span>
              <div className={`flex items-center gap-1.5 ${isBrutal ? 'bg-white p-1.5 border-[2.5px] border-black shadow-[3px_3px_0px_rgba(255,255,255,1)]' : 'glass-panel bg-white/50 border border-slate-200/60 rounded-xl p-1'}`}>
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!product.isAvailable || quantity <= 1}
                  className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-white disabled:opacity-50 hover:bg-gray-900' : 'text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm rounded-lg disabled:opacity-50'}`}
                >
                  <Minus className="w-4 h-4" strokeWidth={isBrutal ? 2.5 : 2} />
                </button>
                <span className={`w-8 sm:w-10 text-center ${isBrutal ? 'text-black font-black text-xl' : 'font-bold text-sm text-primary'}`}>{quantity}</span>
                <button 
                  onClick={() => { if (product.isAvailable) setQuantity(quantity + 1); }}
                  disabled={!product.isAvailable}
                  className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-white disabled:opacity-50 hover:bg-gray-900' : 'text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm rounded-lg disabled:opacity-50'}`}
                >
                  <Plus className="w-4 h-4" strokeWidth={isBrutal ? 2.5 : 2} />
                </button>
              </div>
            </div>

            <button
              onClick={() => onAdd(product, quantity)}
              disabled={!product.isAvailable}
              className={`w-full h-12 md:h-14 flex items-center justify-center transition-all ${isBrutal ? 'bg-[var(--s-accent)] text-[var(--s-accent-text)] font-black uppercase text-lg border-[3px] border-[var(--s-border)] shadow-[4px_4px_0px_var(--s-border)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--s-border)] active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed' : 'bg-[var(--s-accent)] text-[var(--s-accent-text)] font-semibold rounded-[16px] shadow-sm shadow-accent/25 hover:brightness-110 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base'}`}
            >
              {product.isAvailable ? `${business.themeConfig?.ctaText || (isBrutal ? 'Buy Now' : 'Add to Cart')} • ${formatNaira(product.price * quantity)}` : 'Sold Out'}
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
function BrutalStorefront({ business, products, onOpenProduct }: { business: Business; products: Product[]; onOpenProduct: (p: Product) => void }) {
  const featured = products.slice(0, 1)[0];
  const rest = products.slice(1);

  return (
    <div className="min-h-screen bg-black pb-16 font-sans text-white selection:bg-[var(--s-accent)] selection:text-black">
      {/* Editorial Hero */}
      <div className="pt-12 pb-10 px-4 sm:px-6 lg:px-8 border-b-[3px] border-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-6 uppercase break-words drop-shadow-[3px_3px_0px_var(--s-accent)]">
              {business.businessName}
            </h1>
            <p className="text-lg sm:text-xl font-bold uppercase text-gray-300 max-w-xl leading-relaxed mb-8 border-l-[4px] border-[var(--s-accent)] pl-4 py-1">
              Curated selection of premium items. Built for the bold.
            </p>
            {featured && (
              <a href="#products" className="inline-flex items-center justify-center h-12 sm:h-14 px-6 sm:px-8 bg-white text-black font-black uppercase text-base sm:text-lg border-[3px] border-[var(--s-accent)] shadow-[4px_4px_0px_var(--s-accent)] hover:bg-[var(--s-accent)] hover:border-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(255,255,255,1)] transition-all active:translate-y-0.5 active:shadow-none w-full sm:w-auto">
                EXPLORE NOW <ArrowRight className="ml-2 w-5 h-5" strokeWidth={2.5} />
              </a>
            )}
          </div>
          
          {/* Featured Product Highlight */}
          {featured && (
            <div 
              onClick={() => onOpenProduct(featured)}
              className="relative aspect-square md:aspect-[4/3] bg-[var(--s-accent)] border-[3px] border-white group cursor-pointer overflow-hidden shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] transition-all"
            >
              {featured.imageUrl ? (
                <img src={featured.imageUrl} alt={featured.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!featured.isAvailable ? 'opacity-40 grayscale' : ''}`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black">
                  <Package className="w-24 h-24 sm:w-32 sm:h-32" strokeWidth={1.5} />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <span className="bg-white text-black text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-1 mb-3 inline-block border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">FEATURED</span>
                    <h3 className="text-lg sm:text-2xl font-black text-white uppercase group-hover:bg-[var(--s-accent)] group-hover:text-[var(--s-accent-text)] transition-colors line-clamp-2 px-1">{featured.name}</h3>
                  </div>
                  <div className="shrink-0">
                    {featured.isAvailable ? (
                      <div className="bg-[var(--s-accent)] text-[var(--s-accent-text)] px-3 py-1.5 sm:px-4 sm:py-2 border-[2.5px] sm:border-[3px] border-white font-black text-lg sm:text-xl shadow-[3px_3px_0px_rgba(255,255,255,1)]">{formatNaira(featured.price)}</div>
                    ) : (
                      <span className="bg-[var(--s-secondary)] text-[var(--s-secondary-text)] px-3 py-1.5 sm:px-4 sm:py-2 border-[2.5px] sm:border-[3px] border-[var(--s-secondary-text)] font-black text-lg uppercase shadow-[3px_3px_0px_var(--s-secondary-text)]">SOLD OUT</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product grid */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-[3px] border-white pb-4 sm:pb-5">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">THE COLLECTION</h2>
          <span className="bg-[var(--s-accent)] text-[var(--s-accent-text)] text-sm sm:text-base font-black uppercase px-3 py-1.5 sm:px-4 sm:py-2 border-[2.5px] sm:border-[3px] border-white shadow-[3px_3px_0px_rgba(255,255,255,1)] inline-block self-start sm:self-auto">{products.length} ITEMS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {rest.map(product => (
            <div 
              key={product.id}
              onClick={() => onOpenProduct(product)}
              className="group cursor-pointer bg-white border-[3px] border-white flex flex-col shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] transition-all"
            >
              <div className="aspect-[4/5] bg-gray-100 overflow-hidden relative border-b-[3px] border-black">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!product.isAvailable ? 'opacity-50 grayscale' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package className="w-16 h-16 sm:w-20 sm:h-20" strokeWidth={1.5} />
                  </div>
                )}
                {!product.isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <span className="text-[var(--s-secondary-text)] font-black uppercase text-base sm:text-lg border-[3px] border-[var(--s-secondary-text)] px-4 py-2 bg-[var(--s-secondary)] shadow-[3px_3px_0px_var(--s-secondary-text)] -rotate-6">SOLD OUT</span>
                  </div>
                )}
                
                {product.isAvailable && (
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent">
                    <button 
                      onClick={e => { e.stopPropagation(); onOpenProduct(product); }}
                      className="w-full h-12 bg-[var(--s-accent)] text-[var(--s-accent-text)] font-black uppercase text-sm sm:text-base border-[2.5px] border-[var(--s-border)] shadow-[3px_3px_0px_var(--s-border)] hover:bg-[var(--s-border)] hover:text-[var(--s-bg)]"
                    >
                      {business.themeConfig?.ctaText || 'QUICK ADD'}
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col bg-black text-white">
                <h3 className="text-base md:text-lg font-black uppercase text-white line-clamp-2 mb-1.5 group-hover:bg-[var(--s-accent)] group-hover:text-[var(--s-accent-text)] transition-colors leading-tight px-1">{product.name}</h3>
                <p className="text-lg font-black text-white mt-auto px-1">{formatNaira(product.price)}</p>
              </div>
            </div>
          ))}
        </div>
        
        {rest.length === 0 && !featured && (
          <div className="text-center py-32 border-[4px] border-white bg-black shadow-[8px_8px_0px_rgba(255,255,255,1)]">
            <Package className="w-24 h-24 text-white mx-auto mb-8" strokeWidth={1.5} />
            <h3 className="text-4xl font-black text-white uppercase tracking-widest mb-4">COLLECTION EMPTY</h3>
            <p className="text-xl font-bold uppercase text-gray-400">Check back later for new drops.</p>
          </div>
        )}
      </div>
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

  const theme = business.theme || 'brutal';

  return (
    <>
      {theme === 'modern' && <ModernStorefront business={business} products={products} onOpenProduct={setSelectedProduct} />}
      {theme === 'brutal' && <BrutalStorefront business={business} products={products} onOpenProduct={setSelectedProduct} />}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={handleAdd} theme={theme} business={business} />
    </>
  );
}
