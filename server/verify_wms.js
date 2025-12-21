

async function verify() {
    console.log("--- TESTING WMS CONNECTIVITY ---");

    const CADASTRE_URL = "https://servicesmatriciels.mern.gouv.qc.ca/eres/SrvCarte/WMS?service=WMS&request=GetCapabilities";

    console.log(`\n[1] Pinging Cadastre (MRNF): ${CADASTRE_URL}`);
    try {
        const res = await fetch(CADASTRE_URL);
        console.log(`    Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            console.log("    ✅ Service is reachable.");
        } else {
            console.log("    ❌ Service error.");
        }
    } catch (e) {
        console.log(`    ❌ Connection Failed: ${e.message}`);
    }
}

if (!global.fetch) {
    global.fetch = require('node-fetch');
}

verify();
