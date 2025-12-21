const pdfLib = require('pdf-parse');
console.log('Type of pdfLib:', typeof pdfLib);
console.log('Is Function?', typeof pdfLib === 'function');
console.log('Keys:', Object.keys(pdfLib));

if (typeof pdfLib !== 'function') {
    // Check if default exists
    if (pdfLib.default) {
        console.log('pdfLib.default type:', typeof pdfLib.default);
    }
}
