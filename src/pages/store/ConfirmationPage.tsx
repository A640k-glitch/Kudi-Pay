import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Download, ArrowLeft } from 'lucide-react';
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

  if (isLoading) return <div className="min-h-screen p-10 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--store-primary)', borderTopColor: 'transparent' }}></div></div>;

  if (!order) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--store-text)' }}>Order not found</h1>
        <Link to={`/store/${business.storefrontSlug}`} className="hover:underline" style={{ color: 'var(--store-primary)' }}>Return to store</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto pb-24 flex flex-col items-center text-center mt-10">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="mb-6 w-24 h-24 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: 'var(--store-primary)' }}
      >
        <CheckCircle2 className="w-12 h-12" />
      </motion.div>

      <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--store-text)' }}>Order Successful!</h1>
      <p className="mb-8 max-w-sm text-lg leading-relaxed" style={{ color: 'var(--store-text-muted)' }}>
        We've notified <span className="font-semibold text-current">{business.businessName}</span>. They'll be in touch shortly.
      </p>

      <div className="w-full p-6 rounded-2xl mb-8 border" style={{ backgroundColor: 'var(--store-card)', borderColor: 'var(--store-border)' }}>
        <div className="text-sm font-medium mb-1" style={{ color: 'var(--store-text-muted)' }}>Order Reference</div>
        <div className="text-2xl font-bold tracking-wider mb-6" style={{ color: 'var(--store-text)' }}>#{order.id}</div>
        
        <div className="border-t pt-4 text-left" style={{ borderColor: 'var(--store-border)' }}>
          <div className="flex justify-between items-center text-lg font-bold" style={{ color: 'var(--store-text)' }}>
            <span>Amount Paid</span>
            <span>{formatNaira(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4">
        <button 
          onClick={() => setShowReceipt(true)}
          className="w-full h-14 rounded-xl font-bold transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--store-primary)', color: 'white' }}
        >
          View Receipt
        </button>
        <Link 
          to={`/store/${business.storefrontSlug}`}
          className="w-full h-14 rounded-xl font-bold transition-colors hover:bg-black/5 flex items-center justify-center"
          style={{ color: 'var(--store-text)' }}
        >
          Continue Shopping
        </Link>
      </div>

      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)}>
        <div className="py-4">
          <div id="receipt-container" className="bg-white border-2 border-gray-900 p-6 rounded-none mx-auto max-w-sm font-mono text-sm text-black">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold uppercase tracking-widest">{business.businessName}</h2>
              <p className="text-gray-500 text-xs mt-1">Receipt for Order #{order.id}</p>
              <p className="text-gray-500 text-xs">{format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>

            <div className="border-t border-b border-dashed border-gray-300 py-4 mb-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between mb-2">
                  <div>
                    <div>{item.productName}</div>
                    <div className="text-gray-500">{item.quantity} x {formatNaira(item.unitPrice)}</div>
                  </div>
                  <div>{formatNaira(item.unitPrice * item.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-base mb-6">
              <span>TOTAL PAID</span>
              <span>{formatNaira(order.totalAmount)}</span>
            </div>

            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>Customer: {order.customerName}</p>
              <p>Payment: {order.paymentMethod.replace('_', ' ').toUpperCase()}</p>
              <p className="mt-4 pt-4 border-t border-gray-200">Powered by Kudi</p>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button 
              className="flex-1 h-12 flex items-center justify-center rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200"
              onClick={() => {
                const el = document.getElementById('receipt-container');
                if (el) {
                  htmlToImage.toPng(el, { backgroundColor: '#ffffff' }).then(dataUrl => {
                    const link = document.createElement('a');
                    link.download = `Receipt-${order.id}.png`;
                    link.href = dataUrl;
                    link.click();
                  });
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" /> Download
            </button>
            <button 
              className="flex-1 h-12 rounded-xl font-bold text-white"
              style={{ backgroundColor: 'var(--store-primary)' }}
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
