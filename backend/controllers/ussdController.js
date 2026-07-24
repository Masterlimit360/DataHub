const db = require('../db');
const axios = require('axios');
const { sendSMS } = require('../services/sms');

/**
 * Helper to generate unique order reference
 */
function generateOrderReference() {
  return 'JB-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

let tableChecked = false;

/**
 * Handle GiantSMS USSD Webhook
 */
async function handleUssd(req, res) {
  let payload = req.body || {};
  // Fallback for wrong Content-Type headers from GiantSMS
  if (Object.keys(payload).length === 1 && typeof Object.keys(payload)[0] === 'string' && Object.keys(payload)[0].startsWith('{')) {
    try { payload = JSON.parse(Object.keys(payload)[0]); } catch(e) {}
  } else if (Object.keys(payload).length === 0 && typeof req.body === 'string') {
    try { payload = JSON.parse(req.body); } catch(e) {}
  }

  const data = payload.data || '';
  const msisdn = payload.msisdn || '';
  const isNew = payload.new === true || payload.new === 'true' || payload.new === 1;
  const sessionId = payload.sessionId || payload.sequenceID || '';
  const phoneNumber = msisdn || payload.phoneNumber || '';
  
  let response = '';
  let text = '';
  
  try {
    if (!tableChecked) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS ussd_sessions (
          session_id VARCHAR(255) PRIMARY KEY,
          session_data TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      tableChecked = true;
    }

    if (isNew || data === '*239*239#') {
      text = '';
      await db.query(`
        INSERT INTO ussd_sessions (session_id, session_data) 
        VALUES ($1, $2)
        ON CONFLICT (session_id) DO UPDATE SET session_data = EXCLUDED.session_data
      `, [sessionId, '']);
    } else {
      const sessionRes = await db.query('SELECT session_data FROM ussd_sessions WHERE session_id = $1', [sessionId]);
      if (sessionRes.rows.length === 0) {
        return res.json({
          message: "Session expired. Please dial *239*239# again.",
          reply: false
        });
      }
      const previousText = sessionRes.rows[0].session_data;
      text = previousText === '' ? data : `${previousText}*${data}`;
      await db.query('UPDATE ussd_sessions SET session_data = $1 WHERE session_id = $2', [text, sessionId]);
    }

    // If text is empty or not provided, it's the first step
    const textArray = text === '' ? [] : text.split('*');

    if (textArray.length === 0) {
      // ---- Step 0: Welcome Menu -> Show Networks ----
      const networksRes = await db.query("SELECT * FROM networks WHERE is_active = true ORDER BY (CASE WHEN name = 'MTN Ghana' THEN 1 ELSE 2 END), name ASC");
      
      response = "CON Welcome to JB-DataHub\nSelect Network:\n";
      networksRes.rows.forEach((net, index) => {
        response += `${index + 1}. ${net.name}\n`;
      });
      
    } else if (textArray.length === 1) {
      // ---- Step 1: Chose Network -> Show Bundles ----
      const networkIndex = parseInt(textArray[0]) - 1;
      const networksRes = await db.query("SELECT * FROM networks WHERE is_active = true ORDER BY (CASE WHEN name = 'MTN Ghana' THEN 1 ELSE 2 END), name ASC");
      
      if (networkIndex < 0 || networkIndex >= networksRes.rows.length) {
        response = "END Invalid network selection.";
      } else {
        const selectedNetwork = networksRes.rows[networkIndex];
        
        const bundlesRes = await db.query(
          'SELECT * FROM bundles WHERE network_id = $1 AND is_active = true ORDER BY price_ghs ASC',
          [selectedNetwork.id]
        );
        
        if (bundlesRes.rows.length === 0) {
          response = "END No bundles available for this network.";
        } else {
          response = `CON Select Bundle (${selectedNetwork.name}):\n`;
          bundlesRes.rows.forEach((b, index) => {
            response += `${index + 1}. ${b.label} - GHS ${b.price_ghs}\n`;
          });
        }
      }

    } else if (textArray.length === 2) {
      // ---- Step 2: Chose Bundle -> Ask for Phone Number ----
      const networkIndex = parseInt(textArray[0]) - 1;
      const bundleIndex = parseInt(textArray[1]) - 1;
      
      const networksRes = await db.query("SELECT * FROM networks WHERE is_active = true ORDER BY (CASE WHEN name = 'MTN Ghana' THEN 1 ELSE 2 END), name ASC");
      
      if (networkIndex < 0 || networkIndex >= networksRes.rows.length) {
        response = "END Invalid selection.";
      } else {
        const selectedNetwork = networksRes.rows[networkIndex];
        const bundlesRes = await db.query(
          'SELECT * FROM bundles WHERE network_id = $1 AND is_active = true ORDER BY price_ghs ASC',
          [selectedNetwork.id]
        );
        
        if (bundleIndex < 0 || bundleIndex >= bundlesRes.rows.length) {
          response = "END Invalid bundle selection.";
        } else {
          response = "CON Enter the phone number to receive the data bundle (e.g., 0244123456):\n";
        }
      }

    } else if (textArray.length === 3) {
      // ---- Step 3: Entered Phone Number -> Confirm Purchase ----
      const networkIndex = parseInt(textArray[0]) - 1;
      const bundleIndex = parseInt(textArray[1]) - 1;
      const targetPhone = textArray[2];
      
      const networksRes = await db.query("SELECT * FROM networks WHERE is_active = true ORDER BY (CASE WHEN name = 'MTN Ghana' THEN 1 ELSE 2 END), name ASC");
      
      if (networkIndex < 0 || networkIndex >= networksRes.rows.length) {
        response = "END Invalid selection.";
      } else {
        const selectedNetwork = networksRes.rows[networkIndex];
        const bundlesRes = await db.query(
          'SELECT * FROM bundles WHERE network_id = $1 AND is_active = true ORDER BY price_ghs ASC',
          [selectedNetwork.id]
        );
        
        if (bundleIndex < 0 || bundleIndex >= bundlesRes.rows.length) {
          response = "END Invalid bundle selection.";
        } else {
          const selectedBundle = bundlesRes.rows[bundleIndex];
          response = `CON Confirm Purchase:\n`;
          response += `${selectedBundle.label} for GHS ${selectedBundle.price_ghs}\n`;
          response += `To: ${targetPhone}\n`;
          response += `1. Confirm\n2. Cancel`;
        }
      }

    } else if (textArray.length === 4) {
      // ---- Step 4: Confirm or Cancel -> Create Order & Send Payment Link ----
      const networkIndex = parseInt(textArray[0]) - 1;
      const bundleIndex = parseInt(textArray[1]) - 1;
      const targetPhone = textArray[2];
      const confirmChoice = textArray[3];
      
      if (confirmChoice !== '1') {
        response = "END Purchase cancelled.";
      } else {
        const networksRes = await db.query("SELECT * FROM networks WHERE is_active = true ORDER BY (CASE WHEN name = 'MTN Ghana' THEN 1 ELSE 2 END), name ASC");
        if (networkIndex < 0 || networkIndex >= networksRes.rows.length) {
          return res.json({ message: "Invalid selection.", reply: false });
        }
        
        const selectedNetwork = networksRes.rows[networkIndex];
        const bundlesRes = await db.query(
          'SELECT * FROM bundles WHERE network_id = $1 AND is_active = true ORDER BY price_ghs ASC',
          [selectedNetwork.id]
        );
        
        if (bundleIndex < 0 || bundleIndex >= bundlesRes.rows.length) {
          return res.json({ message: "Invalid selection.", reply: false });
        }
        
        const selectedBundle = bundlesRes.rows[bundleIndex];
        const amountGhs = parseFloat(selectedBundle.price_ghs);
        const ref = generateOrderReference();
        
        // Create Order
        await db.query(`
          INSERT INTO orders (phone_number, network_id, bundle_id, order_type, amount_ghs, status, payment_reference)
          VALUES ($1, $2, $3, $4, $5, 'pending', $6)
        `, [targetPhone, selectedNetwork.id, selectedBundle.id, 'data', amountGhs, ref]);
        
        // Initialize Paystack Payment
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const dummyEmail = `${targetPhone}@ussd.jbdatahub.com`;
        
        if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
           // Fallback for dev environment without valid keys
           response = `END Order ${ref} created! Paystack key missing. Check admin panel.`;
        } else {
          try {
            const paystackRes = await axios.post('https://api.paystack.co/transaction/initialize', {
              email: dummyEmail,
              amount: amountGhs * 100, // Paystack expects amount in pesewas
              reference: ref,
              currency: 'GHS',
              callback_url: `${frontendUrl}/track?phone=${targetPhone}`
            }, {
              headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            });
            
            if (paystackRes.data && paystackRes.data.status) {
              const authUrl = paystackRes.data.data.authorization_url;
              
              // Send SMS with payment link to the USSD session user (using phoneNumber from AT)
              // We'll send to the person dialing the USSD code.
              const callerPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
              const smsText = `JB-DataHub: Pay GHS ${amountGhs} for ${selectedBundle.label} Data (${targetPhone}). Click to pay: ${authUrl}`;
              
              await sendSMS(callerPhone, smsText);
              
              response = "END Order received! An SMS with the payment link has been sent to your phone. Complete the payment to receive your bundle.";
            } else {
              response = "END Failed to initialize payment. Please try again.";
            }
          } catch (error) {
            console.error('[USSD Controller] Paystack init error:', error.response?.data || error.message);
            response = "END Payment system error. Please try again later.";
          }
        }
      }
    } else {
      response = "END Invalid input.";
    }
  } catch (error) {
    console.error('[USSD Controller] Error:', error);
    response = "END System error. Please try again later.";
  }

  // GiantSMS expects JSON response
  const isEnd = response.startsWith('END');
  const message = response.replace(/^(CON|END)\s*/, '');
  
  res.json({
    message: message,
    reply: !isEnd
  });
}

module.exports = {
  handleUssd
};
