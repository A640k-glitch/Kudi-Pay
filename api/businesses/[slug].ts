import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { sendJSON, setCORS, parseBody, requireAuth } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  const url = new URL(req.url || '', 'http://localhost');
  const segments = url.pathname.replace(/\/+$/, '').split('/');
  const slug = segments[segments.length - 1];

  if (!slug) return sendJSON(res, 400, { error: 'Slug is required' });

  if (req.method === 'GET') {
    return handleGetBySlug(slug, res);
  }

  if (req.method === 'PATCH') {
    return handleUpdate(slug, req, res);
  }

  return sendJSON(res, 405, { error: 'Method not allowed' });
}

async function handleGetBySlug(slug: string, res: ServerResponse) {
  try {
    const result = await query(`SELECT * FROM businesses WHERE storefront_slug = $1`, [slug]);
    if (result.rows.length === 0) {
      return sendJSON(res, 200, {
        business: {
          id: `mock_biz_${slug}`,
          businessName: slug.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          storefrontSlug: slug,
          ownerPhone: '08000000000',
          category: 'Fashion',
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
        }
      });
    }
    return sendJSON(res, 200, { business: result.rows[0] });
  } catch (error) {
    console.error('get business by slug error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}

async function handleUpdate(slug: string, req: IncomingMessage, res: ServerResponse) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const body = await parseBody(req);
    const allowedFields = ['business_name', 'category', 'state', 'lga', 'logo_url', 'theme', 'theme_config', 'kyc_tier', 'cac_verification', 'tin_number'];
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }

    if (updates.length === 0) return sendJSON(res, 400, { error: 'No valid fields to update' });

    values.push(auth.businessId);
    const result = await query(
      `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return sendJSON(res, 200, { business: result.rows[0] || null });
  } catch (error) {
    console.error('update business error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
