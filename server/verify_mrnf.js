

async function verify() {
    const URLS = [
        // ArcGIS Pattern 1: /WMSServer
        { name: "MRNF ArcGIS WMS", url: "https://servicesmatriciels.mern.gouv.qc.ca/eres/rest/services/S_FONCIER/Lot/MapServer/WMSServer?request=GetCapabilities&service=WMS" },
        // Pattern 2: New Domain
        { name: "MRNF New Domain WMS", url: "https://servicesmatriciels.mrnf.gouv.qc.ca/eres/rest/services/S_FONCIER/Lot/MapServer/WMSServer?request=GetCapabilities&service=WMS" },
        // REST Check
        { name: "MRNF REST JSON", url: "https://servicesmatriciels.mern.gouv.qc.ca/eres/rest/services/S_FONCIER/Lot/MapServer?f=json" }
    ];

    for (const service of URLS) {
        console.log(`\n[Testing] ${service.name}: ${service.url}`);
        try {
            const res = await fetch(service.url);
            console.log(`    Status: ${res.status}`);
            if (res.ok) {
                console.log("    ✅ REACHABLE");
                // parsing not needed if 200 OK for now, just need to know it exists
            } else {
                console.log("    ❌ ERROR");
            }
        } catch (e) {
            console.log(`    ❌ FAILED: ${e.message}`);
        }
    }
}

if (!global.fetch) {
    global.fetch = require('node-fetch');
}

verify();
