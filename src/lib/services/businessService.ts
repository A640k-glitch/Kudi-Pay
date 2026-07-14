import { Business } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Default hero images per business category ─────────────────────────────
// The skincare/fashion hero is the platform default for all fashion storefronts.
export const DEFAULT_HERO_IMAGE_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAei2SCO828A82z9Nk8QNfFG7OaW_4XjTjOH-FkL-c719S45Y3t7z0pk4ORAE3EHBU2kGj_RqeUA8JZ7wu8A1PhozLhrANtFNBm82qZu82WAGc3yUrfAGE6SFAYFEfkuJI4QPh8tAKzitoqE866ICR3Rlih1IBwvJl5wMIBuVzuN_FML0QGmA5dTMI5scAxa_dhmnSLesA7M7RmcF2HsOsV5ZVPBgDEBVw3IEn83Kd4rDOjANhyi3hKZawQZ94mQRz65W7WwEUnob4';

/**
 * Returns the appropriate default hero image URL for a given business category.
 * Falls back to the platform-wide fashion/skincare default if no category match.
 */
export function getDefaultHeroImageUrl(_category?: string): string {
  // Future: return category-specific defaults here (food, electronics, etc.)
  return DEFAULT_HERO_IMAGE_URL;
}

export const businessService = {
  async createBusiness(business: Omit<Business, 'id' | 'createdAt' | 'kycTier'>): Promise<Business> {
    await delay(800);
    const newBusiness: Business = {
      ...business,
      id: `biz_${Date.now()}`,
      createdAt: new Date().toISOString(),
      kycTier: 0,
      themeConfig: {
        primaryColor: '#111111',
        ctaText: 'Add to Bag',
        heroImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAei2SCO828A82z9Nk8QNfFG7OaW_4XjTjOH-FkL-c719S45Y3t7z0pk4ORAE3EHBU2kGj_RqeUA8JZ7wu8A1PhozLhrANtFNBm82qZu82WAGc3yUrfAGE6SFAYFEfkuJI4QPh8tAKzitoqE866ICR3Rlih1IBwvJl5wMIBuVzuN_FML0QGmA5dTMI5scAxa_dhmnSLesA7M7RmcF2HsOsV5ZVPBgDEBVw3IEn83Kd4rDOjANhyi3hKZawQZ94mQRz65W7WwEUnob4'
      }
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
        category: 'fashion',
        state: 'Lagos',
        lga: 'Ikeja',
        kycTier: 3,
        createdAt: new Date().toISOString(),
        theme: 'light',
        themeConfig: {
          primaryColor: '#111111',
          ctaText: 'Add to Bag',
          heroImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAei2SCO828A82z9Nk8QNfFG7OaW_4XjTjOH-FkL-c719S45Y3t7z0pk4ORAE3EHBU2kGj_RqeUA8JZ7wu8A1PhozLhrANtFNBm82qZu82WAGc3yUrfAGE6SFAYFEfkuJI4QPh8tAKzitoqE866ICR3Rlih1IBwvJl5wMIBuVzuN_FML0QGmA5dTMI5scAxa_dhmnSLesA7M7RmcF2HsOsV5ZVPBgDEBVw3IEn83Kd4rDOjANhyi3hKZawQZ94mQRz65W7WwEUnob4'
        }
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
