const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    database: 'city_hub'
};

async function fix() {
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();
        console.log("🛠️ FIXING GEO REFERENCE FEDERATION...");

        // 1. Create Server
        try {
            await client.query(`
                CREATE SERVER IF NOT EXISTS city_geo_ref_server
                FOREIGN DATA WRAPPER postgres_fdw
                OPTIONS (host '${process.env.DB_HOST || 'localhost'}', dbname 'city_geo_ref', port '${process.env.DB_PORT || '5432'}');
            `);
            console.log("   - Server Created.");
        } catch (e) { console.log("   - Server check skipped/failed:", e.message); }

        // 2. Create User Mapping
        try {
            await client.query(`
                CREATE USER MAPPING IF NOT EXISTS FOR ${process.env.DB_USER || 'postgres'}
                SERVER city_geo_ref_server
                OPTIONS (user '${process.env.DB_USER || 'postgres'}', password '${process.env.DB_PASSWORD}');
            `);
            console.log("   - User Mapping Created.");
        } catch (e) { console.log("   - Mapping check skipped/failed:", e.message); }

        // 3. Import Schema (as foreign_city_geo_ref)
        await client.query("CREATE SCHEMA IF NOT EXISTS foreign_city_geo_ref;");
        await client.query(`
            IMPORT FOREIGN SCHEMA public 
            FROM SERVER city_geo_ref_server 
            INTO foreign_city_geo_ref;
        `);
        console.log("   - Imported Schema 'foreign_city_geo_ref'.");

        // 4. Create Public Views/Wrappers for Router compatibility
        // The Router expects 'adresses' and 'lots' to be available. 
        // We will create Views in 'public' that point to the foreign tables.
        // We drop existing 'adresses' if it's broken.

        await client.query("DROP TABLE IF EXISTS adresses CASCADE;");
        await client.query("DROP VIEW IF EXISTS adresses;");

        await client.query(`
            CREATE VIEW adresses AS 
            SELECT * FROM foreign_city_geo_ref.adresses;
        `);
        console.log("   - Created Public View 'adresses' -> 'foreign_city_geo_ref.adresses'.");

        await client.query("DROP TABLE IF EXISTS lots CASCADE;");
        await client.query("DROP VIEW IF EXISTS lots;");
        await client.query(`
            CREATE VIEW lots AS 
            SELECT * FROM foreign_city_geo_ref.lots;
        `);
        console.log("   - Created Public View 'lots' -> 'foreign_city_geo_ref.lots'.");

        console.log("✅ FIX COMPLETE. 'adresses' relational link restored.");

    } catch (e) {
        console.error("❌ FIX FAILED:", e);
    } finally {
        await client.end();
    }
}

fix();
