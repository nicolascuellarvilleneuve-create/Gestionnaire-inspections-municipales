

// If node-fetch isn't available, we'll use http module or just rely on native fetch (Node 18+)
// The environment is Node 24.12.0 so native fetch is globally available.

async function testSave() {
    console.log("--- TESTING MINIMAL SAVE ---");

    // 1. Very Minimal (Empty) - Expect Failure or Success? User wants success.
    const minimalPayload = {
        // Only sending one field to see if it saves
        notes: "Test inspection minimal"
    };

    try {
        const response = await fetch('http://localhost:3001/api/inspections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(minimalPayload)
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);

    } catch (e) {
        console.error("Fetch Error:", e.message);
    }

    // 2. Partial Address 
    const partialAddress = {
        nom_rue: "Rue Test" // No number
    };

    console.log("\n--- TESTING PARTIAL ADDRESS ---");
    try {
        const response = await fetch('http://localhost:3001/api/inspections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partialAddress)
        });
        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);
    } catch (e) { }

}

testSave();
