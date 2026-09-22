// api/index.js – Vercel Serverless Function entry point
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const pgSession = require('connect-pg-simple')(session);
const db = require('../server/db');
const authRoutes = require('../server/routes/auth');
const userRoutes = require('../server/routes/users');
const productRoutes = require('../server/routes/products');
const orderRoutes = require('../server/routes/orders');
const cartRoutes = require('../server/routes/cart');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  store: new pgSession({
    pool: db.pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'supersecret_nexus_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
