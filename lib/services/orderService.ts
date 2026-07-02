import { Order } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const orderService = {
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    await delay(1500); // Simulate checkout processing
    const newOrder: Order = {
      ...order,
      id: `ord_${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    
    const existing = this._getAllOrders();
    existing.push(newOrder);
    localStorage.setItem("coda_orders", JSON.stringify(existing));
    return newOrder;
  },

  async getOrders(businessId: string): Promise<Order[]> {
    await delay(400);
    const existing = this._getAllOrders();
    return existing.filter(o => o.businessId === businessId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOrder(id: string): Promise<Order | null> {
    await delay(200);
    const existing = this._getAllOrders();
    return existing.find(o => o.id === id) || null;
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    await delay(400);
    let existing = this._getAllOrders();
    let updatedOrder = null;
    existing = existing.map(o => {
      if (o.id === id) {
        updatedOrder = { ...o, status };
        return updatedOrder;
      }
      return o;
    });
    localStorage.setItem("coda_orders", JSON.stringify(existing));
    return updatedOrder;
  },

  _getAllOrders(): Order[] {
    if (typeof window !== "undefined") {
      const str = localStorage.getItem("coda_orders");
      return str ? JSON.parse(str) : [];
    }
    return [];
  }
};
