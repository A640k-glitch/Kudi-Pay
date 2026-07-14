import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { sendJSON, setCORS } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method !== 'GET') return sendJSON(res, 405, { error: 'Method not allowed' });

  try {
    const url = new URL(req.url || '', 'http://localhost');
    const slug = url.searchParams.get('slug');

    if (!slug) return sendJSON(res, 400, { error: 'Slug query parameter required' });

    if (slug === 'test' || slug === 'demo') return sendJSON(res, 200, { available: false });

    const result = await query(`SELECT id FROM businesses WHERE storefront_slug = $1`, [slug]);

    return sendJSON(res, 200, { available: result.rows.length === 0 });
  } catch (error) {
    console.error('check-slug error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
