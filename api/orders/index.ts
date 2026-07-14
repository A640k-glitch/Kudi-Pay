import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { sendJSON, setCORS, parseBody, requireAuth } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);

  return sendJSON(res, 405, { error: 'Method not allowed' });
}

async function handleList(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url || '', 'http://localhost');
    const businessId = url.searchParams.get('businessId');

    if (!businessId) return sendJSON(res, 400, { error: 'businessId query parameter required' });

    const result = await query(
      `SELECT * FROM orders WHERE business_id = $1 ORDER BY created_at DESC`,
      [businessId]
    );

    return sendJSON(res, 200, { orders: result.rows });
  } catch (error) {
    console.error('list orders error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}

async function handleCreate(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await parseBody(req);
    const { businessId, customerName, customerPhone, items, totalAmount, paymentMethod } = body;

    if (!businessId || !customerName || !customerPhone || !items || !totalAmount || !paymentMethod) {
      return sendJSON(res, 400, { error: 'Missing required fields' });
    }

    const id = `ord_${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    const result = await query(
      `INSERT INTO orders (id, business_id, customer_name, customer_phone, items, total_amount, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, businessId, customerName, customerPhone, JSON.stringify(items), totalAmount, paymentMethod]
    );

    return sendJSON(res, 201, { order: result.rows[0] });
  } catch (error) {
    console.error('create order error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
