

async function verify() {
    const BASE_URL = "https://services.mern.gouv.qc.ca/arcgis/rest/services/Cartes_dynamiques/Cadastre_allege/MapServer";

    // Test 1: WMS Capability on MapServer
    // Standard ArcGIS pattern is appending /WMSServer
    const WMS_URL = `${BASE_URL}/WMSServer?request=GetCapabilities&service=WMS`;

    // Test 2: JSON Metadata (Pure REST)
    const REST_URL = `${BASE_URL}?f=json`;

    console.log(`[Testing] ArcGIS WMS: ${WMS_URL}`);
    try {
        const res = await fetch(WMS_URL);
        console.log(`    Status: ${res.status}`);
        if (res.ok) {
            const text = await res.text();
            if (text.includes("ServiceException") || text.includes("html>")) {
                console.log("    ❌ ERROR: HTML/Exception returned (WMS likely disabled)");
            } else {
                console.log("    ✅ REACHABLE & VALID XML");
                const matches = text.match(/<Name>([^<]+)<\/Name>/g);
                if (matches) {
                    console.log(`    Found ${matches.length} layers.`);
                    matches.slice(0, 5).forEach(m => console.log("      " + m.replace(/<\/?Name>/g, '')));
                }
            }
        } else {
            console.log("    ❌ ERROR (Status)");
        }
    } catch (e) {
        console.log(`    ❌ FAILED: ${e.message}`);
    }

    console.log(`\n[Testing] ArcGIS REST: ${REST_URL}`);
    try {
        const res = await fetch(REST_URL);
        console.log(`    Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log("    ✅ REACHABLE (REST API)");
            if (data.layers) {
                console.log(`    Found ${data.layers.length} layers.`);
                data.layers.forEach(l => console.log(`      [${l.id}] ${l.name}`));
            }
        }
    } catch (e) {
        console.log(`    ❌ FAILED: ${e.message}`);
    }
}

if (!global.fetch) {
    global.fetch = require('node-fetch');
}

verify();
