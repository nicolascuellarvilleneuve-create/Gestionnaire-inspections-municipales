const { Client } = require('pg');
require('dotenv').config();

const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'city_hub',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
};

async function check() {
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();

        console.log("--- SCHEMAS ---");
        const schemas = await client.query("SELECT schema_name FROM information_schema.schemata;");
        schemas.rows.forEach(r => console.log(`  - ${r.schema_name}`));

        console.log("\n--- TABLES & VIEWS (public) ---");
        const tables = await client.query(`
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        tables.rows.forEach(r => console.log(`  - ${r.table_name} (${r.table_type})`));

        console.log("\n--- TESTING FOREIGN ACCESS (industrie) ---");
        try {
            const res = await client.query("SELECT count(*) FROM foreign_city_industrie.inspection_details_industrie");
            console.log(`  ✅ foreign_city_industrie.inspection_details_industrie access OK. Count: ${res.rows[0].count}`);
        } catch (e) {
            console.log(`  ❌ Failed to access foreign_city_industrie: ${e.message}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
