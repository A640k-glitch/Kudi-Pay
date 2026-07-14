const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'KudiPay';

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '234' + cleaned.slice(1);
  else if (!cleaned.startsWith('234')) cleaned = '234' + cleaned;
  return cleaned;
}

export function isSmsConfigured(): boolean {
  return !!(TERMII_API_KEY && TERMII_API_KEY !== 'your_termii_api_key_here');
}

export function generateOTP(length = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
}

export async function sendOTP(phone: string, code: string): Promise<boolean> {
  if (!TERMII_API_KEY || TERMII_API_KEY === 'your_termii_api_key_here') {
    console.log(`[SMS] Dev mode — OTP for ${phone} is ${code}`);
    return true;
  }

  try {
    const res = await fetch('https://api.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to: normalizePhone(phone),
        from: TERMII_SENDER_ID,
        sms: `Your KudiPay OTP is ${code}. Valid for 5 minutes.`,
        type: 'plain',
        channel: 'generic',
      }),
    });
    const data = await res.json();
    return data?.message === 'Successfully sent';
  } catch (error) {
    console.error('[SMS] Failed to send via Termii:', error);
    return false;
  }
}
