import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Download, ArrowLeft, Receipt } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { format } from 'date-fns';
import { Business, Order } from '../../lib/types';
import { orderService } from '../../lib/services/orderService';
import { formatNaira } from '../../lib/utils';
import { Modal } from '../../components/Modal';

export default function ConfirmationPage() {
  const { business } = useOutletContext<{ business: Business }>();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    async function load() {
      if (orderId) {
        const o = await orderService.getOrder(orderId);
        setOrder(o);
      }
      setIsLoading(false);
    }
    load();
  }, [orderId]);

  const theme = business?.theme || 'light';
  const isBrutal = theme === 'brutal';
  const isDarkMode = theme === 'modern';
  const isLight = !isBrutal && !isDarkMode;

  if (isLoading) return (
    <div className="min-h-screen p-10 flex justify-center items-center">
      <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin border-black" />
    </div>
  );

  if (!order || !business) {
    return (
      <div className="p-10 text-center flex flex-col items-center">
        <h1 className={`text-3xl mb-6 font-bold font-display ${isDarkMode ? 'text-white' : 'text-primary'}`}>
          {business?.category === 'Services' ? 'Booking not found' : 'Order not found'}
        </h1>
        <Link to={`/store/${business?.storefrontSlug}`} className={`flex items-center gap-2 font-semibold transition-colors ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-accent hover:text-emerald-400'}`}>
          <ArrowLeft className="w-5 h-5" /> Return to {business?.category === 'Services' ? 'bookings' : 'store'}
        </Link>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 max-w-xl mx-auto pb-24 flex flex-col items-center text-center mt-10 ${isDarkMode ? 'selection:bg-[var(--s-accent)] selection:text-[var(--s-accent-text)]' : 'selection:bg-accent selection:text-white'}`}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className={`mb-8 w-28 h-28 flex items-center justify-center rounded-full shadow-sm border ${isDarkMode ? 'bg-[#18181B] text-[var(--s-accent)] border-[#27272A]' : 'bg-emerald-50 text-accent border-emerald-100'}`}
      >
        <CheckCircle2 className="w-14 h-14" strokeWidth={2} />
      </motion.div>

      <h1 className={`text-4xl md:text-5xl tracking-tighter mb-4 font-bold font-display ${isDarkMode ? 'text-white' : 'text-primary'}`}>
        {business.category === 'Services' ? 'Booking Successful!' : 'Order Successful!'}
      </h1>
      <p className={`mb-10 max-w-md text-lg md:text-xl leading-relaxed font-medium ${isDarkMode ? 'text-[#9CA3AF]' : 'text-slate-500'}`}>
        We've notified <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-primary'}`}>{business.businessName}</span>. They'll be in touch shortly.
      </p>

      <div className={`w-full p-8 mb-10 border rounded-[32px] shadow-sm ${isDarkMode ? 'bg-[#18181B] border-[#27272A]' : 'glass-panel bg-white border-slate-200/60'}`}>
        <div className={`text-sm tracking-widest mb-2 font-bold uppercase ${isDarkMode ? 'text-[#6B7280]' : 'text-slate-400'}`}>
          {business.category === 'Services' ? 'Booking Reference' : 'Order Reference'}
        </div>
        <div className={`text-3xl tracking-widest mb-8 font-mono font-bold ${isDarkMode ? 'text-white' : 'text-primary'}`}>#{order.id}</div>

        <div className={`pt-6 text-left border-t ${isDarkMode ? 'border-[#27272A]' : 'border-slate-200/60'}`}>
          <div className={`flex justify-between items-center text-xl font-semibold ${isDarkMode ? 'text-[#D1D5DB]' : 'text-primary'}`}>
            <span>Amount Paid</span>
            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatNaira(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setShowReceipt(true)}
          className={`flex-1 h-14 md:h-16 flex items-center justify-center transition-all font-semibold text-base md:text-lg rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 bg-[var(--s-accent)] text-[var(--s-accent-text)]`}
        >
          <Receipt className="w-5 h-5 mr-2" strokeWidth={2} /> View Receipt
        </button>
        <button 
          onClick={() => window.location.href = `/store/${business?.storefrontSlug}`}
          className={`flex-1 h-14 md:h-16 flex items-center justify-center transition-all ${isBrutal ? 'font-black uppercase text-base bg-[var(--s-accent)] text-[var(--s-accent-text)] border-[3px] border-white shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-none' : 'font-semibold text-base md:text-lg bg-[var(--s-accent)] text-[var(--s-accent-text)] rounded-[20px] hover:opacity-90 shadow-sm hover:-translate-y-0.5'}`}
        >
          Continue Shopping
        </button>
      </div>

      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)}>
        <div className="py-4">
          <div id="receipt-container" className="bg-white border border-slate-200 p-8 rounded-2xl mx-auto max-w-sm font-mono text-sm text-black shadow-md">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-slate-200 pb-4 inline-block">{business.businessName}</h2>
              <p className="font-bold text-xs mt-4 uppercase">Receipt for {business.category === 'Services' ? 'Booking' : 'Order'} #{order.id}</p>
              <p className="font-bold text-xs mt-1 uppercase text-gray-500">{format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-6 mb-6 space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between font-bold uppercase">
                  <div>
                    <div className="text-black">{item.productName}</div>
                    <div className="text-gray-500 text-xs mt-1">{item.quantity} x {formatNaira(item.unitPrice)}</div>
                  </div>
                  <div className="text-black">{formatNaira(item.unitPrice * item.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-lg mb-8 uppercase">
              <span>TOTAL PAID</span>
              <span>{formatNaira(order.totalAmount)}</span>
            </div>

            <div className="text-center font-bold text-xs text-gray-500 space-y-2 uppercase">
              <p>Customer: {order.customerName}</p>
              <p>Payment: {order.paymentMethod.replace('_', ' ')}</p>
              <div className="mt-8 pt-6 border-t border-slate-200 text-black">
                <span className="bg-slate-100 text-slate-800 px-2 py-1 font-bold inline-block -rotate-2 rounded">POWERED BY KUDI</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 px-4 sm:px-0">
            <button
              className="flex-1 h-14 flex items-center justify-center transition-all font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
              onClick={() => {
                const el = document.getElementById('receipt-container');
                if (!el) return;
                const clone = el.cloneNode(true) as HTMLElement;
                clone.style.position = 'fixed';
                clone.style.top = '-9999px';
                clone.style.left = '-9999px';
                clone.style.width = el.scrollWidth + 'px';
                clone.style.height = el.scrollHeight + 'px';
                clone.style.overflow = 'visible';
                document.body.appendChild(clone);
                htmlToImage
                  .toPng(clone, {
                    backgroundColor: '#ffffff',
                    pixelRatio: 2,
                    skipFonts: true,
                    width: el.scrollWidth,
                    height: el.scrollHeight,
                  })
                  .then(dataUrl => {
                    document.body.removeChild(clone);
                    const link = document.createElement('a');
                    link.download = `Receipt-${order.id}.png`;
                    link.href = dataUrl;
                    link.click();
                  })
                  .catch(() => document.body.removeChild(clone));
              }}
            >
              <Download className="w-5 h-5 mr-2" strokeWidth={2} /> Download
            </button>
            <button
              className="flex-1 h-14 transition-all font-semibold bg-primary text-white rounded-xl hover:bg-slate-800"
              onClick={() => setShowReceipt(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
