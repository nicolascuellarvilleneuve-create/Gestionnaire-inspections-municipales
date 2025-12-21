const { Client } = require('pg');
require('dotenv').config();

const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'city_hub',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
};

async function debug() {
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();
        console.log("Connected to city_hub.");

        // EXACT Query from db_router.js
        const query = `
            SELECT 
                h.id, 
                (a.numero_civique || ' ' || a.rue) as adresse, -- Alias for Dashboard
                u.code as zone, -- Alias for Dashboard (Type/Use)
                h.status_conformite as status, -- Alias for Dashboard
                h.date_inspection as date, -- Alias for Dashboard
                h.source_db,
                'N/A' as proprietaire, -- Placeholder until Owner tables linked
                ST_X(a.geom::geometry) as lng, 
                ST_Y(a.geom::geometry) as lat 
            FROM inspections_hub h
            JOIN adresses a ON h.address_id = a.id
            JOIN usages u ON h.usage_code_id = u.id
            WHERE a.active_to IS NULL -- Only show active addresses
            ORDER BY h.date_inspection DESC;
        `;

        console.log("Running Query...");
        const res = await client.query(query);
        console.log(`Found ${res.rowCount} rows.`);
        if (res.rowCount > 0) {
            console.log("First Row Data:", JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log("No rows found. Checking raw tables...");
            const hubCount = await client.query('SELECT COUNT(*) FROM inspections_hub');
            const addrCount = await client.query('SELECT COUNT(*) FROM adresses');
            console.log(`Inspections Hub Count: ${hubCount.rows[0].count}`);
            console.log(`Addresses Count: ${addrCount.rows[0].count}`);
        }

    } catch (e) {
        console.error("❌ Failed:", e.message);
    } finally {
        await client.end();
    }
}

debug();
