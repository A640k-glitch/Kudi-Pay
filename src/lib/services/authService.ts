import { Business } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  async sendOTP(phone: string): Promise<boolean> {
    await delay(800);
    localStorage.setItem("coda_pending_phone", phone);
    return true;
  },

  async verifyOTP(code: string): Promise<{ success: boolean; isNewUser?: boolean }> {
    await delay(800);
    if (code === "123456") {
      const phone = localStorage.getItem("coda_pending_phone") || "";
      localStorage.setItem("coda_session_phone", phone);
      // Simulate checking if business exists
      const businessesStr = localStorage.getItem("coda_businesses");
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
    localStorage.removeItem("coda_session_phone");
    localStorage.removeItem("coda_pending_phone");
  },

  getCurrentPhone(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("coda_session_phone");
    }
    return null;
  }
};
