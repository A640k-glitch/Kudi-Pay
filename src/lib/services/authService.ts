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
    this.logout();
    await api.post('/auth/request-otp', { phone });
    localStorage.setItem('kudi_pending_phone', phone);
    return true;
  },

  async verifyOTP(code: string): Promise<{ success: boolean; isNewUser?: boolean }> {
    const phone = localStorage.getItem('kudi_pending_phone') || '';
    const data = await api.post('/auth/verify-otp', { phone, code });
    if (data.success) {
      localStorage.setItem('kudi_session_phone', phone);
      if (data.token) {
        localStorage.setItem('kudi_token', data.token);
      }
      return { success: true, isNewUser: data.isNewUser };
    }
    return { success: false };
  },

  async login(phone: string, password: string): Promise<{ success: boolean; message?: string }> {
    this.logout();
    try {
      const data = await api.post('/auth/login', { phone, password });
      if (data.success) {
        localStorage.setItem('kudi_pending_phone', phone);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          return { success: false, message: "We don't recognize this number." };
        }
        if (err.status === 401) {
          return { success: false, message: "Invalid password." };
        }
      }
      return { success: false, message: err?.message || 'Could not connect to server. Make sure the API is running.' };
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
