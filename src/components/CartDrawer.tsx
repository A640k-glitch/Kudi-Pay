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

  const theme = business?.theme || 'modern';
  const isBrutal = theme === 'brutal';
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
        className={`fixed inset-0 z-[100] transition-opacity ${isBrutal ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/50'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md shadow-2xl z-[110] flex flex-col animate-in slide-in-from-right duration-300 ${isBrutal ? 'bg-black border-l-[4px] border-white' : 'glass-panel bg-white/90 backdrop-blur-2xl border-l border-slate-200/60'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 ${isBrutal ? 'border-b-[4px] border-white' : 'border-b border-slate-200/60'}`}>
          <div className="flex items-center gap-3">
            <ShoppingBag className={`w-6 h-6 ${isBrutal ? 'text-white' : 'text-primary'}`} strokeWidth={isBrutal ? 2.5 : 2} />
            <h2 className={`${isBrutal ? 'text-xl font-black uppercase text-white' : 'text-xl font-display font-bold text-primary'}`}>Your Cart</h2>
            {items.length > 0 && (
              <span className={`w-8 h-8 flex items-center justify-center text-sm ${isBrutal ? 'font-black bg-[var(--s-accent)] text-black border-[3px] border-white shadow-[2px_2px_0px_rgba(255,255,255,1)]' : 'font-bold rounded-full bg-accent text-white shadow-sm'}`}>
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 transition-all ${isBrutal ? 'bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1' : 'hover:bg-slate-100 text-slate-500 hover:text-primary rounded-full'}`}
          >
            <X className="w-5 h-5" strokeWidth={isBrutal ? 3 : 2} />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-5 ${isBrutal ? 'bg-black selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)]' : 'selection:bg-accent selection:text-white'}`}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className={`w-16 h-16 flex items-center justify-center mb-4 ${isBrutal ? 'bg-[var(--s-accent)] border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'bg-slate-50 border border-slate-100 rounded-2xl'}`}>
                <ShoppingBag className={`w-8 h-8 ${isBrutal ? 'text-[var(--s-accent-text)]' : 'text-slate-300'}`} strokeWidth={isBrutal ? 1.5 : 2} />
              </div>
              <h3 className={`mb-2 text-xl ${isBrutal ? 'font-black uppercase text-white' : 'font-display font-bold text-primary'}`}>Your cart is empty</h3>
              <p className={`mb-6 text-sm ${isBrutal ? 'font-bold uppercase text-gray-400' : 'font-medium text-slate-500'}`}>Looks like you haven't added anything yet.</p>
              <button
                onClick={onClose}
                className={`px-6 h-12 flex items-center justify-center transition-all ${isBrutal ? 'font-black uppercase text-sm bg-[var(--s-accent)] text-[var(--s-accent-text)] border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-none' : 'font-semibold text-sm rounded-xl bg-accent text-white shadow-sm hover:bg-emerald-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'}`}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.productId} className={`flex gap-3 p-3 transition-all ${isBrutal ? 'bg-black border-[3px] border-white shadow-[3px_3px_0px_rgba(255,255,255,1)]' : 'bg-white rounded-[20px] border border-slate-200/60 shadow-sm'}`}>
                  <div className={`w-16 h-16 overflow-hidden shrink-0 ${isBrutal ? 'bg-[var(--s-accent)] border-[2px] border-white' : 'bg-slate-50 rounded-[12px]'}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className={`w-5 h-5 ${isBrutal ? 'text-[var(--s-accent-text)]' : 'text-slate-300'}`} strokeWidth={isBrutal ? 1.5 : 2} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className={`line-clamp-2 ${isBrutal ? 'font-black uppercase text-xs sm:text-sm text-white' : 'font-semibold text-sm text-primary'}`}>{item.productName}</h3>
                      <button 
                        onClick={() => removeItem(item.productId)}
                        className={`p-1 transition-all ${isBrutal ? 'bg-[var(--s-secondary)] text-[var(--s-secondary-text)] border-[2px] border-white shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5' : 'hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={isBrutal ? 2.5 : 2} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-sm sm:text-base ${isBrutal ? 'font-black text-[var(--s-accent)]' : 'font-bold text-slate-800'}`}>{formatNaira(item.unitPrice)}</span>
                      
                      <div className={`flex items-center p-0.5 ${isBrutal ? 'bg-white border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-slate-200/60 rounded-lg bg-slate-50'}`}>
                        <button 
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          className={`w-6 h-6 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[var(--s-accent)] hover:bg-gray-900' : 'text-slate-600 hover:bg-white rounded-md hover:shadow-sm'}`}
                        >
                          <Minus className="w-3 h-3" strokeWidth={isBrutal ? 2.5 : 2} />
                        </button>
                        <span className={`w-6 text-center text-xs ${isBrutal ? 'font-black text-black' : 'font-bold text-primary'}`}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className={`w-6 h-6 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[var(--s-accent)] hover:bg-gray-900' : 'text-slate-600 hover:bg-white rounded-md hover:shadow-sm'}`}
                        >
                          <Plus className="w-3 h-3" strokeWidth={isBrutal ? 2.5 : 2} />
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
          <div className={`p-4 md:p-5 ${isBrutal ? 'bg-black border-t-[3px] border-white' : 'border-t border-slate-200/60 bg-white/50 backdrop-blur-md'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs md:text-sm ${isBrutal ? 'font-black uppercase tracking-widest text-gray-400' : 'font-medium text-slate-500'}`}>Subtotal</span>
              <span className={`text-lg md:text-xl ${isBrutal ? 'font-black text-white' : 'font-display font-bold text-primary'}`}>{formatNaira(getTotal())}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className={`w-full flex items-center justify-center gap-2 h-12 md:h-14 transition-all ${isBrutal ? 'font-black uppercase text-base bg-[var(--s-accent)] text-[var(--s-accent-text)] border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-none' : 'font-semibold text-base rounded-[16px] bg-accent text-white shadow-sm hover:bg-emerald-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'}`}
            >
              {isBrutal ? 'CHECKOUT' : 'Checkout'} <ArrowRight className="w-5 h-5" strokeWidth={isBrutal ? 2.5 : 2} />
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
