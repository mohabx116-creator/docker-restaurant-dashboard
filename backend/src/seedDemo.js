const bcrypt = require("bcryptjs");
const pool = require("./db");
const productCatalog = require("./productCatalog");

const DEMO_EMAIL = "mohab@test.com";
const DEMO_PASSWORD = "123456";

const customers = [
    "Mohab Ahmed",
    "Nour Hassan",
    "Omar Khaled",
    "Mariam Ali",
    "Youssef Nabil",
    "Salma Adel",
    "Karim Samir",
    "Laila Mostafa",
];

const statuses = ["pending", "preparing", "completed", "cancelled"];

async function ensureDemoUser(client) {
    const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [
        DEMO_EMAIL,
    ]);

    if (existingUser.rows.length > 0) {
        return existingUser.rows[0].id;
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const createdUser = await client.query(
        `INSERT INTO users (name, email, password)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ["Mohab Demo", DEMO_EMAIL, passwordHash]
    );

    return createdUser.rows[0].id;
}

async function ensureProducts(client) {
    for (const product of productCatalog) {
        const existingProduct = await client.query(
            "SELECT id FROM products WHERE name = $1 LIMIT 1",
            [product.name]
        );

        if (existingProduct.rows.length > 0) {
            continue;
        }

        await client.query(
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

    const products = await client.query(
        "SELECT id, name, price, category FROM products ORDER BY id ASC"
    );

    return products.rows;
}

async function seedOrders(client, userId, products) {
    const existingOrders = await client.query(
        "SELECT COUNT(*)::int AS count FROM orders WHERE user_id = $1",
        [userId]
    );

    if (existingOrders.rows[0].count >= 20) {
        return;
    }

    for (let index = 0; index < 28; index += 1) {
        const itemCount = 1 + (index % 4);
        const selectedItems = [];

        for (let offset = 0; offset < itemCount; offset += 1) {
            const product = products[(index + offset * 3) % products.length];
            selectedItems.push({
                product,
                quantity: 1 + ((index + offset) % 3),
            });
        }

        const totalPrice = selectedItems.reduce(
            (sum, item) => sum + Number(item.product.price) * item.quantity,
            0
        );
        const createdAt = new Date(Date.now() - index * 8 * 60 * 60 * 1000);
        const order = await client.query(
            `INSERT INTO orders (customer_name, total_price, user_id, status, created_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [
                customers[index % customers.length],
                totalPrice,
                userId,
                statuses[index % statuses.length],
                createdAt,
            ]
        );

        for (const item of selectedItems) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                 VALUES ($1, $2, $3, $4)`,
                [order.rows[0].id, item.product.id, item.quantity, item.product.price]
            );
        }
    }
}

async function seedCart(client, userId, products) {
    const cartResult = await client.query(
        `INSERT INTO carts (user_id, status)
         VALUES ($1, 'active')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [userId]
    );
    const cartId =
        cartResult.rows[0]?.id ||
        (
            await client.query(
                "SELECT id FROM carts WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1",
                [userId]
            )
        ).rows[0].id;

    const existingItems = await client.query(
        "SELECT COUNT(*)::int AS count FROM cart_items WHERE cart_id = $1",
        [cartId]
    );

    if (existingItems.rows[0].count > 0) {
        return;
    }

    for (const product of products.slice(0, 3)) {
        await client.query(
            `INSERT INTO cart_items (cart_id, product_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (cart_id, product_id)
             DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP`,
            [cartId, product.id, 1]
        );
    }
}

async function main() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        const userId = await ensureDemoUser(client);
        const products = await ensureProducts(client);
        await seedOrders(client, userId, products);
        await seedCart(client, userId, products);
        await client.query("COMMIT");

        console.log(`Demo data ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Demo seed failed:", error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

main();
