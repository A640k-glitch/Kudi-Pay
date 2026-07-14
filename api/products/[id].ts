import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { sendJSON, setCORS, parseBody, requireAuth } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  const url = new URL(req.url || '', 'http://localhost');
  const segments = url.pathname.replace(/\/+$/, '').split('/');
  const id = segments[segments.length - 1];

  if (!id) return sendJSON(res, 400, { error: 'Product ID is required' });

  if (req.method === 'GET') return handleGet(id, res);
  if (req.method === 'PATCH') return handleUpdate(id, req, res);
  if (req.method === 'DELETE') return handleDelete(id, req, res);

  return sendJSON(res, 405, { error: 'Method not allowed' });
}

async function handleGet(id: string, res: ServerResponse) {
  try {
    const result = await query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (result.rows.length === 0) return sendJSON(res, 404, { error: 'Product not found' });
    return sendJSON(res, 200, { product: result.rows[0] });
  } catch (error) {
    console.error('get product error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}

async function handleUpdate(id: string, req: IncomingMessage, res: ServerResponse) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const body = await parseBody(req);
    const allowedFields = ['name', 'description', 'price', 'image_url', 'stock_count', 'is_available', 'category', 'attributes'];
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

    values.push(id);
    values.push(auth.businessId);
    const result = await query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${idx} AND business_id = $${idx + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return sendJSON(res, 404, { error: 'Product not found' });
    return sendJSON(res, 200, { product: result.rows[0] });
  } catch (error) {
    console.error('update product error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}

async function handleDelete(id: string, req: IncomingMessage, res: ServerResponse) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const result = await query(`DELETE FROM products WHERE id = $1 AND business_id = $2 RETURNING id`, [id, auth.businessId]);
    if (result.rows.length === 0) return sendJSON(res, 404, { error: 'Product not found' });
    return sendJSON(res, 200, { success: true });
  } catch (error) {
    console.error('delete product error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
