import React, { useState } from 'react';
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
import { useToast } from '../../components/Toast';

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { business } = useOutletContext<{ business: Business }>();
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'ussd'>('card');

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

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
      clearCart();
      navigate(`/store/${business.storefrontSlug}/confirmation/${order.id}`);
    } catch (err) {
      addToast('Failed to process order', 'error');
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-1 transition-colors`;
  const getInputStyle = (hasError: boolean) => ({
    backgroundColor: 'var(--store-bg)',
    color: 'var(--store-text)',
    borderColor: hasError ? '#ef4444' : 'var(--store-border)',
    outlineColor: 'var(--store-primary)',
  });

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-24">
      <Link to={`/store/${business.storefrontSlug}/cart`} className="inline-flex items-center text-sm font-medium mb-6 hover:opacity-80 transition-opacity" style={{ color: 'var(--store-text-muted)' }}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Cart
      </Link>
      
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="order-2 md:order-1">
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--store-text)' }}>Checkout</h1>
          
          <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--store-text)' }}>Customer Details</h2>
              <div className="space-y-4">
                <div>
                  <input
                    placeholder="Full Name"
                    {...register('customerName')}
                    className={inputClass}
                    style={getInputStyle(!!errors.customerName)}
                  />
                  {errors.customerName && <p className="text-sm text-red-500 mt-1">{errors.customerName.message}</p>}
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Phone Number (e.g. 08012345678)"
                    {...register('customerPhone')}
                    className={inputClass}
                    style={getInputStyle(!!errors.customerPhone)}
                  />
                  {errors.customerPhone && <p className="text-sm text-red-500 mt-1">{errors.customerPhone.message}</p>}
                </div>
                <div>
                  <textarea
                    placeholder="Delivery Note or Instructions (Optional)"
                    {...register('note')}
                    className={`${inputClass} py-3 min-h-[100px] resize-none`}
                    style={getInputStyle(!!errors.note)}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--store-text)' }}>Payment Method</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'card' ? 'ring-2' : ''}`}
                  style={{ 
                    borderColor: paymentMethod === 'card' ? 'var(--store-primary)' : 'var(--store-border)',
                    backgroundColor: 'var(--store-card)',
                    color: 'var(--store-text)'
                  }}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--store-bg)' }}>
                    <CreditCard className="w-5 h-5" style={{ color: 'var(--store-text)' }} />
                  </div>
                  <div className="flex-1 font-medium">Pay with Card</div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-transparent' : ''}`} style={{ borderColor: paymentMethod !== 'card' ? 'var(--store-border)' : undefined, backgroundColor: paymentMethod === 'card' ? 'var(--store-primary)' : 'transparent' }}>
                    {paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'bank_transfer' ? 'ring-2' : ''}`}
                  style={{ 
                    borderColor: paymentMethod === 'bank_transfer' ? 'var(--store-primary)' : 'var(--store-border)',
                    backgroundColor: 'var(--store-card)',
                    color: 'var(--store-text)'
                  }}
                  onClick={() => setPaymentMethod('bank_transfer')}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--store-bg)' }}>
                    <Building2 className="w-5 h-5" style={{ color: 'var(--store-text)' }} />
                  </div>
                  <div className="flex-1 font-medium">Bank Transfer</div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'bank_transfer' ? 'border-transparent' : ''}`} style={{ borderColor: paymentMethod !== 'bank_transfer' ? 'var(--store-border)' : undefined, backgroundColor: paymentMethod === 'bank_transfer' ? 'var(--store-primary)' : 'transparent' }}>
                    {paymentMethod === 'bank_transfer' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </label>
                
                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'ussd' ? 'ring-2' : ''}`}
                  style={{ 
                    borderColor: paymentMethod === 'ussd' ? 'var(--store-primary)' : 'var(--store-border)',
                    backgroundColor: 'var(--store-card)',
                    color: 'var(--store-text)'
                  }}
                  onClick={() => setPaymentMethod('ussd')}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--store-bg)' }}>
                    <Hash className="w-5 h-5" style={{ color: 'var(--store-text)' }} />
                  </div>
                  <div className="flex-1 font-medium">USSD</div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'ussd' ? 'border-transparent' : ''}`} style={{ borderColor: paymentMethod !== 'ussd' ? 'var(--store-border)' : undefined, backgroundColor: paymentMethod === 'ussd' ? 'var(--store-primary)' : 'transparent' }}>
                    {paymentMethod === 'ussd' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </label>
              </div>
            </section>
          </form>
        </div>

        <div className="order-1 md:order-2">
          <div className="p-6 rounded-2xl sticky top-24" style={{ backgroundColor: 'var(--store-card)', border: '1px solid var(--store-border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--store-text)' }}>Order Summary</h2>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between gap-4 text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium" style={{ color: 'var(--store-text-muted)' }}>{item.quantity}x</span>
                    <span className="line-clamp-1" style={{ color: 'var(--store-text)' }}>{item.productName}</span>
                  </div>
                  <span className="font-medium whitespace-nowrap" style={{ color: 'var(--store-text)' }}>{formatNaira(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4" style={{ borderColor: 'var(--store-border)' }}>
              <div className="flex justify-between items-center text-lg font-bold" style={{ color: 'var(--store-text)' }}>
                <span>Total</span>
                <span>{formatNaira(total)}</span>
              </div>
            </div>

            <button 
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full mt-6 h-14 flex items-center justify-center rounded-xl font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--store-primary)' }}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ${formatNaira(total)} Now`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
