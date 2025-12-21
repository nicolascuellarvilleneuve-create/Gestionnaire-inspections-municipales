const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'city_hub',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
};

async function applyCodes() {
    console.log(">>> APPLYING CODES SCHEMA TO CITY_HUB...");
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();

        const schemaPath = path.join(__dirname, '../docs/schemas/10_codes.sql');
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            await client.query(sql);
            console.log("   ✅ Schema 10_codes.sql applied.");
        } else {
            console.error("   ❌ Schema file not found:", schemaPath);
        }

    } catch (e) {
        console.error("Error applying codes:", e);
    } finally {
        await client.end();
    }
}

applyCodes();
