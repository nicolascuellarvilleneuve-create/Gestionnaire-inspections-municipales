
const { Client } = require('pg');
// Native fetch is available in Node 18+
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const BASE_URL = 'http://localhost:3001/api';
// Assuming admin credentials for test valid token generation if needed, 
// but for now we'll test public/protected routes and DB directly.
const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'city_hub',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
};

async function runDiagnostics() {
    console.log("==========================================");
    console.log("   FULL SYSTEM DIAGNOSTIC SCAN");
    console.log("   " + new Date().toISOString());
    console.log("==========================================\n");

    let errors = 0;
    let warnings = 0;

    // 1. CHECK DATABASE CONNECTIVITY (HUB)
    console.log("[1/5] Checking Database Federation...");
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();
        console.log("   [PASS] Connected to 'city_hub'");

        // Check PostGIS
        const postgis = await client.query("SELECT postgis_full_version()");
        console.log(`   [PASS] PostGIS Active: ${postgis.rows[0].postgis_full_version.substring(0, 20)}...`);

    } catch (e) {
        console.log("   [FAIL] Could not connect to 'city_hub': " + e.message);
        console.log("   !!! CRITICAL FAILURE - ABORTING !!!");
        return;
    }

    // 2. CHECK SPOKE CONNECTIONS & FOREIGN TABLES
    console.log("\n[2/5] Checking Federated Tables (Spokes)...");
    const requiredTables = [
        'inspections_hub',
        'usages',
        'adresses',
        'lots',
        'foreign_city_industrie.inspection_details',
        'foreign_city_habitation.inspection_details'
        // Add others as needed
    ];

    for (const table of requiredTables) {
        try {
            // Simple select 1 to verify existence and FDW link
            await client.query(`SELECT 1 FROM ${table} LIMIT 1`);
            console.log(`   [PASS] Table Access: ${table}`);
        } catch (e) {
            console.log(`   [FAIL] Table Access: ${table} - ${e.message}`);
            errors++;
        }
    }

    // 3. CHECK DATA CONSISTENCY
    console.log("\n[3/5] Checking Data Integrity...");

    // Check for Orphans (Hub records with no matching spoke details)
    try {
        const orphanQuery = `
            SELECT h.id, h.source_db, h.source_id 
            FROM inspections_hub h
            LEFT JOIN foreign_city_industrie.inspection_details ind ON (h.source_db = 'foreign_city_industrie.inspection_details' AND h.source_id = ind.id)
            LEFT JOIN foreign_city_habitation.inspection_details hab ON (h.source_db = 'foreign_city_habitation.inspection_details' AND h.source_id = hab.id)
            WHERE 
                (h.source_db = 'foreign_city_industrie.inspection_details' AND ind.id IS NULL) OR
                (h.source_db = 'foreign_city_habitation.inspection_details' AND hab.id IS NULL)
        `;
        const orphans = await client.query(orphanQuery);
        if (orphans.rowCount > 0) {
            console.log(`   [WARN] Found ${orphans.rowCount} Orphaned Records in Hub (Valid ID but missing details).`);
            warnings++;
        } else {
            console.log("   [PASS] No Orphaned Records found (Hub <-> Spoke Sync OK).");
        }
    } catch (e) {
        console.log(`   [FAIL] Integrity Check Error: ${e.message}`);
        errors++;
    }

    // 4. CHECK API STATUS
    console.log("\n[4/5] Checking API Server...");
    try {
        const rootRes = await fetch('http://localhost:3001/');
        if (rootRes.ok) {
            const data = await rootRes.json();
            console.log(`   [PASS] Server Online: ${data.message}`);
        } else {
            console.log(`   [FAIL] Server responded with status ${rootRes.status}`);
            errors++;
        }
    } catch (e) {
        console.log(`   [FAIL] Server Unreachable: ${e.message}`);
        console.log("          (Make sure to run LANCER_APP.bat)");
        errors++;
    }

    // 5. CHECK MAP DATA API (Public Endpoint wrapper check)
    console.log("\n[5/5] Checking Dashboard/Map Data Endpoint...");
    try {
        // We can't easily test protected routes without a valid token, 
        // but checking the GET /api/inspections (if public, but it is protected now?) 
        // Actually map data route might be protected or not. Let's assume protected but check response.
        // Wait, route `app.get('/api/inspections')` in index.js seems unprotected in previous reads?
        // Checking index.js... Line 54: app.get('/api/inspections', async (req, res)... 
        // It does NOT have verifyToken middleware! It is public for map.

        const mapRes = await fetch(`${BASE_URL}/inspections`);
        if (mapRes.ok) {
            const data = await mapRes.json();
            console.log(`   [PASS] Map Data Fetch Success. Count: ${data.length}`);

            // Validate data structure for Dashboard
            if (data.length > 0) {
                const sample = data[0];
                const missingKeys = ['id', 'adresse', 'zone', 'status', 'date', 'lat', 'lng'].filter(k => !(k in sample));
                if (missingKeys.length === 0) {
                    console.log("   [PASS] Data Structure Valid (Dashboard Keys present).");
                } else {
                    console.log(`   [FAIL] Data Structure Invalid. Missing keys: ${missingKeys.join(', ')}`);
                    console.log("          Received keys:", Object.keys(sample));
                    errors++;
                }
            }
        } else {
            console.log(`   [FAIL] Map Data Fetch Status: ${mapRes.status}`);
            errors++;
        }
    } catch (e) {
        console.log(`   [FAIL] Map Data Fetch Failed: ${e.message}`);
        errors++;
    }

    await client.end();

    console.log("\n==========================================");
    console.log(` DIAGNOSTIC COMPLETE`);
    console.log(` Errors: ${errors}`);
    console.log(` Warnings: ${warnings}`);
    if (errors === 0) console.log(" SYSTEM STATUS: HEALTHY (GREEN)");
    else console.log(" SYSTEM STATUS: DEGRADED (RED)");
    console.log("==========================================");
}

runDiagnostics();
