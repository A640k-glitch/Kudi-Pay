/**
 * Business Verification Service
 * 
 * Adapter pattern: In development mode, returns simulated CAC/TIN
 * verification results. In production, proxies to Dojah API for
 * real government database lookups.
 */

import type { CACVerification } from '../types';
import { api } from '../api';

const isDev = () => {
  try {
    return (import.meta as any).env?.MODE !== 'production';
  } catch {
    return true;
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Storage
const CAC_VERIFICATIONS_KEY = 'kudi_cac_verifications';
const TIN_VERIFICATIONS_KEY = 'kudi_tin_verifications';

// ── Simulated CAC Data (DEV ONLY) ───────────────────────────
const COMPANY_TYPES = ['RC', 'BN'] as const;
const SIMULATED_COMPANIES: Record<string, Partial<CACVerification>> = {
  // A few "real-looking" test entries for dev
  'RC1234567': { companyName: 'Kudi TECHNOLOGIES LTD', registrationDate: '2022-03-15', companyType: 'RC', status: 'active' },
  'RC7654321': { companyName: 'FASHOLA TEXTILES NIG LTD', registrationDate: '2019-08-22', companyType: 'RC', status: 'active' },
  'BN3456789': { companyName: 'ADEBAYO FASHION HOUSE', registrationDate: '2023-06-10', companyType: 'BN', status: 'active' },
};

export interface BVNVerificationResult {
  valid: boolean;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  enrollmentBank?: string;
}

export interface NINVerificationResult {
  valid: boolean;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  photo?: string; // Base64 image for liveness comparison
}

export interface TINVerificationResult {
  valid: boolean;
  taxId?: string;
  companyName?: string;
  status?: 'active' | 'inactive';
}

export const businessVerificationService = {
  /**
   * Verify a CAC RC/BN number.
   * DEV: Returns simulated data or generates plausible response.
   * PROD: Calls Dojah GET /api/v1/kyc/cac
   */
  async verifyCACNumber(rcNumber: string, businessId: string): Promise<CACVerification | null> {
    if (isDev()) {
      return this._devVerifyCAC(rcNumber, businessId);
    }
    try {
      const data = await api.get(`/proxy/kyc/cac?rcNumber=${encodeURIComponent(rcNumber)}`);
      if (data.entity) {
        const ent = data.entity;
        const verification: CACVerification = {
          rcNumber: ent.rcNumber || ent.rc_number || rcNumber,
          companyName: ent.companyName || ent.company_name || 'VERIFIED CAC COMPANY',
          registrationDate: ent.registrationDate || ent.registration_date || new Date().toISOString().split('T')[0],
          companyType: ent.companyType || ent.company_type || 'RC',
          status: ent.status || 'active',
          verifiedAt: new Date().toISOString(),
        };
        // Also save it locally for speed/compatibility
        this._saveCACVerification(businessId, verification);
        return verification;
      }
      return null;
    } catch (error) {
      console.error('Failed to verify CAC in production:', error);
      throw error;
    }
  },

  /**
   * Verify a TIN (Tax Identification Number).
   * DEV: Returns simulated result.
   * PROD: Calls Dojah GET /api/v1/kyc/tin
   */
  async verifyTIN(tinNumber: string): Promise<TINVerificationResult> {
    if (isDev()) {
      return this._devVerifyTIN(tinNumber);
    }
    try {
      const data = await api.get(`/proxy/kyc/tin?tin=${encodeURIComponent(tinNumber)}`);
      if (data.entity) {
        const ent = data.entity;
        return {
          valid: true,
          taxId: ent.taxId || ent.tin || tinNumber,
          companyName: ent.companyName || ent.company_name || 'VERIFIED TAXPAYER',
          status: ent.status || 'active',
        };
      }
      return { valid: false };
    } catch (error) {
      console.error('Failed to verify TIN in production:', error);
      return { valid: false };
    }
  },

  /**
   * Verify BVN (Bank Verification Number).
   * DEV: Simulated validation.
   * PROD: Calls Dojah GET /api/v1/kyc/bvn
   */
  async verifyBVN(bvnNumber: string): Promise<BVNVerificationResult> {
    if (isDev()) {
      return this._devVerifyBVN(bvnNumber);
    }
    try {
      const data = await api.get(`/proxy/kyc/bvn?bvn=${encodeURIComponent(bvnNumber)}`);
      if (data.entity) {
        const ent = data.entity;
        return {
          valid: true,
          firstName: ent.firstName || ent.first_name,
          lastName: ent.lastName || ent.last_name,
          dateOfBirth: ent.dateOfBirth || ent.date_of_birth,
          phoneNumber: ent.phoneNumber || ent.phone_number,
          enrollmentBank: ent.enrollmentBank || ent.enrollment_bank,
        };
      }
      return { valid: false };
    } catch (error) {
      console.error('Failed to verify BVN in production:', error);
      return { valid: false };
    }
  },

  /**
   * Verify NIN (National Identity Number) or vNIN.
   * DEV: Simulated validation.
   * PROD: Calls Dojah GET /api/v1/kyc/nin or /vnin
   */
  async verifyNIN(ninNumber: string): Promise<NINVerificationResult> {
    if (isDev()) {
      return this._devVerifyNIN(ninNumber);
    }
    try {
      const data = await api.get(`/proxy/kyc/nin?nin=${encodeURIComponent(ninNumber)}`);
      if (data.entity) {
        const ent = data.entity;
        return {
          valid: true,
          firstName: ent.firstName || ent.first_name,
          lastName: ent.lastName || ent.last_name,
          dateOfBirth: ent.dateOfBirth || ent.date_of_birth,
          gender: ent.gender,
        };
      }
      return { valid: false };
    } catch (error) {
      console.error('Failed to verify NIN in production:', error);
      return { valid: false };
    }
  },

  /**
   * Get stored CAC verification for a business.
   */
  async getCACVerification(businessId: string): Promise<CACVerification | null> {
    await delay(100);
    const verifications = this._getAllCACVerifications();
    return verifications.find((v: any) => v._businessId === businessId) || null;
  },

  /**
   * Compute business age in days from CAC registration date or business creation date.
   */
  getBusinessAgeDays(business: { createdAt: string; cacVerification?: CACVerification }): number {
    // If CAC is verified, use registration date (more authoritative)
    const referenceDate = business.cacVerification?.registrationDate || business.createdAt;
    const created = new Date(referenceDate).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - created) / (24 * 60 * 60 * 1000)));
  },

  // ── DEV-ONLY implementations ────────────────────────────

  async _devVerifyCAC(rcNumber: string, businessId: string): Promise<CACVerification | null> {
    await delay(1500); // Simulate API call

    const normalized = rcNumber.toUpperCase().replace(/\s/g, '');

    // Check if it matches a known test entry
    const known = SIMULATED_COMPANIES[normalized];
    if (known) {
      const verification: CACVerification = {
        rcNumber: normalized,
        companyName: known.companyName || '',
        registrationDate: known.registrationDate || '2023-01-01',
        companyType: known.companyType || 'RC',
        status: known.status || 'active',
        verifiedAt: new Date().toISOString(),
      };
      this._saveCACVerification(businessId, verification);
      return verification;
    }

    // For any other RC/BN number, generate plausible data
    if (/^(RC|BN)\d{5,}$/i.test(normalized)) {
      // Extract the prefix to determine type
      const prefix = normalized.slice(0, 2).toUpperCase();
      // Generate a registration date 1-5 years ago
      const yearsAgo = 1 + Math.floor(Math.random() * 5);
      const regDate = new Date();
      regDate.setFullYear(regDate.getFullYear() - yearsAgo);

      const verification: CACVerification = {
        rcNumber: normalized,
        companyName: `VERIFIED BUSINESS ${normalized}`,
        registrationDate: regDate.toISOString().split('T')[0],
        companyType: prefix === 'BN' ? 'BN' : 'RC',
        status: 'active',
        verifiedAt: new Date().toISOString(),
      };
      this._saveCACVerification(businessId, verification);
      return verification;
    }

    // Invalid format
    return null;
  },

  async _devVerifyTIN(tinNumber: string): Promise<TINVerificationResult> {
    await delay(1200);

    // Valid TIN format: 8+ digits
    if (/^\d{8,}$/.test(tinNumber.replace(/-/g, ''))) {
      return {
        valid: true,
        taxId: tinNumber,
        companyName: 'VERIFIED TAXPAYER',
        status: 'active',
      };
    }
    return { valid: false };
  },

  async _devVerifyBVN(bvnNumber: string): Promise<BVNVerificationResult> {
    await delay(1200);

    // Valid BVN: exactly 11 digits
    if (/^\d{11}$/.test(bvnNumber)) {
      return {
        valid: true,
        firstName: 'ADEOLA',
        lastName: 'JOHNSON',
        dateOfBirth: '1990-05-15',
        phoneNumber: '0801****567',
        enrollmentBank: 'GTBank',
      };
    }
    return { valid: false };
  },

  async _devVerifyNIN(ninNumber: string): Promise<NINVerificationResult> {
    await delay(1200);

    // Valid NIN: 11 digits or vNIN: 16 alphanumeric chars
    if (/^\d{11}$/.test(ninNumber) || /^[A-Za-z0-9]{16}$/.test(ninNumber)) {
      return {
        valid: true,
        firstName: 'ADEOLA',
        lastName: 'JOHNSON',
        dateOfBirth: '1990-05-15',
        gender: 'Male',
      };
    }
    return { valid: false };
  },

  // ── Storage ─────────────────────────────────────────────
  _saveCACVerification(businessId: string, verification: CACVerification): void {
    const verifications = this._getAllCACVerifications();
    // Remove existing for this business
    const filtered = verifications.filter((v: any) => v._businessId !== businessId);
    filtered.push({ ...verification, _businessId: businessId });
    localStorage.setItem(CAC_VERIFICATIONS_KEY, JSON.stringify(filtered));
  },

  _getAllCACVerifications(): any[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem(CAC_VERIFICATIONS_KEY);
    return str ? JSON.parse(str) : [];
  },
};
