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

  const theme = business?.theme || 'modern';
  const isBrutal = theme === 'brutal';

  if (items.length === 0) {
    return (
      <div className={`p-6 md:p-10 max-w-2xl mx-auto text-center py-20 ${isBrutal ? 'selection:bg-[#E0FF4F] selection:text-black' : ''}`}>
        <div className={`w-32 h-32 flex items-center justify-center mx-auto mb-8 ${isBrutal ? 'bg-[#E0FF4F] border-[4px] border-white shadow-[8px_8px_0px_rgba(255,255,255,1)]' : 'bg-gray-100 rounded-full'}`}>
          <ShoppingBag className={`w-14 h-14 ${isBrutal ? 'text-black' : 'text-gray-400'}`} strokeWidth={isBrutal ? 1.5 : 2} />
        </div>
        <h1 className={`text-4xl font-black mb-4 uppercase ${isBrutal ? 'text-white' : 'text-black'}`}>Your cart is empty</h1>
        <p className={`mb-10 text-lg font-bold uppercase ${isBrutal ? 'text-gray-400' : 'text-gray-500'}`}>Looks like you haven't added anything yet.</p>
        <Link to={`/store/${business?.storefrontSlug}`}>
          <button className={`px-10 h-16 font-black uppercase text-xl transition-all ${isBrutal ? 'bg-white text-black border-[4px] border-black shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] active:translate-y-1 active:shadow-none' : 'bg-black text-white rounded-xl hover:bg-gray-800'}`}>
            Continue Shopping
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 max-w-4xl mx-auto pb-40 ${isBrutal ? 'selection:bg-[#E0FF4F] selection:text-black' : ''}`}>
      <h1 className={`text-4xl md:text-5xl font-black mb-10 uppercase tracking-tighter ${isBrutal ? 'text-white border-b-[4px] border-white pb-4' : 'text-black border-b border-gray-200 pb-4'}`}>Your Cart</h1>
      
      <div className="space-y-6 mb-10">
        {items.map(item => (
          <div key={item.productId} className={`flex gap-4 sm:gap-6 p-4 sm:p-6 transition-all ${isBrutal ? 'bg-black border-[4px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)]' : 'bg-white rounded-2xl border border-gray-200'}`}>
            <div className={`w-24 h-24 sm:w-32 sm:h-32 overflow-hidden shrink-0 ${isBrutal ? 'bg-[#E0FF4F] border-[3px] border-white' : 'bg-gray-50 rounded-xl'}`}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className={`w-8 h-8 ${isBrutal ? 'text-black' : 'text-gray-300'}`} strokeWidth={isBrutal ? 1.5 : 2} />
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex justify-between items-start gap-4">
                <h3 className={`font-black uppercase text-xl md:text-2xl line-clamp-2 ${isBrutal ? 'text-white' : 'text-gray-900'}`}>{item.productName}</h3>
                <button 
                  onClick={() => removeItem(item.productId)}
                  className={`p-2 transition-all ${isBrutal ? 'bg-[#FF6666] text-white border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:-translate-y-1' : 'text-red-500 hover:bg-red-50 rounded-lg'}`}
                >
                  <Trash2 className="w-5 h-5" strokeWidth={isBrutal ? 3 : 2} />
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                <span className={`font-black text-2xl ${isBrutal ? 'text-[#E0FF4F]' : 'text-black'}`}>{formatNaira(item.unitPrice)}</span>
                
                <div className={`flex items-center ${isBrutal ? 'bg-white p-1 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]' : 'border border-gray-200 rounded-lg p-1'}`}>
                  <button 
                    onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                    className={`w-10 h-10 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[#E0FF4F] hover:bg-gray-900' : 'text-gray-600 hover:bg-gray-50 rounded'}`}
                  >
                    <Minus className="w-4 h-4" strokeWidth={isBrutal ? 3 : 2} />
                  </button>
                  <span className={`w-12 text-center text-xl font-black ${isBrutal ? 'text-black' : 'text-gray-900'}`}>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className={`w-10 h-10 flex items-center justify-center transition-colors ${isBrutal ? 'bg-black text-[#E0FF4F] hover:bg-gray-900' : 'text-gray-600 hover:bg-gray-50 rounded'}`}
                  >
                    <Plus className="w-4 h-4" strokeWidth={isBrutal ? 3 : 2} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`fixed bottom-0 left-0 right-0 p-4 md:p-6 z-10 ${isBrutal ? 'bg-black/90 border-t-[4px] border-white backdrop-blur-md' : 'bg-white/80 border-t border-gray-200 backdrop-blur-xl'}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between">
          <div className="flex-1 w-full flex items-center justify-between sm:justify-start sm:gap-8">
            <div className={`font-black uppercase text-lg ${isBrutal ? 'text-gray-300' : 'text-gray-500'}`}>Subtotal</div>
            <div className={`text-3xl font-black ${isBrutal ? 'text-white drop-shadow-[2px_2px_0px_rgba(224,255,79,1)]' : 'text-black'}`}>{formatNaira(getTotal())}</div>
          </div>
          <button 
            onClick={() => navigate(`/store/${business?.storefrontSlug}/checkout`)}
            className={`w-full sm:w-auto flex items-center justify-center px-10 h-16 font-black uppercase text-xl transition-all ${isBrutal ? 'bg-[#E0FF4F] text-black border-[4px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] active:translate-y-1 active:shadow-none' : 'bg-black text-white rounded-xl hover:bg-gray-800'}`} 
          >
            CHECKOUT <ArrowRight className="w-6 h-6 ml-3" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
