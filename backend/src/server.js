const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const productCatalog = require("./productCatalog");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

const ORDER_STATUSES = new Set(["pending", "preparing", "completed", "cancelled"]);
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

function normalizeCartItems(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    const mergedItems = new Map();

    for (const item of items) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);

        if (
            !Number.isInteger(productId) ||
            productId <= 0 ||
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            continue;
        }

        mergedItems.set(productId, (mergedItems.get(productId) || 0) + quantity);
    }

    return Array.from(mergedItems.entries()).map(([product_id, quantity]) => ({
        product_id,
        quantity,
    }));
}

function createHttpError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function normalizeQuantity(value, fallbackValue = 1) {
    const quantity = Number(value ?? fallbackValue);
    return Number.isInteger(quantity) ? quantity : null;
}

async function getActiveCartId(userId, client = pool) {
    const existingCart = await client.query(
        "SELECT id FROM carts WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1",
        [userId]
    );

    if (existingCart.rows.length > 0) {
        return existingCart.rows[0].id;
    }

    try {
        const createdCart = await client.query(
            "INSERT INTO carts (user_id, status) VALUES ($1, 'active') RETURNING id",
            [userId]
        );

        return createdCart.rows[0].id;
    } catch (error) {
        if (error.code !== "23505") {
            throw error;
        }

        const cartAfterConflict = await client.query(
            "SELECT id FROM carts WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1",
            [userId]
        );

        return cartAfterConflict.rows[0].id;
    }
}

