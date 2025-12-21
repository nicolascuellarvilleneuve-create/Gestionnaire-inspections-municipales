const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_NAME = 'city_geo_ref';
const SCHEMA_FILE = '../docs/schemas/09_geo_ref.sql';

const rootConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    database: 'postgres'
};

async function init() {
    console.log(`>>> INITIALIZING ${DB_NAME}...`);

    // 1. Create DB
    const clientRoot = new Client(rootConfig);
    try {
        await clientRoot.connect();
        const res = await clientRoot.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`);
        if (res.rowCount === 0) {
            await clientRoot.query(`CREATE DATABASE "${DB_NAME}"`);
            console.log("   - Database Created.");
        } else {
            console.log("   - Database exists.");
        }
    } catch (e) {
        console.error("Error creating DB:", e);
        return;
    } finally {
        await clientRoot.end();
    }

    // 2. Apply Schema
    const clientApp = new Client({ ...rootConfig, database: DB_NAME });
    try {
        await clientApp.connect();
        await clientApp.query("CREATE EXTENSION IF NOT EXISTS postgis;");
        console.log("   - PostGIS enabled.");

        const schemaPath = path.join(__dirname, SCHEMA_FILE);
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            await clientApp.query(sql);
            console.log("   - Schema Applied.");
        } else {
            console.error("   - Schema File Not Found:", schemaPath);
        }

    } catch (e) {
        console.error("Error applying schema:", e);
    } finally {
        await clientApp.end();
    }
}

init();
