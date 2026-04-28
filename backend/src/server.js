const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const productCatalog = require("./productCatalog");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

const ORDER_STATUSES = new Set(["pending", "preparing", "completed"]);
const DEFAULT_CLIENT_URL = "http://localhost:5173";
const normalizeOrigin = (value) => String(value || "").trim().replace(/\/$/, "");
const allowedOrigins = [
    DEFAULT_CLIENT_URL,
    process.env.CLIENT_URL,
]
    .flatMap((value) => String(value || "").split(","))
    .map(normalizeOrigin)
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
                callback(null, true);
                return;
            }

            callback(new Error("Not allowed by CORS"));
        },
    })
);
app.use(express.json());

function normalizeOrderStatus(status = "pending") {
    const normalizedStatus = String(status).trim().toLowerCase() || "pending";
    return ORDER_STATUSES.has(normalizedStatus) ? normalizedStatus : null;
}

function normalizeProductName(value) {
    const normalizedValue = String(value || "").trim();
    return normalizedValue || null;
}

function normalizeProductCategory(value) {
    const normalizedValue = String(value || "").trim();
    return normalizedValue || null;
}

function normalizeProductDescription(value) {
    const normalizedValue = String(value || "").trim();
    return normalizedValue || "";
}

function normalizeProductImageUrl(value) {
    const normalizedValue = String(value || "").trim();
    return normalizedValue || "";
}

function normalizeProductPrice(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
}

function normalizeProductAvailability(value, fallbackValue = true) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        const normalizedValue = value.trim().toLowerCase();

        if (normalizedValue === "true") return true;
        if (normalizedValue === "false") return false;
    }

    return fallbackValue;
}

async function seedProductsIfEmpty() {
    const countResult = await pool.query("SELECT COUNT(*)::int AS count FROM products");
    const existingCount = countResult.rows[0]?.count || 0;

    if (existingCount > 0) {
        return;
    }

    for (const product of productCatalog) {
        await pool.query(
            `INSERT INTO products (name, description, price, image_url, category, is_available)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                product.name,
                product.description,
                product.price,
                product.imageUrl,
                product.category,
                product.isAvailable,
            ]
        );
    }
}

async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            customer_name TEXT NOT NULL,
            total_price NUMERIC NOT NULL,
            status TEXT DEFAULT 'pending',
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price NUMERIC NOT NULL,
            image_url TEXT,
            category TEXT NOT NULL,
            is_available BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'"
    );
    await pool.query(
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE"
    );
    await pool.query(
        "ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'"
    );
    await pool.query(
        "UPDATE orders SET status = 'pending' WHERE status IS NULL OR status NOT IN ('pending', 'preparing', 'completed')"
    );

    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT");
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT");
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT");
    await pool.query(
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true"
    );
    await pool.query(
        "ALTER TABLE products ALTER COLUMN is_available SET DEFAULT true"
    );
    await pool.query(
        "UPDATE products SET is_available = true WHERE is_available IS NULL"
    );

    await seedProductsIfEmpty();

    console.log("DB Ready");
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token." });
        }

        req.user = user;
        next();
    });
}

app.get("/", (req, res) => {
    res.json({ message: "Restaurant Dashboard API is running" });
});

app.get("/health", async (req, res) => {
    const result = await pool.query("SELECT NOW()");
    res.json({
        status: "ok",
        databaseTime: result.rows[0].now,
    });
});

app.post("/auth/register", async (req, res) => {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
        [name, email, hashedPassword]
    );

    res.json({
        message: "User registered successfully",
        user: result.rows[0],
    });
});

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({
        message: "Login successful",
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    });
});

app.post("/orders", authenticateToken, async (req, res) => {
    const { customer_name, total_price, status = "pending" } = req.body;
    const normalizedStatus = normalizeOrderStatus(status);

    if (!normalizedStatus) {
        return res.status(400).json({ message: "Invalid order status" });
    }

    const result = await pool.query(
        "INSERT INTO orders (customer_name, total_price, user_id, status) VALUES ($1, $2, $3, $4) RETURNING *",
        [customer_name, total_price, req.user.id, normalizedStatus]
    );

    res.json(result.rows[0]);
});

app.get("/orders", authenticateToken, async (req, res) => {
    const result = await pool.query(
        "SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC",
        [req.user.id]
    );

    res.json(result.rows);
});

app.put("/orders/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { customer_name, total_price, status = "pending" } = req.body;
    const normalizedStatus = normalizeOrderStatus(status);

    if (!normalizedStatus) {
        return res.status(400).json({ message: "Invalid order status" });
    }

    const result = await pool.query(
        `UPDATE orders
         SET customer_name = $1, total_price = $2, status = $3
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [customer_name, total_price, normalizedStatus, id, req.user.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: "Order not found" });
    }

    res.json(result.rows[0]);
});

app.delete("/orders/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
        "DELETE FROM orders WHERE id = $1 AND user_id = $2 RETURNING *",
        [id, req.user.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
});

app.get("/products", authenticateToken, async (req, res) => {
    const result = await pool.query(
        "SELECT * FROM products ORDER BY category ASC, name ASC, id ASC"
    );

    res.json(result.rows);
});

app.post("/products", authenticateToken, async (req, res) => {
    const normalizedName = normalizeProductName(req.body.name);
    const normalizedCategory = normalizeProductCategory(req.body.category);
    const normalizedPrice = normalizeProductPrice(req.body.price);

    if (!normalizedName || !normalizedCategory || normalizedPrice === null) {
        return res.status(400).json({
            message: "Product name, category, and a valid price are required.",
        });
    }

    const result = await pool.query(
        `INSERT INTO products (name, description, price, image_url, category, is_available)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
            normalizedName,
            normalizeProductDescription(req.body.description),
            normalizedPrice,
            normalizeProductImageUrl(req.body.image_url),
            normalizedCategory,
            normalizeProductAvailability(req.body.is_available, true),
        ]
    );

    res.status(201).json(result.rows[0]);
});

app.put("/products/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const normalizedName = normalizeProductName(req.body.name);
    const normalizedCategory = normalizeProductCategory(req.body.category);
    const normalizedPrice = normalizeProductPrice(req.body.price);

    if (!normalizedName || !normalizedCategory || normalizedPrice === null) {
        return res.status(400).json({
            message: "Product name, category, and a valid price are required.",
        });
    }

    const result = await pool.query(
        `UPDATE products
         SET name = $1,
             description = $2,
             price = $3,
             image_url = $4,
             category = $5,
             is_available = $6
         WHERE id = $7
         RETURNING *`,
        [
            normalizedName,
            normalizeProductDescription(req.body.description),
            normalizedPrice,
            normalizeProductImageUrl(req.body.image_url),
            normalizedCategory,
            normalizeProductAvailability(req.body.is_available, true),
            id,
        ]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
});

app.delete("/products/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
        "DELETE FROM products WHERE id = $1 RETURNING *",
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
});

app.patch("/products/:id/toggle", authenticateToken, async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
        `UPDATE products
         SET is_available = NOT is_available
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
});

const PORT = process.env.PORT || 3001;

async function startServer() {
    await initDB();

    app.listen(PORT, () => {
        console.log(`API running on port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("DB initialization failed:", error);
    process.exit(1);
});
