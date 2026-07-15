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
    return serializeProduct(data.product);
  },

  async getProducts(businessId: string): Promise<Product[]> {
    const data = await api.get(`/products?businessId=${encodeURIComponent(businessId)}`);
    return data.products.map(serializeProduct);
  },

  async getProduct(id: string): Promise<Product | null> {
    const data = await api.get(`/products/${id}`);
    return serializeProduct(data.product);
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
    return serializeProduct(data.product);
  },

  async deleteProduct(id: string): Promise<boolean> {
    await api.delete(`/products/${id}`);
    return true;
  }
};
