import { Business } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  async sendOTP(phone: string): Promise<boolean> {
    await delay(800);
    localStorage.setItem("kudi_pending_phone", phone);
    return true;
  },

  async verifyOTP(code: string): Promise<{ success: boolean; isNewUser?: boolean }> {
    await delay(800);
    if (code === "123456") {
      const phone = localStorage.getItem("kudi_pending_phone") || "";
      localStorage.setItem("kudi_session_phone", phone);
      // Simulate checking if business exists
      const businessesStr = localStorage.getItem("kudi_businesses");
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
  },

  logout() {
    localStorage.removeItem("kudi_session_phone");
    localStorage.removeItem("kudi_pending_phone");
  },

  getCurrentPhone(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kudi_session_phone");
    }
    return null;
  }
};
