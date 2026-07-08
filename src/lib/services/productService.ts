import { Product } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const productService = {
  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    await delay(600);
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    const existing = this._getAllProducts();
    existing.push(newProduct);
    localStorage.setItem("kudi_products", JSON.stringify(existing));
    return newProduct;
  },

  async getProducts(businessId: string): Promise<Product[]> {
    await delay(400);
    const existing = this._getAllProducts();
    const filtered = existing.filter(p => p.businessId === businessId);
    if (filtered.length === 0) {
      const mockProducts: Product[] = [
        {
          id: `prod_mock1_${businessId}`,
          businessId,
          name: "Royal Silk Ankara Dress",
          price: 25000,
          isAvailable: true,
          description: "Handcrafted premium grade Ankara fabric silk dress with custom gold lining.",
          category: "Clothing",
          imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80",
          createdAt: new Date().toISOString(),
          stockCount: 15
        },
        {
          id: `prod_mock2_${businessId}`,
          businessId,
          name: "Italian Suede Stiletto Heels",
          price: 35000,
          isAvailable: true,
          description: "Authentic custom Italian suede dress shoes designed for extreme comfort and elegance.",
          category: "Footwear",
          imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80",
          createdAt: new Date().toISOString(),
          stockCount: 8
        },
        {
          id: `prod_mock3_${businessId}`,
          businessId,
          name: "Luxury Traditional Coral Beads",
          price: 18000,
          isAvailable: true,
          description: "Stunning handcrafted traditional wedding coral bead accessories, imported from Edo state.",
          category: "Accessories",
          imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80",
          createdAt: new Date().toISOString(),
          stockCount: 20
        }
      ];
      const all = [...existing, ...mockProducts];
      localStorage.setItem("kudi_products", JSON.stringify(all));
      return mockProducts;
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getProduct(id: string): Promise<Product | null> {
    await delay(200);
    const existing = this._getAllProducts();
    return existing.find(p => p.id === id) || null;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    let existing = this._getAllProducts();
    let updatedProduct = null;
    existing = existing.map(p => {
      if (p.id === id) {
        updatedProduct = { ...p, ...updates };
        return updatedProduct;
      }
      return p;
    });
    localStorage.setItem("kudi_products", JSON.stringify(existing));
    await delay(500);
    return updatedProduct;
  },

  async deleteProduct(id: string): Promise<boolean> {
    await delay(400);
    let existing = this._getAllProducts();
    existing = existing.filter(p => p.id !== id);
    localStorage.setItem("kudi_products", JSON.stringify(existing));
    return true;
  },

  _getAllProducts(): Product[] {
    if (typeof window !== "undefined") {
      const str = localStorage.getItem("kudi_products");
      return str ? JSON.parse(str) : [];
    }
    return [];
  }
};
