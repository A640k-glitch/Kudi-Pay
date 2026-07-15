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
    return serializeOrder(data.order);
  },

  async getOrders(businessId: string): Promise<Order[]> {
    const data = await api.get(`/orders?businessId=${encodeURIComponent(businessId)}`);
    return data.orders.map(serializeOrder);
  },

  async getOrder(id: string): Promise<Order | null> {
    const data = await api.get(`/orders/${id}`);
    return serializeOrder(data.order);
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    const data = await api.patch(`/orders/${id}`, { status });
    return serializeOrder(data.order);
  }
};
