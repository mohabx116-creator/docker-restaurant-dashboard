const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const ORDER_STATUSES = new Set(["pending", "preparing", "completed"]);

app.use(cors());
app.use(express.json());

function normalizeOrderStatus(status = "pending") {
    const normalizedStatus = String(status).trim().toLowerCase() || "pending";
    return ORDER_STATUSES.has(normalizedStatus) ? normalizedStatus : null;
}

async function ensureOrdersStatusColumn() {
    const tableCheck = await pool.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'orders'
        ) AS exists`
    );

    if (!tableCheck.rows[0]?.exists) {
        return;
    }

    await pool.query(
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'"
    );

    await pool.query(
        "UPDATE orders SET status = 'pending' WHERE status IS NULL OR status NOT IN ('pending', 'preparing', 'completed')"
    );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
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

const PORT = process.env.PORT || 3001;

async function startServer() {
    await ensureOrdersStatusColumn();

    app.listen(PORT, () => {
        console.log(`API running on http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start API:", error);
    process.exit(1);
});
