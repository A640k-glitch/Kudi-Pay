import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, X, Plus, Minus, Package, Zap, ArrowRight, Twitter, Instagram, Mail } from 'lucide-react';
import { Business, Product } from '../../lib/types';
import { productService } from '../../lib/services/productService';
import { businessService } from '../../lib/services/businessService';
import { useCartStore } from '../../lib/store';
import { useToast } from '../../components/Toast';

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
};

//  SHARED: Product Detail Modal (used by all themes)
function ProductModal({
  product,
  onClose,
  onAdd
}: {
  product: Product | null;
  onClose: () => void;
  onAdd: (p: Product, qty: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) setQuantity(1);
  }, [product]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-sm hover:bg-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="w-full md:w-1/2 bg-gray-50 aspect-square md:aspect-auto relative">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package className="w-20 h-20" />
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h2>
            <p className="text-2xl font-black text-indigo-600 mb-6">
              {formatNaira(product.price)}
            </p>

            {product.description && (
              <div className="prose prose-sm text-gray-600 mb-8">
                {product.description}
              </div>
            )}

            {!product.isAvailable && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg font-semibold text-sm mb-6">
                Currently Out of Stock
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-gray-100 mt-auto">
            <div className="flex items-center gap-4 mb-6">
              <span className="font-semibold text-gray-900">Quantity</span>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!product.isAvailable || quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-gray-900 w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => { if (product.isAvailable) setQuantity(quantity + 1); }}
                  disabled={!product.isAvailable}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => onAdd(product, quantity)}
              disabled={!product.isAvailable}
              className="w-full h-14 bg-[#1E1B4B] text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 hover:bg-[#111827] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {product.isAvailable ? `Add to Cart • ${formatNaira(product.price * quantity)}` : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

//  Classic, Shopify-like, clean white, clear borders
function ClassicStorefront({ business, products, onOpenProduct }: { business: Business; products: Product[]; onOpenProduct: (p: Product) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Banner */}
      <div className="bg-white border-b border-gray-200 pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 mb-6 shadow-sm">
            <span className="text-2xl font-bold text-gray-400">{business.businessName.charAt(0)}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">{business.businessName}</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Authentic products direct from {business.businessName}. Secure checkout and fast delivery to your door.
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
          <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 border border-gray-200 rounded-full shadow-sm">{products.length} items</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => (
            <div 
              key={product.id}
              onClick={() => onOpenProduct(product)}
              className="group cursor-pointer bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300"
            >
              <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!product.isAvailable ? 'opacity-50 grayscale' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 group-hover:scale-105 transition-transform duration-500">
                    <Package className="w-12 h-12" />
                  </div>
                )}
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider">Sold Out</span>
                  </div>
                )}
                {product.isAvailable && (
                  <button 
                    onClick={e => { e.stopPropagation(); onOpenProduct(product); }}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-md hover:bg-gray-800"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                <p className="text-base font-bold text-gray-900">{formatNaira(product.price)}</p>
              </div>
            </div>
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-24 bg-white border border-gray-200 rounded-2xl">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No products yet</h3>
            <p className="text-gray-500 mt-1">Check back later for new arrivals.</p>
          </div>
        )}
      </div>
    </div>
  );
}

