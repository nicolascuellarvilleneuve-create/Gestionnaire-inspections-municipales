

async function verify() {
    const URLS = [
        { name: "CPTAQ", url: "https://carto.cptaq.gouv.qc.ca/cgi-bin/cptaq?SERVICE=WMS&VERSION=1.0.0&REQUEST=GetCapabilities" },
        { name: "Donnees Quebec (IGS)", url: "https://services.donneesquebec.ca/IGS/SrvCarte/WMS?service=WMS&request=GetCapabilities" }
    ];

    for (const service of URLS) {
        console.log(`\n[Testing] ${service.name}: ${service.url}`);
        try {
            const res = await fetch(service.url);
            console.log(`    Status: ${res.status}`);
            if (res.ok) {
                console.log("    ✅ REACHABLE");
                const text = await res.text();
                // Find layers
                const matches = text.match(/<Name>([^<]+)<\/Name>/g);
                if (matches) {
                    console.log(`    Found ${matches.length} Layers:`);
                    matches.forEach(m => console.log("      " + m.replace(/<\/?Name>/g, '')));
                } else {
                    console.log("    ⚠️ No layers found (Check XML structure)");
                    console.log(text.substring(0, 500));
                }
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
