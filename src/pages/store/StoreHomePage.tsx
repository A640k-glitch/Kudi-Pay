import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { ShoppingBag, PackageX, Minus, Plus } from 'lucide-react';
import { Business, Product } from '../../lib/types';
import { productService } from '../../lib/services/productService';
import { formatNaira } from '../../lib/utils';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { useCartStore } from '../../lib/store';
import { useToast } from '../../components/Toast';

export default function StoreHomePage() {
  const { business } = useOutletContext<{ business: Business }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore(state => state.addItem);
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      const p = await productService.getProducts(business.id);
      setProducts(p);
      setIsLoading(false);
    }
    load();
  }, [business.id]);

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: quantity,
      imageUrl: product.imageUrl
    });
    
    setSelectedProduct(null);
    setQuantity(1);
    addToast('Added to cart', 'success');
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="aspect-[4/5] rounded-2xl" style={{ backgroundColor: 'var(--store-border)' }}></div>)}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--store-border)' }}>
          <PackageX className="w-8 h-8 opacity-50" style={{ color: 'var(--store-text)' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--store-text)' }}>Store is setting up</h2>
        <p style={{ color: 'var(--store-text-muted)' }}>Products will appear here soon.</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 pb-20">
      {business.theme === 'classic' && (
        <div className="mb-6 rounded-xl p-6 flex flex-col items-center text-center bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{business.businessName}</h1>
          <p className="text-sm text-gray-600">Shop our latest collection</p>
        </div>
      )}

      {business.theme === 'bold' && (
        <div className="mb-8 text-center pt-6">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-2">{business.businessName}</h1>
          <div className="w-12 h-1 bg-[#F5A623] mx-auto"></div>
        </div>
      )}

      {business.theme === 'minimal' && (
        <div className="mb-8 pt-4 border-b pb-4" style={{ borderColor: 'var(--store-border)' }}>
          <h1 className="text-xl font-light text-gray-900 tracking-wide uppercase">{business.category} / <span className="font-medium">{business.businessName}</span></h1>
        </div>
      )}

      <div className={`grid gap-3 md:gap-4 ${
        business.theme === 'minimal' 
          ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' 
          : business.theme === 'bold' 
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      }`}>
        {products.map(product => (
          <div 
            key={product.id} 
            onClick={() => openProduct(product)}
            className={`group cursor-pointer flex flex-col transition-transform hover:-translate-y-1 ${
              business.theme === 'minimal' ? 'rounded-none' : business.theme === 'bold' ? 'rounded-3xl border-2' : 'rounded-xl border'
            } overflow-hidden`}
            style={{ 
              backgroundColor: 'var(--store-card)', 
              borderColor: business.theme === 'minimal' ? 'transparent' : 'var(--store-border)' 
            }}
          >
            <div className={`relative overflow-hidden ${business.theme === 'bold' ? 'aspect-[4/3]' : 'aspect-square'} ${!product.isAvailable ? 'opacity-50 grayscale' : ''}`} style={{ backgroundColor: 'var(--store-border)' }}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 opacity-20" style={{ color: 'var(--store-text)' }} />
                </div>
              )}
              {/* Quick add button (desktop hover) */}
              <button 
                onClick={(e) => handleAddToCart(product, e)}
                disabled={!product.isAvailable}
                className={`absolute bottom-3 left-3 right-3 py-2 text-sm font-bold text-white shadow-lg translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all hidden md:block disabled:opacity-50 disabled:cursor-not-allowed ${business.theme === 'bold' ? 'rounded-2xl uppercase tracking-wider text-xs' : 'rounded-lg'}`}
                style={{ backgroundColor: 'var(--store-primary)' }}
              >
                {!product.isAvailable ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
            
            <div className={`flex flex-col flex-1 ${business.theme === 'bold' ? 'p-4 md:p-5' : 'p-2 md:p-3'} ${!product.isAvailable ? 'opacity-50' : ''}`}>
              <h3 className={`font-medium line-clamp-2 mb-1 ${business.theme === 'bold' ? 'text-lg font-bold uppercase tracking-tight' : 'text-sm'}`} style={{ color: 'var(--store-text)' }}>{product.name}</h3>
              <div className="mt-auto flex items-center justify-between">
                <span className={`${business.theme === 'bold' ? 'text-xl font-black text-[#F5A623]' : 'font-bold text-sm'}`} style={{ color: business.theme === 'bold' ? undefined : 'var(--store-text)' }}>{formatNaira(product.price)}</span>
                {!product.isAvailable && <span className="text-xs font-bold uppercase" style={{ color: 'var(--store-text-muted)' }}>Sold Out</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)}>
        {selectedProduct && (
          <div className="flex flex-col md:flex-row gap-6 py-2">
            <div className="w-full md:w-1/2 aspect-square rounded-xl overflow-hidden relative" style={{ backgroundColor: 'var(--store-border)' }}>
              {selectedProduct.imageUrl ? (
                 <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 opacity-20" style={{ color: 'var(--store-text)' }} />
                </div>
              )}
            </div>
            <div className="w-full md:w-1/2 flex flex-col">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--store-text)' }}>{selectedProduct.name}</h2>
              <div className="text-xl font-bold mb-6" style={{ color: 'var(--store-primary)' }}>{formatNaira(selectedProduct.price)}</div>
              
              {selectedProduct.description && (
                <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--store-text-muted)' }}>
                  {selectedProduct.description}
                </p>
              )}

              {!selectedProduct.isAvailable && (
                <div className="mb-6 inline-flex items-center px-3 py-1 rounded bg-black/5 text-sm font-medium" style={{ color: 'var(--store-text)' }}>
                  Out of stock
                </div>
              )}

              <div className="mt-auto pt-6 flex gap-4 items-center border-t" style={{ borderColor: 'var(--store-border)' }}>
                <div className="flex items-center rounded-xl border p-1" style={{ borderColor: 'var(--store-border)' }}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
                    disabled={!selectedProduct.isAvailable}
                  >
                    <Minus className="w-4 h-4" style={{ color: 'var(--store-text)' }} />
                  </button>
                  <span className="w-10 text-center font-bold" style={{ color: 'var(--store-text)' }}>{quantity}</span>
                  <button 
                    onClick={() => {
                      if (selectedProduct.isAvailable) {
                        setQuantity(quantity + 1);
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
                    disabled={!selectedProduct.isAvailable}
                  >
                    <Plus className="w-4 h-4" style={{ color: 'var(--store-text)' }} />
                  </button>
                </div>
                <button 
                  onClick={() => handleAddToCart(selectedProduct)}
                  disabled={!selectedProduct.isAvailable}
                  className="flex-1 h-12 rounded-xl font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--store-primary)' }}
                >
                  {!selectedProduct.isAvailable ? 'Sold Out' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
