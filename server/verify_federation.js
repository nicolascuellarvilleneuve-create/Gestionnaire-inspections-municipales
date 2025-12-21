
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_CONFIG = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: 'city_hub' // Connecting to the Brain
};

async function verify() {
    console.log(">>> VERIFYING FEDERATION LINKS...");
    const client = new Client(DB_CONFIG);

    try {
        await client.connect();
        console.log("✅ Connected to HUB.");

        // Check if we can see the Foreign Schema
        const res = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'foreign_%';
        `);

        console.log(`\nFound ${res.rowCount} Foreign Links (Visible Spokes):`);
        res.rows.forEach(r => console.log(` - ${r.schema_name}`));

        // Attempt to query a Spoke (Industrie)
        console.log("\nAttempting to query 'foreign_city_industrie'...");
        const resInd = await client.query('SELECT count(*) FROM foreign_city_industrie.inspection_details');
        console.log(`✅ Success! Link is active. Row count: ${resInd.rows[0].count}`);

    } catch (e) {
        console.error("❌ Link Verification Failed:", e.message);
    } finally {
        await client.end();
    }
}

verify();
