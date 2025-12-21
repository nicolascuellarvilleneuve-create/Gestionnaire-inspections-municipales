const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SPOKES = [
    { name: 'city_industrie', schema: '../docs/schemas/01_industrie.sql' },
    { name: 'city_habitation', schema: '../docs/schemas/02_habitation.sql' },
    { name: 'city_permis', schema: '../docs/schemas/06_permis.sql' },
    { name: 'city_plans', schema: '../docs/schemas/08_plans.sql' }
    // Add others if files exist
];

const rootConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    database: 'postgres'
};

async function init() {
    console.log(">>> INITIALIZING SPOKE DATABASES...");

    // 1. CREATE DATABASES
    const clientRoot = new Client(rootConfig);
    try {
        await clientRoot.connect();

        for (const spoke of SPOKES) {
            console.log(`\nProcessing ${spoke.name}...`);
            // Check Exist
            const res = await clientRoot.query(`SELECT 1 FROM pg_database WHERE datname = '${spoke.name}'`);
            if (res.rowCount === 0) {
                await clientRoot.query(`CREATE DATABASE "${spoke.name}"`);
                console.log(`   - Database ${spoke.name} Created.`);
            } else {
                console.log(`   - Database ${spoke.name} already exists.`);
            }
        }
    } catch (e) {
        console.error("Critical Error connecting to Postgres:", e);
        return;
    } finally {
        await clientRoot.end();
    }

    // 2. APPLY SCHEMAS
    for (const spoke of SPOKES) {
        const schemaPath = path.join(__dirname, spoke.schema);
        if (!fs.existsSync(schemaPath)) {
            console.warn(`   ⚠️ Schema file not found: ${schemaPath}`);
            continue;
        }

        console.log(`   - Applying schema to ${spoke.name}...`);
        const clientApp = new Client({ ...rootConfig, database: spoke.name });
        try {
            await clientApp.connect();

            // Basic Extensions
            await clientApp.query("CREATE EXTENSION IF NOT EXISTS postgis;");

            // Read & Run SQL
            const sql = fs.readFileSync(schemaPath, 'utf8');
            await clientApp.query(sql);
            console.log(`   - ✅ Schema applied.`);

        } catch (e) {
            console.error(`   ❌ Error applying schema to ${spoke.name}:`, e.message);
        } finally {
            await clientApp.end();
        }
    }
}

init();
