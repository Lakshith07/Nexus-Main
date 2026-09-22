-- server/migrations/003_cart_rejected_and_seed_products.sql

-- 1. Add name column to users if not present
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- 2. Add user_name column to orders if not present
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);

-- 3. Create cart_items table to persist user cart in database
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  product_id INTEGER,
  product_name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create cancelled_items table to track rejected / cancelled items in database
CREATE TABLE IF NOT EXISTS cancelled_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image TEXT,
  reason VARCHAR(255) DEFAULT 'User Cancelled / Rejected Order',
  status VARCHAR(50) DEFAULT 'Rejected',
  cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Populate users with names if null
UPDATE users SET name = SPLIT_PART(email, '@', 1) WHERE name IS NULL;

-- 6. Clean existing products and seed with reasonable rental pricing and all categories
DELETE FROM order_items WHERE product_id NOT IN (SELECT id FROM products);

-- Clear old products to ensure clean seed with reasonable pricing
DELETE FROM products;

-- 7. Seed comprehensive catalog of products with reasonable rental rates (shirts, pants, shoes, western, traditional)
INSERT INTO products (name, price, stock, category, gender, location, size, delivery_days, image_front, image_back, image_side, best) VALUES
-- SHIRTS (Reasonable price: ₹299 - ₹399)
('Classic White Tuxedo Shirt', 349, 8, 'shirt', 'men', 'hyderabad', 'M', 2, 
 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600', 
 'https://images.unsplash.com/photo-1620012253295-c15c429f66bf?w=600', 
 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600', true),

('Midnight Indigo Linen Casual Shirt', 299, 10, 'shirt', 'men', 'mumbai', 'M', 2,
 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600',
 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600',
 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', false),

('Ivory Silk Embroidered Kurta Shirt', 399, 6, 'shirt', 'men', 'delhi', 'L', 3,
 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600',
 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600',
 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600', true),

('Oversized Dusty Rose Formal Shirt', 329, 7, 'shirt', 'women', 'bengaluru', 'S', 2,
 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600',
 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600',
 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600', false),

-- PANTS & TROUSERS (Reasonable price: ₹349 - ₹449)
('Black Formal Italian Tailored Trouser', 399, 8, 'pant', 'men', 'mumbai', 'L', 2,
 'https://images.unsplash.com/photo-1583001809909-6e6a2ecbcd5b?w=600',
 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600',
 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600', true),

('Beige Pleated High-Waist Trousers', 369, 5, 'pant', 'women', 'bengaluru', 'M', 2,
 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600',
 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600',
 'https://images.unsplash.com/photo-1583001809909-6e6a2ecbcd5b?w=600', false),

('Charcoal Grey Slim-Fit Tuxedo Pant', 429, 6, 'pant', 'men', 'hyderabad', 'M', 3,
 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600',
 'https://images.unsplash.com/photo-1583001809909-6e6a2ecbcd5b?w=600',
 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600', true),

-- SHOES (Reasonable price: ₹449 - ₹599)
('Handcrafted Brown Oxford Brogue Shoes', 499, 6, 'shoe', 'men', 'hyderabad', 'L', 2,
 'https://images.unsplash.com/photo-1528701800489-20be3c66de50?w=600',
 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600', true),

('Black Velvet Embroidered Mojari Loafers', 449, 7, 'shoe', 'men', 'delhi', 'M', 3,
 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
 'https://images.unsplash.com/photo-1528701800489-20be3c66de50?w=600',
 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600', false),

('Golden Stiletto Ankle-Strap Pumps', 549, 5, 'shoe', 'women', 'mumbai', 'S', 2,
 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600',
 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600',
 'https://images.unsplash.com/photo-1528701800489-20be3c66de50?w=600', true),

-- WESTERN GOWNS & DRESSES (Reasonable price: ₹799 - ₹1199)
('Emerald Evening Western Silk Gown', 899, 4, 'western', 'women', 'bengaluru', 'S', 2,
 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600',
 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600',
 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', true),

('Champagne Satin Backless Slip Dress', 799, 6, 'western', 'women', 'mumbai', 'S', 2,
 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600',
 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600', true),

('Midnight Blue Double-Breasted Tuxedo Blazer', 999, 4, 'western', 'men', 'delhi', 'L', 3,
 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600',
 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600',
 'https://images.unsplash.com/photo-1583001809909-6e6a2ecbcd5b?w=600', true),

-- TRADITIONAL LEHENGAS & SHERWANIS (Reasonable price: ₹1199 - ₹1699)
('Royal Embroidered Bridal Lehenga', 1699, 3, 'traditional', 'women', 'delhi', 'M', 3,
 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600',
 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', true),

('Royal Heritage Velvet Embroidered Sherwani', 1499, 4, 'traditional', 'men', 'delhi', 'L', 3,
 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600',
 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600',
 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600', true),

('Crimson Zari Silk Anarkali Gown', 1199, 5, 'traditional', 'women', 'hyderabad', 'M', 2,
 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600',
 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', true);
