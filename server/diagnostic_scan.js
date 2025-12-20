const { Client } = require('pg');
// Native fetch is available in Node 18+

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_CONFIG = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

async function measure(label, fn) {
    const start = performance.now();
    try {
        await fn();
        const end = performance.now();
        const duration = (end - start).toFixed(2);
        console.log(`[PASS] ${label}: ${duration}ms`);
        return parseFloat(duration);
    } catch (e) {
        console.log(`[FAIL] ${label}: ${e.message}`);
        return null;
    }
}

async function runDiagnostics() {
    console.log(">>> SYSTEM DIAGNOSTIC & PERFORMANCE SCAN <<<");
    console.log(`Date: ${new Date().toISOString()}`);
    console.log("------------------------------------------------");

    // 1. API HEALTH
    await measure("API Response Time (Health Check)", async () => {
        const res = await fetch('http://localhost:3001/');
        if (!res.ok) throw new Error(res.statusText);
    });

    // 2. DIRECT SPOKE WRITE (The Router's Job)
    const spokeClient = new Client({ ...DB_CONFIG, database: 'city_industrie' });
    await measure("Direct DB Connection (Spoke: Industrie)", async () => {
        await spokeClient.connect();
    });

    await measure("Write Latency (Spoke Insert)", async () => {
        await spokeClient.query("INSERT INTO inspection_details (raw_form_data) VALUES ('{\"diagnostic\": true}')");
    });

    // Cleanup Spoke
    await spokeClient.query("DELETE FROM inspection_details WHERE raw_form_data->>'diagnostic' = 'true'");
    await spokeClient.end();

    // 3. HUB CONNECTIVITY
    const hubClient = new Client({ ...DB_CONFIG, database: 'city_hub' });
    await measure("Direct DB Connection (Hub)", async () => {
        await hubClient.connect();
    });

    // 4. FDW PERFORMANCE (The Bridge)
    // Querying the Spoke THROUGH the Hub
    await measure("Federation Read Latency (Hub -> Spoke via FDW)", async () => {
        // This tests the overhead of the 'foreign_city_industrie' wrapper
        await hubClient.query("SELECT count(*) FROM foreign_city_industrie.inspection_details");
    });

    await hubClient.end();

    console.log("------------------------------------------------");
    console.log("Scan Complete.");
}

runDiagnostics();
