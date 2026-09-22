// server/routes/cart.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to extract user name
function getUserName(req) {
  if (req.body && req.body.user_name) return req.body.user_name;
  if (req.user && req.user.name) return req.user.name;
  if (req.user && req.user.email) return req.user.email.split('@')[0];
  return 'Member';
}

// GET /api/cart — Get all cart items for logged-in user
router.get('/', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await db.query(
      'SELECT id, product_id, product_name as name, price, quantity, image, user_name, created_at FROM cart_items WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cart', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart — Add item to cart in database
router.post('/', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { product_id, name, price, quantity = 1, image } = req.body;
  const userName = getUserName(req);

  if (!name || !price) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  try {
    // Check if item already exists in user's cart
    const existing = await db.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND (product_id = $2 OR product_name = $3)',
      [req.user.id, product_id || null, name]
    );

    if (existing.rows.length > 0) {
      // Update quantity
      const updated = await db.query(
        'UPDATE cart_items SET quantity = quantity + $1, user_name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [quantity, userName, existing.rows[0].id]
      );
      return res.json(updated.rows[0]);
    } else {
      // Insert new cart item
      const inserted = await db.query(
        `INSERT INTO cart_items (user_id, user_name, product_id, product_name, price, quantity, image)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [req.user.id, userName, product_id || null, name, price, quantity, image || null]
      );
      return res.status(201).json(inserted.rows[0]);
    }
  } catch (err) {
    console.error('Error adding to cart', err);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/:id — Update quantity of cart item
router.put('/:id', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { quantity } = req.body;
  const itemId = req.params.id;

  try {
    if (quantity <= 0) {
      await db.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [itemId, req.user.id]);
      return res.json({ message: 'Item removed', id: itemId });
    }

    const result = await db.query(
      'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, itemId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating cart item', err);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/:id — Remove specific item
router.delete('/:id', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Item removed from cart', id: req.params.id });
  } catch (err) {
    console.error('Error removing cart item', err);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// DELETE /api/cart — Clear entire cart for user
router.delete('/', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('Error clearing cart', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
