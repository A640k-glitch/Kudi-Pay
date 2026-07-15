import { Business } from '../types';
import { api } from '../api';

export function getDefaultHeroImageUrl(category?: string): string {
  switch (category) {
    case 'Fashion':
      return '/images/heroes/hero_fashion.png';
    case 'Food & Beverages':
      return '/images/heroes/hero_food.png';
    case 'Electronics':
      return '/images/heroes/hero_electronics.png';
    case 'Services':
      return '/images/heroes/hero_services.png';
    case 'Beauty':
      return '/images/heroes/hero_beauty.png';
    default:
      return '/images/heroes/hero_other.png';
  }
}

export function getDefaultThemeConfig(category?: string) {
  switch (category) {
    case 'Fashion':
      return {
        heroLabel: 'New Collection',
        heroHeading: 'Elevate Your Style. Every Single Day.',
        heroSubheading: 'Discover our curated collection of premium clothing tailored for modern elegance and comfort.',
        ctaText: 'Add to Bag'
      };
    case 'Food & Beverages':
      return {
        heroLabel: 'Freshly Prepared',
        heroHeading: 'Taste the Magic in Every Bite.',
        heroSubheading: 'Explore a rich menu of mouth-watering dishes crafted with love and the finest ingredients.',
        ctaText: 'Add to Order'
      };
    case 'Electronics':
      return {
        heroLabel: 'Latest Tech',
        heroHeading: 'Power Your Life with Innovation.',
        heroSubheading: 'Upgrade your world with our cutting-edge electronics and premium gadgets.',
        ctaText: 'Add to Bag'
      };
    case 'Services':
      return {
        heroLabel: 'Professional Services',
        heroHeading: 'Expertise You Can Always Trust.',
        heroSubheading: 'Book our top-tier services and let professionals handle everything seamlessly.',
        ctaText: 'Book Now'
      };
    case 'Beauty':
      return {
        heroLabel: 'Premium Skincare',
        heroHeading: 'Glow Naturally, Every Single Day.',
        heroSubheading: 'Discover our curated collection of premium skincare essentials formulated for radiant, healthy skin.',
        ctaText: 'Add to Bag'
      };
    default:
      return {
        heroLabel: 'Featured Products',
        heroHeading: 'Quality Products, Exceptional Value.',
        heroSubheading: 'Browse our extensive catalog and discover exactly what you are looking for today.',
        ctaText: 'Add to Bag'
      };
  }
}

const OLD_DEFAULT_HERO = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAei2SCO828A82z9Nk8QNfFG7OaW_4XjTjOH-FkL-c719S45Y3t7z0pk4ORAE3EHBU2kGj_RqeUA8JZ7wu8A1PhozLhrANtFNBm82qZu82WAGc3yUrfAGE6SFAYFEfkuJI4QPh8tAKzitoqE866ICR3Rlih1IBwvJl5wMIBuVzuN_FML0QGmA5dTMI5scAxa_dhmnSLesA7M7RmcF2HsOsV5ZVPBgDEBVw3IEn83Kd4rDOjANhyi3hKZawQZ94mQRz65W7WwEUnob4';

function fixBusinessTheme(business: Business | null): Business | null {
  if (!business) return null;
  if (!business.themeConfig) return business;

  const isOldDefault = business.themeConfig.heroImageUrl === OLD_DEFAULT_HERO;
  const isBuggedOther = business.category !== 'Other' && business.themeConfig.heroImageUrl === '/images/heroes/hero_other.png';

  if (isOldDefault || isBuggedOther) {
    business.themeConfig.heroImageUrl = getDefaultHeroImageUrl(business.category);
  }
  
  if (business.themeConfig.ctaText === 'Add to Bag' && business.category === 'Services') {
    business.themeConfig.ctaText = getDefaultThemeConfig(business.category).ctaText;
  }
  
  const isBuggedHeading = business.category !== 'Other' && business.themeConfig.heroHeading === 'Quality Products, Exceptional Value.';
  if (isBuggedHeading) {
    const defaults = getDefaultThemeConfig(business.category);
    business.themeConfig.heroHeading = defaults.heroHeading;
    business.themeConfig.heroSubheading = defaults.heroSubheading;
    business.themeConfig.heroLabel = defaults.heroLabel;
  }
  
  return business;
}

export const businessService = {
  async createBusiness(business: Omit<Business, 'id' | 'createdAt' | 'kycTier'> & { password: string }): Promise<Business> {
    const data = await api.post('/businesses', business);
    if (data.token) {
      localStorage.setItem('kudi_token', data.token);
    }
    return fixBusinessTheme(data.business)!;
  },

  async getBusinessByPhone(phone: string): Promise<Business | null> {
    const data = await api.get(`/businesses?phone=${encodeURIComponent(phone)}`);
    return fixBusinessTheme(data.business);
  },

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    const data = await api.get(`/businesses/${slug}`);
    return fixBusinessTheme(data.business || null);
  },

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
    const data = await api.patch(`/businesses/${id}`, updates);
    return fixBusinessTheme(data.business);
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
