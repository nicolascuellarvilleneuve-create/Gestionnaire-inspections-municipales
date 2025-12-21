
// const fetch = require('node-fetch'); // Native fetch in Node 18+
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// Create a dummy PDF for testing if needed
const DUMMY_PDF_PATH = path.join(__dirname, 'test_plan.pdf');

// Create dummy PDF if not exists
if (!fs.existsSync(DUMMY_PDF_PATH)) {
    // PDF Header + "Lot 1234567" + "Scale 1:500" + EOF
    const content = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 50 >>\nstream\nBT /F1 24 Tf 100 700 Td (Lot 1234567\nScale 1:500\nArpenteur: John Doe) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000215 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n315\n%%EOF`;
    fs.writeFileSync(DUMMY_PDF_PATH, content);
}

const BASE_URL = 'http://localhost:3001/api';

// Need to auth first
async function runTest() {
    console.log(">>> TESTING AUDIT FLOW...");

    // 1. Login (assuming admin/admin123 still works or seed user)
    // We'll skip real login and just assume we can bypass or use a mock token if middleware allows,
    // but middleware checks verifyToken. We need a valid token.
    // Let's use the 'admin' seed logic or just directly call the controller functions?
    // No, better test via HTTP. Let's try to login default admin.

    let token = '';
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'password123' })
        });
        const loginData = await loginRes.json();
        if (loginData.token) {
            token = loginData.token;
            console.log("[PASS] Logged in. Token received.");
        } else {
            console.log("[FAIL] Login failed (" + loginRes.status + ")");
            // Proceeding might fail if protected
        }
    } catch (e) {
        console.log("[FAIL] Login error:", e.message);
    }

    // 2. Upload PDF (Session Start)
    console.log("\n>>> 2. Testing Session Start (Upload)...");
    try {
        const form = new FormData();
        form.append('plan', fs.createReadStream(DUMMY_PDF_PATH));

        const uploadRes = await fetch(`${BASE_URL}/audit/session/start`, {
            method: 'POST',
            // headers: { 'Authorization': `Bearer ${token}` }, // Auth disabled for test
            headers: {
                ...form.getHeaders()
            },
            body: form
        });

        const uploadData = await uploadRes.json();
        console.log("Upload Status:", uploadRes.status);
        console.log("Extracted Data:", JSON.stringify(uploadData.data, null, 2));

        if (uploadData.data && uploadData.data.metadata.lot_number) {
            console.log("[PASS] Data Extraction Successful.");
        } else {
            console.log("[WARN] Data Extraction incomplete (Regex might need tuning).");
        }

    } catch (e) {
        console.error("[FAIL] Upload Error:", e.message);
    }

    // 3. Commit Audit
    console.log("\n>>> 3. Testing Commit Audit...");
    try {
        const commitRes = await fetch(`${BASE_URL}/audit/commit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                inspector_id: 1, // Assuming admin is ID 1
                action: 'PERMIT_ISSUED',
                location: { lat: 48.0975, lng: -77.7828 }, // Center of Val d'Or
                metadata: { plan_id: 'TEST-2025', valid: true }
            })
        });

        const commitData = await commitRes.json();
        console.log("Commit Status:", commitRes.status);
        if (commitData.audit_id) {
            console.log("[PASS] Audit Committed. ID:", commitData.audit_id);
            console.log("       Permit #:", commitData.permit_number);
        } else {
            console.log("[FAIL] Commit Failed:", commitData);
        }

    } catch (e) {
        console.error("[FAIL] Commit Error:", e.message);
    }
}

runTest();
