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

async function fix() {
    console.log(">>> FIXING HUB TABLE...");
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();

        await client.query("DROP TABLE IF EXISTS inspections_hub CASCADE;");

        // Definition from 00_hub.sql
        const sql = `
            CREATE TABLE inspections_hub (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                address_id UUID NOT NULL, -- Links to city_geo_ref.adresses(id)
                usage_code_id UUID NOT NULL, -- Links to city_codes.usages(id)
                conformity_snapshot_id UUID,
                status_conformite TEXT CHECK (status_conformite IN ('Conforme', 'Non-conforme')),
                date_inspection DATE NOT NULL,
                source_db TEXT NOT NULL,
                source_id UUID NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
            ALTER TABLE inspections_hub ADD COLUMN geom GEOMETRY(POINT, 4326);
            CREATE INDEX idx_hub_geom ON inspections_hub USING GIST (geom);
        `;

        await client.query(sql);
        console.log("✅ TABLE 'inspections_hub' CREATED SUCCESSFULLY.");

    } catch (e) {
        console.error("❌ CREATE FAILED:", e);
    } finally {
        await client.end();
    }
}

fix();
