const db = require('../db');

/**
 * Get active networks
 */
async function getNetworks(req, res) {
  try {
    const result = await db.query('SELECT * FROM networks WHERE is_active = true ORDER BY name ASC');
    return res.json({ networks: result.rows });
  } catch (error) {
    console.error('[Bundle Controller] getNetworks error:', error);
    return res.status(500).json({ error: 'Failed to retrieve networks.' });
  }
}

/**
 * Get active bundles
 */
async function getBundles(req, res) {
  const { network_id } = req.query;
  try {
    let query = 'SELECT * FROM bundles WHERE is_active = true';
    const params = [];

    if (network_id) {
      query += ' AND network_id = $1';
      params.push(network_id);
    }
    
    query += ' ORDER BY price_ghs ASC';

    const result = await db.query(query, params);
    return res.json({ bundles: result.rows });
  } catch (error) {
    console.error('[Bundle Controller] getBundles error:', error);
    return res.status(500).json({ error: 'Failed to retrieve bundles.' });
  }
}

/**
 * Get a single bundle by id
 */
async function getBundleById(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM bundles WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bundle not found.' });
    return res.json({ bundle: result.rows[0] });
  } catch (error) {
    console.error('[Bundle Controller] getBundleById error:', error);
    return res.status(500).json({ error: 'Failed to retrieve bundle.' });
  }
}

/**
 * Get all bundles (for admin management)
 */
async function adminGetBundles(req, res) {
  try {
    const result = await db.query(`
      SELECT b.*, n.name as network_name 
      FROM bundles b
      JOIN networks n ON b.network_id = n.id
      ORDER BY b.network_id, b.price_ghs ASC
    `);
    return res.json({ bundles: result.rows });
  } catch (error) {
    console.error('[Bundle Controller] adminGetBundles error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin bundle list.' });
  }
}

/**
 * Create a new bundle (admin only)
 */
async function createBundle(req, res) {
  const { network_id, size_mb, label, price_ghs, cost_price_ghs, validity_days } = req.body;

  if (!network_id || !size_mb || !label || price_ghs === undefined || cost_price_ghs === undefined) {
    return res.status(400).json({ error: 'Missing required bundle fields.' });
  }

  try {
    const result = await db.query(`
      INSERT INTO bundles (network_id, size_mb, label, price_ghs, cost_price_ghs, validity_days, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `, [network_id, size_mb, label, price_ghs, cost_price_ghs, validity_days || 30]);

    return res.status(201).json({ message: 'Bundle created successfully.', bundle: result.rows[0] });
  } catch (error) {
    console.error('[Bundle Controller] createBundle error:', error);
    return res.status(500).json({ error: 'Failed to create bundle.' });
  }
}

/**
 * Update an existing bundle (admin only)
 */
async function updateBundle(req, res) {
  const { id } = req.params;
  const { network_id, size_mb, label, price_ghs, cost_price_ghs, validity_days, is_active } = req.body;

  try {
    // Check if bundle exists
    const checkRes = await db.query('SELECT * FROM bundles WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Bundle not found.' });
    }

    const current = checkRes.rows[0];

    const result = await db.query(`
      UPDATE bundles 
      SET network_id = $1, size_mb = $2, label = $3, price_ghs = $4, cost_price_ghs = $5, validity_days = $6, is_active = $7
      WHERE id = $8
      RETURNING *
    `, [
      network_id || current.network_id,
      size_mb !== undefined ? size_mb : current.size_mb,
      label || current.label,
      price_ghs !== undefined ? price_ghs : current.price_ghs,
      cost_price_ghs !== undefined ? cost_price_ghs : current.cost_price_ghs,
      validity_days !== undefined ? validity_days : current.validity_days,
      is_active !== undefined ? is_active : current.is_active,
      id
    ]);

    return res.json({ message: 'Bundle updated successfully.', bundle: result.rows[0] });
  } catch (error) {
    console.error('[Bundle Controller] updateBundle error:', error);
    return res.status(500).json({ error: 'Failed to update bundle.' });
  }
}

/**
 * Update network config (admin only)
 */
async function updateNetwork(req, res) {
  const { id } = req.params;
  const { is_active, tagline } = req.body;

  try {
    const checkRes = await db.query('SELECT * FROM networks WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Network not found.' });
    }

    const current = checkRes.rows[0];

    const result = await db.query(`
      UPDATE networks 
      SET is_active = $1, tagline = $2
      WHERE id = $3
      RETURNING *
    `, [
      is_active !== undefined ? is_active : current.is_active,
      tagline !== undefined ? tagline : current.tagline,
      id
    ]);

    return res.json({ message: 'Network updated successfully.', network: result.rows[0] });
  } catch (error) {
    console.error('[Bundle Controller] updateNetwork error:', error);
    return res.status(500).json({ error: 'Failed to update network configuration.' });
  }
}

module.exports = {
  getNetworks,
  getBundles,
  getBundleById,
  adminGetBundles,
  createBundle,
  updateBundle,
  updateNetwork
};
