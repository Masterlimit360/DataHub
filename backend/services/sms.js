const axios = require('axios');
require('dotenv').config();

/**
 * Normalizes phone numbers to Ghanaian format (233XXXXXXXXX)
 * @param {string} phone
 * @returns {string}
 */
function normalizePhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '233' + cleaned.substring(1);
  }
  if (cleaned.length === 9) {
    return '233' + cleaned;
  }
  return cleaned; // assume already formatted
}

/**
 * Sends SMS notifications using Arkesel SMS gateway
 * @param {string} to Phone number of recipient
 * @param {string} message Text message to send
 * @returns {Promise<boolean>} Success state of the request
 */
async function sendSMS(to, message) {
  const apiKey = process.env.SMS_GATEWAY_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'JBDataHub';

  if (!apiKey) {
    console.log(`[SMS Service] [MOCK] To: ${to} | Msg: ${message}`);
    return true;
  }

  const normalizedTo = normalizePhoneNumber(to);
  console.log(`[SMS Service] Sending message to ${normalizedTo} using Arkesel`);

  try {
    const response = await axios.post('https://sms.arkesel.com/api/v2/sms/send', {
      sender: senderId,
      message: message,
      recipients: [normalizedTo]
    }, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && (response.data.status === 'success' || response.data.code === 1000)) {
      console.log(`[SMS Service] SMS successfully sent. Response:`, response.data);
      return true;
    } else {
      console.error(`[SMS Service] SMS failed. Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`[SMS Service] SMS exception error:`, error.response?.data || error.message);
    return false; // don't block order execution if SMS fails
  }
}

module.exports = {
  sendSMS,
  normalizePhoneNumber
};
