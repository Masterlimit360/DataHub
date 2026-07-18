const axios = require('axios');
require('dotenv').config();

/**
 * Normalizes phone numbers to Ghanaian format (233XXXXXXXXX)
 */
function normalizePhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '233' + cleaned.substring(1);
  }
  if (cleaned.length === 9) {
    return '233' + cleaned;
  }
  return cleaned;
}

/**
 * Send SMS via GiantSMS API (https://api.giantsms.com/api/v1/send)
 */
async function sendViaGiantSms(to, message) {
  const senderId = process.env.SMS_SENDER_ID || 'JBDataHub';
  const token = process.env.GIANTSMS_TOKEN;
  const username = process.env.GIANTSMS_USERNAME;
  const password = process.env.GIANTSMS_PASSWORD;
  const normalizedTo = normalizePhoneNumber(to);

  const payload = {
    from: senderId,
    to: normalizedTo,
    message,
    msg: message,
  };

  const config = {
    timeout: 10000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  };

  if (token) {
    config.headers.Authorization = `Basic ${token}`;
  } else if (username && password) {
    config.auth = { username, password };
  } else {
    console.log(`[SMS Service] [MOCK] To: ${to} | Msg: ${message}`);
    return true;
  }

  const response = await axios.post('https://api.giantsms.com/api/v1/send', payload, config);
  const data = response.data;
  const ok =
    data?.status === 'success' ||
    data?.status === true ||
    data?.success === true ||
    data?.code === 1000 ||
    response.status === 200;

  if (ok) {
    console.log('[SMS Service] GiantSMS message sent:', data);
    return true;
  }

  console.error('[SMS Service] GiantSMS send failed:', data);
  return false;
}

/**
 * Sends SMS notifications to customers after order events.
 */
async function sendSMS(to, message) {
  const provider = (process.env.SMS_PROVIDER || 'giantsms').toLowerCase();

  try {
    if (provider === 'giantsms') {
      return await sendViaGiantSms(to, message);
    }

    // Legacy Arkesel fallback
    const apiKey = process.env.SMS_GATEWAY_API_KEY;
    const senderId = process.env.SMS_SENDER_ID || 'JBDataHub';

    if (!apiKey) {
      console.log(`[SMS Service] [MOCK] To: ${to} | Msg: ${message}`);
      return true;
    }

    const normalizedTo = normalizePhoneNumber(to);
    const response = await axios.post(
      'https://sms.arkesel.com/api/v2/sms/send',
      { sender: senderId, message, recipients: [normalizedTo] },
      {
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        timeout: 10000,
      }
    );

    const ok = response.data && (response.data.status === 'success' || response.data.code === 1000);
    return ok;
  } catch (error) {
    console.error('[SMS Service] SMS exception:', error.response?.data || error.message);
    return false;
  }
}

module.exports = {
  sendSMS,
  normalizePhoneNumber,
};