//  Black bg, amber accent, large type, editorial product cards
function BoldStorefront({ business, products, onOpenProduct }: { business: Business; products: Product[]; onOpenProduct: (p: Product) => void }) {
  const featured = products.slice(0, 1)[0];
  const rest = products.slice(1);

  return (
    <div className="min-h-screen bg-[#111827] pb-24 font-sans text-gray-100 selection:bg-amber-400 selection:text-black">
      {/* Editorial Hero */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-amber-400 font-bold tracking-widest uppercase text-xs mb-6 block flex items-center gap-2">
              <span className="w-8 h-[2px] bg-amber-400"></span> Official Store
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.95] mb-6 uppercase break-words">
              {business.businessName}
            </h1>
            <p className="text-lg text-gray-400 max-w-md leading-relaxed mb-10 border-l border-white/20 pl-4">
              Curated selection of premium items. Designed for the bold.
            </p>
            {featured && (
              <a href="#products" className="inline-flex items-center justify-center h-14 px-8 bg-amber-400 text-black font-bold uppercase tracking-wider hover:bg-amber-300 transition-colors rounded-none w-full sm:w-auto">
                Explore Collection
              </a>
            )}
          </div>
          
          {/* Featured Product Highlight */}
          {featured && (
            <div 
              onClick={() => onOpenProduct(featured)}
              className="relative aspect-square md:aspect-[4/3] bg-[#1F2937] border border-white/10 group cursor-pointer overflow-hidden"
            >
              {featured.imageUrl ? (
                <img src={featured.imageUrl} alt={featured.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!featured.isAvailable ? 'opacity-40 grayscale' : ''}`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10">
                  <Package className="w-24 h-24" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="bg-white text-black text-[10px] font-bold uppercase tracking-widest px-2 py-1 mb-3 inline-block">Featured</span>
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors line-clamp-1">{featured.name}</h3>
                    <p className="text-amber-400 font-black text-xl">{formatNaira(featured.price)}</p>
                  </div>
                  {!featured.isAvailable && (
                    <span className="text-gray-400 font-bold uppercase text-sm border border-gray-600 px-3 py-1">Sold Out</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product grid */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="mb-12 flex items-center justify-between">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">The Collection</h2>
          <span className="text-gray-500 text-sm font-bold uppercase tracking-widest border border-white/10 px-4 py-1.5">{products.length} Items</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {rest.map(product => (
            <div 
              key={product.id}
              onClick={() => onOpenProduct(product)}
              className="group cursor-pointer"
            >
              <div className="aspect-[3/4] bg-[#1F2937] mb-6 overflow-hidden relative border border-white/5 group-hover:border-white/20 transition-colors">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!product.isAvailable ? 'opacity-30 grayscale' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/5">
                    <Package className="w-16 h-16" />
                  </div>
                )}
                {!product.isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="text-white font-black uppercase tracking-[0.2em] text-sm border border-white/20 px-6 py-2 bg-black/50">Sold Out</span>
                  </div>
                )}
                
                {product.isAvailable && (
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button 
                      onClick={e => { e.stopPropagation(); onOpenProduct(product); }}
                      className="w-full h-12 bg-amber-400 text-black font-bold uppercase tracking-wider hover:bg-amber-300 transition-colors"
                    >
                      Quick Add
                    </button>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-200 line-clamp-1 mb-1 group-hover:text-amber-400 transition-colors">{product.name}</h3>
                <p className="text-gray-400 font-medium">{formatNaira(product.price)}</p>
              </div>
            </div>
          ))}
        </div>
        
        {rest.length === 0 && !featured && (
          <div className="text-center py-32 border border-white/10 bg-[#1F2937]/50">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white uppercase tracking-widest">Collection Empty</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoreHomePage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { items, addItem } = useCartStore();
  const { addToast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      if (!slug) return;
      const b = await businessService.getBusinessBySlug(slug);
      setBusiness(b);
      if (b) {
        const p = await productService.getProducts(b.id);
        setProducts(p);
      }
      setLoading(false);
    };
    fetch();

    const channel = new BroadcastChannel('inventory_updates');
    channel.onmessage = (e) => {
      if (e.data.type === 'inventory_changed' && e.data.slug === slug) {
        fetch();
      }
    };
    return () => channel.close();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!business) return <div className="min-h-screen flex items-center justify-center text-gray-500">Store not found</div>;

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

  const theme = business.theme || 'classic';

  return (
    <>
      {theme === 'classic' && <ClassicStorefront business={business} products={products} onOpenProduct={setSelectedProduct} />}
      {theme === 'bold' && <BoldStorefront business={business} products={products} onOpenProduct={setSelectedProduct} />}
      {/* Fallback to classic if theme is missing */}
      {theme !== 'classic' && theme !== 'bold' && <ClassicStorefront business={business} products={products} onOpenProduct={setSelectedProduct} />}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={handleAdd} />
    </>
  );
}
