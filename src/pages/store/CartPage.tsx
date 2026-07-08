import React from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Business } from '../../lib/types';
import { useCartStore } from '../../lib/store';
import { formatNaira } from '../../lib/utils';

export default function CartPage() {
  const { business } = useOutletContext<{ business: Business }>();
  const navigate = useNavigate();
  const { updateQuantity, removeItem, getTotal } = useCartStore();
  const storeItems = useCartStore(state => state.items);
  const items = Array.isArray(storeItems) ? storeItems : [];

  const theme = business?.theme || 'modern';
  const isBrutal = theme === 'brutal';

  if (items.length === 0) {
    return (
      <div className={`p-4 md:p-6 max-w-xl mx-auto text-center py-12 ${isBrutal ? 'selection:bg-[#E0FF4F] selection:text-black' : 'selection:bg-accent selection:text-white'}`}>
        <div className={`w-20 h-20 flex items-center justify-center mx-auto mb-6 ${isBrutal ? 'bg-[var(--s-accent)] border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'bg-slate-100 rounded-full'}`}>
          <ShoppingBag className={`w-10 h-10 ${isBrutal ? 'text-[var(--s-accent-text)]' : 'text-slate-400'}`} strokeWidth={isBrutal ? 1.5 : 2} />
        </div>
        <h1 className={`text-2xl sm:text-3xl mb-3 ${isBrutal ? 'font-black uppercase text-white' : 'font-display font-bold text-primary'}`}>Your cart is empty</h1>
        <p className={`mb-8 text-sm sm:text-base ${isBrutal ? 'font-bold uppercase text-gray-400' : 'font-medium text-slate-500'}`}>Looks like you haven't added anything yet.</p>
        <Link to={`/store/${business?.storefrontSlug}`}>
          <button className={`px-8 h-12 transition-all ${isBrutal ? 'font-black uppercase text-base bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-none' : 'font-semibold text-base bg-accent text-white rounded-xl hover:bg-emerald-400 shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}>
            Continue Shopping
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 max-w-4xl mx-auto pb-40 ${isBrutal ? 'selection:bg-[#E0FF4F] selection:text-black' : 'selection:bg-accent selection:text-white'}`}>
      <h1 className={`text-3xl md:text-4xl tracking-tighter ${isBrutal ? 'font-black uppercase mb-8 text-white border-b-[3px] border-white pb-3' : 'font-display font-bold mb-6 text-primary border-b border-slate-200 pb-3'}`}>Your Cart</h1>
      
      <div className="space-y-4 sm:space-y-6 mb-8">
        {items.map(item => (
          <div key={item.productId} className={`flex gap-3 sm:gap-4 p-3 sm:p-4 transition-all ${isBrutal ? 'bg-black border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'glass-panel bg-white rounded-2xl border border-slate-200 shadow-sm'}`}>
            <div className={`w-20 h-20 sm:w-24 sm:h-24 overflow-hidden shrink-0 ${isBrutal ? 'bg-[var(--s-accent)] border-[2px] border-white' : 'bg-slate-50 rounded-xl'}`}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className={`w-6 h-6 ${isBrutal ? 'text-[var(--s-accent-text)]' : 'text-slate-300'}`} strokeWidth={isBrutal ? 1.5 : 2} />
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex justify-between items-start gap-3">
                <h3 className={`line-clamp-2 ${isBrutal ? 'font-black uppercase text-lg md:text-xl text-white' : 'font-semibold text-base md:text-lg text-primary'}`}>{item.productName}</h3>
                <button 
                  onClick={() => removeItem(item.productId)}
                  className={`p-1.5 transition-all ${isBrutal ? 'bg-[var(--s-secondary)] text-[var(--s-secondary-text)] border-[2px] border-white shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5' : 'text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg'}`}
                >
                  <Trash2 className="w-4 h-4" strokeWidth={isBrutal ? 2.5 : 2} />
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                <span className={`text-xl ${isBrutal ? 'font-black text-[var(--s-accent)]' : 'font-bold text-slate-800'}`}>{formatNaira(item.unitPrice)}</span>
                
                <div className={`flex items-center gap-1.5 ${isBrutal ? 'bg-white p-1 border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'border border-slate-200 rounded-lg p-1 bg-slate-50'}`}>
                  <button 
                    onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                    className={`w-8 h-8 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[var(--s-accent)] hover:bg-gray-900' : 'text-slate-600 hover:bg-white rounded-md hover:shadow-sm'}`}
                  >
                    <Minus className="w-3.5 h-3.5" strokeWidth={isBrutal ? 2.5 : 2} />
                  </button>
                  <span className={`w-8 text-center text-lg ${isBrutal ? 'font-black text-black' : 'font-bold text-primary'}`}>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className={`w-8 h-8 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[var(--s-accent)] hover:bg-gray-900' : 'text-slate-600 hover:bg-white rounded-md hover:shadow-sm'}`}
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={isBrutal ? 2.5 : 2} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`fixed bottom-0 left-0 right-0 p-4 md:p-6 z-10 ${isBrutal ? 'bg-black/90 border-t-[3px] border-white backdrop-blur-md' : 'glass-panel bg-white/90 border-t border-slate-200 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]'}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex-1 w-full flex items-center justify-between sm:justify-start sm:gap-6">
            <div className={`text-base ${isBrutal ? 'font-black uppercase text-gray-300' : 'font-medium text-slate-500'}`}>Subtotal</div>
            <div className={`text-2xl ${isBrutal ? 'font-black text-white drop-shadow-[2px_2px_0px_var(--s-accent)]' : 'font-display font-bold text-slate-800'}`}>{formatNaira(getTotal())}</div>
          </div>
          <button 
            onClick={() => navigate(`/store/${business?.storefrontSlug}/checkout`)}
            className={`w-full sm:w-auto flex items-center justify-center px-8 h-12 transition-all ${isBrutal ? 'font-black uppercase text-base bg-[var(--s-accent)] text-[var(--s-accent-text)] border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-none' : 'font-semibold text-base bg-accent text-white rounded-[16px] shadow-sm hover:bg-emerald-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'}`} 
          >
            {isBrutal ? 'CHECKOUT' : 'Checkout'} <ArrowRight className="w-5 h-5 ml-2" strokeWidth={isBrutal ? 2.5 : 2} />
          </button>
        </div>
      </div>
    </div>
  );
}
