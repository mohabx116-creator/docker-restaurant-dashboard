const { Pool } = require("pg");
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;

const pool = new Pool(
    databaseUrl
        ? {
            connectionString: databaseUrl,
            ssl: {
                rejectUnauthorized: false,
            },
        }
        : {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        }
);

module.exports = pool;
