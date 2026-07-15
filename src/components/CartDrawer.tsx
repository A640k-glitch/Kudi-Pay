import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, Minus, Plus, Trash2, X, ArrowRight } from 'lucide-react';
import { Business } from '../lib/types';
import { useCartStore } from '../lib/store';
import { formatNaira } from '../lib/utils';

interface CartDrawerProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ business, isOpen, onClose, onCheckout }: CartDrawerProps) {
  const store = useCartStore();
  const items = Array.isArray(store.items) ? store.items : [];
  const { updateQuantity, removeItem, getTotal } = store;

  const theme = business?.theme || 'light';
  const isDarkMode = theme === 'modern';
  const isLight = !isDarkMode;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  // Load products to verify stock limits
  const productsStr = localStorage.getItem('kudi_products');
  const products = productsStr ? JSON.parse(productsStr) : [];

  const getProductStockLimit = (productId: string): number => {
    const p = products.find((prod: any) => prod.id === productId);
    return p && p.stockCount !== undefined ? p.stockCount : 9999;
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] transition-opacity bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md shadow-2xl z-[110] flex flex-col animate-in slide-in-from-right duration-300 ${isLight ? 'bg-white border-l border-slate-200' : 'bg-[#18181B] border-l border-[#27272A]'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isLight ? 'border-slate-100' : 'border-[#27272A]'}`}>
          <div className="flex items-center gap-3">
            <ShoppingBag className={`w-5 h-5 ${isLight ? 'text-primary' : 'text-white'}`} strokeWidth={1.5} />
            <h2 className={`text-xl font-display font-semibold ${isLight ? 'text-primary' : 'text-white font-serif'}`} style={!isLight ? { fontFamily: '"Playfair Display", "Source Serif Pro", serif' } : {}}>Your Cart</h2>
            {items.length > 0 && (
              <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${isLight ? 'bg-[#111111] text-white' : 'bg-white text-[#111111]'} shadow-sm`}>
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-primary' : 'hover:bg-[#27272A] text-[#9CA3AF] hover:text-white'}`}
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-5 ${isLight ? 'bg-white' : 'bg-[#121212] selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)]'}`}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className={`w-16 h-16 flex items-center justify-center mb-4 rounded-2xl ${isLight ? 'bg-slate-50 border border-slate-100' : 'bg-[#18181B] border border-[#27272A]'}`}>
                <ShoppingBag className={`w-8 h-8 ${isLight ? 'text-slate-300' : 'text-[#3F3F46]'}`} strokeWidth={1.5} />
              </div>
              <h3 className={`mb-2 text-2xl font-display font-semibold ${isLight ? 'text-primary' : 'text-white'}`}>Your cart is empty</h3>
              <p className={`mb-6 text-base ${isLight ? 'text-slate-500' : 'text-[#9CA3AF]'}`}>Looks like you haven't added anything yet.</p>
              <button
                onClick={onClose}
                className={`px-8 h-14 flex items-center justify-center transition-all font-semibold text-base rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${isLight ? 'bg-[var(--s-accent)] text-[var(--s-accent-text)]' : 'bg-[var(--s-accent)] text-[var(--s-accent-text)]'}`}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.productId} className={`flex gap-3 p-3 rounded-xl border transition-all duration-300 shadow-sm ${isLight ? 'bg-white border-slate-100 hover:border-slate-200' : 'bg-[#18181B] border-[#27272A] hover:border-[#3F3F46]'}`}>
                  <div className={`w-16 h-16 overflow-hidden shrink-0 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#121212] border-[#27272A]'}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className={`w-5 h-5 ${isLight ? 'text-slate-300' : 'text-[#3F3F46]'}`} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                     <div className="flex justify-between items-start gap-2">
                      <h3 className={`line-clamp-2 font-display font-semibold text-base ${isLight ? 'text-primary' : 'text-white'}`}>{item.productName}</h3>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className={`p-1.5 rounded-lg transition-colors ${isLight ? 'bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600' : 'bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300'}`}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-base font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{formatNaira(item.unitPrice)}</span>

                      <div className={`flex items-center p-0.5 rounded-lg border ${isLight ? 'border-slate-200/60 bg-slate-50' : 'border-[#3F3F46] bg-[#121212]'}`}>
                        <button
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          className={`w-6 h-6 flex items-center justify-center transition-colors rounded-md hover:shadow-sm ${isLight ? 'text-slate-600 hover:bg-white' : 'text-[#9CA3AF] hover:bg-[#27272A] hover:text-white'}`}
                        >
                          <Minus className="w-3 h-3" strokeWidth={2} />
                        </button>
                        <span className={`w-8 text-center text-sm font-bold ${isLight ? 'text-primary' : 'text-white'}`}>{item.quantity}</span>
                        <button
                          onClick={() => {
                            const maxVal = getProductStockLimit(item.productId);
                            if (item.quantity < maxVal) {
                              updateQuantity(item.productId, item.quantity + 1);
                            }
                          }}
                          disabled={item.quantity >= getProductStockLimit(item.productId)}
                          className={`w-6 h-6 flex items-center justify-center transition-colors rounded-md hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent ${isLight ? 'text-slate-600 hover:bg-white' : 'text-[#9CA3AF] hover:bg-[#27272A] hover:text-white'}`}
                        >
                          <Plus className="w-3 h-3" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={`p-4 md:p-5 border-t shadow-sm ${isLight ? 'border-slate-100 bg-white' : 'border-[#27272A] bg-[#18181B]'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm md:text-base font-medium ${isLight ? 'text-slate-500' : 'text-[#9CA3AF]'}`}>Subtotal</span>
              <span className={`text-xl md:text-2xl font-display font-semibold ${isLight ? 'text-primary' : 'text-white'}`}>{formatNaira(getTotal())}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className={`w-full flex items-center justify-center gap-2 h-14 md:h-16 transition-all font-semibold text-lg rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 bg-[var(--s-accent)] text-[var(--s-accent-text)]`}
            >
              Checkout <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
