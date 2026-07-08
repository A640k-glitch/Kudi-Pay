export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  heroImageUrl?: string;
  ctaText?: string;
}

export interface Business {
  id: string;
  ownerPhone: string;
  businessName: string;
  category: string;
  state: string;
  lga: string;
  logoUrl?: string;
  storefrontSlug: string;
  theme: 'brutal' | 'modern';
  themeConfig?: ThemeConfig;
  createdAt: string;
  kycTier: 0 | 1 | 2 | 3;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stockCount?: number;
  isAvailable: boolean;
  category?: string;
  // Category-specific attributes (sizes, dietary info, warranty, etc.)
  attributes?: Record<string, string>;
  createdAt: string;
}

export interface Order {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'new' | 'paid' | 'fulfilled' | 'cancelled';
  paymentMethod: 'card' | 'bank_transfer' | 'ussd';
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}
