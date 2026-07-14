import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { comparePassword, sendJSON, setCORS, parseBody } from '../_lib/auth';
import { generateOTP, sendOTP } from '../_lib/sms';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method !== 'POST') return sendJSON(res, 405, { error: 'Method not allowed' });

  try {
    const { phone, password } = await parseBody(req);
    if (!phone || !password) return sendJSON(res, 400, { error: 'Phone and password are required' });

    const bizResult = await query(
      `SELECT id, password_hash FROM businesses WHERE owner_phone = $1`,
      [phone]
    );

    if (bizResult.rows.length === 0) {
      return sendJSON(res, 404, { success: false, message: "We don't recognize this number." });
    }

    const biz = bizResult.rows[0];
    const valid = await comparePassword(password, biz.password_hash);
    if (!valid) {
      return sendJSON(res, 401, { success: false, message: 'Invalid password.' });
    }

    await query(`UPDATE otp_codes SET used = true WHERE phone = $1 AND used = false`, [phone]);

    const code = generateOTP();
    await query(
      `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
      [phone, code]
    );

    await sendOTP(phone, code);

    return sendJSON(res, 200, { success: true, isNewUser: false });
  } catch (error) {
    console.error('login error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
