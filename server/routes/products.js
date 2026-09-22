// server/routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all products (public endpoint)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST a new product (requires authentication)
router.post('/', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const {
    name,
    price,
    stock = 1,
    category,
    gender,
    location,
    size,
    delivery_days = 2,
    image_front,
    image_back,
    image_side,
    best = false,
  } = req.body;
  try {
    const insertQuery = `INSERT INTO products (name, price, stock, category, gender, location, size, delivery_days, image_front, image_back, image_side, best, owner_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`;
    const values = [
      name,
      price,
      stock,
      category,
      gender,
      location,
      size,
      delivery_days,
      image_front,
      image_back || null,
      image_side || null,
      best,
      req.user.id,
    ];
    const result = await db.query(insertQuery, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

module.exports = router;
