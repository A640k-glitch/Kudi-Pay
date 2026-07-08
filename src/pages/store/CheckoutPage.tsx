import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Building2, Hash, ArrowLeft, Loader2 } from 'lucide-react';
import { Business } from '../../lib/types';
import { useCartStore } from '../../lib/store';
import { formatNaira } from '../../lib/utils';
import { checkoutSchema } from '../../lib/validation/schemas';
import { orderService } from '../../lib/services/orderService';
import { productService } from '../../lib/services/productService';
import { ledgerService } from '../../lib/services/ledgerService';
import { useToast } from '../../components/Toast';

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { business } = useOutletContext<{ business: Business }>();
  const navigate = useNavigate();
  const store = useCartStore();
  const items = Array.isArray(store.items) ? store.items : [];
  const { getTotal, clearCart } = store;
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'ussd'>('card');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: (() => {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`kudi_checkout_fields_${business.id}`);
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            console.error('Failed to parse cached checkout fields', e);
          }
        }
      }
      return { customerName: '', customerPhone: '', note: '' };
    })()
  });

  const watchedFields = watch();
  
  useEffect(() => {
    if (business?.id && (watchedFields.customerName || watchedFields.customerPhone || watchedFields.note)) {
      localStorage.setItem(
        `kudi_checkout_fields_${business.id}`,
        JSON.stringify({
          customerName: watchedFields.customerName || '',
          customerPhone: watchedFields.customerPhone || '',
          note: watchedFields.note || ''
        })
      );
    }
  }, [watchedFields.customerName, watchedFields.customerPhone, watchedFields.note, business?.id]);

  if (items.length === 0) {
    navigate(`/store/${business.storefrontSlug}/cart`, { replace: true });
    return null;
  }

  const total = getTotal();

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    try {
      const orderData = {
        businessId: business.id,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        items: items,
        totalAmount: total,
        paymentMethod: paymentMethod,
      };

      const order = await orderService.createOrder(orderData);
      
      try {
        await ledgerService.addEntry({
          businessId: business.id,
          type: 'revenue',
          amount: total,
          source: 'order_payment',
          verificationStatus: 'pending',
          verificationSource: 'order_payment',
          metadata: { description: `Storefront sale to ${data.customerName}` }
        });

        for (const item of items) {
          const product = await productService.getProduct(item.productId);
          if (product && product.stockCount !== undefined) {
            await productService.updateProduct(item.productId, {
              stockCount: Math.max(0, product.stockCount - item.quantity)
            });
          }
        }
      } catch (e) {
        console.error("Ledger/Inventory update failed: ", e);
      }

      clearCart();
      localStorage.removeItem(`kudi_checkout_fields_${business.id}`);
      navigate(`/store/${business.storefrontSlug}/confirmation/${order.id}`);
    } catch (err) {
      addToast('Failed to process order', 'error');
      setIsSubmitting(false);
    }
  };

  const theme = business.theme || 'modern';
  const isBrutal = theme === 'brutal';

  return (
    <div className={`p-4 md:p-6 max-w-5xl mx-auto pb-24 ${isBrutal ? 'selection:bg-[#E0FF4F] selection:text-black' : 'selection:bg-accent selection:text-white'}`}>
      <Link to={`/store/${business.storefrontSlug}`} className={`inline-flex items-center text-sm font-black uppercase mb-8 hover:-translate-x-1 transition-transform ${isBrutal ? 'text-white' : 'text-slate-500 hover:text-primary'}`}>
        <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={3} /> BACK TO STORE
      </Link>
      
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
        <div className="order-2 md:order-1">
          <h1 className={`text-4xl md:text-5xl tracking-tighter ${isBrutal ? 'font-black uppercase mb-8 text-white' : 'font-display font-bold mb-8 text-primary'}`}>Checkout</h1>
          
          <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            <section>
              <h2 className={`text-lg sm:text-xl mb-4 sm:mb-6 ${isBrutal ? 'font-black uppercase text-white border-b-[3px] border-white pb-2' : 'font-display font-semibold text-primary border-b border-slate-200 pb-2'}`}>Customer Details</h2>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className={`block mb-1.5 sm:mb-2 ${isBrutal ? 'font-black uppercase text-[10px] sm:text-xs text-gray-300' : 'font-semibold text-xs sm:text-sm text-slate-700'}`}>Full Name</label>
                  <input
                    {...register('customerName')}
                    className={`w-full p-3 transition-colors text-sm sm:text-base ${isBrutal ? 'font-bold uppercase outline-none bg-black text-white border-[2px] border-white focus:bg-white focus:text-black placeholder-gray-600 shadow-[3px_3px_0px_rgba(255,255,255,1)]' : 'bg-slate-50 text-slate-900 border border-slate-200 focus:border-accent focus:ring-1 focus:ring-accent rounded-lg placeholder-slate-400'}`}
                  />
                  {errors.customerName && <p className={`text-[10px] sm:text-xs mt-1.5 ${isBrutal ? 'font-bold text-red-500 uppercase' : 'font-medium text-amber-500'}`}>{errors.customerName.message}</p>}
                </div>
                <div>
                  <label className={`block mb-1.5 sm:mb-2 ${isBrutal ? 'font-black uppercase text-[10px] sm:text-xs text-gray-300' : 'font-semibold text-xs sm:text-sm text-slate-700'}`}>Phone Number</label>
                  <input
                    type="tel"
                    {...register('customerPhone')}
                    className={`w-full p-3 transition-colors text-sm sm:text-base ${isBrutal ? 'font-bold uppercase outline-none bg-black text-white border-[2px] border-white focus:bg-white focus:text-black placeholder-gray-600 shadow-[3px_3px_0px_rgba(255,255,255,1)]' : 'bg-slate-50 text-slate-900 border border-slate-200 focus:border-accent focus:ring-1 focus:ring-accent rounded-lg placeholder-slate-400'}`}
                  />
                  {errors.customerPhone && <p className={`text-[10px] sm:text-xs mt-1.5 ${isBrutal ? 'font-bold text-red-500 uppercase' : 'font-medium text-amber-500'}`}>{errors.customerPhone.message}</p>}
                </div>
                <div>
                  <label className={`block mb-1.5 sm:mb-2 ${isBrutal ? 'font-black uppercase text-[10px] sm:text-xs text-gray-300' : 'font-semibold text-xs sm:text-sm text-slate-700'}`}>Delivery Note (Optional)</label>
                  <textarea
                    {...register('note')}
                    className={`w-full p-3 transition-colors min-h-[100px] text-sm sm:text-base resize-none ${isBrutal ? 'font-bold uppercase outline-none bg-black text-white border-[2px] border-white focus:bg-white focus:text-black placeholder-gray-600 shadow-[3px_3px_0px_rgba(255,255,255,1)]' : 'bg-slate-50 text-slate-900 border border-slate-200 focus:border-accent focus:ring-1 focus:ring-accent rounded-lg placeholder-slate-400'}`}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className={`text-lg sm:text-xl mb-4 sm:mb-6 ${isBrutal ? 'font-black uppercase text-white border-b-[3px] border-white pb-2' : 'font-display font-semibold text-primary border-b border-slate-200 pb-2'}`}>Payment Method</h2>
              <div className="space-y-3 sm:space-y-4">
                <label className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer transition-all ${isBrutal ? `border-[3px] border-white ${paymentMethod === 'card' ? 'bg-[var(--s-accent)] text-[var(--s-accent-text)] shadow-[4px_4px_0px_rgba(255,255,255,1)] -translate-y-1' : 'bg-black text-white hover:-translate-y-1 shadow-[3px_3px_0px_rgba(255,255,255,1)]'}` : `rounded-2xl border ${paymentMethod === 'card' ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-slate-200 bg-white hover:border-slate-300'}`}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className={`w-10 h-10 flex items-center justify-center ${isBrutal ? 'border-[2px] border-black bg-white text-black' : `rounded-xl border ${paymentMethod === 'card' ? 'bg-white text-accent border-accent/20' : 'bg-slate-50 border-slate-200 text-slate-500'}`}`}>
                    <CreditCard className="w-5 h-5" strokeWidth={isBrutal ? 2 : 1.5} />
                  </div>
                  <div className={`flex-1 text-sm sm:text-base ${isBrutal ? 'font-black uppercase' : 'font-semibold text-primary'}`}>Pay with Card</div>
                  {isBrutal ? (
                    <div className={`w-5 h-5 border-[2px] border-black flex items-center justify-center ${paymentMethod === 'card' ? 'bg-black' : 'bg-white'}`} />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'card' ? 'border-accent' : 'border-slate-300'}`}>
                      {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                    </div>
                  )}
                </label>

                <label className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer transition-all ${isBrutal ? `border-[3px] border-white ${paymentMethod === 'bank_transfer' ? 'bg-[var(--s-accent)] text-[var(--s-accent-text)] shadow-[4px_4px_0px_rgba(255,255,255,1)] -translate-y-1' : 'bg-black text-white hover:-translate-y-1 shadow-[3px_3px_0px_rgba(255,255,255,1)]'}` : `rounded-2xl border ${paymentMethod === 'bank_transfer' ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-slate-200 bg-white hover:border-slate-300'}`}`}
                  onClick={() => setPaymentMethod('bank_transfer')}
                >
                  <div className={`w-10 h-10 flex items-center justify-center ${isBrutal ? 'border-[2px] border-black bg-white text-black' : `rounded-xl border ${paymentMethod === 'bank_transfer' ? 'bg-white text-accent border-accent/20' : 'bg-slate-50 border-slate-200 text-slate-500'}`}`}>
                    <Building2 className="w-5 h-5" strokeWidth={isBrutal ? 2 : 1.5} />
                  </div>
                  <div className={`flex-1 text-sm sm:text-base ${isBrutal ? 'font-black uppercase' : 'font-semibold text-primary'}`}>Bank Transfer</div>
                  {isBrutal ? (
                    <div className={`w-5 h-5 border-[2px] border-black flex items-center justify-center ${paymentMethod === 'bank_transfer' ? 'bg-black' : 'bg-white'}`} />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'bank_transfer' ? 'border-accent' : 'border-slate-300'}`}>
                      {paymentMethod === 'bank_transfer' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                    </div>
                  )}
                </label>

                <label className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer transition-all ${isBrutal ? `border-[3px] border-white ${paymentMethod === 'ussd' ? 'bg-[var(--s-accent)] text-[var(--s-accent-text)] shadow-[4px_4px_0px_rgba(255,255,255,1)] -translate-y-1' : 'bg-black text-white hover:-translate-y-1 shadow-[3px_3px_0px_rgba(255,255,255,1)]'}` : `rounded-2xl border ${paymentMethod === 'ussd' ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-slate-200 bg-white hover:border-slate-300'}`}`}
                  onClick={() => setPaymentMethod('ussd')}
                >
                  <div className={`w-10 h-10 flex items-center justify-center ${isBrutal ? 'border-[2px] border-black bg-white text-black' : `rounded-xl border ${paymentMethod === 'ussd' ? 'bg-white text-accent border-accent/20' : 'bg-slate-50 border-slate-200 text-slate-500'}`}`}>
                    <Hash className="w-5 h-5" strokeWidth={isBrutal ? 2 : 1.5} />
                  </div>
                  <div className={`flex-1 text-sm sm:text-base ${isBrutal ? 'font-black uppercase' : 'font-semibold text-primary'}`}>USSD</div>
                  {isBrutal ? (
                    <div className={`w-5 h-5 border-[2px] border-black flex items-center justify-center ${paymentMethod === 'ussd' ? 'bg-black' : 'bg-white'}`} />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'ussd' ? 'border-accent' : 'border-slate-300'}`}>
                      {paymentMethod === 'ussd' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                    </div>
                  )}
                </label>
              </div>
            </section>
          </form>
        </div>

        <div className="order-1 md:order-2 z-20 sticky top-20 md:top-24 max-h-[40vh] md:max-h-none overflow-visible">
          <div className={`p-4 md:p-6 ${isBrutal ? 'bg-black border-[3px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)]' : 'glass-panel bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-[24px] shadow-sm'}`}>
            <h2 className={`text-lg md:text-xl mb-3 md:mb-5 ${isBrutal ? 'font-black uppercase text-white border-b-[3px] border-white pb-2' : 'font-display font-semibold text-primary border-b border-slate-200/60 pb-2'}`}>Order Summary</h2>
            <div className="space-y-3 md:space-y-4 mb-4 md:mb-6 max-h-[15vh] md:max-h-60 overflow-y-auto pr-2 scrollbar-thin">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between gap-3 text-sm md:text-base">
                  <div className="flex gap-3">
                    <span className={`font-black ${isBrutal ? 'text-[var(--s-accent)]' : 'text-accent'}`}>{item.quantity}×</span>
                    <span className={`line-clamp-2 ${isBrutal ? 'font-bold uppercase text-white' : 'font-medium text-slate-700'}`}>{item.productName}</span>
                  </div>
                  <span className={`font-bold whitespace-nowrap ${isBrutal ? 'text-white' : 'text-primary'}`}>{formatNaira(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className={`pt-4 md:pt-5 ${isBrutal ? 'border-t-[3px] border-white' : 'border-t border-slate-200/60'}`}>
              <div className={`flex justify-between items-center text-lg md:text-xl ${isBrutal ? 'font-black uppercase text-white' : 'font-display font-bold text-primary'}`}>
                <span>Total</span>
                <span className={isBrutal ? 'text-[var(--s-accent)]' : 'text-slate-900'}>{formatNaira(total)}</span>
              </div>
            </div>

            <button 
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className={`w-full mt-4 md:mt-6 h-12 md:h-14 flex items-center justify-center transition-all disabled:opacity-50 ${isBrutal ? 'font-black uppercase text-sm sm:text-base bg-[var(--s-accent)] text-[var(--s-accent-text)] border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-none' : 'font-semibold text-sm sm:text-base bg-accent text-white rounded-[16px] shadow-sm hover:bg-emerald-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'}`}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={isBrutal ? 2.5 : 2} /> : (isBrutal ? `PAY ${formatNaira(total)} NOW` : `Pay ${formatNaira(total)}`)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
