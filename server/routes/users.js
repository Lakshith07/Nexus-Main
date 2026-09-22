// server/routes/users.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireRole } = require('../middleware/role');
const router = express.Router();

// Get current user info
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  const { id, email, role } = req.user;
  res.json({ id, email, role });
});

// Change password
router.put('/me/password', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Missing passwords' });
  try {
    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];
    const match = await bcrypt.compare(oldPassword, user.password_hash);
    if (!match) return res.status(400).json({ message: 'Current password incorrect' });
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Example protected route for publishers
router.get('/publisher-only', requireRole('publisher'), (req, res) => {
  res.json({ message: 'Publisher access granted' });
});

module.exports = router;
