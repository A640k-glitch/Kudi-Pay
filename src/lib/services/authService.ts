import { api, ApiError } from '../api';
import { Business } from '../types';

async function isApiAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/request-otp', { method: 'OPTIONS' });
    return res.status < 500;
  } catch {
    return false;
  }
}

export const authService = {
  async sendOTP(phone: string): Promise<boolean> {
    try {
      await api.post('/auth/request-otp', { phone });
    } catch {
      // Fallback: localStorage mode for local dev
    }
    localStorage.setItem('kudi_pending_phone', phone);
    return true;
  },

  async verifyOTP(code: string): Promise<{ success: boolean; isNewUser?: boolean }> {
    const phone = localStorage.getItem('kudi_pending_phone') || '';

    try {
      const data = await api.post('/auth/verify-otp', { phone, code });
      if (data.success) {
        localStorage.setItem('kudi_session_phone', phone);
        if (data.token) {
          localStorage.setItem('kudi_token', data.token);
          if (data.business) {
            const businesses = JSON.parse(localStorage.getItem('kudi_businesses') || '[]');
            const bizIndex = businesses.findIndex((b: any) => b.id === data.business.id);
            if (bizIndex >= 0) {
              businesses[bizIndex] = data.business;
            } else {
              businesses.push(data.business);
            }
            localStorage.setItem('kudi_businesses', JSON.stringify(businesses));
          }
        }
        return { success: true, isNewUser: data.isNewUser };
      }
      return { success: false };
    } catch {
      // Fallback: localStorage dev mode
      if (code === '123456') {
        localStorage.setItem('kudi_session_phone', phone);
        const businessesStr = localStorage.getItem('kudi_businesses');
        let isNewUser = true;
        if (businessesStr) {
          const businesses: Business[] = JSON.parse(businessesStr);
          if (businesses.some(b => b.ownerPhone === phone)) {
            isNewUser = false;
          }
        }
        return { success: true, isNewUser };
      }
      return { success: false };
    }
  },

  async login(phone: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const data = await api.post('/auth/login', { phone, password });
      if (data.success) {
        localStorage.setItem('kudi_pending_phone', phone);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err: any) {
      // Fallback: localStorage dev mode
      if (err instanceof ApiError && err.status === 404) {
        return { success: false, message: "We don't recognize this number." };
      }
      // In dev without API server, fall back to localStorage check
      const businessesStr = localStorage.getItem('kudi_businesses');
      if (businessesStr) {
        const businesses: Business[] = JSON.parse(businessesStr);
        const business = businesses.find(b => b.ownerPhone === phone);
        if (!business) {
          return { success: false, message: "We don't recognize this number." };
        }
        localStorage.setItem('kudi_pending_phone', phone);
        return { success: true };
      }
      return { success: false, message: 'Could not connect to server. Make sure the API is running.' };
    }
  },

  logout() {
    localStorage.removeItem('kudi_session_phone');
    localStorage.removeItem('kudi_pending_phone');
    localStorage.removeItem('kudi_token');
  },

  getCurrentPhone(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('kudi_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          localStorage.setItem('kudi_session_phone', payload.phone);
          return payload.phone;
        } catch {}
      }
      return localStorage.getItem('kudi_session_phone');
    }
    return null;
  },

  getCurrentBusinessId(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('kudi_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.businessId;
        } catch {}
      }
    }
    return null;
  }
};
