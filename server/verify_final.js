

async function verify() {
    const URLS = [
        // MSP Variations
        { name: "MSP /carto/", url: "https://geoegl.msp.gouv.qc.ca/carto/wms?service=WMS&request=GetCapabilities" },
        { name: "MSP /ws/ w/ Map", url: "https://geoegl.msp.gouv.qc.ca/ws/mapserv?map=/referenciel/carto.map&service=WMS&request=GetCapabilities" },

        // Données Québec (HTTP vs HTTPS)
        { name: "Donnees QC HTTPS", url: "https://services.donneesquebec.ca/IGS/SrvCarte/WMS?service=WMS&request=GetCapabilities" },
        { name: "Donnees QC HTTP", url: "http://services.donneesquebec.ca/IGS/SrvCarte/WMS?service=WMS&request=GetCapabilities" },

        // IGO Gouv
        { name: "IGO Gouv", url: "https://geoegl.msp.gouv.qc.ca/ws/igo_gouv/wms?service=WMS&request=GetCapabilities" }
    ];

    for (const service of URLS) {
        console.log(`\n[Testing] ${service.name}: ${service.url}`);
        try {
            const res = await fetch(service.url);
            console.log(`    Status: ${res.status}`);
            if (res.ok) {
                const text = await res.text();
                if (text.includes("ServiceException") || text.includes("html>")) {
                    console.log("    ❌ ERROR: HTML/Exception returned");
                } else {
                    console.log("    ✅ REACHABLE & VALID XML");
                    const matches = text.match(/<Name>([^<]+)<\/Name>/g);
                    if (matches) {
                        console.log(`    Found ${matches.length} layers.`);
                        matches.slice(0, 5).forEach(m => console.log("      " + m.replace(/<\/?Name>/g, '')));
                    }
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
