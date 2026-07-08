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

const getInitialItems = (): OrderItem[] => {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('kudi_store_cart_items');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached cart items', e);
      }
    }
  }
  return [];
};

const saveItemsToCache = (items: OrderItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kudi_store_cart_items', JSON.stringify(items));
  }
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: getInitialItems(),
  addItem: (newItem) => set((state) => {
    const existing = state.items.find(i => i.productId === newItem.productId);
    let updatedItems: OrderItem[];
    if (existing) {
      updatedItems = state.items.map(i => 
        i.productId === newItem.productId 
          ? { ...i, quantity: i.quantity + newItem.quantity }
          : i
      );
    } else {
      updatedItems = [...state.items, newItem];
    }
    saveItemsToCache(updatedItems);
    return { items: updatedItems };
  }),
  removeItem: (productId) => set((state) => {
    const updatedItems = state.items.filter(i => i.productId !== productId);
    saveItemsToCache(updatedItems);
    return { items: updatedItems };
  }),
  updateQuantity: (productId, quantity) => set((state) => {
    const updatedItems = state.items.map(i => 
      i.productId === productId ? { ...i, quantity } : i
    );
    saveItemsToCache(updatedItems);
    return { items: updatedItems };
  }),
  clearCart: () => {
    saveItemsToCache([]);
    set({ items: [] });
  },
  getTotal: () => get().items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0),
  getItemCount: () => get().items.reduce((count, item) => count + item.quantity, 0)
}));
