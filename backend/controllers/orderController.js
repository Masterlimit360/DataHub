const db = require('../db');
const providerAdapter = require('../providers/ProviderAdapter');
const { sendSMS } = require('../services/sms');

/**
 * Helper to generate unique order reference
 */
function generateOrderReference() {
  return 'JB-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Helper to validate Ghana phone number formats
 */
function isValidGhanaPhone(phone) {
  const clean = phone.replace(/\D/g, '');
  return (
    (clean.startsWith('0') && clean.length === 10) || 
    (clean.startsWith('233') && clean.length === 12)
  );
}

/**
 * Create a new pending order
 */
async function createOrder(req, res) {
  const { phone_number, network_id, bundle_id, order_type, amount_ghs } = req.body;

  // Basic validations
  if (!phone_number || !network_id || !order_type) {
    return res.status(400).json({ error: 'Phone number, network, and order type are required.' });
  }

  if (!isValidGhanaPhone(phone_number)) {
    return res.status(400).json({ error: 'Please supply a valid Ghanaian phone number (e.g. 0244123456)' });
  }

  let finalAmount = parseFloat(amount_ghs);
  let resolvedBundleId = bundle_id ? parseInt(bundle_id) : null;

  try {
    // If it's a data bundle order, validate the bundle and verify price matches
    if (order_type === 'data') {
      if (!resolvedBundleId) {
        return res.status(400).json({ error: 'Bundle ID is required for data orders.' });
      }

      const bundleQuery = await db.query('SELECT * FROM bundles WHERE id = $1 AND is_active = true LIMIT 1', [resolvedBundleId]);
      const bundle = bundleQuery.rows[0];

      if (!bundle) {
        return res.status(404).json({ error: 'Selected bundle is invalid or inactive.' });
      }

      if (bundle.network_id !== network_id) {
        return res.status(400).json({ error: 'Selected bundle does not match the network provider.' });
      }

      // Override with verified database price for security
      finalAmount = parseFloat(bundle.price_ghs);
    } else {
      // Airtime order
      if (isNaN(finalAmount) || finalAmount <= 0) {
        return res.status(400).json({ error: 'Valid GHS airtime amount is required.' });
      }
      resolvedBundleId = null;
    }

    const ref = generateOrderReference();

    // Insert order into db as 'pending'
    const result = await db.query(`
      INSERT INTO orders (phone_number, network_id, bundle_id, order_type, amount_ghs, status, payment_reference)
      VALUES ($1, $2, $3, $4, $5, 'pending', $6)
      RETURNING *
    `, [phone_number, network_id, resolvedBundleId, order_type, finalAmount, ref]);

    return res.status(201).json({
      message: 'Order created successfully.',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('[Order Controller] createOrder error:', error);
    return res.status(500).json({ error: 'Database failed to register the order.' });
  }
}

/**
 * Track order by phone number or reference
 */
async function trackOrders(req, res) {
  const { phone, ref } = req.query;

  if (!phone && !ref) {
    return res.status(400).json({ error: 'Provide a phone number or payment reference to track.' });
  }

  try {
    let result;
    if (ref) {
      // Direct reference look-up
      result = await db.query(`
        SELECT o.*, n.name as network_name, b.label as bundle_label
        FROM orders o
        JOIN networks n ON o.network_id = n.id
        LEFT JOIN bundles b ON o.bundle_id = b.id
        WHERE o.payment_reference = $1
        LIMIT 1
      `, [ref.trim()]);
    } else {
      // Phone lookup - return top 5 latest orders for this phone number
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Handle both local format (024...) and international (23324...)
      const variations = [cleanPhone];
      if (cleanPhone.startsWith('0')) {
        variations.push('233' + cleanPhone.substring(1));
      } else if (cleanPhone.startsWith('233')) {
        variations.push('0' + cleanPhone.substring(3));
      }

      result = await db.query(`
        SELECT o.*, n.name as network_name, b.label as bundle_label
        FROM orders o
        JOIN networks n ON o.network_id = n.id
        LEFT JOIN bundles b ON o.bundle_id = b.id
        WHERE o.phone_number = ANY($1)
        ORDER BY o.created_at DESC
        LIMIT 5
      `, [variations]);
    }

    return res.json({ orders: result.rows });
  } catch (error) {
    console.error('[Order Controller] trackOrders error:', error);
    return res.status(500).json({ error: 'Failed to retrieve order tracking information.' });
  }
}

/**
 * Admin: Get list of all orders
 */
async function adminGetOrders(req, res) {
  const { status, network_id, order_type, limit = 50, offset = 0 } = req.query;

  try {
    let query = `
      SELECT o.*, n.name as network_name, b.label as bundle_label
      FROM orders o
      JOIN networks n ON o.network_id = n.id
      LEFT JOIN bundles b ON o.bundle_id = b.id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`o.status = $${params.length}`);
    }
    if (network_id) {
      params.push(network_id);
      conditions.push(`o.network_id = $${params.length}`);
    }
    if (order_type) {
      params.push(order_type);
      conditions.push(`o.order_type = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY o.created_at DESC';

    // Add Pagination
    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;
    
    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;

    // Get count for total items
    const countRes = await db.query('SELECT COUNT(*)::int as count FROM orders');

    const result = await db.pool.query(query, params);
    return res.json({
      orders: result.rows,
      total: countRes.rows[0].count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('[Order Controller] adminGetOrders error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin order list.' });
  }
}

/**
 * Admin: Retry a failed order manually
 */
async function retryOrder(req, res) {
  const { id } = req.params;

  try {
    // Find order
    const orderQuery = await db.query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [id]);
    const order = orderQuery.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status !== 'failed' && order.status !== 'paid') {
      return res.status(400).json({ error: `Cannot retry delivery for an order that is currently '${order.status}'.` });
    }

    // Set status to processing
    await db.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['processing', id]);

    // Fetch bundle details if data
    let bundle = null;
    if (order.order_type === 'data' && order.bundle_id) {
      const bundleQuery = await db.query('SELECT * FROM bundles WHERE id = $1', [order.bundle_id]);
      bundle = bundleQuery.rows[0];
    }

    // Attempt delivery again
    const delivery = await providerAdapter.deliver(order, bundle);

    if (delivery.success) {
      await db.query(`
        UPDATE orders 
        SET status = 'delivered', wholesale_reference = $1, updated_at = NOW() 
        WHERE id = $2
      `, [delivery.wholesale_reference, id]);

      // Send SMS
      let messageText = '';
      if (order.order_type === 'data' && bundle) {
        messageText = `JB-DataHub Manual Delivery: Success! ${bundle.label} has been delivered to ${order.phone_number}. Ref: ${delivery.wholesale_reference}.`;
      } else {
        messageText = `JB-DataHub Manual Delivery: Success! GHS ${order.amount_ghs} Airtime has been sent to ${order.phone_number}. Ref: ${delivery.wholesale_reference}.`;
      }
      await sendSMS(order.phone_number, messageText);

      return res.json({ message: 'Order retried and delivered successfully!', wholesale_reference: delivery.wholesale_reference });
    } else {
      // Revert status to failed
      await db.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['failed', id]);
      return res.status(400).json({ error: `Retry delivery failed: ${delivery.error}` });
    }
  } catch (error) {
    console.error('[Order Controller] retryOrder error:', error);
    return res.status(500).json({ error: 'Server error retrying delivery.' });
  }
}

/**
 * Admin: Mark order as refunded
 */
async function refundOrder(req, res) {
  const { id } = req.params;

  try {
    const orderQuery = await db.query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [id]);
    const order = orderQuery.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status !== 'failed') {
      return res.status(400).json({ error: 'Only failed orders can be marked as refunded.' });
    }

    await db.query("UPDATE orders SET status = 'refunded', updated_at = NOW() WHERE id = $1", [id]);

    // Send refund confirmation SMS
    const msg = `JB-DataHub: Your order GHS ${order.amount_ghs} for ${order.phone_number} has been refunded. Please check your mobile money wallet.`;
    await sendSMS(order.phone_number, msg);

    return res.json({ message: 'Order marked as refunded successfully.' });
  } catch (error) {
    console.error('[Order Controller] refundOrder error:', error);
    return res.status(500).json({ error: 'Server error marking order as refunded.' });
  }
}

module.exports = {
  createOrder,
  trackOrders,
  adminGetOrders,
  retryOrder,
  refundOrder
};
