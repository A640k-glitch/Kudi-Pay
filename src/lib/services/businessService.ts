import { Business } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const businessService = {
  async createBusiness(business: Omit<Business, 'id' | 'createdAt' | 'kycTier'>): Promise<Business> {
    await delay(800);
    const newBusiness: Business = {
      ...business,
      id: `biz_${Date.now()}`,
      createdAt: new Date().toISOString(),
      kycTier: 0,
    };
    
    const existing = this._getAllBusinesses();
    existing.push(newBusiness);
    localStorage.setItem("kudi_businesses", JSON.stringify(existing));
    return newBusiness;
  },

  async getBusinessByPhone(phone: string): Promise<Business | null> {
    await delay(300);
    const existing = this._getAllBusinesses();
    return existing.find(b => b.ownerPhone === phone) || null;
  },

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    await delay(300);
    const existing = this._getAllBusinesses();
    const found = existing.find(b => b.storefrontSlug === slug);
    if (!found) {
      // For demo purposes: if a user scans a QR code on another device, 
      // their localStorage won't have the business. We return a mock business
      // so the storefront can still render properly with mock products.
      return {
        id: `mock_biz_${slug}`,
        businessName: slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        storefrontSlug: slug,
        ownerPhone: "08000000000",
        kycTier: 3,
        createdAt: new Date().toISOString(),
        theme: 'brutal'
      };
    }
    return found;
  },

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
    await delay(500);
    let existing = this._getAllBusinesses();
    let updatedBusiness = null;
    existing = existing.map(b => {
      if (b.id === id) {
        updatedBusiness = { ...b, ...updates };
        return updatedBusiness;
      }
      return b;
    });
    localStorage.setItem("kudi_businesses", JSON.stringify(existing));
    return updatedBusiness;
  },

  async checkSlugAvailable(slug: string): Promise<boolean> {
    await delay(600);
    if (slug === 'test' || slug === 'demo') return false;
    const existing = this._getAllBusinesses();
    return !existing.some(b => b.storefrontSlug === slug);
  },

  _getAllBusinesses(): Business[] {
    if (typeof window !== "undefined") {
      const str = localStorage.getItem("kudi_businesses");
      return str ? JSON.parse(str) : [];
    }
    return [];
  }
};
