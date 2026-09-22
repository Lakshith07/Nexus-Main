-- server/migrations/002_create_products_and_orders_tables.sql

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 1,
  category VARCHAR(100) NOT NULL,
  gender VARCHAR(50) NOT NULL,
  location VARCHAR(100) NOT NULL,
  size VARCHAR(20) NOT NULL,
  delivery_days INTEGER NOT NULL DEFAULT 2,
  image_front TEXT NOT NULL,
  image_back TEXT,
  image_side TEXT,
  best BOOLEAN DEFAULT false,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  rental_days INTEGER NOT NULL DEFAULT 3,
  total_price INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id INTEGER,
  product_name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image TEXT
);
