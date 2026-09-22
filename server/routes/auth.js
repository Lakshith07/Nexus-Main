// server/routes/auth.js
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db');

// Local strategy setup
const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = res.rows[0];
    if (!user) return done(null, false, { message: 'Incorrect email or password.' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return done(null, false, { message: 'Incorrect email or password.' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => { done(null, user.id); });
passport.deserializeUser(async (id, done) => {
  try {
    const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = res.rows[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  const { email, password, role, name } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, hash, role || 'customer']
    );
    const newUser = result.rows[0];
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ message: 'Login after signup failed.' });
      return res.json({ message: 'Signup successful', user: { id: newUser.id, email: newUser.email, role: newUser.role } });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

// Login route
router.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ message: 'Logged in successfully', user: { id: req.user.id, email: req.user.email, role: req.user.role } });
});

// Logout route
router.post('/logout', (req, res) => {
  req.logout(() => {});
  res.json({ message: 'Logged out' });
});

module.exports = router;
