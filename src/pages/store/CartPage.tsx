import React from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Business } from '../../lib/types';
import { useCartStore } from '../../lib/store';
import { formatNaira } from '../../lib/utils';

export default function CartPage() {
  const { business } = useOutletContext<{ business: Business }>();
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--store-border)' }}>
          <ShoppingBag className="w-10 h-10 opacity-50" style={{ color: 'var(--store-text)' }} />
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--store-text)' }}>Your cart is empty</h1>
        <p className="mb-8" style={{ color: 'var(--store-text-muted)' }}>Looks like you haven't added anything yet.</p>
        <Link to={`/store/${business.storefrontSlug}`}>
          <button className="px-8 h-14 rounded-xl font-bold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--store-primary)' }}>
            Continue Shopping
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-32">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--store-text)' }}>Your Cart</h1>
      
      <div className="space-y-4 mb-8">
        {items.map(item => (
          <div key={item.productId} className="flex gap-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--store-card)', border: '1px solid var(--store-border)' }}>
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: 'var(--store-border)' }}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 opacity-20" style={{ color: 'var(--store-text)' }} />
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-medium line-clamp-2" style={{ color: 'var(--store-text)' }}>{item.productName}</h3>
                <button 
                  onClick={() => removeItem(item.productId)}
                  className="p-1 hover:bg-black/5 rounded text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold" style={{ color: 'var(--store-text)' }}>{formatNaira(item.unitPrice)}</span>
                
                <div className="flex items-center rounded-lg border p-1" style={{ borderColor: 'var(--store-border)' }}>
                  <button 
                    onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-black/5 transition-colors"
                  >
                    <Minus className="w-3 h-3" style={{ color: 'var(--store-text)' }} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold" style={{ color: 'var(--store-text)' }}>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-black/5 transition-colors"
                  >
                    <Plus className="w-3 h-3" style={{ color: 'var(--store-text)' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 border-t z-10 backdrop-blur-md" style={{ borderColor: 'var(--store-border)', backgroundColor: 'color-mix(in srgb, var(--store-bg) 80%, transparent)' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <div className="text-sm" style={{ color: 'var(--store-text-muted)' }}>Subtotal</div>
            <div className="text-xl font-bold" style={{ color: 'var(--store-text)' }}>{formatNaira(getTotal())}</div>
          </div>
          <button 
            onClick={() => navigate(`/store/${business.storefrontSlug}/checkout`)}
            className="flex items-center px-8 h-14 rounded-xl font-bold text-white transition-opacity hover:opacity-90" 
            style={{ backgroundColor: 'var(--store-primary)' }}
          >
            Checkout <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
