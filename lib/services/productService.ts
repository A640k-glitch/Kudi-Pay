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
    return existing.filter(p => p.businessId === businessId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getProduct(id: string): Promise<Product | null> {
    await delay(200);
    const existing = this._getAllProducts();
    return existing.find(p => p.id === id) || null;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    await delay(500);
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
