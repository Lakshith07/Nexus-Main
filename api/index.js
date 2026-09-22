// api/index.js
import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import pgSession from "connect-pg-simple";
import db from "../server/db.js";
import authRoutes from "../server/routes/auth.js";
import userRoutes from "../server/routes/users.js";
import productRoutes from "../server/routes/products.js";
import orderRoutes from "../server/routes/orders.js";
import cartRoutes from "../server/routes/cart.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  store: new (pgSession(session))({
    pool: db.pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "supersecret_nexus_key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProduction, sameSite: isProduction ? "none" : "lax", httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

export default app;
