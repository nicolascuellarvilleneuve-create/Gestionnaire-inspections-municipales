const { Client } = require('pg');
require('dotenv').config();

const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'city_hub',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
};

async function verify() {
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();
        console.log("Connected to city_hub.");

        // Simulate the query exactly as updated in db_router.js
        const lotQuery = `
            INSERT INTO lots (id, matricule, data_source, geom_quality, active_from)
            VALUES (gen_random_uuid(), 'TEST-VERIFY-' || gen_random_uuid(), 'manual_correction', 5, NOW())
            RETURNING id;
        `;

        console.log("Running Query:", lotQuery);
        const res = await client.query(lotQuery);
        console.log("✅ Success! ID:", res.rows[0].id);

    } catch (e) {
        console.error("❌ Failed:", e.message);
    } finally {
        await client.end();
    }
}

verify();
