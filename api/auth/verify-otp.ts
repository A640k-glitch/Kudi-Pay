import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { signToken, sendJSON, setCORS, parseBody } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method !== 'POST') return sendJSON(res, 405, { error: 'Method not allowed' });

  try {
    const { phone, code } = await parseBody(req);
    if (!phone || !code) return sendJSON(res, 400, { error: 'Phone and code are required' });

    let otpValid = false;

    // Try DB lookup first
    const otpResult = await query(
      `SELECT * FROM otp_codes WHERE phone = $1 AND code = $2 AND used = false AND expires_at > NOW()`,
      [phone, code]
    );

    if (otpResult.rows.length > 0) {
      otpValid = true;
      await query(`UPDATE otp_codes SET used = true WHERE phone = $1 AND code = $2`, [phone, code]);
    }

    if (!otpValid) {
      return sendJSON(res, 200, { success: false });
    }

    const bizResult = await query(`SELECT id FROM businesses WHERE owner_phone = $1`, [phone]);
    const isNewUser = bizResult.rows.length === 0;

    let token: string | undefined;
    let business: any = null;

    if (!isNewUser) {
      const biz = bizResult.rows[0];
      token = signToken({ businessId: biz.id, phone });

      const fullResult = await query(`SELECT * FROM businesses WHERE id = $1`, [biz.id]);
      business = fullResult.rows[0];
    }

    return sendJSON(res, 200, { success: true, isNewUser, token, business });
  } catch (error) {
    console.error('verify-otp error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
