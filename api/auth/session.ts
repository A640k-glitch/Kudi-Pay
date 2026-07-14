import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { verifyToken, getTokenFromHeader, sendJSON, setCORS } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method !== 'GET') return sendJSON(res, 405, { error: 'Method not allowed' });

  try {
    const token = getTokenFromHeader(req);
    if (!token) return sendJSON(res, 401, { error: 'No token provided' });

    const payload = verifyToken(token);
    if (!payload) return sendJSON(res, 401, { error: 'Invalid token' });

    const result = await query(`SELECT * FROM businesses WHERE id = $1`, [payload.businessId]);
    if (result.rows.length === 0) return sendJSON(res, 401, { error: 'Business not found' });

    const business = result.rows[0];

    return sendJSON(res, 200, {
      authenticated: true,
      phone: payload.phone,
      businessId: payload.businessId,
      business
    });
  } catch (error) {
    console.error('session error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
