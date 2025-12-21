const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = process.env.DB_PORT || 5432;

async function applyHubSchema() {
    console.log("Applying updated Hub Schema...");
    const client = new Client({
        user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT,
        database: 'city_hub'
    });

    try {
        await client.connect();
        const schemaPath = path.join(__dirname, '../docs/schemas/00_hub.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        // We split by ';' to run statements, OR just run the whole thing if it allows multiple. 
        // Postgres node driver usually allows multiple statements if basic.
        // However, '00_hub.sql' has CREATE EXTENSION etc which might error if exist.
        // The file has "IF NOT EXISTS", so it should be fine to re-run.

        await client.query(sql);
        console.log("✅ Schema applied successfully.");
    } catch (e) {
        console.error("❌ Error applying schema:", e.message);
    } finally {
        await client.end();
    }
}

applyHubSchema();
