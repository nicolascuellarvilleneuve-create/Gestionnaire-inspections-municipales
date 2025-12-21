
const pdf = require('pdf-parse');

console.log('Type of pdf:', typeof pdf);
console.log('Is Array?', Array.isArray(pdf));
console.log('Keys:', Object.keys(pdf));

if (typeof pdf === 'object') {
    // Check for default
    console.log('Has default?', 'default' in pdf);
    if (pdf.default) {
        console.log('Type of default:', typeof pdf.default);
    }
}

try {
    const fs = require('fs');
    // Create dummy buffer
    const buff = Buffer.from('dummy pdf content');
    pdf(buff).then(() => console.log('Called as function success'))
        .catch(e => console.log('Called as function failed:', e.message));
} catch (e) {
    console.log('Calling as function threw:', e.message);
}
