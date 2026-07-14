import { Business } from '../types';
import { api } from '../api';

export const DEFAULT_HERO_IMAGE_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAei2SCO828A82z9Nk8QNfFG7OaW_4XjTjOH-FkL-c719S45Y3t7z0pk4ORAE3EHBU2kGj_RqeUA8JZ7wu8A1PhozLhrANtFNBm82qZu82WAGc3yUrfAGE6SFAYFEfkuJI4QPh8tAKzitoqE866ICR3Rlih1IBwvJl5wMIBuVzuN_FML0QGmA5dTMI5scAxa_dhmnSLesA7M7RmcF2HsOsV5ZVPBgDEBVw3IEn83Kd4rDOjANhyi3hKZawQZ94mQRz65W7WwEUnob4';

export function getDefaultHeroImageUrl(_category?: string): string {
  return DEFAULT_HERO_IMAGE_URL;
}

export const businessService = {
  async createBusiness(business: Omit<Business, 'id' | 'createdAt' | 'kycTier'> & { password: string }): Promise<Business> {
    const data = await api.post('/businesses', business);
    if (data.token) {
      localStorage.setItem('kudi_token', data.token);
    }
    const businesses = JSON.parse(localStorage.getItem('kudi_businesses') || '[]');
    businesses.push(data.business);
    localStorage.setItem('kudi_businesses', JSON.stringify(businesses));
    return data.business;
  },

  async getBusinessByPhone(phone: string): Promise<Business | null> {
    try {
      const data = await api.get(`/businesses?phone=${encodeURIComponent(phone)}`);
      return data.business;
    } catch {
      const existing = this._getAllBusinesses();
      return existing.find(b => b.ownerPhone === phone) || null;
    }
  },

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    try {
      const data = await api.get(`/businesses/${slug}`);
      return data.business;
    } catch {
      const existing = this._getAllBusinesses();
      const localBiz = existing.find(b => b.storefrontSlug === slug);
      if (localBiz) return localBiz;
      
      return {
        id: `mock_biz_${slug}`,
        businessName: slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        storefrontSlug: slug,
        ownerPhone: '08000000000',
        category: 'Fashion',
        state: 'Lagos',
        lga: 'Ikeja',
        kycTier: 3,
        createdAt: new Date().toISOString(),
        theme: 'light' as const,
        themeConfig: {
          primaryColor: '#111111',
          ctaText: 'Add to Bag',
          heroImageUrl: DEFAULT_HERO_IMAGE_URL
        }
      };
    }
  },

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
    try {
      const data = await api.patch(`/businesses/${id}`, updates);
      return data.business;
    } catch (e) {
      // Fallback for local development when backend is unreachable
      const existing = this._getAllBusinesses();
      const index = existing.findIndex(b => b.id === id);
      if (index !== -1) {
        existing[index] = { ...existing[index], ...updates };
        localStorage.setItem('kudi_businesses', JSON.stringify(existing));
        return existing[index];
      }
      throw e;
    }
  },

  async checkSlugAvailable(slug: string): Promise<boolean> {
    try {
      const data = await api.get(`/businesses/check-slug?slug=${encodeURIComponent(slug)}`);
      return data.available;
    } catch {
      if (slug === 'test' || slug === 'demo') return false;
      const existing = this._getAllBusinesses();
      return !existing.some(b => b.storefrontSlug === slug);
    }
  },

  _getAllBusinesses(): Business[] {
    if (typeof window !== 'undefined') {
      const str = localStorage.getItem('kudi_businesses');
      return str ? JSON.parse(str) : [];
    }
    return [];
  }
};
