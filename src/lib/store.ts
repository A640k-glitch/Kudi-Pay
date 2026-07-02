import { create } from 'zustand';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

interface CartStore {
  items: OrderItem[];
  addItem: (item: OrderItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (newItem) => set((state) => {
    const existing = state.items.find(i => i.productId === newItem.productId);
    if (existing) {
      return {
        items: state.items.map(i => 
          i.productId === newItem.productId 
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        )
      };
    }
    return { items: [...state.items, newItem] };
  }),
  removeItem: (productId) => set((state) => ({
    items: state.items.filter(i => i.productId !== productId)
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items.map(i => 
      i.productId === productId ? { ...i, quantity } : i
    )
  })),
  clearCart: () => set({ items: [] }),
  getTotal: () => get().items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0),
  getItemCount: () => get().items.reduce((count, item) => count + item.quantity, 0)
}));
