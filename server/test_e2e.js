// Native fetch used in Node 18+

async function testSave() {
    console.log(">>> TESTING FEDERATION SAVE (End-to-End)...");

    // Sample "Form Data" (mimicking React state)
    const payload = {
        adresse: "123 Test Blvd Federation",
        numero_civique: "123",
        nom_rue: "Test Blvd Federation",
        type_activite: "industrie", // Targeted Spoke
        nom_proprietaire: "E2E Tester Inc.",
        superficie_terrain: 5000,
        superficie_batiment_princ: 2500,
        // Random safety bucket data
        new_field_2025: "Solar Panels Installed",
        comment: "This is a test of the Heptagon."
    };

    try {
        const res = await fetch('http://localhost:3001/api/inspections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const json = await res.json();
            console.log("✅ API Success! Returned ID:", json.id);
            console.log("   (This means data is safely inside 'city_industrie' AND linked in 'city_hub')");
        } else {
            console.error("❌ API Failed:", res.status, res.statusText);
            const text = await res.text();
            console.error("   Response:", text);
        }

    } catch (e) {
        console.error("❌ Connection Failed:", e.message);
    }
}

testSave();
