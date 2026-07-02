import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Package, Download, Phone, MessageCircle } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Order, Business } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { orderService } from '../../lib/services/orderService';
import { Button } from '../../components/Button';
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
    <div className="p-3 md:p-4 max-w-5xl mx-auto pb-24 md:pb-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Orders</h1>
        <p className="text-gray-500">Track and manage customer purchases.</p>
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        {STATUS_FILTERS.map(f => {
          const count = f === 'All' ? orders.length : orders.filter(o => o.status.toLowerCase() === f.toLowerCase()).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors border
                ${filter === f 
                  ? 'bg-gray-900 text-white border-gray-900' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {f}
              <span className={`px-2 py-0.5 rounded-full text-xs
                ${filter === f ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}
              `}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-10 h-10" />}
          title={filter === 'All' ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
          description={filter === 'All' ? "When customers buy from your store, their orders will appear here." : "Try changing the filter to see other orders."}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-primary transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{order.customerName}</span>
                  <span className="text-gray-400 text-sm">#{order.id}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {order.items.length} item(s) • {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-4 sm:min-w-[200px]">
                <div className="font-bold text-gray-900">{formatNaira(order.totalAmount)}</div>
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Drawer */}
      <Modal isOpen={!!selectedOrder && !showReceipt} onClose={() => setSelectedOrder(null)} isDrawer title={`Order #${selectedOrder?.id}`}>
        {selectedOrder && (
          <div className="flex flex-col h-full">
            <div className="flex-1 pb-20">
              {/* Status Stepper */}
              <div className="mb-6 px-2">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -z-10 -translate-y-1/2"></div>
                  {['new', 'paid', 'fulfilled'].map((step, idx) => {
                    const statusOrder = ['new', 'paid', 'fulfilled'];
                    const currentIdx = statusOrder.indexOf(selectedOrder.status);
                    const isCompleted = statusOrder.indexOf(step) <= currentIdx;
                    const isCancelled = selectedOrder.status === 'cancelled';
                    return (
                      <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2
                          ${isCancelled ? 'border-gray-200 text-gray-300 bg-white' : isCompleted ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-400 bg-white'}
                        `}>
                          {idx + 1}
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-semibold ${isCompleted && !isCancelled ? 'text-primary' : 'text-gray-400'}`}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="font-medium text-gray-900 mb-1">{selectedOrder.customerName}</div>
                <div className="text-gray-500 mb-3">{selectedOrder.customerPhone}</div>
                <div className="flex gap-2">
                  <a href={`tel:${selectedOrder.customerPhone}`} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                  <a href={`https://wa.me/${selectedOrder.customerPhone.replace('+','')}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-[#25D366]">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                <div className="flex flex-col gap-3">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                          {item.quantity}x
                        </div>
                        <span className="text-gray-900">{item.productName}</span>
                      </div>
                      <span className="text-gray-900 font-medium">{formatNaira(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-gray-200 mt-4 pt-4 flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>{formatNaira(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              <div className="text-sm text-gray-500 flex justify-between">
                <span>Payment Method</span>
                <span className="capitalize font-medium text-gray-900">{selectedOrder.paymentMethod.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-gray-100 pt-4 pb-safe mt-auto">
              {selectedOrder.status === 'new' && (
                <div className="flex flex-col gap-3">
                  <Button onClick={() => updateStatus(selectedOrder.id, 'paid')} className="w-full">Mark as Paid</Button>
                  <Button onClick={() => updateStatus(selectedOrder.id, 'cancelled')} variant="ghost" className="w-full text-destructive hover:bg-red-50 hover:text-destructive">Cancel Order</Button>
                </div>
              )}
              {selectedOrder.status === 'paid' && (
                <div className="flex flex-col gap-3">
                  <Button onClick={() => updateStatus(selectedOrder.id, 'fulfilled')} className="w-full">Mark as Fulfilled</Button>
                  <Button onClick={() => setShowReceipt(true)} variant="secondary" className="w-full">Generate Receipt</Button>
                </div>
              )}
              {(selectedOrder.status === 'fulfilled' || selectedOrder.status === 'cancelled') && (
                <Button onClick={() => setShowReceipt(true)} variant="secondary" className="w-full">Generate Receipt</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)}>
        {selectedOrder && business && (
          <div className="py-4">
            <div id="receipt-container" className="bg-white border-2 border-gray-900 p-6 rounded-none mx-auto max-w-sm font-mono text-sm">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold uppercase tracking-widest">{business.businessName}</h2>
                <p className="text-gray-500 text-xs mt-1">Receipt for Order #{selectedOrder.id}</p>
                <p className="text-gray-500 text-xs">{format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, HH:mm')}</p>
              </div>

              <div className="border-t border-b border-dashed border-gray-300 py-4 mb-4">
                {selectedOrder.items.map((item, i) => (
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
                <span>TOTAL</span>
                <span>{formatNaira(selectedOrder.totalAmount)}</span>
              </div>

              <div className="text-center text-xs text-gray-500 space-y-1">
                <p>Status: {selectedOrder.status.toUpperCase()}</p>
                <p>Customer: {selectedOrder.customerName}</p>
                <p className="mt-4 pt-4 border-t border-gray-200">Powered by CODA</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  const el = document.getElementById('receipt-container');
                  if (el) {
                    htmlToImage.toPng(el).then(dataUrl => {
                      const link = document.createElement('a');
                      link.download = `Receipt-${selectedOrder.id}.png`;
                      link.href = dataUrl;
                      link.click();
                    });
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setShowReceipt(false)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    paid: 'bg-green-50 text-green-700 border-green-200',
    fulfilled: 'bg-gray-100 text-gray-700 border-gray-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
}
