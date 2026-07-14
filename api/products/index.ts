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
      `SELECT * FROM products WHERE business_id = $1 ORDER BY created_at DESC`,
      [businessId]
    );

    let products = result.rows;

    if (products.length === 0) {
      const mockProducts = [
        { id: `prod_mock1_${businessId}`, business_id: businessId, name: 'Royal Silk Ankara Dress', price: 25000, is_available: true, description: 'Handcrafted premium grade Ankara fabric silk dress with custom gold lining.', category: 'Clothing', image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80', created_at: new Date().toISOString(), stock_count: 15, attributes: {} },
        { id: `prod_mock2_${businessId}`, business_id: businessId, name: 'Italian Suede Stiletto Heels', price: 35000, is_available: true, description: 'Authentic custom Italian suede dress shoes designed for extreme comfort and elegance.', category: 'Footwear', image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80', created_at: new Date().toISOString(), stock_count: 8, attributes: {} },
        { id: `prod_mock3_${businessId}`, business_id: businessId, name: 'Luxury Traditional Coral Beads', price: 18000, is_available: true, description: 'Stunning handcrafted traditional wedding coral bead accessories, imported from Edo state.', category: 'Accessories', image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80', created_at: new Date().toISOString(), stock_count: 20, attributes: {} },
      ];
      for (const p of mockProducts) {
        await query(
          `INSERT INTO products (id, business_id, name, price, is_available, description, category, image_url, created_at, stock_count, attributes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING`,
          [p.id, p.business_id, p.name, p.price, p.is_available, p.description, p.category, p.image_url, p.created_at, p.stock_count, JSON.stringify(p.attributes)]
        );
      }
      return sendJSON(res, 200, { products: mockProducts });
    }

    return sendJSON(res, 200, { products });
  } catch (error) {
    console.error('list products error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}

async function handleCreate(req: IncomingMessage, res: ServerResponse) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const body = await parseBody(req);
    const { name, description, price, imageUrl, stockCount, isAvailable, category, attributes } = body;

    if (!name || price === undefined) {
      return sendJSON(res, 400, { error: 'Name and price are required' });
    }

    const id = `prod_${Date.now()}`;
    const result = await query(
      `INSERT INTO products (id, business_id, name, description, price, image_url, stock_count, is_available, category, attributes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, auth.businessId, name, description || null, price, imageUrl || null, stockCount || null, isAvailable !== false, category || null, attributes ? JSON.stringify(attributes) : '{}']
    );

    return sendJSON(res, 201, { product: result.rows[0] });
  } catch (error) {
    console.error('create product error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
