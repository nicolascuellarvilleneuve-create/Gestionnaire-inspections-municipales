
const { Client } = require('pg');
const http = require('http');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
};

async function checkDatabase() {
    console.log("--- [1] DATABASE CHECK ---");
    const client = new Client(dbConfig);
    try {
        await client.connect();
        console.log("✅ Connection to PostgreSQL: SUCCESS");

        // Check PostGIS
        const resExt = await client.query("SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis'");
        if (resExt.rows.length > 0) {
            console.log(`✅ PostGIS Extension: INSTALLED (v${resExt.rows[0].extversion})`);
        } else {
            console.error("❌ PostGIS Extension: MISSING");
        }

        // Check Tables
        const resTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);

        const tables = resTables.rows.map(r => r.table_name);
        const required = ['inspections_hub', 'inspection_data_industrie', 'inspection_data_habitation'];

        required.forEach(req => {
            if (tables.includes(req)) {
                console.log(`✅ Table '${req}': FOUND`);
            } else {
                console.error(`❌ Table '${req}': MISSING`);
            }
        });

    } catch (err) {
        console.error("❌ Database Connection: FAILED", err.message);
    } finally {
        await client.end();
    }
}

async function checkAPI() {
    console.log("\n--- [2] API SERVER CHECK ---");
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3001/', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.status === 'Online') {
                        console.log("✅ API Status: ONLINE");
                        console.log(`   Message: ${json.message}`);
                    } else {
                        console.warn("⚠️ API Status: UNKNOWN RESPONSE", json);
                    }
                } catch {
                    console.error("❌ API Response: INVALID JSON");
                }
                resolve();
            });
        });

        req.on('error', (err) => {
            console.error("❌ API Connection: FAILED (Is the server running?)");
            console.error(`   Error: ${err.message}`);
            resolve();
        });
    });
}

async function runScan() {
    console.log(">>> SYSTEM DEBUG SCAN STARTING...\n");
    await checkDatabase();
    await checkAPI();
    console.log("\n>>> SCAN COMPLETE.");
}

runScan();
