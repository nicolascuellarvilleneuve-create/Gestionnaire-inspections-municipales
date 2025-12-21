
const https = require('https');

const lotNumber = '6693027';
const city = "Val-d'Or";
const query = encodeURIComponent(`Lot ${lotNumber}, ${city}`);
const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=5`;

console.log(`Querying Nominatim: ${url}`);

https.get(url, {
    headers: { 'User-Agent': 'MunicipalInspectionApp/1.0 (test script)' }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Result Count:', json.length);
            if (json.length > 0) {
                console.log('First Result:', JSON.stringify(json[0], null, 2));
            } else {
                console.log('No results found for this Lot in OpenStreetMap.');
            }
        } catch (e) {
            console.error('Parse Error:', e.message);
        }
    });
}).on('error', err => {
    console.error('Request Error:', err.message);
});
