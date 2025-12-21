const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = process.env.DB_PORT || 5432;

async function seedAdmin() {
    console.log("Seeding Admin User...");
    const client = new Client({
        user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT,
        database: 'city_hub'
    });

    try {
        await client.connect();

        // 1. Check if admin exists
        const check = await client.query("SELECT 1 FROM users WHERE username = 'admin'");
        if (check.rowCount > 0) {
            console.log("⚠️ Admin user already exists. Skipping.");
            return;
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // 3. Insert
        await client.query(`
            INSERT INTO users (username, password_hash, role)
            VALUES ('admin', $1, 'admin')
        `, [hashedPassword]);

        console.log("✅ Admin user created! (User: admin / Pass: admin123)");

    } catch (e) {
        console.error("❌ Error seeding admin:", e.message);
    } finally {
        await client.end();
    }
}

seedAdmin();
