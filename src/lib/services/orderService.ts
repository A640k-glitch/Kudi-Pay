import { Order } from '../types';
import { api } from '../api';

function serializeOrder(row: any): Order {
  return {
    id: row.id,
    businessId: row.business_id || row.businessId,
    customerName: row.customer_name || row.customerName,
    customerPhone: row.customer_phone || row.customerPhone,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    totalAmount: Number(row.total_amount || row.totalAmount),
    status: row.status,
    paymentMethod: row.payment_method || row.paymentMethod,
    createdAt: row.created_at || row.createdAt,
  };
}

export const orderService = {
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    const data = await api.post('/orders', {
      businessId: order.businessId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
    });
    const newOrder = serializeOrder(data.order);
    this._syncToLocal(newOrder);
    return newOrder;
  },

  async getOrders(businessId: string): Promise<Order[]> {
    try {
      const data = await api.get(`/orders?businessId=${encodeURIComponent(businessId)}`);
      const orders = data.orders.map(serializeOrder);
      localStorage.setItem('kudi_orders', JSON.stringify(orders));
      return orders;
    } catch {
      return this._getLocalOrders(businessId);
    }
  },

  async getOrder(id: string): Promise<Order | null> {
    try {
      const data = await api.get(`/orders/${id}`);
      return serializeOrder(data.order);
    } catch {
      const existing = this._getAllOrders();
      return existing.find(o => o.id === id) || null;
    }
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    const data = await api.patch(`/orders/${id}`, { status });
    const updated = serializeOrder(data.order);
    this._syncToLocal(updated);
    return updated;
  },

  _syncToLocal(order: Order) {
    const all = this._getAllOrders();
    const idx = all.findIndex(o => o.id === order.id);
    if (idx >= 0) all[idx] = order;
    else all.push(order);
    localStorage.setItem('kudi_orders', JSON.stringify(all));
  },

  _getAllOrders(): Order[] {
    if (typeof window !== 'undefined') {
      const str = localStorage.getItem('kudi_orders');
      return str ? JSON.parse(str) : [];
    }
    return [];
  },

  _getLocalOrders(businessId: string): Order[] {
    const existing = this._getAllOrders();
    return existing.filter(o => o.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};
