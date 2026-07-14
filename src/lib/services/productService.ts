import { Product } from '../types';
import { api } from '../api';

function serializeProduct(row: any): Product {
  return {
    id: row.id || row.id,
    businessId: row.business_id || row.businessId,
    name: row.name,
    description: row.description || undefined,
    price: Number(row.price),
    imageUrl: row.image_url || row.imageUrl || undefined,
    stockCount: row.stock_count ?? row.stockCount ?? undefined,
    isAvailable: row.is_available ?? row.isAvailable ?? true,
    category: row.category || undefined,
    attributes: row.attributes || undefined,
    createdAt: row.created_at || row.createdAt,
  };
}

export const productService = {
  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const body = {
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      stockCount: product.stockCount,
      isAvailable: product.isAvailable,
      category: product.category,
      attributes: product.attributes,
    };
    const data = await api.post('/products', body);
    const newProduct = serializeProduct(data.product);
    this._syncToLocal(newProduct);
    return newProduct;
  },

  async getProducts(businessId: string): Promise<Product[]> {
    try {
      const data = await api.get(`/products?businessId=${encodeURIComponent(businessId)}`);
      const products = data.products.map(serializeProduct);
      localStorage.setItem('kudi_products', JSON.stringify(products));
      return products;
    } catch {
      return this._getLocalProducts(businessId);
    }
  },

  async getProduct(id: string): Promise<Product | null> {
    try {
      const data = await api.get(`/products/${id}`);
      return serializeProduct(data.product);
    } catch {
      const existing = this._getAllProducts();
      return existing.find(p => p.id === id) || null;
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const body: any = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.price !== undefined) body.price = updates.price;
    if (updates.imageUrl !== undefined) body.image_url = updates.imageUrl;
    if (updates.stockCount !== undefined) body.stock_count = updates.stockCount;
    if (updates.isAvailable !== undefined) body.is_available = updates.isAvailable;
    if (updates.category !== undefined) body.category = updates.category;
    if (updates.attributes !== undefined) body.attributes = updates.attributes;

    const data = await api.patch(`/products/${id}`, body);
    const updated = serializeProduct(data.product);
    this._syncToLocal(updated);
    return updated;
  },

  async deleteProduct(id: string): Promise<boolean> {
    await api.delete(`/products/${id}`);
    const all = this._getAllProducts().filter(p => p.id !== id);
    localStorage.setItem('kudi_products', JSON.stringify(all));
    return true;
  },

  _syncToLocal(product: Product) {
    const all = this._getAllProducts();
    const idx = all.findIndex(p => p.id === product.id);
    if (idx >= 0) all[idx] = product;
    else all.push(product);
    localStorage.setItem('kudi_products', JSON.stringify(all));
  },

  _getAllProducts(): Product[] {
    if (typeof window !== 'undefined') {
      const str = localStorage.getItem('kudi_products');
      return str ? JSON.parse(str) : [];
    }
    return [];
  },

  _getLocalProducts(businessId: string): Product[] {
    const all = this._getAllProducts().filter(p => p.businessId === businessId);
    if (all.length === 0) {
      const mockProducts: Product[] = [
        {
          id: `prod_mock1_${businessId}`, businessId,
          name: 'Royal Silk Ankara Dress', price: 25000, isAvailable: true,
          description: 'Handcrafted premium grade Ankara fabric silk dress with custom gold lining.',
          category: 'Clothing',
          imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
          createdAt: new Date().toISOString(), stockCount: 15
        },
        {
          id: `prod_mock2_${businessId}`, businessId,
          name: 'Italian Suede Stiletto Heels', price: 35000, isAvailable: true,
          description: 'Authentic custom Italian suede dress shoes designed for extreme comfort and elegance.',
          category: 'Footwear',
          imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80',
          createdAt: new Date().toISOString(), stockCount: 8
        },
        {
          id: `prod_mock3_${businessId}`, businessId,
          name: 'Luxury Traditional Coral Beads', price: 18000, isAvailable: true,
          description: 'Stunning handcrafted traditional wedding coral bead accessories, imported from Edo state.',
          category: 'Accessories',
          imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80',
          createdAt: new Date().toISOString(), stockCount: 20
        }
      ];
      localStorage.setItem('kudi_products', JSON.stringify(mockProducts));
      return mockProducts;
    }
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};
