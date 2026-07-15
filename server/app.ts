import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { query } from '../api/_lib/db';
import { signToken, hashPassword, comparePassword, verifyToken } from '../api/_lib/auth';
import { generateOTP, sendOTP, isSmsConfigured } from '../api/_lib/sms';
import { aiAgentService } from './aiAgent';

const app = express();

app.use(cors());
app.use('/api/webhook/paystack', express.raw({ type: '*/*' }));
app.use(express.json());

import { whatsappRouter } from './whatsapp';
app.use('/api/whatsapp', whatsappRouter);

app.get('/api/health', async (_req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({ status: 'ok', db: 'connected', time: result.rows[0].now, service: 'Kudi API', version: '1.0' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});
app.get('/api', (_req, res) => res.json({ status: 'ok', service: 'Kudi API', version: '1.0' }));
app.get('/', (_req, res) => res.redirect('/api'));

app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });

    await query(`UPDATE otp_codes SET used = true WHERE phone = $1 AND used = false`, [phone]);

    const code = generateOTP();
    await query(`INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`, [phone, code]);
    await sendOTP(phone, code);

    res.json({ success: true });
  } catch (error) {
    console.error('request-otp error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Phone and code are required' });

    let otpValid = false;

    const otpResult = await query(`SELECT * FROM otp_codes WHERE phone = $1 AND code = $2 AND used = false AND expires_at > NOW()`, [phone, code]);
    if (otpResult.rows.length > 0) {
      otpValid = true;
      await query(`UPDATE otp_codes SET used = true WHERE phone = $1 AND code = $2`, [phone, code]);
    }

    if (!otpValid && !isSmsConfigured() && code === '123456') {
      otpValid = true;
    }

    if (!otpValid) return res.json({ success: false });

    const bizResult = await query(`SELECT id FROM businesses WHERE owner_phone = $1`, [phone]);
    const isNewUser = bizResult.rows.length === 0;

    let token: string | undefined;
    let business: any = null;

    if (!isNewUser) {
      token = signToken({ businessId: bizResult.rows[0].id, phone });
      const full = await query(`SELECT * FROM businesses WHERE id = $1`, [bizResult.rows[0].id]);
      business = full.rows[0];
    }

    res.json({ success: true, isNewUser, token, business });
  } catch (error) {
    console.error('verify-otp error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' });

    const bizResult = await query(`SELECT id, password_hash FROM businesses WHERE owner_phone = $1`, [phone]);
    if (bizResult.rows.length === 0) return res.status(404).json({ success: false, message: "We don't recognize this number." });

    const valid = await comparePassword(password, bizResult.rows[0].password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid password.' });

    await query(`UPDATE otp_codes SET used = true WHERE phone = $1 AND used = false`, [phone]);

    const code = generateOTP();
    await query(`INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`, [phone, code]);
    await sendOTP(phone, code);

    res.json({ success: true, isNewUser: false });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });

    const result = await query(`SELECT * FROM businesses WHERE id = $1`, [payload.businessId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Business not found' });

    res.json({ authenticated: true, phone: payload.phone, businessId: payload.businessId, business: result.rows[0] });
  } catch (error) {
    console.error('session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/businesses', async (req, res) => {
  try {
    const { ownerPhone, businessName, category, state, lga, logoUrl, storefrontSlug, theme, password } = req.body;
    if (!ownerPhone || !businessName || !category || !state || !lga || !storefrontSlug || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingSlug = await query(`SELECT id FROM businesses WHERE storefront_slug = $1`, [storefrontSlug]);
    if (existingSlug.rows.length > 0) return res.status(409).json({ error: 'Store slug is already taken' });

    const id = `biz_${Date.now()}`;
    const passwordHash = await hashPassword(password);

    const result = await query(
      `INSERT INTO businesses (id, owner_phone, business_name, category, state, lga, logo_url, storefront_slug, theme, theme_config, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id, ownerPhone, businessName, category, state, lga, logoUrl || null, storefrontSlug, theme || 'light',
       JSON.stringify({ primaryColor: '#111111', ctaText: 'Add to Bag', heroImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAei2SCO828A82z9Nk8QNfFG7OaW_4XjTjOH-FkL-c719S45Y3t7z0pk4ORAE3EHBU2kGj_RqeUA8JZ7wu8A1PhozLhrANtFNBm82qZu82WAGc3yUrfAGE6SFAYFEfkuJI4QPh8tAKzitoqE866ICR3Rlih1IBwvJl5wMIBuVzuN_FML0QGmA5dTMI5scAxa_dhmnSLesA7M7RmcF2HsOsV5ZVPBgDEBVw3IEn83Kd4rDOjANhyi3hKZawQZ94mQRz65W7WwEUnob4' }),
       passwordHash]
    );

    const business = result.rows[0];
    const token = signToken({ businessId: id, phone: ownerPhone });

    res.status(201).json({ business, token });
  } catch (error) {
    console.error('create business error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/businesses', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone query parameter required' });

    const result = await query(`SELECT * FROM businesses WHERE owner_phone = $1`, [phone]);
    res.json({ business: result.rows[0] || null });
  } catch (error) {
    console.error('get business error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/businesses/check-slug', async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'Slug query parameter required' });

    if (slug === 'test' || slug === 'demo') return res.json({ available: false });

    const result = await query(`SELECT id FROM businesses WHERE storefront_slug = $1`, [slug]);
    res.json({ available: result.rows.length === 0 });
  } catch (error) {
    console.error('check-slug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/businesses/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await query(`SELECT * FROM businesses WHERE storefront_slug = $1`, [slug]);
    if (result.rows.length === 0) {
      return res.json({
        business: {
          id: `mock_biz_${slug}`, businessName: slug.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          storefrontSlug: slug, ownerPhone: '08000000000', category: 'Fashion', state: 'Lagos', lga: 'Ikeja',
          kycTier: 3, createdAt: new Date().toISOString(), theme: 'light',
          themeConfig: { primaryColor: '#111111', ctaText: 'Add to Bag', heroImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAei2SCO828A82z9Nk8QNfFG7OaW_4XjTjOH-FkL-c719S45Y3t7z0pk4ORAE3EHBU2kGj_RqeUA8JZ7wu8A1PhozLhrANtFNBm82qZu82WAGc3yUrfAGE6SFAYFEfkuJI4QPh8tAKzitoqE866ICR3Rlih1IBwvJl5wMIBuVzuN_FML0QGmA5dTMI5scAxa_dhmnSLesA7M7RmcF2HsOsV5ZVPBgDEBVw3IEn83Kd4rDOjANhyi3hKZawQZ94mQRz65W7WwEUnob4' }
        }
      });
    }
    res.json({ business: result.rows[0] });
  } catch (error) {
    console.error('get business by slug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/businesses/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });

    const allowedFields = ['business_name', 'category', 'state', 'lga', 'logo_url', 'theme', 'theme_config', 'kyc_tier', 'cac_verification', 'tin_number'];
    const fieldMapping: Record<string, string> = {
      businessName: 'business_name',
      logoUrl: 'logo_url',
      themeConfig: 'theme_config',
      kycTier: 'kyc_tier',
      cacVerification: 'cac_verification',
      tinNumber: 'tin_number',
    };
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body)) {
      const dbKey = fieldMapping[key] || key;
      if (allowedFields.includes(dbKey)) {
        updates.push(`${dbKey} = $${idx++}`);
        values.push(value);
      }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    values.push(payload.businessId);
    const result = await query(`UPDATE businesses SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);

    res.json({ business: result.rows[0] || null });
  } catch (error) {
    console.error('update business error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: 'businessId query parameter required' });

    const result = await query(`SELECT * FROM products WHERE business_id = $1 ORDER BY created_at DESC`, [businessId]);
    res.json({ products: result.rows });
  } catch (error) {
    console.error('list products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });

    const { name, description, price, imageUrl, stockCount, isAvailable, category, attributes } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: 'Name and price are required' });

    const id = `prod_${Date.now()}`;
    const result = await query(
      `INSERT INTO products (id, business_id, name, description, price, image_url, stock_count, is_available, category, attributes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, payload.businessId, name, description || null, price, imageUrl || null, stockCount || null, isAvailable !== false, category || null, attributes ? JSON.stringify(attributes) : '{}']);

    res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    console.error('create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM products WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/products/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });

    const allowedFields = ['name', 'description', 'price', 'image_url', 'stock_count', 'is_available', 'category', 'attributes'];
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key)) { updates.push(`${key} = $${idx++}`); values.push(value); }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    values.push(req.params.id);
    values.push(payload.businessId);
    const result = await query(`UPDATE products SET ${updates.join(', ')} WHERE id = $${idx} AND business_id = $${idx + 1} RETURNING *`, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });

    const result = await query(`DELETE FROM products WHERE id = $1 AND business_id = $2 RETURNING id`, [req.params.id, payload.businessId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: 'businessId query parameter required' });
    const result = await query(`SELECT * FROM orders WHERE business_id = $1 ORDER BY created_at DESC`, [businessId]);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('list orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { businessId, customerName, customerPhone, items, totalAmount, paymentMethod } = req.body;
    if (!businessId || !customerName || !customerPhone || !items || !totalAmount || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = `ord_${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    const result = await query(
      `INSERT INTO orders (id, business_id, customer_name, customer_phone, items, total_amount, payment_method) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, businessId, customerName, customerPhone, JSON.stringify(items), totalAmount, paymentMethod]);
    res.status(201).json({ order: result.rows[0] });
  } catch (error) {
    console.error('create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM orders WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });

    const validStatuses = ['new', 'paid', 'fulfilled', 'cancelled'];
    if (!req.body.status || !validStatuses.includes(req.body.status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(`UPDATE orders SET status = $1 WHERE id = $2 AND business_id = $3 RETURNING *`,
      [req.body.status, req.params.id, payload.businessId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/ledger', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: 'businessId query parameter required' });
    const result = await query(`SELECT * FROM ledger_entries WHERE business_id = $1 ORDER BY created_at DESC`, [businessId]);
    res.json({ entries: result.rows });
  } catch (error) {
    console.error('list ledger entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/ledger/stats', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: 'businessId query parameter required' });

    const result = await query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'revenue' AND (verification_status = 'verified' OR verification_source = 'bank_api') THEN amount ELSE 0 END), 0) as revenue,
              COALESCE(SUM(CASE WHEN type = 'expense' AND (verification_status = 'verified' OR verification_source = 'bank_api') THEN amount ELSE 0 END), 0) as expenses
       FROM ledger_entries WHERE business_id = $1`, [businessId]);

    const { revenue, expenses } = result.rows[0];
    res.json({ revenue: Number(revenue), expenses: Number(expenses), profit: Number(revenue) - Number(expenses), balance: Number(revenue) - Number(expenses) });
  } catch (error) {
    console.error('ledger stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/ledger', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });

    const { type, amount, source, verificationStatus, verificationSource, bankTransactionId, metadata } = req.body;
    if (!type || !amount || !source) return res.status(400).json({ error: 'Type, amount, and source are required' });

    const id = `ent_${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    const result = await query(
      `INSERT INTO ledger_entries (id, business_id, type, amount, source, verification_status, verification_source, bank_transaction_id, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, payload.businessId, type, amount, source, verificationStatus || 'pending', verificationSource || 'manual_unverified', bankTransactionId || null, metadata ? JSON.stringify(metadata) : '{}']);

    res.status(201).json({ entry: result.rows[0] });
  } catch (error) {
    console.error('create ledger entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/bank/accounts', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: 'businessId query parameter required' });
    const result = await query(`SELECT * FROM bank_accounts WHERE business_id = $1 AND is_active = true`, [businessId]);
    res.json({ account: result.rows[0] || null });
  } catch (error) {
    console.error('get account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/bank/accounts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });

    const NIGERIAN_BANKS = [{ name: 'GTBank', code: '058' }, { name: 'Access Bank', code: '044' }, { name: 'Zenith Bank', code: '057' }, { name: 'First Bank', code: '011' }, { name: 'UBA', code: '033' }, { name: 'Fidelity Bank', code: '070' }];
    const bank = req.body.institutionCode ? NIGERIAN_BANKS.find(b => b.code === req.body.institutionCode) || NIGERIAN_BANKS[0] : NIGERIAN_BANKS[0];

    const bizResult = await query(`SELECT business_name FROM businesses WHERE id = $1`, [payload.businessId]);
    const bizName = bizResult.rows[0]?.business_name || 'Kudi BUSINESS';

    const result = await query(
      `INSERT INTO bank_accounts (id, business_id, institution, institution_code, account_number, account_name, paystack_dva) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [`acc_${Date.now()}`, payload.businessId, bank.name, bank.code, Math.floor(1000000000 + Math.random() * 9000000000).toString(), bizName.toUpperCase(),
       JSON.stringify({ bankName: 'Wema Bank', accountNumber: Math.floor(7000000000 + Math.random() * 999999999).toString(), accountName: `Kudi/${bizName.toUpperCase()}` })]);

    res.status(201).json({ account: result.rows[0] });
  } catch (error) {
    console.error('link account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/bank/transactions', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: 'businessId query parameter required' });

    const accountResult = await query(`SELECT id FROM bank_accounts WHERE business_id = $1 AND is_active = true`, [businessId]);
    if (accountResult.rows.length === 0) return res.json({ transactions: [] });

    const result = await query(`SELECT * FROM bank_transactions WHERE bank_account_id = $1 ORDER BY date DESC LIMIT 100`, [accountResult.rows[0].id]);
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('list transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/bank/transactions/sync', async (req, res) => {
  try {
    const { businessId } = req.body;
    if (!businessId) return res.status(400).json({ error: 'businessId is required' });

    const accountResult = await query(`SELECT id, balance FROM bank_accounts WHERE business_id = $1 AND is_active = true`, [businessId]);
    if (accountResult.rows.length === 0) return res.status(404).json({ error: 'No bank account found' });

    const account = accountResult.rows[0];
    let currentBalance = Number(account.balance);
    const newCount = 1 + Math.floor(Math.random() * 4);
    const newTransactions: any[] = [];
    const NAMES = ['ADEBAYO JOHNSON', 'CHIOMA OKAFOR', 'EMEKA NWOSU', 'FUNKE ADEYEMI'];
    const VENDORS = ['ALABA MARKET', 'BALOGUN TEXTILES', 'COMPUTER VILLAGE', 'SHOPRITE'];

    for (let i = 0; i < newCount; i++) {
      const isCredit = Math.random() < 0.65;
      const amount = Math.round((isCredit ? 2000 + Math.random() * 48000 : 1000 + Math.random() * 19000) / 500) * 500;
      if (!isCredit && currentBalance - amount < 5000) continue;
      currentBalance = isCredit ? currentBalance + amount : currentBalance - amount;
      newTransactions.push({
        id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        bank_account_id: account.id,
        type: isCredit ? 'credit' : 'debit',
        amount, narration: isCredit ? `TRF FRM ${NAMES[Math.floor(Math.random() * NAMES.length)]}` : `POS PURCHASE/${VENDORS[Math.floor(Math.random() * VENDORS.length)]}`,
        date: new Date().toISOString(), balance: currentBalance, category: isCredit ? 'Income' : 'Expense',
      });
    }

    for (const tx of newTransactions) {
      await query(`INSERT INTO bank_transactions (id, bank_account_id, type, amount, narration, date, balance, category) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
        [tx.id, tx.bank_account_id, tx.type, tx.amount, tx.narration, tx.date, tx.balance, tx.category]);
    }

    await query(`UPDATE bank_accounts SET balance = $1, last_synced_at = NOW() WHERE id = $2`, [currentBalance, account.id]);

    res.json({ newCount: newTransactions.length, transactions: newTransactions });
  } catch (error) {
    console.error('sync transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/score/compute', async (req, res) => {
  res.json({ status: 'success', score: req.body.score || 0 });
});

app.post('/api/webhook/paystack', (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) { console.error('PAYSTACK_SECRET_KEY not set'); return res.status(500).send('Webhook error'); }
  const raw = req.body instanceof Buffer ? req.body.toString('utf8') : null;
  if (!raw) return res.status(400).send('Missing raw body');
  const hash = crypto.createHmac('sha512', secret).update(raw).digest('hex');
  if (hash !== req.headers['x-paystack-signature']) return res.status(401).send('Invalid signature');
  const event = JSON.parse(raw);
  console.log('Received Paystack event:', event.event);
  res.status(200).send('Webhook received');
});

app.get('/api/proxy/bank/transactions', async (_req, res) => {
  res.json({ status: 'success', message: 'Proxy placeholder for Mono transactions', data: [] });
});

app.post('/api/proxy/bank/link', async (_req, res) => {
  res.json({ status: 'success', accountId: 'mono_acc_placeholder_123' });
});

app.get('/api/proxy/kyc/bvn', async (_req, res) => {
  res.json({ status: 'success', message: 'Proxy placeholder for Dojah BVN' });
});

app.get('/api/proxy/kyc/nin', async (_req, res) => {
  res.json({ status: 'success', message: 'Proxy placeholder for Dojah NIN' });
});

app.get('/api/proxy/kyc/cac', async (_req, res) => {
  res.json({ status: 'success', message: 'Proxy placeholder for Dojah CAC' });
});

app.get('/api/assistant/status', (_req, res) => {
  res.json({ active: !!process.env.GEMINI_API_KEY });
});

app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { businessId, query: queryText, clientContext } = req.body;
    if (!businessId || !queryText) {
      return res.status(400).json({ error: 'businessId and query are required' });
    }
    const reply = await aiAgentService.processDashboardQuery(businessId, queryText, clientContext);
    res.json({ reply });
  } catch (error: any) {
    console.error('Assistant chat error:', error);
    res.status(500).json({ error: error.message || 'Assistant failed to generate response' });
  }
});

// ── Global Error Handler (must be last) ─────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Express] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', detail: err?.message || 'Unknown error' });
});

export { app };
export default app;
