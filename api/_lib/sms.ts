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
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
}

export async function sendOTP(phone: string, code: string): Promise<boolean> {
  const apiKey = getApiKey();
  const senderId = getSenderId();

  if (!apiKey || apiKey === 'your_termii_api_key_here') {
    console.log(`[SMS] Dev mode — Dev fallback OTP for ${phone} is ${code}`);
    return true;
  }

  try {
    console.log(`[SMS] Sending OTP to ${phone} via Termii...`);
    const res = await fetch('https://v4.api.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        to: normalizePhone(phone),
        from: senderId,
        sms: `Your KudiPay OTP is ${code}. Valid for 5 minutes.`,
        type: 'plain',
        channel: 'generic',
      }),
    });
    const data: any = await res.json();
    console.log('[SMS] Termii response status:', res.status, 'body:', data);
    return data?.message?.toLowerCase() === 'successfully sent';
  } catch (error) {
    console.error('[SMS] Failed to send via Termii:', error);
    return false;
  }
}
