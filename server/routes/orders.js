// server/routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../db');

function getUserName(req, fallbackName) {
  if (fallbackName) return fallbackName;
  if (req.user && req.user.name) return req.user.name;
  if (req.user && req.user.email) return req.user.email.split('@')[0];
  return 'Member';
}

// POST /api/orders — Place a new order (requires authentication)
router.post('/', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Please sign in to place an order' });
  }

  const { full_name, phone, address, city, postal_code, rental_days, items } = req.body;
  const userName = getUserName(req, full_name);

  // Validate required fields
  if (!full_name || !phone || !address || !city || !postal_code) {
    return res.status(400).json({ error: 'All address fields are required' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  const totalPrice = items.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Insert the order with user_name
    await client.query(
      `INSERT INTO orders (order_id, user_id, user_name, full_name, phone, address, city, postal_code, rental_days, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [orderId, req.user.id, userName, full_name, phone, address, city, postal_code, rental_days || 3, totalPrice]
    );

    // Insert each order item
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.id || null, item.name, item.price, item.quantity || 1, item.image || null]
      );
    }

    // Clear user's cart in database
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    await client.query('COMMIT');

    res.status(201).json({
      orderId,
      user_name: userName,
      date: new Date().toLocaleDateString(),
      total: totalPrice,
      items,
      status: 'Processing',
      full_name,
      phone,
      address,
      city,
      postal_code,
      rental_days: rental_days || 3,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error placing order', err);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    client.release();
  }
});

// GET /api/orders — Get orders for current user
router.get('/', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const ordersResult = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    const orders = [];
    for (const order of ordersResult.rows) {
      const itemsResult = await db.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.order_id]
      );
      orders.push({
        orderId: order.order_id,
        user_name: order.user_name || order.full_name,
        date: new Date(order.created_at).toLocaleDateString(),
        total: order.total_price,
        status: order.status,
        full_name: order.full_name,
        phone: order.phone,
        address: order.address,
        city: order.city,
        postal_code: order.postal_code,
        rental_days: order.rental_days,
        items: itemsResult.rows.map((it) => ({
          id: it.product_id,
          name: it.product_name,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
        })),
      });
    }

    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/rejected — Get all rejected / cancelled items for current user
router.get('/rejected', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM cancelled_items WHERE user_id = $1 ORDER BY cancelled_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching rejected items', err);
    res.status(500).json({ error: 'Failed to fetch rejected items' });
  }
});

// GET /api/orders/activity — Live Database activity tracking cart, orders, and rejected items with user_name
router.get('/activity', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userName = getUserName(req);

    // 1. Cart items
    const cartRes = await db.query(
      'SELECT * FROM cart_items WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    // 2. Active / placed orders
    const ordersRes = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    // 3. Rejected / cancelled items
    const rejectedRes = await db.query(
      'SELECT * FROM cancelled_items WHERE user_id = $1 ORDER BY cancelled_at DESC',
      [req.user.id]
    );

    // 4. Products summary
    const prodCountRes = await db.query('SELECT count(*) FROM products');

    res.json({
      user: { id: req.user.id, name: userName, email: req.user.email },
      cartItems: cartRes.rows,
      orders: ordersRes.rows,
      rejectedItems: rejectedRes.rows,
      totalProductsInDB: parseInt(prodCountRes.rows[0].count, 10),
    });
  } catch (err) {
    console.error('Error fetching activity', err);
    res.status(500).json({ error: 'Failed to fetch database activity' });
  }
});

// PUT /api/orders/:orderId/cancel — Cancel an order & log to cancelled_items with user_name
router.put('/:orderId/cancel', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { orderId } = req.params;
  const userName = getUserName(req);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Update order status
    const updateRes = await client.query(
      `UPDATE orders SET status = 'Cancelled' WHERE order_id = $1 AND user_id = $2 RETURNING *`,
      [orderId, req.user.id]
    );

    if (updateRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch order items to record them into cancelled_items table
    const itemsRes = await client.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );

    for (const it of itemsRes.rows) {
      await client.query(
        `INSERT INTO cancelled_items (order_id, user_id, user_name, product_name, price, quantity, image, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          orderId,
          req.user.id,
          userName,
          it.product_name,
          it.price,
          it.quantity,
          it.image,
          'User Cancelled / Rejected Order',
          'Rejected',
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Order cancelled and logged to rejected items', orderId, user_name: userName });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error cancelling order', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  } finally {
    client.release();
  }
});

module.exports = router;
