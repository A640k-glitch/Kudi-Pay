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

  const theme = business?.theme || 'modern';
  const isBrutal = theme === 'brutal';

  if (isLoading) return (
    <div className="min-h-screen p-10 flex justify-center items-center">
      <div className={`w-12 h-12 rounded-full border-4 border-t-transparent animate-spin ${isBrutal ? 'border-white' : 'border-black'}`} />
    </div>
  );

  if (!order || !business) {
    return (
      <div className="p-10 text-center flex flex-col items-center">
        <h1 className={`text-3xl font-black mb-6 uppercase ${isBrutal ? 'text-white' : 'text-black'}`}>Order not found</h1>
        <Link to={`/store/${business?.storefrontSlug}`} className={`font-bold uppercase flex items-center gap-2 ${isBrutal ? 'text-[#E0FF4F] hover:text-white' : 'text-gray-500 hover:text-black'}`}>
          <ArrowLeft className="w-5 h-5" /> Return to store
        </Link>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 max-w-xl mx-auto pb-24 flex flex-col items-center text-center mt-10 ${isBrutal ? 'selection:bg-[#E0FF4F] selection:text-black' : 'selection:bg-black selection:text-white'}`}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className={`mb-8 w-28 h-28 flex items-center justify-center ${isBrutal ? 'bg-[#E0FF4F] text-black border-[4px] border-white shadow-[8px_8px_0px_rgba(255,255,255,1)]' : 'bg-black text-white rounded-full shadow-xl'}`}
      >
        <CheckCircle2 className="w-14 h-14" strokeWidth={isBrutal ? 3 : 2} />
      </motion.div>

      <h1 className={`text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter ${isBrutal ? 'text-white drop-shadow-[2px_2px_0px_rgba(224,255,79,1)]' : 'text-black'}`}>Order Successful!</h1>
      <p className={`mb-10 max-w-md text-lg md:text-xl font-bold uppercase leading-relaxed ${isBrutal ? 'text-gray-300' : 'text-gray-500'}`}>
        We've notified <span className={isBrutal ? 'text-[#E0FF4F]' : 'text-black'}>{business.businessName}</span>. They'll be in touch shortly.
      </p>

      <div className={`w-full p-8 mb-10 ${isBrutal ? 'bg-black border-[4px] border-white shadow-[8px_8px_0px_rgba(255,255,255,1)]' : 'bg-gray-50 rounded-2xl border border-gray-200'}`}>
        <div className={`text-sm font-black uppercase tracking-widest mb-2 ${isBrutal ? 'text-gray-400' : 'text-gray-500'}`}>Order Reference</div>
        <div className={`text-3xl font-black tracking-widest mb-8 ${isBrutal ? 'text-white' : 'text-black'}`}>#{order.id}</div>
        
        <div className={`pt-6 text-left ${isBrutal ? 'border-t-[4px] border-white' : 'border-t border-gray-200'}`}>
          <div className={`flex justify-between items-center text-xl font-black uppercase ${isBrutal ? 'text-white' : 'text-black'}`}>
            <span>Amount Paid</span>
            <span className={isBrutal ? 'text-[#E0FF4F]' : ''}>{formatNaira(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => setShowReceipt(true)}
          className={`flex-1 h-16 flex items-center justify-center font-black uppercase text-lg transition-all ${isBrutal ? 'bg-[#E0FF4F] text-black border-[4px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] active:translate-y-1 active:shadow-none' : 'bg-black text-white rounded-xl hover:bg-gray-800'}`}
        >
          <Receipt className="w-5 h-5 mr-2" strokeWidth={isBrutal ? 3 : 2} /> View Receipt
        </button>
        <Link 
          to={`/store/${business.storefrontSlug}`}
          className={`flex-1 h-16 flex items-center justify-center font-black uppercase text-lg transition-all ${isBrutal ? 'bg-black text-white border-[4px] border-white shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(255,255,255,1)] hover:bg-white hover:text-black active:translate-y-1 active:shadow-none' : 'bg-white text-black border border-gray-200 rounded-xl hover:bg-gray-50'}`}
        >
          Continue Shopping
        </Link>
      </div>

      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)}>
        <div className="py-4">
          <div id="receipt-container" className="bg-white border-[4px] border-black p-8 rounded-none mx-auto max-w-sm font-mono text-sm text-black shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-widest border-b-[2px] border-black pb-4 inline-block">{business.businessName}</h2>
              <p className="font-bold text-xs mt-4 uppercase">Receipt for Order #{order.id}</p>
              <p className="font-bold text-xs mt-1 uppercase text-gray-500">{format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>

            <div className="border-t-[2px] border-b-[2px] border-dashed border-black py-6 mb-6 space-y-4">
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

            <div className="flex justify-between font-black text-lg mb-8 uppercase">
              <span>TOTAL PAID</span>
              <span>{formatNaira(order.totalAmount)}</span>
            </div>

            <div className="text-center font-bold text-xs text-gray-500 space-y-2 uppercase">
              <p>Customer: {order.customerName}</p>
              <p>Payment: {order.paymentMethod.replace('_', ' ')}</p>
              <div className="mt-8 pt-6 border-t-[2px] border-black text-black">
                <span className="bg-black text-white px-2 py-1 font-black inline-block -rotate-2 shadow-[2px_2px_0px_rgba(200,200,200,1)]">POWERED BY KUDI</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 px-4 sm:px-0">
            <button 
              className={`flex-1 h-14 flex items-center justify-center font-black uppercase transition-all ${isBrutal ? 'bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1' : 'bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200'}`}
              onClick={() => {
                const el = document.getElementById('receipt-container');
                if (el) {
                  htmlToImage.toPng(el, { backgroundColor: '#ffffff', pixelRatio: 2 }).then(dataUrl => {
                    const link = document.createElement('a');
                    link.download = `Receipt-${order.id}.png`;
                    link.href = dataUrl;
                    link.click();
                  });
                }
              }}
            >
              <Download className="w-5 h-5 mr-2" strokeWidth={3} /> Download
            </button>
            <button 
              className={`flex-1 h-14 font-black uppercase transition-all ${isBrutal ? 'bg-black text-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:bg-[#E0FF4F] hover:text-black' : 'bg-black text-white rounded-xl hover:bg-gray-800'}`}
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
