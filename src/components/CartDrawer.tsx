import React from 'react';
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

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity ${isBrutal ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/50'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md shadow-2xl z-[110] flex flex-col animate-in slide-in-from-right duration-300 ${isBrutal ? 'bg-black border-l-[4px] border-white' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 ${isBrutal ? 'border-b-[4px] border-white' : 'border-b border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <ShoppingBag className={`w-6 h-6 ${isBrutal ? 'text-white' : 'text-black'}`} strokeWidth={isBrutal ? 2.5 : 2} />
            <h2 className={`text-xl font-black uppercase ${isBrutal ? 'text-white' : 'text-black'}`}>Your Cart</h2>
            {items.length > 0 && (
              <span className={`w-8 h-8 flex items-center justify-center font-black text-sm ${isBrutal ? 'bg-[#E0FF4F] text-black border-[3px] border-white shadow-[2px_2px_0px_rgba(255,255,255,1)]' : 'rounded-full bg-black text-white'}`}>
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 transition-all ${isBrutal ? 'bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1' : 'hover:bg-gray-100 rounded-full'}`}
          >
            <X className="w-5 h-5" strokeWidth={isBrutal ? 3 : 2} />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-5 ${isBrutal ? 'bg-black selection:bg-[#E0FF4F] selection:text-black' : ''}`}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className={`w-24 h-24 flex items-center justify-center mb-6 ${isBrutal ? 'bg-[#E0FF4F] border-[4px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)]' : 'bg-gray-100 rounded-full'}`}>
                <ShoppingBag className={`w-12 h-12 ${isBrutal ? 'text-black' : 'text-gray-400'}`} strokeWidth={isBrutal ? 1.5 : 2} />
              </div>
              <h3 className={`text-2xl font-black uppercase mb-2 ${isBrutal ? 'text-white' : 'text-black'}`}>Your cart is empty</h3>
              <p className={`font-bold uppercase mb-8 ${isBrutal ? 'text-gray-400' : 'text-gray-500'}`}>Looks like you haven't added anything yet.</p>
              <button
                onClick={onClose}
                className={`px-8 h-14 flex items-center justify-center font-black uppercase text-lg transition-all ${isBrutal ? 'bg-[#E0FF4F] text-black border-[4px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] active:translate-y-1 active:shadow-none' : 'rounded-xl bg-black text-white hover:bg-gray-800'}`}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.productId} className={`flex gap-4 p-4 transition-all ${isBrutal ? 'bg-black border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'bg-gray-50 rounded-xl border border-gray-100'}`}>
                  <div className={`w-20 h-20 overflow-hidden shrink-0 ${isBrutal ? 'bg-[#E0FF4F] border-[2px] border-white' : 'bg-gray-200 rounded-lg'}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className={`w-6 h-6 ${isBrutal ? 'text-black' : 'text-gray-400'}`} strokeWidth={isBrutal ? 1.5 : 2} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className={`font-black uppercase text-sm line-clamp-2 ${isBrutal ? 'text-white' : 'text-gray-900'}`}>{item.productName}</h3>
                      <button 
                        onClick={() => removeItem(item.productId)}
                        className={`p-1.5 transition-all ${isBrutal ? 'bg-[#FF6666] text-white border-[2px] border-white shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5' : 'hover:bg-red-50 rounded text-red-500'}`}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={isBrutal ? 3 : 2} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className={`font-black text-lg ${isBrutal ? 'text-[#E0FF4F]' : 'text-black'}`}>{formatNaira(item.unitPrice)}</span>
                      
                      <div className={`flex items-center p-1 ${isBrutal ? 'bg-white border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-gray-200 rounded-lg bg-white'}`}>
                        <button 
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          className={`w-8 h-8 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[#E0FF4F] hover:bg-gray-900' : 'text-gray-600 hover:bg-gray-100 rounded'}`}
                        >
                          <Minus className="w-4 h-4" strokeWidth={isBrutal ? 3 : 2} />
                        </button>
                        <span className={`w-8 text-center text-sm font-black ${isBrutal ? 'text-black' : 'text-gray-900'}`}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className={`w-8 h-8 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[#E0FF4F] hover:bg-gray-900' : 'text-gray-600 hover:bg-gray-100 rounded'}`}
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
          <div className={`p-5 ${isBrutal ? 'bg-black border-t-[4px] border-white' : 'border-t border-gray-100 bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`font-black uppercase tracking-widest ${isBrutal ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal</span>
              <span className={`text-2xl font-black ${isBrutal ? 'text-white' : 'text-black'}`}>{formatNaira(getTotal())}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className={`w-full flex items-center justify-center gap-3 h-16 font-black uppercase text-xl transition-all ${isBrutal ? 'bg-[#E0FF4F] text-black border-[4px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] active:translate-y-1 active:shadow-none' : 'rounded-xl bg-black text-white hover:bg-gray-800'}`}
            >
              CHECKOUT <ArrowRight className="w-6 h-6" strokeWidth={isBrutal ? 3 : 2} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
