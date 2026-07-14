import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { signToken, hashPassword, sendJSON, setCORS, parseBody, requireAuth } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method === 'POST') {
    return handleCreate(req, res);
  }

  if (req.method === 'GET') {
    return handleGetByPhone(req, res);
  }

  return sendJSON(res, 405, { error: 'Method not allowed' });
}

async function handleCreate(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await parseBody(req);
    const { ownerPhone, businessName, category, state, lga, logoUrl, storefrontSlug, theme, password } = body;

    if (!ownerPhone || !businessName || !category || !state || !lga || !storefrontSlug || !password) {
      return sendJSON(res, 400, { error: 'Missing required fields' });
    }

    const existingSlug = await query(`SELECT id FROM businesses WHERE storefront_slug = $1`, [storefrontSlug]);
    if (existingSlug.rows.length > 0) {
      return sendJSON(res, 409, { error: 'Store slug is already taken' });
    }

    const id = `biz_${Date.now()}`;
    const passwordHash = await hashPassword(password);

    const result = await query(
      `INSERT INTO businesses (id, owner_phone, business_name, category, state, lga, logo_url, storefront_slug, theme, theme_config, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id, ownerPhone, businessName, category, state, lga,
        logoUrl || null, storefrontSlug, theme || 'light',
        JSON.stringify({
          primaryColor: '#111111',
          ctaText: 'Add to Bag',
          heroImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAei2SCO828A82z9Nk8QNfFG7OaW_4XjTjOH-FkL-c719S45Y3t7z0pk4ORAE3EHBU2kGj_RqeUA8JZ7wu8A1PhozLhrANtFNBm82qZu82WAGc3yUrfAGE6SFAYFEfkuJI4QPh8tAKzitoqE866ICR3Rlih1IBwvJl5wMIBuVzuN_FML0QGmA5dTMI5scAxa_dhmnSLesA7M7RmcF2HsOsV5ZVPBgDEBVw3IEn83Kd4rDOjANhyi3hKZawQZ94mQRz65W7WwEUnob4'
        }),
        passwordHash
      ]
    );

    const business = result.rows[0];
    const token = signToken({ businessId: id, phone: ownerPhone });

    return sendJSON(res, 201, { business, token });
  } catch (error) {
    console.error('create business error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}

async function handleGetByPhone(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url || '', 'http://localhost');
    const phone = url.searchParams.get('phone');

    if (!phone) return sendJSON(res, 400, { error: 'Phone query parameter required' });

    const result = await query(`SELECT * FROM businesses WHERE owner_phone = $1`, [phone]);
    if (result.rows.length === 0) return sendJSON(res, 200, { business: null });

    return sendJSON(res, 200, { business: result.rows[0] });
  } catch (error) {
    console.error('get business error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
