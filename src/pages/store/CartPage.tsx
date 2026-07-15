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

  // Load products to verify stock limits
  const productsStr = localStorage.getItem('kudi_products');
  const products = productsStr ? JSON.parse(productsStr) : [];

  const getProductStockLimit = (productId: string): number => {
    const p = products.find((prod: any) => prod.id === productId);
    return p && p.stockCount !== undefined ? p.stockCount : 9999;
  };

  const theme = business?.theme || 'light';
  const isBrutal = theme === 'brutal';
  const isDarkMode = theme === 'modern';
  const isLight = !isBrutal && !isDarkMode;

  if (items.length === 0) {
    return (
      <div className={`p-4 md:p-6 max-w-xl mx-auto text-center py-12 ${isBrutal ? 'selection:bg-[#E0FF4F] selection:text-black' : isDarkMode ? 'selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)]' : 'selection:bg-accent selection:text-white'}`}>
        <div className={`w-20 h-20 flex items-center justify-center mx-auto mb-6 ${isBrutal ? 'bg-[var(--s-accent)] border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)]' : isDarkMode ? 'bg-[#18181B] border border-[#27272A] rounded-2xl' : 'bg-slate-100 rounded-full'}`}>
          <ShoppingBag className={`w-10 h-10 ${isBrutal ? 'text-[var(--s-accent-text)]' : isDarkMode ? 'text-[#3F3F46]' : 'text-slate-400'}`} strokeWidth={isBrutal ? 1.5 : 2} />
        </div>
        <h1 className={`text-3xl sm:text-4xl mb-3 font-display ${isBrutal ? 'font-black uppercase text-white' : 'font-bold'}`}>Your cart is empty</h1>
        <p className={`mb-8 text-base sm:text-lg ${isBrutal ? 'font-bold uppercase text-gray-400' : isDarkMode ? 'text-[#9CA3AF]' : 'font-medium text-slate-500'}`}>Looks like you haven't added anything yet.</p>
        <Link to={`/store/${business?.storefrontSlug}`}>
          <button className={`px-8 h-14 transition-all ${isBrutal ? 'font-black uppercase text-lg bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-none' : isDarkMode ? 'font-semibold text-lg bg-[var(--s-accent)] text-[var(--s-accent-text)] rounded-full hover:opacity-90 shadow-sm hover:shadow-md hover:-translate-y-0.5' : 'font-semibold text-lg bg-accent text-white rounded-xl hover:bg-emerald-400 shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}>
            Continue Shopping
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 max-w-4xl mx-auto pb-40 ${isBrutal ? 'selection:bg-[#E0FF4F] selection:text-black' : isDarkMode ? 'selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)]' : 'selection:bg-accent selection:text-white'}`}>
      <h1 className={`text-4xl md:text-5xl font-display tracking-tighter ${isBrutal ? 'font-black uppercase mb-8 text-white border-b-[3px] border-white pb-3' : isDarkMode ? 'font-bold mb-6 text-white border-b border-[#27272A] pb-3' : 'font-bold mb-6 text-primary border-b border-slate-200 pb-3'}`}>Your Cart</h1>
      
      <div className="space-y-4 sm:space-y-6 mb-8">
        {items.map(item => (
          <div key={item.productId} className={`flex gap-3 sm:gap-4 p-3 sm:p-4 transition-all ${isBrutal ? 'bg-black border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)]' : isDarkMode ? 'bg-[#18181B] rounded-2xl border border-[#27272A] shadow-sm' : 'glass-panel bg-white rounded-2xl border border-slate-200 shadow-sm'}`}>
            <div className={`w-20 h-20 sm:w-24 sm:h-24 overflow-hidden shrink-0 ${isBrutal ? 'bg-[var(--s-accent)] border-[2px] border-white' : isDarkMode ? 'bg-[#121212] border border-[#27272A] rounded-xl' : 'bg-slate-50 rounded-xl'}`}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className={`w-6 h-6 ${isBrutal ? 'text-[var(--s-accent-text)]' : isDarkMode ? 'text-[#3F3F46]' : 'text-slate-300'}`} strokeWidth={isBrutal ? 1.5 : 2} />
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex justify-between items-start gap-3">
                <h3 className={`line-clamp-2 font-display ${isBrutal ? 'font-black uppercase text-xl md:text-2xl text-white' : isDarkMode ? 'font-semibold text-lg md:text-xl text-white' : 'font-semibold text-lg md:text-xl text-primary'}`}>{item.productName}</h3>
                <button 
                  onClick={() => removeItem(item.productId)}
                  className={`p-1.5 transition-all ${isBrutal ? 'bg-[var(--s-secondary)] text-[var(--s-secondary-text)] border-[2px] border-white shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5' : isDarkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 rounded-lg' : 'text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg'}`}
                >
                  <Trash2 className="w-4 h-4" strokeWidth={isBrutal ? 2.5 : 2} />
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                <span className={`text-2xl ${isBrutal ? 'font-black text-[var(--s-accent)]' : isDarkMode ? 'font-bold text-white' : 'font-bold text-slate-800'}`}>{formatNaira(item.unitPrice)}</span>
                
                <div className={`flex items-center gap-1.5 ${isBrutal ? 'bg-white p-1 border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' : isDarkMode ? 'border border-[#3F3F46] rounded-lg p-1 bg-[#121212]' : 'border border-slate-200 rounded-lg p-1 bg-slate-50'}`}>
                  <button 
                    onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                    className={`w-10 h-10 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[var(--s-accent)] hover:bg-gray-900' : isDarkMode ? 'text-[#9CA3AF] hover:bg-[#27272A] hover:text-white rounded-md' : 'text-slate-600 hover:bg-white rounded-md hover:shadow-sm'}`}
                  >
                    <Minus className="w-4 h-4" strokeWidth={isBrutal ? 2.5 : 2} />
                  </button>
                  <span className={`w-10 text-center text-xl ${isBrutal ? 'font-black text-black' : isDarkMode ? 'font-bold text-white' : 'font-bold text-primary'}`}>{item.quantity}</span>
                  <button 
                    onClick={() => {
                      const maxVal = getProductStockLimit(item.productId);
                      if (item.quantity < maxVal) {
                        updateQuantity(item.productId, item.quantity + 1);
                      }
                    }}
                    disabled={item.quantity >= getProductStockLimit(item.productId)}
                    className={`w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-30 ${isBrutal ? 'bg-black text-[var(--s-accent)] hover:bg-gray-900' : isDarkMode ? 'text-[#9CA3AF] hover:bg-[#27272A] hover:text-white rounded-md' : 'text-slate-600 hover:bg-white rounded-md hover:shadow-sm'}`}
                  >
                    <Plus className="w-4 h-4" strokeWidth={isBrutal ? 2.5 : 2} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`fixed bottom-0 left-0 right-0 p-4 md:p-6 z-10 ${isBrutal ? 'bg-black/90 border-t-[3px] border-white backdrop-blur-md' : isDarkMode ? 'bg-[#18181B]/90 border-t border-[#27272A] backdrop-blur-xl' : 'glass-panel bg-white/90 border-t border-slate-200 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]'}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex-1 w-full flex items-center justify-between sm:justify-start sm:gap-6">
            <div className={`text-lg ${isBrutal ? 'font-black uppercase text-gray-300' : isDarkMode ? 'text-[#9CA3AF]' : 'font-medium text-slate-500'}`}>Subtotal</div>
            <div className={`text-3xl font-display ${isBrutal ? 'font-black text-white drop-shadow-[2px_2px_0px_var(--s-accent)]' : 'font-bold'}`}>{formatNaira(getTotal())}</div>
          </div>
          <button 
            onClick={() => navigate(`/store/${business?.storefrontSlug}/checkout`)}
            className={`w-full sm:w-auto flex items-center justify-center px-10 h-14 transition-all ${isBrutal ? 'font-black uppercase text-lg bg-[var(--s-accent)] text-[var(--s-accent-text)] border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-none' : isDarkMode ? 'font-semibold text-lg bg-[var(--s-accent)] text-[var(--s-accent-text)] rounded-full shadow-sm hover:opacity-90 hover:-translate-y-0.5' : 'font-semibold text-lg bg-accent text-white rounded-[16px] shadow-sm hover:bg-emerald-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'}`} 
          >
            {isBrutal ? 'CHECKOUT' : 'Checkout'} <ArrowRight className="w-5 h-5 ml-2" strokeWidth={isBrutal ? 2.5 : 2} />
          </button>
        </div>
      </div>
    </div>
  );
}
