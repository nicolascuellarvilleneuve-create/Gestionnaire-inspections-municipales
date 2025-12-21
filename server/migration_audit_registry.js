
const { Client } = require('pg');
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
    console.log("[MIGRATE] Connecting to city_hub...");
    const client = new Client(DB_CONFIG);

    try {
        await client.connect();

        console.log("[MIGRATE] Creating 'inspection_audits' table...");

        // 1. Create Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS inspection_audits (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                inspection_id UUID,
                inspector_id INTEGER,
                inspector_name TEXT,
                action_type TEXT NOT NULL,
                location_snapshot GEOMETRY(Point, 4326),
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                metadata JSONB DEFAULT '{}'::jsonb
            );
        `);

        // 2. Create Indexes for performance
        await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_inspection ON inspection_audits(inspection_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_inspector ON inspection_audits(inspector_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON inspection_audits(timestamp);`);

        console.log("[MIGRATE] SUCCESS: 'inspection_audits' table created.");

    } catch (e) {
        console.error("[MIGRATE] ERROR:", e);
    } finally {
        await client.end();
    }
}

migrate();
