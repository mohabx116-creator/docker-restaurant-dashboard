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
    const result = await pool.query(
        "SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC",
        [req.user.id]
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
