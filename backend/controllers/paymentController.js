const db = require('../db');
const axios = require('axios');
const crypto = require('crypto');
const providerAdapter = require('../providers/ProviderAdapter');
const { sendSMS } = require('../services/sms');

/**
 * Initialize payment via Paystack
 */
async function initializePayment(req, res) {
  const { order_id, email, amount, reference } = req.body;

  if (!order_id || !email || !amount || !reference) {
    return res.status(400).json({ error: 'Missing required parameters for initialization.' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Fallback mock payment URL if secret key is missing (for local testing/dev)
  if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
    console.log('[Payment Controller] Paystack Secret Key not set or placeholder. Falling back to Mock Payment page.');
    
    // Simulate successful sandbox checkout redirect
    const mockCheckoutUrl = `${frontendUrl}/track?ref=${reference}&phone=${email.split('@')[0]}&mock_paid=true`;
    return res.json({ authorization_url: mockCheckoutUrl });
  }

  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount, // in GHS Pesewas (kobo equivalent)
      reference,
      currency: 'GHS',
      callback_url: `${frontendUrl}/track?phone=${email.split('@')[0]}`
    }, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.status) {
      return res.json({
        authorization_url: response.data.data.authorization_url,
        reference: response.data.data.reference
      });
    } else {
      return res.status(400).json({ error: 'Paystack initialization failed.' });
    }
  } catch (error) {
    console.error('[Payment Controller] Paystack initialization error:', error.response?.data || error.message);
    
    // Safety fallback: allow mock checkout redirect in local environment if Paystack is down or keys are misconfigured
    if (process.env.NODE_ENV !== 'production') {
      const mockCheckoutUrl = `${frontendUrl}/track?ref=${reference}&phone=${email.split('@')[0]}&mock_paid=true`;
      return res.json({ authorization_url: mockCheckoutUrl });
    }
    
    return res.status(500).json({ error: 'Failed to initialize payment gateway.' });
  }
}

/**
 * Handle incoming webhooks from Paystack
 */
async function handleWebhook(req, res) {
  const secret = process.env.PAYSTACK_SECRET_KEY || '';
  const signature = req.headers['x-paystack-signature'];

  // In production, we strictly require a signature match
  if (process.env.NODE_ENV === 'production' && !signature) {
    return res.status(400).send('Signature header missing');
  }

  // Get raw body or JSON payload
  const payload = req.body;
  const rawBody = req.rawBody || JSON.stringify(payload);

  if (secret && signature) {
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    if (hash !== signature) {
      console.error('[Payment Webhook] Signature mismatch! Rejected.');
      return res.status(401).send('Signature mismatch');
    }
  }

  // Acknowledge webhook receipt immediately to avoid timeouts
  res.status(200).send('Event received');

  // Process async to avoid blocking the webhook response
  try {
    const { event, data } = payload;
    console.log(`[Payment Webhook] Event received: ${event}`);

    if (event === 'charge.success') {
      const paymentRef = data.reference;
      const amountPesewas = data.amount;
      const amountGhs = amountPesewas / 100;
      const providerRef = data.id;

      // 1. Retrieve the corresponding order
      const orderQuery = await db.query('SELECT * FROM orders WHERE payment_reference = $1 LIMIT 1', [paymentRef]);
      const order = orderQuery.rows[0];

      if (!order) {
        console.error(`[Payment Webhook] Order with payment reference ${paymentRef} not found.`);
        return;
      }

      // 2. Check idempotency: If already paid or processed, skip
      if (order.status !== 'pending') {
        console.log(`[Payment Webhook] Order ${order.id} is already processed (Status: ${order.status}). Skipping.`);
        return;
      }

      // Log transaction
      await db.query(`
        INSERT INTO transactions (order_id, provider_reference, amount_ghs, status, raw_payload)
        VALUES ($1, $2, $3, $4, $5)
      `, [order.id, String(providerRef), amountGhs, 'success', payload]);

      // 3. Mark as paid & processing
      await db.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['paid', order.id]);
      console.log(`[Payment Webhook] Order ${order.id} marked as PAID. Triggering wholesale API...`);

      // 4. Retrieve bundle details if it's a data order
      let bundle = null;
      if (order.order_type === 'data' && order.bundle_id) {
        const bundleQuery = await db.query('SELECT * FROM bundles WHERE id = $1', [order.bundle_id]);
        bundle = bundleQuery.rows[0];
      }

      // Update status to processing
      await db.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['processing', order.id]);

      // 5. Deliver order via ProviderAdapter
      const delivery = await providerAdapter.deliver(order, bundle);

      if (delivery.success) {
        // Update order to delivered
        await db.query(`
          UPDATE orders 
          SET status = 'delivered', wholesale_reference = $1, updated_at = NOW() 
          WHERE id = $2
        `, [delivery.wholesale_reference, order.id]);

        console.log(`[Payment Webhook] Order ${order.id} delivered successfully! Ref: ${delivery.wholesale_reference}`);

        // 6. Send success SMS to user
        const networkName = order.network_id.toUpperCase();
        let messageText = '';
        if (order.order_type === 'data' && bundle) {
          messageText = `JB-DataHub: Success! ${bundle.label} has been delivered to ${order.phone_number}. Ref: ${delivery.wholesale_reference}. Thank you for buying!`;
        } else {
          messageText = `JB-DataHub: Success! GHS ${order.amount_ghs} Airtime top-up has been sent to ${order.phone_number}. Ref: ${delivery.wholesale_reference}.`;
        }
        await sendSMS(order.phone_number, messageText);

      } else {
        // Mark as failed
        await db.query(`
          UPDATE orders 
          SET status = 'failed', updated_at = NOW() 
          WHERE id = $1
        `, [order.id]);

        console.error(`[Payment Webhook] Wholesale delivery failed for Order ${order.id}. Error: ${delivery.error}`);

        // Send failure SMS notification
        const failMessage = `JB-DataHub Alert: Payment received, but delivery of your order to ${order.phone_number} failed. Our support is processing it manually. Ref: ${order.payment_reference}.`;
        await sendSMS(order.phone_number, failMessage);
      }
    }

    // Handle failed/cancelled payments from Paystack
    if (event === 'charge.failed') {
      const paymentRef = data.reference;
      const providerRef = data.id;

      const orderQuery = await db.query('SELECT * FROM orders WHERE payment_reference = $1 LIMIT 1', [paymentRef]);
      const order = orderQuery.rows[0];

      if (!order) {
        console.error(`[Payment Webhook] charge.failed - Order with reference ${paymentRef} not found.`);
        return;
      }

      if (order.status !== 'pending') {
        console.log(`[Payment Webhook] charge.failed - Order ${order.id} is already '${order.status}'. Skipping.`);
        return;
      }

      // Log the failed transaction
      await db.query(`
        INSERT INTO transactions (order_id, provider_reference, amount_ghs, status, raw_payload)
        VALUES ($1, $2, $3, $4, $5)
      `, [order.id, String(providerRef), parseFloat(order.amount_ghs), 'cancelled', payload]);

      // Mark order as cancelled
      await db.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', order.id]);
      console.log(`[Payment Webhook] Order ${order.id} marked as CANCELLED (payment failed/abandoned).`);
    }
  } catch (error) {
    console.error('[Payment Webhook] Error processing payment webhook:', error);
  }
}

