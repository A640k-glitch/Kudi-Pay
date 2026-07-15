import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Building2, Hash, Loader2, Lock, Truck, ShieldCheck, Tag, Package, Plus, Minus, Trash2 } from 'lucide-react';
import { Business } from '../../lib/types';
import { useCartStore } from '../../lib/store';
import { formatNaira } from '../../lib/utils';
import { orderService } from '../../lib/services/orderService';
import { productService } from '../../lib/services/productService';
import { ledgerService } from '../../lib/services/ledgerService';
import { useToast } from '../../components/Toast';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara'
];

const localCheckoutSchema = z.object({
  email: z.string().email('Please enter a valid email address').or(z.literal('')),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().regex(/^(080|070|090|081|091|\+234)\d{8,9}$/, 'Please enter a valid Nigerian phone number'),
  address: z.string().min(5, 'Delivery address is required'),
  address2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(1, 'Please select a state'),
  note: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof localCheckoutSchema>;

const inputClsLight = 'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-base focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all text-[#191b23]';
const labelClsLight = 'block text-sm font-semibold font-display text-slate-600 mb-1.5';
const inputClsDark = 'w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-3 py-3 text-base focus:border-white focus:ring-2 focus:ring-white/20 outline-none transition-all text-white placeholder-gray-400';
const labelClsDark = 'block text-sm font-semibold font-display text-gray-200 mb-1.5';

export default function CheckoutPage() {
  const { business } = useOutletContext<{ business: Business }>();
  const navigate = useNavigate();
  const store = useCartStore();
  const items = Array.isArray(store.items) ? store.items : [];
  const { getTotal, clearCart, updateQuantity, removeItem } = store;
  const { addToast } = useToast();

  // Load products to verify stock limits
  const productsStr = localStorage.getItem('kudi_products');
  const products = productsStr ? JSON.parse(productsStr) : [];

  const getProductStockLimit = (productId: string): number => {
    const p = products.find((prod: any) => prod.id === productId);
    return p && p.stockCount !== undefined ? p.stockCount : 9999;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'ussd'>('card');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(localCheckoutSchema),
    defaultValues: (() => {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`kudi_checkout_fields_new_${business?.id}`);
        if (cached) {
          try { return JSON.parse(cached); } catch { /* ignore */ }
        }
      }
      return { email: '', firstName: '', lastName: '', phone: '', address: '', address2: '', city: '', state: 'Lagos', note: '' };
    })()
  });

  const watchedFields = watch();
  useEffect(() => {
    if (business?.id) {
      localStorage.setItem(`kudi_checkout_fields_new_${business.id}`, JSON.stringify(watchedFields));
    }
  }, [watchedFields, business?.id]);

  if (items.length === 0) {
    navigate(`/store/${business.storefrontSlug}`, { replace: true });
    return null;
  }

  const isDarkMode = business.theme === 'modern';
  const inputCls = isDarkMode ? inputClsDark : inputClsLight;
  const labelCls = isDarkMode ? labelClsDark : labelClsLight;

  const subtotal = getTotal();
  const deliveryFee = 2500;
  const taxes = 1000;
  const total = Math.max(0, subtotal + deliveryFee + taxes - discountAmount);

  const handleApplyDiscount = () => {
    if (discountCode.trim().toUpperCase() === 'KUDI10') {
      setDiscountAmount(Math.round(subtotal * 0.1));
      setAppliedDiscount('KUDI10');
      addToast('10% discount applied!', 'success');
    } else if (discountCode.trim().toUpperCase() === 'WELCOME') {
      setDiscountAmount(2000);
      setAppliedDiscount('WELCOME');
      addToast('₦2,000 discount applied!', 'success');
    } else {
      addToast('Invalid discount code', 'error');
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    try {
      const order = await orderService.createOrder({
        businessId: business.id,
        customerName: `${data.firstName} ${data.lastName}`,
        customerPhone: data.phone,
        items,
        totalAmount: total,
        paymentMethod,
      });

      try {
        await ledgerService.addEntry({
          businessId: business.id,
          type: 'revenue',
          amount: total,
          source: 'order_payment',
          verificationStatus: 'pending',
          verificationSource: 'order_payment',
          metadata: {
            description: `Storefront sale to ${data.firstName} ${data.lastName}`,
            email: data.email,
            deliveryAddress: `${data.address}${data.address2 ? ', ' + data.address2 : ''}, ${data.city}, ${data.state}`,
            discountApplied: appliedDiscount || undefined,
          },
        });
        for (const item of items) {
          const product = await productService.getProduct(item.productId);
          if (product && product.stockCount !== undefined) {
            await productService.updateProduct(item.productId, {
              stockCount: Math.max(0, product.stockCount - item.quantity),
            });
          }
        }
      } catch (e) {
        console.error('Ledger/Inventory update failed:', e);
      }

      clearCart();
      localStorage.removeItem(`kudi_checkout_fields_new_${business.id}`);
      navigate(`/store/${business.storefrontSlug}/confirmation/${order.id}`);
    } catch {
      addToast('Failed to process order. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const PaymentOption = ({ id, label, icon: Icon }: { id: 'card' | 'bank_transfer' | 'ussd'; label: string; icon: React.ElementType }) => (
    <button
      type="button"
      onClick={() => setPaymentMethod(id)}
      className={`flex-1 flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl border-2 transition-all text-sm font-semibold ${
        paymentMethod === id
          ? (isDarkMode ? 'border-white bg-white/10 text-white' : 'border-accent bg-accent/5 text-accent')
          : (isDarkMode ? 'border-[#3F3F46] text-gray-400 hover:border-gray-500 bg-[#27272A]' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white')
      }`}
    >
      <Icon className="w-5 h-5" strokeWidth={1.5} />
      {label}
    </button>
  );

  return (
    <div className={`${isDarkMode ? 'bg-[#0a0a0a] text-white selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)]' : 'bg-[#faf8ff] text-[#191b23] selection:bg-accent selection:text-white'} font-sans min-h-screen`}>
      <main className="w-full max-w-[1280px] mx-auto px-4 py-8 md:py-12 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* ── LEFT: Forms ─────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className={`text-4xl font-bold font-display tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-[#191b23]'}`}>Checkout</h1>
              <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Please enter your details to complete your order.</p>
            </div>

            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Delivery Details */}
              <section className={`${isDarkMode ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'} rounded-2xl border p-5 sm:p-6 shadow-sm`}>
                <h2 className={`text-lg font-semibold font-display mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#191b23]'}`}>
                  <Truck className={`w-4 h-4 ${isDarkMode ? 'text-gray-300' : 'text-accent'}`} />
                  Delivery Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Email Address <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input type="email" {...register('email')} className={inputCls} placeholder="you@example.com" />
                    {errors.email && <p className="text-xs mt-1 text-red-500">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>First Name</label>
                    <input type="text" {...register('firstName')} className={inputCls} placeholder="Jane" />
                    {errors.firstName && <p className="text-xs mt-1 text-red-500">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Last Name</label>
                    <input type="text" {...register('lastName')} className={inputCls} placeholder="Doe" />
                    {errors.lastName && <p className="text-xs mt-1 text-red-500">{errors.lastName.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Phone Number</label>
                    <input type="tel" {...register('phone')} className={inputCls} placeholder="e.g. 08012345678" />
                    {errors.phone && <p className="text-xs mt-1 text-red-500">{errors.phone.message}</p>}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className={labelCls}>Delivery Address</label>
                    <input type="text" {...register('address')} className={inputCls} placeholder="123 Main St" />
                    {errors.address && <p className="text-xs mt-1 text-red-500">{errors.address.message}</p>}
                    <input type="text" {...register('address2')} className={inputCls} placeholder="Apartment, suite, etc. (optional)" />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input type="text" {...register('city')} className={inputCls} placeholder="Lagos" />
                    {errors.city && <p className="text-xs mt-1 text-red-500">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <select {...register('state')} className={inputCls}>
                      <option value="">Select state</option>
                      {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <p className="text-xs mt-1 text-red-500">{errors.state.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Order Note <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <textarea {...register('note')} rows={2} className={`${inputCls} resize-none`} placeholder="Any special instructions for your order…" />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className={`${isDarkMode ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'} rounded-2xl border p-5 sm:p-6 shadow-sm`}>
                <h2 className={`text-lg font-semibold font-display mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#191b23]'}`}>
                  <CreditCard className={`w-4 h-4 ${isDarkMode ? 'text-gray-300' : 'text-accent'}`} strokeWidth={1.5} />
                  Payment Method
                </h2>
                <div className="flex gap-3 mb-5">
                  <PaymentOption id="card" label="Card" icon={CreditCard} />
                  <PaymentOption id="bank_transfer" label="Bank Transfer" icon={Building2} />
                  <PaymentOption id="ussd" label="USSD" icon={Hash} />
                </div>

                {paymentMethod === 'card' && (
                  <div className={`space-y-4 pt-4 border-t ${isDarkMode ? 'border-[#27272A]' : 'border-slate-100'}`}>
                    <div>
                      <label className={labelCls}>Card Number</label>
                      <input type="text" className={inputCls} placeholder="1234 5678 9012 3456" maxLength={19} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Expiry Date</label>
                        <input type="text" className={inputCls} placeholder="MM / YY" maxLength={7} />
                      </div>
                      <div>
                        <label className={labelCls}>CVV</label>
                        <input type="text" className={inputCls} placeholder="•••" maxLength={4} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Name on Card</label>
                      <input type="text" className={inputCls} placeholder="Jane Doe" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className={`p-4 rounded-xl border text-sm space-y-2 pt-4 border-t mt-4 ${isDarkMode ? 'bg-[#121212] border-[#27272A]' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>Transfer to:</p>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-slate-600'}><span className="font-bold">Bank:</span> First Bank Nigeria</p>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-slate-600'}><span className="font-bold">Account Number:</span> 3012345678</p>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-slate-600'}><span className="font-bold">Account Name:</span> {business.businessName}</p>
                    <p className={`text-[11px] mt-2 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Your order will be confirmed once payment is verified.</p>
                  </div>
                )}

                {paymentMethod === 'ussd' && (
                  <div className={`p-4 rounded-xl border text-sm space-y-2 pt-4 border-t mt-4 ${isDarkMode ? 'bg-[#121212] border-[#27272A]' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>Dial the code below on your phone:</p>
                    <p className={`text-2xl font-black tracking-widest text-center py-2 ${isDarkMode ? 'text-white' : 'text-accent'}`}>*894*000#</p>
                    <p className={`text-[11px] text-center ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Follow the prompts to complete payment.</p>
                  </div>
                )}
              </section>

              {/* Security badges */}
              <div className={`flex flex-wrap items-center justify-center gap-4 text-xs py-2 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> SSL Encrypted</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Secure Checkout</span>
                <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Kudi Business OS</span>
              </div>
            </form>
          </div>

          {/* ── RIGHT: Order Summary ─────────────────────────────────── */}
          <div className="lg:col-span-5 self-start sticky top-24">
            <div className={`${isDarkMode ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'} rounded-2xl border shadow-sm p-5 sm:p-6`}>
              <h2 className={`text-lg font-semibold font-display mb-6 ${isDarkMode ? 'text-white' : 'text-[#191b23]'}`}>
                Order Summary
                <span className={`ml-2 text-sm font-normal ${isDarkMode ? 'text-gray-400' : 'text-slate-400'}`}>({items.length} item{items.length !== 1 ? 's' : ''})</span>
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={item.productId} className={`flex gap-3 items-center py-2 border-b last:border-0 ${isDarkMode ? 'border-[#27272A]' : 'border-slate-100'}`}>
                    <div className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border ${isDarkMode ? 'bg-[#121212] border-[#27272A]' : 'bg-slate-50 border-slate-100'}`}>
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className={`w-5 h-5 ${isDarkMode ? 'text-gray-600' : 'text-slate-300'}`} strokeWidth={1.5} /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold line-clamp-1 ${isDarkMode ? 'text-white' : 'text-[#191b23]'}`}>{item.productName}</p>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{formatNaira(item.unitPrice)} each</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${isDarkMode ? 'border-[#3F3F46] text-gray-400 hover:bg-[#27272A]' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                        >
                          <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                        <span className={`text-sm font-bold w-6 text-center ${isDarkMode ? 'text-white' : 'text-[#191b23]'}`}>{item.quantity}</span>
                        <button
                          onClick={() => {
                            const maxVal = getProductStockLimit(item.productId);
                            if (item.quantity < maxVal) {
                              updateQuantity(item.productId, item.quantity + 1);
                            }
                          }}
                          disabled={item.quantity >= getProductStockLimit(item.productId)}
                          className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors disabled:opacity-30 ${isDarkMode ? 'border-[#3F3F46] text-gray-400 hover:bg-[#27272A]' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                        >
                          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className={`ml-1 p-1 transition-colors rounded ${isDarkMode ? 'text-red-400 hover:text-red-500 hover:bg-red-500/10' : 'text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600'}`}
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    <p className={`text-base font-bold shrink-0 ${isDarkMode ? 'text-white' : 'text-[#191b23]'}`}>{formatNaira(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Discount Code */}
              <div className="mb-5 flex gap-2">
                <div className="relative flex-1">
                  <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`} strokeWidth={1.5} />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                    disabled={!!appliedDiscount}
                    placeholder="Discount code"
                    className={`w-full pl-9 pr-3 py-3 rounded-lg text-base outline-none transition-all disabled:opacity-60 border ${isDarkMode ? 'bg-[#27272A] border-[#3F3F46] text-white focus:border-white focus:ring-2 focus:ring-white/20 placeholder-gray-400' : 'bg-slate-50 border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/10'}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={!!appliedDiscount || !discountCode.trim()}
                  className={`px-5 py-3 text-[var(--s-accent-text)] text-base font-semibold rounded-lg transition-colors ${isDarkMode ? 'bg-[var(--s-accent)] hover:bg-[var(--s-accent)]/90 disabled:bg-white/10 disabled:text-gray-400' : 'bg-[var(--s-accent)] hover:bg-[var(--s-accent)]/90 disabled:bg-slate-200 disabled:text-slate-400'}`}
                >
                  {appliedDiscount ? '✓ Applied' : 'Apply'}
                </button>
              </div>

              {/* Price Breakdown */}
              <div className={`space-y-3 pt-5 text-base border-t ${isDarkMode ? 'border-[#27272A]' : 'border-slate-100'}`}>
                <div className={`flex justify-between ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                  <span>Subtotal</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                <div className={`flex justify-between ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                  <span>Delivery Fee</span>
                  <span>{formatNaira(deliveryFee)}</span>
                </div>
                <div className={`flex justify-between ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                  <span>Tax</span>
                  <span>{formatNaira(taxes)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-500 font-medium">
                    <span>Discount ({appliedDiscount})</span>
                    <span>−{formatNaira(discountAmount)}</span>
                  </div>
                )}
                <div className={`flex justify-between font-bold text-lg pt-4 mt-2 border-t ${isDarkMode ? 'border-[#27272A] text-white' : 'border-slate-200 text-[#191b23]'}`}>
                  <span>Total</span>
                  <span>{formatNaira(total)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className={`mt-6 w-full flex items-center justify-center gap-2 h-14 font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed text-lg ${isDarkMode ? 'bg-[var(--s-accent)] text-[var(--s-accent-text)]' : 'bg-[#191b23] hover:bg-slate-800 text-white'}`}
              >
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  : <><Lock className="w-4 h-4" strokeWidth={2} /> Place Order · {formatNaira(total)}</>
                }
              </button>
              <p className={`text-center text-[11px] mt-3 flex items-center justify-center gap-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} /> Your payment info is 256-bit SSL encrypted
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
