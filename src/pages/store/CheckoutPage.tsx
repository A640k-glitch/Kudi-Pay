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
  const { items, getTotal, clearCart } = useCartStore();
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
          source: 'sale',
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
    <div className={`p-4 md:p-6 max-w-5xl mx-auto pb-24 ${isBrutal ? 'selection:bg-[#E0FF4F] selection:text-black' : 'selection:bg-black selection:text-white'}`}>
      <Link to={`/store/${business.storefrontSlug}`} className={`inline-flex items-center text-sm font-black uppercase mb-8 hover:-translate-x-1 transition-transform ${isBrutal ? 'text-white' : 'text-gray-500'}`}>
        <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={3} /> BACK TO STORE
      </Link>
      
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
        <div className="order-2 md:order-1">
          <h1 className={`text-4xl md:text-5xl font-black mb-8 uppercase tracking-tighter ${isBrutal ? 'text-white' : 'text-black'}`}>Checkout</h1>
          
          <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            <section>
              <h2 className={`text-xl font-black uppercase mb-6 ${isBrutal ? 'text-white border-b-[4px] border-white pb-2' : 'text-black border-b border-gray-200 pb-2'}`}>Customer Details</h2>
              <div className="space-y-6">
                <div>
                  <label className={`block font-black uppercase text-xs mb-2 ${isBrutal ? 'text-gray-300' : 'text-gray-600'}`}>Full Name</label>
                  <input
                    {...register('customerName')}
                    className={`w-full p-4 font-bold uppercase outline-none transition-colors ${isBrutal ? 'bg-black text-white border-[3px] border-white focus:bg-white focus:text-black placeholder-gray-600 shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'bg-gray-50 text-black border border-gray-200 focus:border-black rounded-xl placeholder-gray-400'}`}
                  />
                  {errors.customerName && <p className="text-xs font-bold text-red-500 mt-2 uppercase">{errors.customerName.message}</p>}
                </div>
                <div>
                  <label className={`block font-black uppercase text-xs mb-2 ${isBrutal ? 'text-gray-300' : 'text-gray-600'}`}>Phone Number</label>
                  <input
                    type="tel"
                    {...register('customerPhone')}
                    className={`w-full p-4 font-bold uppercase outline-none transition-colors ${isBrutal ? 'bg-black text-white border-[3px] border-white focus:bg-white focus:text-black placeholder-gray-600 shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'bg-gray-50 text-black border border-gray-200 focus:border-black rounded-xl placeholder-gray-400'}`}
                  />
                  {errors.customerPhone && <p className="text-xs font-bold text-red-500 mt-2 uppercase">{errors.customerPhone.message}</p>}
                </div>
                <div>
                  <label className={`block font-black uppercase text-xs mb-2 ${isBrutal ? 'text-gray-300' : 'text-gray-600'}`}>Delivery Note (Optional)</label>
                  <textarea
                    {...register('note')}
                    className={`w-full p-4 font-bold uppercase outline-none transition-colors min-h-[120px] resize-none ${isBrutal ? 'bg-black text-white border-[3px] border-white focus:bg-white focus:text-black placeholder-gray-600 shadow-[4px_4px_0px_rgba(255,255,255,1)]' : 'bg-gray-50 text-black border border-gray-200 focus:border-black rounded-xl placeholder-gray-400'}`}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className={`text-xl font-black uppercase mb-6 ${isBrutal ? 'text-white border-b-[4px] border-white pb-2' : 'text-black border-b border-gray-200 pb-2'}`}>Payment Method</h2>
              <div className="space-y-4">
                <label className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${isBrutal ? `border-[4px] border-white ${paymentMethod === 'card' ? 'bg-[#E0FF4F] text-black shadow-[6px_6px_0px_rgba(255,255,255,1)] -translate-y-1' : 'bg-black text-white hover:-translate-y-1 shadow-[4px_4px_0px_rgba(255,255,255,1)]'}` : `rounded-xl border ${paymentMethod === 'card' ? 'border-black ring-1 ring-black bg-gray-50' : 'border-gray-200'}`}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className={`w-12 h-12 flex items-center justify-center ${isBrutal ? 'border-[3px] border-black bg-white text-black' : 'bg-white rounded-lg border border-gray-200'}`}>
                    <CreditCard className="w-6 h-6" strokeWidth={isBrutal ? 2.5 : 2} />
                  </div>
                  <div className={`flex-1 font-black uppercase text-lg ${isBrutal ? '' : 'text-gray-900'}`}>Pay with Card</div>
                  {isBrutal ? (
                    <div className={`w-6 h-6 border-[3px] border-black flex items-center justify-center ${paymentMethod === 'card' ? 'bg-black' : 'bg-white'}`} />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-black' : 'border-gray-300'}`}>
                      {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                    </div>
                  )}
                </label>

                <label className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${isBrutal ? `border-[4px] border-white ${paymentMethod === 'bank_transfer' ? 'bg-[#E0FF4F] text-black shadow-[6px_6px_0px_rgba(255,255,255,1)] -translate-y-1' : 'bg-black text-white hover:-translate-y-1 shadow-[4px_4px_0px_rgba(255,255,255,1)]'}` : `rounded-xl border ${paymentMethod === 'bank_transfer' ? 'border-black ring-1 ring-black bg-gray-50' : 'border-gray-200'}`}`}
                  onClick={() => setPaymentMethod('bank_transfer')}
                >
                  <div className={`w-12 h-12 flex items-center justify-center ${isBrutal ? 'border-[3px] border-black bg-white text-black' : 'bg-white rounded-lg border border-gray-200'}`}>
                    <Building2 className="w-6 h-6" strokeWidth={isBrutal ? 2.5 : 2} />
                  </div>
                  <div className={`flex-1 font-black uppercase text-lg ${isBrutal ? '' : 'text-gray-900'}`}>Bank Transfer</div>
                  {isBrutal ? (
                    <div className={`w-6 h-6 border-[3px] border-black flex items-center justify-center ${paymentMethod === 'bank_transfer' ? 'bg-black' : 'bg-white'}`} />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'bank_transfer' ? 'border-black' : 'border-gray-300'}`}>
                      {paymentMethod === 'bank_transfer' && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                    </div>
                  )}
                </label>

                <label className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${isBrutal ? `border-[4px] border-white ${paymentMethod === 'ussd' ? 'bg-[#E0FF4F] text-black shadow-[6px_6px_0px_rgba(255,255,255,1)] -translate-y-1' : 'bg-black text-white hover:-translate-y-1 shadow-[4px_4px_0px_rgba(255,255,255,1)]'}` : `rounded-xl border ${paymentMethod === 'ussd' ? 'border-black ring-1 ring-black bg-gray-50' : 'border-gray-200'}`}`}
                  onClick={() => setPaymentMethod('ussd')}
                >
                  <div className={`w-12 h-12 flex items-center justify-center ${isBrutal ? 'border-[3px] border-black bg-white text-black' : 'bg-white rounded-lg border border-gray-200'}`}>
                    <Hash className="w-6 h-6" strokeWidth={isBrutal ? 2.5 : 2} />
                  </div>
                  <div className={`flex-1 font-black uppercase text-lg ${isBrutal ? '' : 'text-gray-900'}`}>USSD</div>
                  {isBrutal ? (
                    <div className={`w-6 h-6 border-[3px] border-black flex items-center justify-center ${paymentMethod === 'ussd' ? 'bg-black' : 'bg-white'}`} />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'ussd' ? 'border-black' : 'border-gray-300'}`}>
                      {paymentMethod === 'ussd' && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                    </div>
                  )}
                </label>
              </div>
            </section>
          </form>
        </div>

        <div className="order-1 md:order-2">
          <div className={`p-6 md:p-8 sticky top-32 ${isBrutal ? 'bg-black border-[4px] border-white shadow-[8px_8px_0px_rgba(255,255,255,1)]' : 'bg-gray-50 border border-gray-200 rounded-3xl'}`}>
            <h2 className={`text-xl font-black uppercase mb-6 ${isBrutal ? 'text-white border-b-[4px] border-white pb-2' : 'text-black border-b border-gray-200 pb-2'}`}>Order Summary</h2>
            <div className="space-y-6 mb-8 max-h-80 overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between gap-4">
                  <div className="flex gap-4">
                    <span className={`font-black text-lg ${isBrutal ? 'text-[#E0FF4F]' : 'text-gray-500'}`}>{item.quantity}X</span>
                    <span className={`font-bold uppercase text-lg line-clamp-2 ${isBrutal ? 'text-white' : 'text-gray-900'}`}>{item.productName}</span>
                  </div>
                  <span className={`font-black text-lg whitespace-nowrap ${isBrutal ? 'text-white' : 'text-black'}`}>{formatNaira(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className={`pt-6 ${isBrutal ? 'border-t-[4px] border-white' : 'border-t border-gray-200'}`}>
              <div className={`flex justify-between items-center text-2xl font-black uppercase ${isBrutal ? 'text-white' : 'text-black'}`}>
                <span>Total</span>
                <span className={isBrutal ? 'text-[#E0FF4F]' : ''}>{formatNaira(total)}</span>
              </div>
            </div>

            <button 
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className={`w-full mt-8 h-16 flex items-center justify-center font-black uppercase text-xl transition-all disabled:opacity-50 ${isBrutal ? 'bg-[#E0FF4F] text-black border-[4px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] active:translate-y-1 active:shadow-none' : 'bg-black text-white rounded-xl hover:bg-gray-800'}`}
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={3} /> : `PAY ${formatNaira(total)} NOW`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
