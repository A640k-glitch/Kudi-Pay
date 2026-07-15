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
    return data.business;
  },

  async getBusinessByPhone(phone: string): Promise<Business | null> {
    const data = await api.get(`/businesses?phone=${encodeURIComponent(phone)}`);
    return data.business;
  },

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    const data = await api.get(`/businesses/${slug}`);
    return data.business || null;
  },

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
    const data = await api.patch(`/businesses/${id}`, updates);
    return data.business;
  },

  async checkSlugAvailable(slug: string): Promise<boolean> {
    const data = await api.get(`/businesses/check-slug?slug=${encodeURIComponent(slug)}`);
    return data.available;
  },

  async requestDeleteOTP(): Promise<boolean> {
    const data = await api.post('/auth/request-delete-otp');
    return data.success;
  },

  async deleteBusiness(id: string, code: string): Promise<boolean> {
    const data = await api.post(`/businesses/${id}/delete`, { code });
    return data.success;
  }
};
