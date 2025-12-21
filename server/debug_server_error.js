
// In Node 24 native fetch is available, so we try-catch the require or just use fetch global.

const BASE_URL = 'http://localhost:3001/api';

async function run() {
    console.log("--- DEBUGGING INTERNAL SERVER ERROR ---");

    // 1. LOGIN
    console.log("\n[1] Logging in...");
    let token = null;
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' }) // Assuming default creds
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        token = data.token;
        console.log("    ✅ Login Success.");
    } catch (e) {
        console.error("    ❌ Login Failed:", e.message);
        return;
    }

    // 2. GET INSPECTIONS (Map Load)
    console.log("\n[2] Fetching Inspections (Map)...");
    try {
        const res = await fetch(`${BASE_URL}/inspections`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const text = await res.text();
        if (res.ok) {
            console.log("    ✅ Fetch Success. Count:", JSON.parse(text).length);
        } else {
            console.error(`    ❌ Fetch Failed (${res.status}):`, text);
        }
    } catch (e) {
        console.error("    ❌ Fetch Error:", e.message);
    }

    // 3. POST INSPECTION (Save)
    console.log("\n[3] Saving Test Inspection...");
    const payload = {
        type_activite: "industrie",
        nom_rue: "Rue Industrielle",
        numero_civique: "999",
        nom_proprietaire: "Test Debugger"
    };

    try {
        const res = await fetch(`${BASE_URL}/inspections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        if (res.ok) {
            console.log("    ✅ Save Success:", text);
        } else {
            console.error(`    ❌ Save Failed (${res.status}):`, text);
        }
    } catch (e) {
        console.error("    ❌ Save Error:", e.message);
    }
}

// Node < 18 compat (though user is on 24)
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

run();
