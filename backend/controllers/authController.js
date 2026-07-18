const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Handle admin login
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase().trim()]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Auth Controller] Login error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

/**
 * Auto-seeds admin user if table is empty
 */
async function seedAdminIfEmpty() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@jbdatahub.com').toLowerCase().trim();
  const adminPass = process.env.ADMIN_PASSWORD || 'admin1234';

  try {
    const result = await db.query('SELECT COUNT(*)::int as count FROM users');
    if (result.rows[0].count === 0) {
      console.log('[Auth Service] No administrators found. Seeding default admin...');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPass, salt);
      
      await db.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
        [adminEmail, hash, 'admin']
      );
      console.log(`[Auth Service] Default admin created with email: ${adminEmail} (password: ${adminPass})`);
    }
  } catch (error) {
    console.error('[Auth Service] Failed to seed default admin:', error);
  }
}

module.exports = {
  login,
  seedAdminIfEmpty
};
