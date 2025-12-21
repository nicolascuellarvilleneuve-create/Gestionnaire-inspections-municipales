const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const SERVER_PATH = path.join(__dirname, 'index.js');
const PORT = 3001;

console.log("🩺 STARTING API HEALTH CHECK...");

// 1. Start Server
const serverProcess = spawn('node', [SERVER_PATH], {
    cwd: path.join(__dirname),
    env: process.env,
    stdio: 'pipe' // Pipe output so we can see logs
});

let serverOutput = '';

serverProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    serverOutput += chunk;
    // console.log(`[SERVER]: ${chunk.trim()}`); 
});

serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR]: ${data.toString()}`);
});

// 2. Wait and Ping
setTimeout(() => {
    console.log("   -> Pinging http://localhost:3001/ ...");

    const req = http.get(`http://localhost:${PORT}/`, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            console.log(`   -> Response Status: ${res.statusCode}`);
            console.log(`   -> Response Body: ${body}`);

            if (res.statusCode === 200 && body.includes('Federated Inspection Engine is Running')) {
                console.log("\n✅ API IS HEALTHY AND RUNNING.");
            } else {
                console.log("\n❌ API FAILED HEALTH CHECK.");
            }
            cleanup();
        });
    });

    req.on('error', (e) => {
        console.error(`\n❌ REQUEST FAILED: ${e.message}`);
        console.log("Server Output so far:\n" + serverOutput);
        cleanup();
    });

}, 3000); // Wait 3 seconds for server to start

function cleanup() {
    serverProcess.kill();
    process.exit(0);
}