async function getCartPayload(userId, client = pool) {
    const cartId = await getActiveCartId(userId, client);
    const itemsResult = await client.query(
        `SELECT
            ci.product_id,
            p.name,
            p.description,
            p.price,
            p.image_url,
            p.category,
            p.is_available,
            ci.quantity,
            (ci.quantity * p.price) AS subtotal
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         WHERE ci.cart_id = $1
         ORDER BY ci.id ASC`,
        [cartId]
    );

    const items = itemsResult.rows.map((item) => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity),
        subtotal: Number(item.subtotal),
    }));

    return {
        id: cartId,
        status: "active",
        items,
        items_count: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
    };
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

    await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL REFERENCES products(id),
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS carts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS cart_items (
            id SERIAL PRIMARY KEY,
            cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL REFERENCES products(id),
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(cart_id, product_id)
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
        "UPDATE orders SET status = 'pending' WHERE status IS NULL OR status NOT IN ('pending', 'preparing', 'completed', 'cancelled')"
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
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS tag TEXT");
    await pool.query(
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.8"
    );
    await pool.query(
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0"
    );
    await pool.query("ALTER TABLE products ALTER COLUMN rating SET DEFAULT 4.8");
    await pool.query("ALTER TABLE products ALTER COLUMN reviews_count SET DEFAULT 0");
    await pool.query("UPDATE products SET rating = 4.8 WHERE rating IS NULL");
    await pool.query("UPDATE products SET reviews_count = 0 WHERE reviews_count IS NULL");

    await pool.query("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INTEGER");
    await pool.query("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC");
    await pool.query(
        "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    );
    await pool.query("ALTER TABLE carts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'");
    await pool.query(
        "ALTER TABLE carts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    );
    await pool.query(
        "ALTER TABLE carts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    );
    await pool.query(
        "ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    );
    await pool.query(
        "ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    );
    await pool.query(
        "CREATE UNIQUE INDEX IF NOT EXISTS carts_one_active_per_user ON carts(user_id) WHERE status = 'active'"
    );

    await pool.query(`
        CREATE TABLE IF NOT EXISTS restaurant_settings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            first_name TEXT,
            last_name TEXT,
            phone_number TEXT,
            restaurant_name TEXT,
            address TEXT,
            cuisine_type TEXT,
            seating_capacity INTEGER,
            new_order_alerts BOOLEAN DEFAULT true,
            low_stock_warnings BOOLEAN DEFAULT true,
            daily_reports BOOLEAN DEFAULT false,
            customer_reviews BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS first_name TEXT");
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS last_name TEXT");
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS phone_number TEXT");
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS restaurant_name TEXT");
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS address TEXT");
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS cuisine_type TEXT");
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS seating_capacity INTEGER");
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS new_order_alerts BOOLEAN DEFAULT true");
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS low_stock_warnings BOOLEAN DEFAULT true");
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS daily_reports BOOLEAN DEFAULT false");
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS customer_reviews BOOLEAN DEFAULT true");
    await pool.query("ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

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

app.patch("/auth/password", authenticateToken, async (req, res) => {
    const currentPassword = String(req.body.current_password || "");
    const newPassword = String(req.body.new_password || "");

    if (!currentPassword || newPassword.length < 6) {
        return res.status(400).json({
            message: "Current password and a new password of at least 6 characters are required.",
        });
    }

    const userResult = await pool.query("SELECT id, password FROM users WHERE id = $1", [
        req.user.id,
    ]);

    if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);

    if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedPassword,
        req.user.id,
    ]);

    res.json({ message: "Password updated successfully." });
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

app.get("/cart", authenticateToken, async (req, res) => {
    const cart = await getCartPayload(req.user.id);
    res.json(cart);
});

app.post("/cart/items", authenticateToken, async (req, res) => {
    const productId = Number(req.body.product_id);
    const quantity = normalizeQuantity(req.body.quantity, 1);

    if (!Number.isInteger(productId) || productId <= 0 || !quantity || quantity <= 0) {
        return res.status(400).json({ message: "Valid product_id and quantity are required." });
    }

    const productResult = await pool.query(
        "SELECT id, name, is_available FROM products WHERE id = $1",
        [productId]
    );

    if (productResult.rows.length === 0) {
        return res.status(404).json({ message: "Product not found." });
    }

    if (!productResult.rows[0].is_available) {
        return res.status(400).json({ message: "Product is currently unavailable." });
    }

    const cartId = await getActiveCartId(req.user.id);

    await pool.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (cart_id, product_id)
         DO UPDATE SET
            quantity = cart_items.quantity + EXCLUDED.quantity,
            updated_at = CURRENT_TIMESTAMP`,
        [cartId, productId, quantity]
    );

    await pool.query("UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [cartId]);

    const cart = await getCartPayload(req.user.id);
    res.status(201).json(cart);
});

app.patch("/cart/items/:productId", authenticateToken, async (req, res) => {
    const productId = Number(req.params.productId);
    const quantity = normalizeQuantity(req.body.quantity, 0);

    if (!Number.isInteger(productId) || productId <= 0 || quantity === null) {
        return res.status(400).json({ message: "Valid product id and quantity are required." });
    }

    const cartId = await getActiveCartId(req.user.id);

    if (quantity <= 0) {
        await pool.query("DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2", [
            cartId,
            productId,
        ]);
    } else {
        const productResult = await pool.query(
            "SELECT id, is_available FROM products WHERE id = $1",
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        if (!productResult.rows[0].is_available) {
            return res.status(400).json({ message: "Product is currently unavailable." });
        }

        await pool.query(
            `UPDATE cart_items
             SET quantity = $1, updated_at = CURRENT_TIMESTAMP
             WHERE cart_id = $2 AND product_id = $3`,
            [quantity, cartId, productId]
        );
    }

    await pool.query("UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [cartId]);

    const cart = await getCartPayload(req.user.id);
    res.json(cart);
});

app.delete("/cart/items/:productId", authenticateToken, async (req, res) => {
    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({ message: "Valid product id is required." });
    }

    const cartId = await getActiveCartId(req.user.id);

    await pool.query("DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2", [
        cartId,
        productId,
    ]);
    await pool.query("UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [cartId]);

    const cart = await getCartPayload(req.user.id);
    res.json(cart);
});

app.delete("/cart", authenticateToken, async (req, res) => {
    const cartId = await getActiveCartId(req.user.id);

    await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
    await pool.query("UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [cartId]);

    const cart = await getCartPayload(req.user.id);
    res.json(cart);
});

app.post("/orders/cart", authenticateToken, async (req, res) => {
    const normalizedCustomerName = String(req.body.customer_name || "").trim();

    if (!normalizedCustomerName) {
        return res.status(400).json({ message: "Customer name is required." });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const cartId = await getActiveCartId(req.user.id, client);
        const cartItemsResult = await client.query(
            `SELECT
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.image_url,
                p.category,
                p.is_available
             FROM cart_items ci
             JOIN products p ON p.id = ci.product_id
             WHERE ci.cart_id = $1
             ORDER BY ci.id ASC
             FOR UPDATE`,
            [cartId]
        );

        if (cartItemsResult.rows.length === 0) {
            throw createHttpError("Cart is empty.", 400);
        }

        for (const product of cartItemsResult.rows) {
            if (!product.is_available) {
                throw createHttpError(`${product.name} is currently out of stock.`, 400);
            }
        }

        const totalPrice = cartItemsResult.rows.reduce((sum, item) => {
            return sum + Number(item.price) * Number(item.quantity);
        }, 0);

        const orderResult = await client.query(
            `INSERT INTO orders (customer_name, total_price, user_id, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [normalizedCustomerName, totalPrice, req.user.id, "pending"]
        );

        const order = orderResult.rows[0];
        const createdItems = [];

        for (const item of cartItemsResult.rows) {
            const itemResult = await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [order.id, item.product_id, Number(item.quantity), Number(item.price)]
            );

            createdItems.push({
                ...itemResult.rows[0],
                product_name: item.name,
                image_url: item.image_url,
                category: item.category,
                subtotal: Number(item.price) * Number(item.quantity),
            });
        }

        await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
        await client.query("UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [cartId]);

        await client.query("COMMIT");

        res.status(201).json({
            ...order,
            total_price: Number(order.total_price),
            items: createdItems,
        });
    } catch (error) {
        await client.query("ROLLBACK");

        res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Failed to create order from cart.",
        });
    } finally {
        client.release();
    }
});

app.get("/orders", authenticateToken, async (req, res) => {
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim().toLowerCase();
    const params = [req.user.id];
    const conditions = ["user_id = $1"];

    if (search) {
        params.push(`%${search}%`);
        conditions.push(
            `(customer_name ILIKE $${params.length} OR CAST(id AS TEXT) ILIKE $${params.length} OR status ILIKE $${params.length})`
        );
    }

    if (status && status !== "all") {
        const normalizedStatus = normalizeOrderStatus(status);

        if (!normalizedStatus) {
            return res.status(400).json({ message: "Invalid order status" });
        }

        params.push(normalizedStatus);
        conditions.push(`status = $${params.length}`);
    }

    const result = await pool.query(
        `SELECT
            o.*,
            COALESCE(SUM(oi.quantity), 0)::int AS items_count,
            COALESCE(
                STRING_AGG(
                    CONCAT(oi.quantity, 'x ', p.name),
                    ', ' ORDER BY oi.id
                ),
                ''
            ) AS items_summary
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE ${conditions.map((condition) => condition.replace(/\bid\b/g, "o.id").replace(/\bstatus\b/g, "o.status").replace(/\bcustomer_name\b/g, "o.customer_name").replace(/\buser_id\b/g, "o.user_id")).join(" AND ")}
         GROUP BY o.id
         ORDER BY o.id DESC`,
        params
    );

    res.json(result.rows);
});

app.get("/orders/:id/items", authenticateToken, async (req, res) => {
    const { id } = req.params;

    const orderCheck = await pool.query(
        "SELECT id FROM orders WHERE id = $1 AND user_id = $2",
        [id, req.user.id]
    );

    if (orderCheck.rows.length === 0) {
        return res.status(404).json({ message: "Order not found." });
    }

    const result = await pool.query(
        `SELECT
            oi.id,
            oi.order_id,
            oi.product_id,
            oi.quantity,
            oi.unit_price,
            p.name,
            p.image_url,
            p.category,
            (oi.quantity * oi.unit_price) AS subtotal
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1
         ORDER BY oi.id ASC`,
        [id]
    );

    res.json(result.rows);
});

app.patch("/orders/:id/status", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const normalizedStatus = normalizeOrderStatus(req.body.status);

    if (!normalizedStatus) {
        return res.status(400).json({ message: "Invalid order status" });
    }

    const result = await pool.query(
        `UPDATE orders
         SET status = $1
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [normalizedStatus, id, req.user.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: "Order not found" });
    }

    res.json(result.rows[0]);
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

app.get("/analytics/overview", authenticateToken, async (req, res) => {
    const summaryResult = await pool.query(
        `SELECT
            COALESCE(SUM(total_price), 0)::numeric AS total_revenue,
            COUNT(*)::int AS total_orders,
            COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders,
            COUNT(*) FILTER (WHERE status = 'preparing')::int AS preparing_orders,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_orders,
            COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_orders,
            COALESCE(AVG(total_price), 0)::numeric AS average_order
         FROM orders
         WHERE user_id = $1`,
        [req.user.id]
    );

    const popularProductsResult = await pool.query(
        `SELECT
            p.id AS product_id,
            p.name,
            p.category,
            p.image_url,
            SUM(oi.quantity)::int AS total_quantity,
            COALESCE(SUM(oi.quantity * oi.unit_price), 0)::numeric AS total_revenue
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN products p ON p.id = oi.product_id
         WHERE o.user_id = $1
         GROUP BY p.id, p.name, p.category, p.image_url
         ORDER BY total_quantity DESC, total_revenue DESC
         LIMIT 8`,
        [req.user.id]
    );

    const revenueByDayResult = await pool.query(
        `SELECT
            DATE(created_at) AS day,
            COALESCE(SUM(total_price), 0)::numeric AS revenue,
            COUNT(*)::int AS orders
         FROM orders
         WHERE user_id = $1
         GROUP BY DATE(created_at)
         ORDER BY day ASC
         LIMIT 30`,
        [req.user.id]
    );

    const topCategoriesResult = await pool.query(
        `SELECT
            p.category,
            SUM(oi.quantity)::int AS total_quantity,
            COALESCE(SUM(oi.quantity * oi.unit_price), 0)::numeric AS total_revenue
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN products p ON p.id = oi.product_id
         WHERE o.user_id = $1
         GROUP BY p.category
         ORDER BY total_revenue DESC`,
        [req.user.id]
    );

    const hourlyOrdersResult = await pool.query(
        `SELECT
            EXTRACT(HOUR FROM created_at)::int AS hour,
            COUNT(*)::int AS orders,
            COALESCE(SUM(total_price), 0)::numeric AS revenue
         FROM orders
         WHERE user_id = $1
         GROUP BY EXTRACT(HOUR FROM created_at)
         ORDER BY hour ASC`,
        [req.user.id]
    );

    const summary = summaryResult.rows[0];

    res.json({
        total_revenue: Number(summary.total_revenue),
        total_orders: summary.total_orders,
        pending_orders: summary.pending_orders,
        preparing_orders: summary.preparing_orders,
        completed_orders: summary.completed_orders,
        cancelled_orders: summary.cancelled_orders,
        average_order: Number(summary.average_order),
        popular_products: popularProductsResult.rows.map((item) => ({
            ...item,
            total_quantity: Number(item.total_quantity),
            total_revenue: Number(item.total_revenue),
        })),
        revenue_by_day: revenueByDayResult.rows.map((item) => ({
            ...item,
            revenue: Number(item.revenue),
            orders: Number(item.orders),
        })),
        top_categories: topCategoriesResult.rows.map((item) => ({
            ...item,
            total_quantity: Number(item.total_quantity),
            total_revenue: Number(item.total_revenue),
        })),
        hourly_orders: hourlyOrdersResult.rows.map((item) => ({
            hour: Number(item.hour),
            orders: Number(item.orders),
            revenue: Number(item.revenue),
        })),
    });
});

app.get("/analytics/popular-products", authenticateToken, async (req, res) => {
    const result = await pool.query(
        `SELECT
            p.id AS product_id,
            p.name,
            p.category,
            p.image_url,
            SUM(oi.quantity)::int AS total_quantity,
            COALESCE(SUM(oi.quantity * oi.unit_price), 0)::numeric AS total_revenue
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN products p ON p.id = oi.product_id
         WHERE o.user_id = $1
         GROUP BY p.id, p.name, p.category, p.image_url
         ORDER BY total_quantity DESC, total_revenue DESC
         LIMIT 10`,
        [req.user.id]
    );

    res.json(
        result.rows.map((item) => ({
            ...item,
            total_quantity: Number(item.total_quantity),
            total_revenue: Number(item.total_revenue),
        }))
    );
});

app.get("/settings", authenticateToken, async (req, res) => {
    const userResult = await pool.query("SELECT name, email FROM users WHERE id = $1", [
        req.user.id,
    ]);
    const user = userResult.rows[0] || {};
    const nameParts = String(user.name || "").split(" ").filter(Boolean);

    const result = await pool.query(
        `INSERT INTO restaurant_settings (
            user_id,
            first_name,
            last_name,
            restaurant_name,
            new_order_alerts,
            low_stock_warnings,
            daily_reports,
            customer_reviews
         )
         VALUES ($1, $2, $3, 'RestoDash Lite', true, true, false, true)
         ON CONFLICT (user_id) DO NOTHING
         RETURNING *`,
        [req.user.id, nameParts[0] || "", nameParts.slice(1).join(" ")]
    );

    const settingsResult =
        result.rows.length > 0
            ? result
            : await pool.query("SELECT * FROM restaurant_settings WHERE user_id = $1", [
                req.user.id,
            ]);

    res.json({
        ...settingsResult.rows[0],
        email: user.email || "",
    });
});

app.put("/settings", authenticateToken, async (req, res) => {
    const toBoolean = (value, fallback) =>
        typeof value === "boolean" ? value : fallback;
    const seatingCapacity = Number(req.body.seating_capacity);

    const result = await pool.query(
        `INSERT INTO restaurant_settings (
            user_id,
            first_name,
            last_name,
            phone_number,
            restaurant_name,
            address,
            cuisine_type,
            seating_capacity,
            new_order_alerts,
            low_stock_warnings,
            daily_reports,
            customer_reviews,
            updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id)
         DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            phone_number = EXCLUDED.phone_number,
            restaurant_name = EXCLUDED.restaurant_name,
            address = EXCLUDED.address,
            cuisine_type = EXCLUDED.cuisine_type,
            seating_capacity = EXCLUDED.seating_capacity,
            new_order_alerts = EXCLUDED.new_order_alerts,
            low_stock_warnings = EXCLUDED.low_stock_warnings,
            daily_reports = EXCLUDED.daily_reports,
            customer_reviews = EXCLUDED.customer_reviews,
            updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
            req.user.id,
            String(req.body.first_name || "").trim(),
            String(req.body.last_name || "").trim(),
            String(req.body.phone_number || "").trim(),
            String(req.body.restaurant_name || "").trim(),
            String(req.body.address || "").trim(),
            String(req.body.cuisine_type || "").trim(),
            Number.isFinite(seatingCapacity) ? seatingCapacity : null,
            toBoolean(req.body.new_order_alerts, true),
            toBoolean(req.body.low_stock_warnings, true),
            toBoolean(req.body.daily_reports, false),
            toBoolean(req.body.customer_reviews, true),
        ]
    );

    res.json(result.rows[0]);
});

app.get("/products", authenticateToken, async (req, res) => {
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();
    const availability = String(req.query.availability || "").trim();
    const params = [];
    const conditions = [];

    if (search) {
        params.push(`%${search}%`);
        conditions.push(
            `(name ILIKE $${params.length} OR description ILIKE $${params.length} OR category ILIKE $${params.length} OR CAST(price AS TEXT) ILIKE $${params.length})`
        );
    }

    if (category && category !== "all") {
        params.push(category);
        conditions.push(`category = $${params.length}`);
    }

    if (availability === "available" || availability === "out-of-stock") {
        params.push(availability === "available");
        conditions.push(`is_available = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
        `SELECT * FROM products ${whereClause} ORDER BY category ASC, name ASC, id ASC`,
        params
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