/**
 * Verify payment status for a pending order by checking with Paystack.
 * If the payment was never completed (abandoned/cancelled), mark the order as cancelled.
 */
async function verifyPayment(req, res) {
  const { reference } = req.params;

  if (!reference) {
    return res.status(400).json({ error: 'Payment reference is required.' });
  }

  try {
    // 1. Look up the order
    const orderQuery = await db.query('SELECT * FROM orders WHERE payment_reference = $1 LIMIT 1', [reference]);
    const order = orderQuery.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Only verify pending orders — already processed orders don't need checking
    if (order.status !== 'pending') {
      return res.json({ order, message: `Order is already '${order.status}'.` });
    }

    // 2. Check with Paystack
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
      // In dev/test mode without Paystack keys, can't verify
      return res.json({ order, message: 'Payment verification unavailable (no Paystack key).' });
    }

    const paystackRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        timeout: 10000,
      }
    );

    const txData = paystackRes.data?.data;

    if (!txData) {
      // Paystack returned no transaction data — payment was never initiated or abandoned
      await db.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', order.id]);
      const updatedQuery = await db.query('SELECT * FROM orders WHERE id = $1', [order.id]);
      return res.json({ order: updatedQuery.rows[0], message: 'Payment was never completed. Order cancelled.' });
    }

    const paystackStatus = txData.status; // 'success', 'failed', 'abandoned'

    if (paystackStatus === 'success') {
      // Payment was successful but webhook may not have fired — process it now
      // (The webhook handler has idempotency checks, but let's update directly here)
      if (order.status === 'pending') {
        await db.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['paid', order.id]);
        console.log(`[Payment Verify] Order ${order.id} confirmed as PAID via verification.`);
      }
      const updatedQuery = await db.query('SELECT * FROM orders WHERE id = $1', [order.id]);
      return res.json({ order: updatedQuery.rows[0], message: 'Payment confirmed.' });
    } else if (paystackStatus === 'abandoned' || paystackStatus === 'failed') {
      // Payment was cancelled/abandoned by user
      await db.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', order.id]);
      console.log(`[Payment Verify] Order ${order.id} marked as CANCELLED (Paystack status: ${paystackStatus}).`);
      const updatedQuery = await db.query('SELECT * FROM orders WHERE id = $1', [order.id]);
      return res.json({ order: updatedQuery.rows[0], message: `Payment ${paystackStatus}. Order cancelled.` });
    } else {
      // Some other status — return current state
      return res.json({ order, message: `Paystack status: ${paystackStatus}. No action taken.` });
    }
  } catch (error) {
    // If Paystack returns 404, the transaction was never initiated
    if (error.response?.status === 404) {
      try {
        await db.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE payment_reference = $2', ['cancelled', reference]);
      } catch (dbErr) {
        // Ignore DB error
      }
      return res.json({ message: 'Transaction not found on Paystack. Payment was never initiated.' });
    }
    console.error('[Payment Verify] Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to verify payment status.' });
  }
}

module.exports = {
  initializePayment,
  handleWebhook,
  verifyPayment
};
