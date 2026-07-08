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
        
        <button onClick={onClose} className={`absolute top-4 right-4 z-20 w-12 h-12 flex items-center justify-center transition-transform ${isBrutal ? 'bg-white text-black border-[3px] border-black hover:-translate-y-1 shadow-[4px_4px_0px_rgba(0,0,0,1)]' : 'bg-white/80 backdrop-blur-md rounded-full text-slate-500 shadow-sm border border-slate-200/60 hover:bg-white hover:text-primary'}`}>
          <X className="w-6 h-6" strokeWidth={isBrutal ? 3 : 2} />
        </button>

        <div className={`w-full md:w-1/2 aspect-square md:aspect-auto relative flex items-center justify-center ${isBrutal ? 'bg-[#E0FF4F] border-b-[4px] md:border-b-0 md:border-r-[4px] border-white' : 'bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100'}`}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className={`w-24 h-24 ${isBrutal ? 'text-black' : 'text-slate-300'}`} strokeWidth={isBrutal ? 1.5 : 1} />
          )}
        </div>

        <div className={`w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto ${isBrutal ? 'bg-black text-white' : 'bg-transparent text-primary'}`}>
          <div className="flex-1">
            <h2 className={`${isBrutal ? 'text-3xl md:text-5xl font-black uppercase mb-4 tracking-tighter' : 'text-3xl font-display font-bold mb-3'}`}>
              {product.name}
            </h2>
            <p className={`${isBrutal ? 'text-4xl font-black text-[#E0FF4F] mb-6' : 'text-2xl font-bold text-slate-800 mb-6'}`}>
              {formatNaira(product.price)}
            </p>

            {product.description && (
              <div className={`${isBrutal ? 'text-lg font-bold uppercase text-gray-400 mb-8 leading-relaxed' : 'text-base font-medium text-slate-500 mb-8 leading-relaxed'}`}>
                {product.description}
              </div>
            )}

            {!product.isAvailable && (
              <div className={`inline-flex items-center px-4 py-2 mb-6 ${isBrutal ? 'bg-[#FF6666] text-white border-[3px] border-white font-black uppercase text-lg shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'bg-amber-50 text-amber-600 rounded-full font-semibold text-sm border border-amber-100'}`}>
                Sold Out
              </div>
            )}
          </div>

          <div className={`pt-8 mt-auto ${isBrutal ? 'border-t-[4px] border-white' : 'border-t border-slate-200/60'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6">
              <span className={`${isBrutal ? 'font-black uppercase text-xl' : 'font-semibold text-slate-700'}`}>Quantity</span>
              <div className={`flex items-center gap-2 ${isBrutal ? 'bg-white p-2 border-[3px] border-black shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'glass-panel bg-white/50 border border-slate-200/60 rounded-2xl p-1.5'}`}>
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!product.isAvailable || quantity <= 1}
                  className={`w-10 h-10 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[#E0FF4F] disabled:opacity-50 hover:bg-gray-900' : 'text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm rounded-xl disabled:opacity-50'}`}
                >
                  <Minus className="w-5 h-5" strokeWidth={isBrutal ? 3 : 2} />
                </button>
                <span className={`w-10 text-center ${isBrutal ? 'text-black font-black text-2xl' : 'font-bold text-primary'}`}>{quantity}</span>
                <button 
                  onClick={() => { if (product.isAvailable) setQuantity(quantity + 1); }}
                  disabled={!product.isAvailable}
                  className={`w-10 h-10 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[#E0FF4F] disabled:opacity-50 hover:bg-gray-900' : 'text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm rounded-xl disabled:opacity-50'}`}
                >
                  <Plus className="w-5 h-5" strokeWidth={isBrutal ? 3 : 2} />
                </button>
              </div>
            </div>

            <button
              onClick={() => onAdd(product, quantity)}
              disabled={!product.isAvailable}
              className={`w-full h-14 md:h-16 flex items-center justify-center transition-all ${isBrutal ? 'bg-[var(--s-accent)] text-[var(--s-accent-text)] font-black uppercase text-xl border-[4px] border-[var(--s-border)] shadow-[6px_6px_0px_var(--s-border)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_var(--s-border)] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed' : 'bg-[var(--s-accent)] text-[var(--s-accent-text)] font-semibold rounded-[20px] shadow-lg shadow-accent/25 hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg'}`}
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
      <div className="relative overflow-hidden bg-white border-b border-slate-200/60 pt-24 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-accent/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-primary tracking-tight mb-4 sm:mb-6">{business.businessName}</h1>
          <p className="text-base sm:text-lg md:text-xl font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Curated premium products from {business.businessName}. Secure checkout and fast delivery to your door.
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-200/60">
          <h2 className="text-2xl font-display font-bold text-primary">Shop All</h2>
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{products.length} products</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map(product => (
            <div 
              key={product.id}
              onClick={() => onOpenProduct(product)}
              className="glass-panel group cursor-pointer flex flex-col bg-white rounded-[20px] sm:rounded-3xl p-2 sm:p-3 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300"
            >
              <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden mb-4 rounded-2xl">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!product.isAvailable ? 'opacity-50 grayscale' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform duration-700">
                    <Package className="w-10 h-10 sm:w-16 sm:h-16" strokeWidth={1} />
                  </div>
                )}
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-white text-slate-800 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm border border-slate-200">Sold Out</span>
                  </div>
                )}
                {product.isAvailable && (
                  <button 
                    onClick={e => { e.stopPropagation(); onOpenProduct(product); }}
                    className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 bg-[var(--s-accent)] text-[var(--s-accent-text)] rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:brightness-110 shadow-lg shadow-[var(--s-accent)]/30"
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
              <div className="px-1 pb-1 sm:px-2 sm:pb-2">
                <h3 className="text-sm sm:text-base font-semibold text-primary mb-0.5 sm:mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-base sm:text-lg font-bold text-slate-700">{formatNaira(product.price)}</p>
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
    <div className="min-h-screen bg-black pb-24 font-sans text-white selection:bg-[#E0FF4F] selection:text-black">
      {/* Editorial Hero */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b-[4px] border-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>

            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8 uppercase break-words drop-shadow-[4px_4px_0px_rgba(224,255,79,1)]">
              {business.businessName}
            </h1>
            <p className="text-xl sm:text-2xl font-bold uppercase text-gray-300 max-w-xl leading-relaxed mb-10 border-l-[6px] border-[#E0FF4F] pl-6 py-2">
              Curated selection of premium items. Built for the bold.
            </p>
            {featured && (
              <a href="#products" className="inline-flex items-center justify-center h-16 px-8 bg-white text-black font-black uppercase text-xl border-[4px] border-[#E0FF4F] shadow-[6px_6px_0px_rgba(224,255,79,1)] hover:bg-[#E0FF4F] hover:border-white hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] transition-all active:translate-y-1 active:shadow-none w-full sm:w-auto">
                EXPLORE NOW <ArrowRight className="ml-3 w-6 h-6" strokeWidth={3} />
              </a>
            )}
          </div>
          
          {/* Featured Product Highlight */}
          {featured && (
            <div 
              onClick={() => onOpenProduct(featured)}
              className="relative aspect-square md:aspect-[4/3] bg-[#E0FF4F] border-[4px] border-white group cursor-pointer overflow-hidden shadow-[8px_8px_0px_rgba(255,255,255,1)] hover:-translate-y-2 hover:shadow-[16px_16px_0px_rgba(255,255,255,1)] transition-all"
            >
              {featured.imageUrl ? (
                <img src={featured.imageUrl} alt={featured.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!featured.isAvailable ? 'opacity-40 grayscale' : ''}`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black">
                  <Package className="w-32 h-32" strokeWidth={1.5} />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <span className="bg-white text-black text-xs font-black uppercase tracking-widest px-3 py-1 mb-4 inline-block border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">FEATURED</span>
                    <h3 className="text-3xl sm:text-4xl font-black text-white uppercase group-hover:text-[#E0FF4F] transition-colors line-clamp-2">{featured.name}</h3>
                  </div>
                  <div className="shrink-0">
                    {featured.isAvailable ? (
                      <div className="bg-black text-[#E0FF4F] px-4 py-2 border-[3px] border-[#E0FF4F] font-black text-xl sm:text-2xl shadow-[4px_4px_0px_rgba(255,255,255,1)]">{formatNaira(featured.price)}</div>
                    ) : (
                      <span className="bg-[#FF6666] text-white px-4 py-2 border-[3px] border-white font-black text-xl uppercase shadow-[4px_4px_0px_rgba(255,255,255,1)]">SOLD OUT</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product grid */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-[4px] border-white pb-6">
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">THE COLLECTION</h2>
          <span className="bg-[#E0FF4F] text-black text-lg font-black uppercase px-4 py-2 border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)] inline-block self-start sm:self-auto">{products.length} ITEMS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {rest.map(product => (
            <div 
              key={product.id}
              onClick={() => onOpenProduct(product)}
              className="group cursor-pointer bg-white border-[4px] border-white flex flex-col shadow-[8px_8px_0px_rgba(255,255,255,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_rgba(255,255,255,1)] transition-all"
            >
              <div className="aspect-[4/5] bg-gray-100 overflow-hidden relative border-b-[4px] border-black">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!product.isAvailable ? 'opacity-50 grayscale' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package className="w-24 h-24" strokeWidth={1.5} />
                  </div>
                )}
                {!product.isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <span className="text-white font-black uppercase text-xl border-[4px] border-white px-6 py-3 bg-[#FF6666] shadow-[4px_4px_0px_rgba(255,255,255,1)] -rotate-6">SOLD OUT</span>
                  </div>
                )}
                
                {product.isAvailable && (
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent">
                    <button 
                      onClick={e => { e.stopPropagation(); onOpenProduct(product); }}
                      className="w-full h-14 bg-[var(--s-accent)] text-[var(--s-accent-text)] font-black uppercase text-lg border-[3px] border-[var(--s-border)] shadow-[4px_4px_0px_var(--s-border)] hover:bg-[var(--s-border)] hover:text-[var(--s-bg)]"
                    >
                      {business.themeConfig?.ctaText || 'QUICK ADD'}
                    </button>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col bg-black text-white">
                <h3 className="text-xl md:text-2xl font-black uppercase line-clamp-2 mb-2 group-hover:text-[#E0FF4F] transition-colors leading-tight">{product.name}</h3>
                <p className="text-2xl font-black text-white mt-auto">{formatNaira(product.price)}</p>
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
