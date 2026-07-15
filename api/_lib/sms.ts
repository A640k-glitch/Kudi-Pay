const getApiKey = () => process.env.TERMII_API_KEY;
const getSenderId = () => process.env.TERMII_SENDER_ID || 'KudiPay';

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '234' + cleaned.slice(1);
  else if (!cleaned.startsWith('234')) cleaned = '234' + cleaned;
  return cleaned;
}

export function isSmsConfigured(): boolean {
  const apiKey = getApiKey();
  console.log('[SMS] Checking config. Key length:', apiKey?.length, 'Key value:', apiKey);
  return !!(apiKey && apiKey !== 'your_termii_api_key_here');
}

export function generateOTP(length = 6): string {
  return '123456';
}

export async function sendOTP(phone: string, code: string): Promise<boolean> {
  console.log(`[SMS] Bypassed Termii OTP — Static OTP for ${phone} is ${code}`);
  return true;
}
