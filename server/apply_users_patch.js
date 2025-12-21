const { Client } = require('pg');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = process.env.DB_PORT || 5432;

async function applyUsersPatch() {
    console.log("Applying Users Table Patch...");
    const client = new Client({
        user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT,
        database: 'city_hub'
    });

    try {
        await client.connect();

        const sql = `
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT CHECK (role IN ('admin', 'inspector')) DEFAULT 'inspector',
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;

        await client.query(sql);
        console.log("✅ Users table created (or already exists).");
    } catch (e) {
        console.error("❌ Error applying patch:", e.message);
    } finally {
        await client.end();
    }
}

applyUsersPatch();
