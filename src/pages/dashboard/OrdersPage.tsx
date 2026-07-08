import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { PackageOpen } from 'lucide-react';
import { Download, Phone, WhatsappLogo } from '@phosphor-icons/react';
import * as htmlToImage from 'html-to-image';
import { Order, Business } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { orderService } from '../../lib/services/orderService';
import { Modal } from '../../components/Modal';
import { formatNaira } from '../../lib/utils';
import { useToast } from '../../components/Toast';

const STATUS_FILTERS = ['All', 'New', 'Paid', 'Fulfilled', 'Cancelled'] as const;
type FilterStatus = typeof STATUS_FILTERS[number];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setIsLoading(true);
    const phone = authService.getCurrentPhone();
    if (!phone) return;
    const b = await businessService.getBusinessByPhone(phone);
    if (b) {
      setBusiness(b);
      const o = await orderService.getOrders(b.id);
      setOrders(o);
    }
    setIsLoading(false);
  }

  const updateStatus = async (id: string, newStatus: Order['status']) => {
    try {
      const updated = await orderService.updateOrderStatus(id, newStatus);
      if (updated) {
        setOrders(prev => prev.map(o => o.id === id ? updated : o));
        if (selectedOrder?.id === id) {
          setSelectedOrder(updated);
        }
        addToast(`Order marked as ${newStatus}`, 'success');
      }
    } catch (e) {
      addToast('Failed to update status', 'error');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'All') return true;
    return o.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-10 selection:bg-[#E0FF4F] selection:text-slate-900">
      <header className="mb-6 md:mb-8 border-b-2 border-slate-200 pb-4">
        <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 mb-1">Orders</h1>
        <p className="text-sm md:text-base font-bold text-slate-500">Track and manage customer purchases.</p>
      </header>

      {/* Filters */}
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {STATUS_FILTERS.map(f => {
          const count = f === 'All' ? orders.length : orders.filter(o => o.status.toLowerCase() === f.toLowerCase()).length;
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border-2
                ${isActive 
                  ? 'bg-slate-900 text-[#E0FF4F] border-slate-900 shadow-[4px_4px_0px_#0f172a]' 
                  : 'bg-white text-slate-600 border-slate-900 hover:shadow-[4px_4px_0px_#0f172a] hover:-translate-y-[2px] hover:-translate-x-[2px]'
                }
              `}
            >
              {f}
              <span className={`px-2 py-0.5 text-xs font-black rounded-full border-2 border-slate-900
                ${isActive ? 'bg-[#E0FF4F] text-slate-900' : 'bg-slate-100 text-slate-500'}
              `}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-[24px]"></div>)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-panel p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-slate-100 border-2 border-slate-900 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0px_#0f172a]">
            <PackageOpen className="w-10 h-10 text-slate-900" strokeWidth={2} />
          </div>
          <h3 className="text-2xl font-display font-black text-slate-900 mb-2">{filter === 'All' ? "No orders yet" : `No ${filter} orders`}</h3>
          <p className="text-sm font-bold text-slate-500 max-w-sm">When customers buy from your store, their orders will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className="glass-panel p-4 md:p-6 cursor-pointer hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg font-black text-slate-900">{order.customerName}</span>
                  <span className="text-xs font-bold bg-slate-100 border-2 border-slate-900 text-slate-900 px-2 py-1 rounded-[8px]">#{order.id.slice(0,8)}</span>
                </div>
                <div className="text-sm font-bold text-slate-500">
                  {order.items.length} item(s) • {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:min-w-[200px]">
                <div className="text-xl font-black text-slate-900">{formatNaira(order.totalAmount)}</div>
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder && !showReceipt} onClose={() => setSelectedOrder(null)} isDrawer title={`Order #${selectedOrder?.id.slice(0,8)}`}>
        {selectedOrder && (
          <div className="flex flex-col h-full bg-slate-50">
            <div className="flex-1 pb-24 p-4 md:p-6 space-y-6">
              
              {/* Status Stepper */}
              <div className="glass-panel p-5">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-1/2 left-0 right-0 h-1 border-b-2 border-dashed border-slate-300 -z-10 -translate-y-1/2"></div>
                  {['new', 'paid', 'fulfilled'].map((step, idx) => {
                    const statusOrder = ['new', 'paid', 'fulfilled'];
                    const currentIdx = statusOrder.indexOf(selectedOrder.status);
                    const isCompleted = statusOrder.indexOf(step) <= currentIdx;
                    const isCancelled = selectedOrder.status === 'cancelled';
                    return (
                      <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className={`w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-sm font-black transition-colors
                          ${isCancelled ? 'bg-slate-100 text-slate-400' : isCompleted ? 'bg-[#E0FF4F] text-slate-900 shadow-[2px_2px_0px_#0f172a]' : 'bg-slate-100 text-slate-400'}
                        `}>
                          {idx + 1}
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-black ${isCompleted && !isCancelled ? 'text-slate-900' : 'text-slate-400'}`}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Info */}
              <div className="glass-panel p-5">
                <div className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Customer</div>
                <div className="font-display font-black text-xl mb-1 text-slate-900">{selectedOrder.customerName}</div>
                <div className="font-bold text-slate-600 mb-5">{selectedOrder.customerPhone}</div>
                <div className="flex gap-3">
                  <a href={`tel:${selectedOrder.customerPhone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-900 text-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[12px] font-bold text-sm transition-all hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none">
                    <Phone weight="bold" className="w-5 h-5" /> Call
                  </a>
                  <a href={`https://wa.me/${selectedOrder.customerPhone.replace('+','')}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#10B981] border-2 border-slate-900 text-white shadow-[4px_4px_0px_#0f172a] rounded-[12px] font-bold text-sm transition-all hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none">
                    <WhatsappLogo weight="fill" className="w-5 h-5" /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Items */}
              <div className="glass-panel p-5">
                <h4 className="font-display font-black text-slate-900 text-lg mb-4 border-b-2 border-slate-100 pb-3">Items</h4>
                <div className="flex flex-col gap-4">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-[8px] bg-[#E0FF4F] border-2 border-slate-900 text-slate-900 flex items-center justify-center text-sm font-black shadow-[2px_2px_0px_#0f172a]">
                          {item.quantity}x
                        </div>
                        <span className="font-bold text-slate-900">{item.productName}</span>
                      </div>
                      <span className="font-black text-slate-900">{formatNaira(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t-2 border-slate-100 mt-5 pt-4 flex justify-between items-center font-display font-black text-xl text-slate-900">
                  <span>Total</span>
                  <span>{formatNaira(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center font-bold text-sm bg-white rounded-[16px] border-2 border-slate-900 p-4 shadow-[4px_4px_0px_#0f172a] text-slate-900">
                <span>Payment Method</span>
                <span className="bg-[#E0FF4F] border-2 border-slate-900 px-3 py-1 rounded-full text-slate-900 font-black capitalize">{selectedOrder.paymentMethod.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t-2 border-slate-900 p-4 md:p-6 bg-white absolute bottom-0 left-0 right-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              {selectedOrder.status === 'new' && (
                <div className="flex flex-col gap-3 max-w-sm mx-auto w-full">
                  <button onClick={() => updateStatus(selectedOrder.id, 'paid')} className="w-full py-3.5 bg-slate-900 text-white rounded-[12px] font-bold shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">Mark as Paid</button>
                  <button onClick={() => updateStatus(selectedOrder.id, 'cancelled')} className="w-full py-3.5 font-bold text-sm text-red-600 bg-white border-2 border-red-600 rounded-[12px] hover:bg-red-50 transition-colors">Cancel Order</button>
                </div>
              )}
              {selectedOrder.status === 'paid' && (
                <div className="flex flex-col gap-3 max-w-sm mx-auto w-full">
                  <button onClick={() => updateStatus(selectedOrder.id, 'fulfilled')} className="w-full py-3.5 bg-slate-900 text-white rounded-[12px] font-bold shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">Mark as Fulfilled</button>
                  <button onClick={() => setShowReceipt(true)} className="w-full py-3.5 bg-white text-slate-900 rounded-[12px] font-bold border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] transition-all">Generate Receipt</button>
                </div>
              )}
              {(selectedOrder.status === 'fulfilled' || selectedOrder.status === 'cancelled') && (
                <div className="max-w-sm mx-auto w-full">
                  <button onClick={() => setShowReceipt(true)} className="w-full py-3.5 bg-white text-slate-900 rounded-[12px] font-bold border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] transition-all">Generate Receipt</button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)}>
        {selectedOrder && business && (
          <div className="p-4 md:p-6 flex flex-col items-center">
            <div id="receipt-container" className="bg-white rounded-[24px] border-4 border-slate-900 p-6 md:p-8 w-full max-w-sm font-mono text-sm relative shadow-[8px_8px_0px_#0f172a] text-slate-900">
              <div className="absolute top-4 right-4 bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-black tracking-widest border-2 border-slate-900">RECEIPT</div>
              <div className="text-center mb-8 pt-4">
                <h2 className="text-2xl font-display font-black tracking-wide text-slate-900 border-b-4 border-slate-900 pb-3 mb-3 inline-block uppercase">{business.businessName}</h2>
                <p className="font-bold text-slate-600 mb-1">ORDER #{selectedOrder.id.slice(0,8)}</p>
                <p className="text-xs text-slate-500 font-bold">{format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, HH:mm')}</p>
              </div>

              <div className="border-t-2 border-b-2 border-dashed border-slate-900 py-4 mb-4 flex flex-col gap-3">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div>
                      <div className="font-black text-slate-900">{item.productName}</div>
                      <div className="text-xs font-bold text-slate-600 mt-0.5">{item.quantity} x {formatNaira(item.unitPrice)}</div>
                    </div>
                    <div className="font-black text-slate-900">{formatNaira(item.unitPrice * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-black text-xl mb-8 text-slate-900">
                <span>TOTAL</span>
                <span>{formatNaira(selectedOrder.totalAmount)}</span>
              </div>

              <div className="text-xs font-bold space-y-2.5 bg-slate-100 p-4 rounded-[12px] border-2 border-slate-900">
                <p className="flex justify-between"><span className="text-slate-600">Status:</span> <span className="font-black text-slate-900 capitalize">{selectedOrder.status}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Customer:</span> <span className="font-black text-slate-900">{selectedOrder.customerName}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Payment:</span> <span className="font-black text-slate-900 capitalize">{selectedOrder.paymentMethod.replace('_', ' ')}</span></p>
              </div>
              <div className="text-center text-[10px] font-black text-slate-500 uppercase mt-8 tracking-widest">
                Powered by Kudi
              </div>
            </div>

            <div className="flex gap-3 mt-8 w-full max-w-sm">
              <button 
                className="flex-[2] py-3.5 flex items-center justify-center bg-[#E0FF4F] text-slate-900 font-bold border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[12px] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] transition-all"
                onClick={() => {
                  const el = document.getElementById('receipt-container');
                  if (el) {
                    htmlToImage.toPng(el, { backgroundColor: '#fff', pixelRatio: 2 }).then(dataUrl => {
                      const link = document.createElement('a');
                      link.download = `Receipt-${selectedOrder.id.slice(0,8)}.png`;
                      link.href = dataUrl;
                      link.click();
                    });
                  }
                }}
              >
                <Download weight="bold" className="w-5 h-5 mr-2" /> Download
              </button>
              <button className="flex-1 py-3.5 bg-white text-slate-900 font-bold border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[12px] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] transition-all" onClick={() => setShowReceipt(false)}>Done</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-[#4D9DE0] text-white shadow-[2px_2px_0px_#0f172a]',
    paid: 'bg-[#E0FF4F] text-slate-900 shadow-[2px_2px_0px_#0f172a]',
    fulfilled: 'bg-slate-900 text-white shadow-[2px_2px_0px_#E0FF4F]',
    cancelled: 'bg-[#FF6666] text-white shadow-[2px_2px_0px_#0f172a]',
  };

  return (
    <span className={`px-3 py-1 text-xs font-black rounded-[8px] border-2 border-slate-900 uppercase tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}
