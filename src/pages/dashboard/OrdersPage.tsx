import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { PackageOpen, Download, Phone } from 'lucide-react';
import { WhatsAppIcon } from '../../components/WhatsAppIcon';
import * as htmlToImage from 'html-to-image';
import { Order, Business } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { orderService } from '../../lib/services/orderService';
import BrutalButton from '../../components/ui/BrutalButton';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
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
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-10 selection:bg-[#E0FF4F] selection:text-black">
      <header className="mb-6 md:mb-8 border-b-[4px] border-black pb-4">
        <h1 className="text-3xl md:text-4xl font-black text-black uppercase mb-1">Orders</h1>
        <p className="text-sm md:text-base font-bold text-gray-700 uppercase">Track and manage customer purchases.</p>
      </header>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {STATUS_FILTERS.map(f => {
          const count = f === 'All' ? orders.length : orders.filter(o => o.status.toLowerCase() === f.toLowerCase()).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 px-4 py-2 border-[3px] border-black whitespace-nowrap text-sm font-black uppercase transition-transform shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]
                ${filter === f 
                  ? 'bg-black text-[#E0FF4F]' 
                  : 'bg-white text-black'
                }
              `}
            >
              {f}
              <span className={`px-2 py-0.5 text-xs font-black border-[2px] border-current
                ${filter === f ? 'bg-[#E0FF4F] text-black border-transparent' : 'bg-gray-100 text-black border-black'}
              `}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 border-[3px] border-black"></div>)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border-[4px] border-black p-10 text-center shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <PackageOpen className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-2xl font-black uppercase mb-2">{filter === 'All' ? "No orders yet" : `No ${filter} orders`}</h3>
          <p className="text-sm font-bold uppercase text-gray-600">When customers buy from your store, their orders will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className="bg-white p-4 md:p-6 border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] cursor-pointer hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:bg-[#FDFBF7] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg font-black uppercase">{order.customerName}</span>
                  <span className="text-sm font-bold bg-[#E0FF4F] border-[2px] border-black px-2 py-0.5">#{order.id.slice(0,8)}</span>
                </div>
                <div className="text-sm font-bold uppercase text-gray-600">
                  {order.items.length} item(s) • {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:min-w-[200px]">
                <div className="text-xl font-black">{formatNaira(order.totalAmount)}</div>
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder && !showReceipt} onClose={() => setSelectedOrder(null)} isDrawer title={`ORDER #${selectedOrder?.id.slice(0,8)}`}>
        {selectedOrder && (
          <div className="flex flex-col h-full bg-[#FDFBF7]">
            <div className="flex-1 pb-20 p-4 md:p-6">
              
              {/* Status Stepper */}
              <div className="mb-8 border-[4px] border-black bg-white p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-black -z-10 -translate-y-1/2"></div>
                  {['new', 'paid', 'fulfilled'].map((step, idx) => {
                    const statusOrder = ['new', 'paid', 'fulfilled'];
                    const currentIdx = statusOrder.indexOf(selectedOrder.status);
                    const isCompleted = statusOrder.indexOf(step) <= currentIdx;
                    const isCancelled = selectedOrder.status === 'cancelled';
                    return (
                      <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className={`w-8 h-8 flex items-center justify-center text-sm font-black border-[3px]
                          ${isCancelled ? 'border-gray-400 text-gray-400 bg-white' : isCompleted ? 'border-black bg-[#E0FF4F] text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border-black text-black bg-white'}
                        `}>
                          {idx + 1}
                        </div>
                        <span className={`text-[10px] uppercase font-black ${isCompleted && !isCancelled ? 'text-black' : 'text-gray-500'}`}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white border-[4px] border-black p-4 mb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-black mb-1 text-gray-500">Customer</div>
                <div className="font-black text-xl mb-1 uppercase">{selectedOrder.customerName}</div>
                <div className="font-bold mb-4">{selectedOrder.customerPhone}</div>
                <div className="flex gap-3">
                  <a href={`tel:${selectedOrder.customerPhone}`} className="flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-white border-[3px] border-black text-sm font-black uppercase hover:bg-black hover:text-[#E0FF4F] transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                  <a href={`https://wa.me/${selectedOrder.customerPhone.replace('+','')}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-[#E0FF4F] border-[3px] border-black text-sm font-black uppercase hover:bg-black hover:text-[#E0FF4F] transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Items */}
              <div className="mb-8 border-[4px] border-black bg-white p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black uppercase text-xl mb-4 border-b-[3px] border-black pb-2">Items</h4>
                <div className="flex flex-col gap-4">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 border-[2px] border-black bg-[#E0FF4F] flex items-center justify-center text-sm font-black">
                          {item.quantity}x
                        </div>
                        <span className="font-bold uppercase text-sm">{item.productName}</span>
                      </div>
                      <span className="font-black">{formatNaira(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t-[4px] border-black mt-4 pt-4 flex justify-between items-center font-black text-2xl">
                  <span>TOTAL</span>
                  <span>{formatNaira(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              <div className="text-sm flex justify-between items-center font-bold uppercase bg-white border-[3px] border-black p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <span>Payment Method</span>
                <span className="bg-[#E0FF4F] px-2 py-1 border-[2px] border-black">{selectedOrder.paymentMethod.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t-[4px] border-black p-4 bg-white sticky bottom-0 z-10 shadow-[0px_-4px_0px_rgba(0,0,0,1)]">
              {selectedOrder.status === 'new' && (
                <div className="flex flex-col gap-3">
                  <BrutalButton onClick={() => updateStatus(selectedOrder.id, 'paid')} className="w-full">MARK AS PAID</BrutalButton>
                  <button onClick={() => updateStatus(selectedOrder.id, 'cancelled')} className="w-full py-3 font-black uppercase text-xs border-[3px] border-black bg-[#FF6666] text-white hover:bg-black transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]">CANCEL ORDER</button>
                </div>
              )}
              {selectedOrder.status === 'paid' && (
                <div className="flex flex-col gap-3">
                  <BrutalButton onClick={() => updateStatus(selectedOrder.id, 'fulfilled')} className="w-full">MARK AS FULFILLED</BrutalButton>
                  <BrutalButton onClick={() => setShowReceipt(true)} color="#4D9DE0" className="w-full text-white">GENERATE RECEIPT</BrutalButton>
                </div>
              )}
              {(selectedOrder.status === 'fulfilled' || selectedOrder.status === 'cancelled') && (
                <BrutalButton onClick={() => setShowReceipt(true)} color="#4D9DE0" className="w-full text-white">GENERATE RECEIPT</BrutalButton>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)}>
        {selectedOrder && business && (
          <div className="p-4 md:p-6 flex flex-col items-center">
            <div id="receipt-container" className="bg-white border-[4px] border-black p-6 w-full max-w-sm font-mono text-sm relative shadow-[8px_8px_0px_rgba(0,0,0,1)]">
              <div className="absolute top-2 right-2 border-2 border-black px-1 text-[10px] bg-[#E0FF4F] font-bold">RECEIPT</div>
              <div className="text-center mb-6 pt-4">
                <h2 className="text-2xl font-black uppercase tracking-widest border-b-[4px] border-black pb-2 mb-2 inline-block">{business.businessName}</h2>
                <p className="font-bold text-xs">ORDER #{selectedOrder.id.slice(0,8)}</p>
                <p className="font-bold text-xs">{format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, HH:mm')}</p>
              </div>

              <div className="border-t-[3px] border-b-[3px] border-dashed border-black py-4 mb-4 flex flex-col gap-2">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start font-bold">
                    <div>
                      <div className="uppercase">{item.productName}</div>
                      <div className="text-xs">{item.quantity} x {formatNaira(item.unitPrice)}</div>
                    </div>
                    <div>{formatNaira(item.unitPrice * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-black text-xl mb-6">
                <span>TOTAL</span>
                <span className="bg-[#E0FF4F] px-1 border border-black">{formatNaira(selectedOrder.totalAmount)}</span>
              </div>

              <div className="text-xs font-bold uppercase space-y-2 border-[2px] border-black p-3 bg-gray-50">
                <p className="flex justify-between"><span>Status:</span> <span>{selectedOrder.status}</span></p>
                <p className="flex justify-between"><span>Customer:</span> <span>{selectedOrder.customerName}</span></p>
                <p className="flex justify-between"><span>Payment:</span> <span>{selectedOrder.paymentMethod}</span></p>
              </div>
              <div className="text-center text-[10px] font-black uppercase mt-6 tracking-widest">
                Powered by Kudi
              </div>
            </div>

            <div className="flex gap-4 mt-8 w-full max-w-sm">
              <BrutalButton 
                color="#E0FF4F"
                className="flex-1"
                onClick={() => {
                  const el = document.getElementById('receipt-container');
                  if (el) {
                    htmlToImage.toPng(el, { backgroundColor: '#fff' }).then(dataUrl => {
                      const link = document.createElement('a');
                      link.download = `Receipt-${selectedOrder.id.slice(0,8)}.png`;
                      link.href = dataUrl;
                      link.click();
                    });
                  }
                }}
              >
                <Download className="w-5 h-5 mr-2" /> SAVE
              </BrutalButton>
              <BrutalButton color="#FF6666" className="flex-1 text-white" onClick={() => setShowReceipt(false)}>DONE</BrutalButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-[#4D9DE0] text-white',
    paid: 'bg-[#06D6A0] text-black',
    fulfilled: 'bg-black text-white',
    cancelled: 'bg-[#FF6666] text-white',
  };

  return (
    <span className={`px-3 py-1 text-xs font-black uppercase border-[3px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] ${styles[status]}`}>
      {status}
    </span>
  );
}
