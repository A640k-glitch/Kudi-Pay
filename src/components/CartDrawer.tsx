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
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();

  if (!isOpen) return null;

  const theme = business?.theme || 'modern';
  const isBrutal = theme === 'brutal';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

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
              <span className={`w-8 h-8 flex items-center justify-center text-sm ${isBrutal ? 'font-black bg-[#E0FF4F] text-black border-[3px] border-white shadow-[2px_2px_0px_rgba(255,255,255,1)]' : 'font-bold rounded-full bg-accent text-white shadow-sm'}`}>
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
        <div className={`flex-1 overflow-y-auto p-5 ${isBrutal ? 'bg-black selection:bg-[#E0FF4F] selection:text-black' : 'selection:bg-accent selection:text-white'}`}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className={`w-24 h-24 flex items-center justify-center mb-6 ${isBrutal ? 'bg-[#E0FF4F] border-[4px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)]' : 'bg-slate-50 border border-slate-100 rounded-[24px]'}`}>
                <ShoppingBag className={`w-12 h-12 ${isBrutal ? 'text-black' : 'text-slate-300'}`} strokeWidth={isBrutal ? 1.5 : 2} />
              </div>
              <h3 className={`mb-2 ${isBrutal ? 'text-2xl font-black uppercase text-white' : 'text-2xl font-display font-bold text-primary'}`}>Your cart is empty</h3>
              <p className={`mb-8 ${isBrutal ? 'font-bold uppercase text-gray-400' : 'font-medium text-slate-500'}`}>Looks like you haven't added anything yet.</p>
              <button
                onClick={onClose}
                className={`px-8 h-14 flex items-center justify-center transition-all ${isBrutal ? 'font-black uppercase text-lg bg-[#E0FF4F] text-black border-[4px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] active:translate-y-1 active:shadow-none' : 'font-semibold text-base rounded-[20px] bg-accent text-white shadow-lg shadow-accent/25 hover:bg-emerald-400 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0'}`}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.productId} className={`flex gap-4 p-4 transition-all ${isBrutal ? 'bg-black border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'bg-white rounded-[24px] border border-slate-200/60 shadow-sm'}`}>
                  <div className={`w-20 h-20 overflow-hidden shrink-0 ${isBrutal ? 'bg-[#E0FF4F] border-[2px] border-white' : 'bg-slate-50 rounded-[16px]'}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className={`w-6 h-6 ${isBrutal ? 'text-black' : 'text-slate-300'}`} strokeWidth={isBrutal ? 1.5 : 2} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className={`line-clamp-2 ${isBrutal ? 'font-black uppercase text-sm text-white' : 'font-semibold text-sm text-primary'}`}>{item.productName}</h3>
                      <button 
                        onClick={() => removeItem(item.productId)}
                        className={`p-1.5 transition-all ${isBrutal ? 'bg-[#FF6666] text-white border-[2px] border-white shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5' : 'hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500'}`}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={isBrutal ? 3 : 2} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-lg ${isBrutal ? 'font-black text-[#E0FF4F]' : 'font-bold text-slate-800'}`}>{formatNaira(item.unitPrice)}</span>
                      
                      <div className={`flex items-center p-1 ${isBrutal ? 'bg-white border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-slate-200/60 rounded-xl bg-slate-50'}`}>
                        <button 
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          className={`w-8 h-8 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[#E0FF4F] hover:bg-gray-900' : 'text-slate-600 hover:bg-white rounded-lg hover:shadow-sm'}`}
                        >
                          <Minus className="w-4 h-4" strokeWidth={isBrutal ? 3 : 2} />
                        </button>
                        <span className={`w-8 text-center text-sm ${isBrutal ? 'font-black text-black' : 'font-bold text-primary'}`}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className={`w-8 h-8 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[#E0FF4F] hover:bg-gray-900' : 'text-slate-600 hover:bg-white rounded-lg hover:shadow-sm'}`}
                        >
                          <Plus className="w-4 h-4" strokeWidth={isBrutal ? 3 : 2} />
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
          <div className={`p-5 ${isBrutal ? 'bg-black border-t-[4px] border-white' : 'border-t border-slate-200/60 bg-white/50 backdrop-blur-md'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`${isBrutal ? 'font-black uppercase tracking-widest text-gray-400' : 'font-medium text-slate-500'}`}>Subtotal</span>
              <span className={`text-2xl ${isBrutal ? 'font-black text-white' : 'font-display font-bold text-primary'}`}>{formatNaira(getTotal())}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className={`w-full flex items-center justify-center gap-3 h-14 md:h-16 transition-all ${isBrutal ? 'font-black uppercase text-xl bg-[#E0FF4F] text-black border-[4px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] active:translate-y-1 active:shadow-none' : 'font-semibold text-lg rounded-[20px] bg-accent text-white shadow-lg shadow-accent/25 hover:bg-emerald-400 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0'}`}
            >
              {isBrutal ? 'CHECKOUT' : 'Checkout'} <ArrowRight className="w-6 h-6" strokeWidth={isBrutal ? 3 : 2} />
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
