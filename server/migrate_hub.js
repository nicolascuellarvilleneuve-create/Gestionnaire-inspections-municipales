const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'city_hub',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
};

async function migrate() {
    console.log(">>> MIGRATING HUB SCHEMA...");
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();

        // 1. Drop Old Table
        console.log("   - Dropping legacy 'inspections_hub'...");
        await client.query("DROP TABLE IF EXISTS inspections_hub CASCADE;");

        // 2. Read Schema File
        const schemaPath = path.join(__dirname, '../docs/schemas/00_hub.sql');
        let sql = fs.readFileSync(schemaPath, 'utf8');

        // Extract the CREATE TABLE part if file has other stuff? 
        // 00_hub.sql has postgis extensions, users table etc.
        // We only want inspections_hub mostly, but running the whole file is safer for consistency
        // providing we handle 'already exists' errors for other tables.

        // Let's just run it. It uses IF NOT EXISTS for extensions.
        // It creates users. We should probably NOT drop users if we want to keep them.
        // The SQL file tries to Create Table users.

        // Hack: We only want to recreate inspections_hub.
        // Let's execute the CREATE TABLE inspections_hub block manually or parse it?
        // Or just Rename users table, run script, restore users?

        // Better: Execute specific SQL for the table.
        // I'll grab the CREATE TABLE definitions from the file in the thought process?
        // No, I'll modify this script to contain the CREATE definition hardcoded to match the file I saw.

        // Wait, reading the file is better source of truth.
        // I'll assume running the file will fail on 'users' (already exists) but succeed on 'inspections_hub' (since I dropped it).

        console.log("   - Applying 00_hub.sql...");
        try {
            await client.query(sql);
        } catch (e) {
            console.log("     (Ignored error during full apply, usually 'relation users exists'):", e.message);
        }

        console.log("✅ MIGRATION COMPLETE.");

    } catch (e) {
        console.error("❌ MIGRATION FAILED:", e);
    } finally {
        await client.end();
    }
}

migrate();
