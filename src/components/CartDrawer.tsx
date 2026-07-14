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
  const isLight = theme === 'light' || theme === 'brutal';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] transition-opacity bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md shadow-2xl z-[110] flex flex-col animate-in slide-in-from-right duration-300 ${isLight ? 'bg-white border-l border-slate-200' : 'glass-panel bg-white/90 backdrop-blur-2xl border-l border-slate-200/60'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="text-xl font-display font-semibold text-primary">Your Cart</h2>
            {items.length > 0 && (
              <span className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full bg-[#111111] text-white shadow-sm">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-primary rounded-full transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-5 ${isLight ? 'bg-white' : 'selection:bg-accent selection:text-white'}`}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 flex items-center justify-center mb-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <ShoppingBag className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-xl font-display font-semibold text-primary">Your cart is empty</h3>
              <p className="mb-6 text-sm text-slate-500">Looks like you haven't added anything yet.</p>
              <button
                onClick={onClose}
                className="px-6 h-12 flex items-center justify-center transition-all font-semibold text-sm rounded-xl bg-accent text-white shadow-sm hover:bg-emerald-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.productId} className="flex gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-all duration-300 shadow-sm">
                  <div className="w-16 h-16 overflow-hidden shrink-0 bg-slate-50 rounded-lg border border-slate-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="line-clamp-2 font-semibold text-sm text-primary">{item.productName}</h3>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold text-slate-800">{formatNaira(item.unitPrice)}</span>

                      <div className="flex items-center p-0.5 border border-slate-200/60 rounded-lg bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 flex items-center justify-center transition-colors text-slate-600 hover:bg-white rounded-md hover:shadow-sm"
                        >
                          <Minus className="w-3 h-3" strokeWidth={2} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-primary">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center transition-colors text-slate-600 hover:bg-white rounded-md hover:shadow-sm"
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
          <div className="p-4 md:p-5 border-t border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs md:text-sm font-medium text-slate-500">Subtotal</span>
              <span className="text-lg md:text-xl font-display font-semibold text-primary">{formatNaira(getTotal())}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className={`w-full flex items-center justify-center gap-2 h-12 md:h-14 transition-all font-semibold text-base rounded-full text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0`}
              style={{ backgroundColor: isLight ? 'var(--s-accent)' : undefined }}
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
