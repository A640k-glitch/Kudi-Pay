import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { sendJSON, setCORS, parseBody, requireAuth } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  const url = new URL(req.url || '', 'http://localhost');
  const segments = url.pathname.replace(/\/+$/, '').split('/');
  const id = segments[segments.length - 1];

  if (!id) return sendJSON(res, 400, { error: 'Order ID is required' });

  if (req.method === 'GET') return handleGet(id, res);
  if (req.method === 'PATCH') return handleUpdateStatus(id, req, res);

  return sendJSON(res, 405, { error: 'Method not allowed' });
}

async function handleGet(id: string, res: ServerResponse) {
  try {
    const result = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (result.rows.length === 0) return sendJSON(res, 404, { error: 'Order not found' });
    return sendJSON(res, 200, { order: result.rows[0] });
  } catch (error) {
    console.error('get order error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}

async function handleUpdateStatus(id: string, req: IncomingMessage, res: ServerResponse) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const body = await parseBody(req);
    const validStatuses = ['new', 'paid', 'fulfilled', 'cancelled'];

    if (!body.status || !validStatuses.includes(body.status)) {
      return sendJSON(res, 400, { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    const result = await query(
      `UPDATE orders SET status = $1 WHERE id = $2 AND business_id = $3 RETURNING *`,
      [body.status, id, auth.businessId]
    );

    if (result.rows.length === 0) return sendJSON(res, 404, { error: 'Order not found' });
    return sendJSON(res, 200, { order: result.rows[0] });
  } catch (error) {
    console.error('update order error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
