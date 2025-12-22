const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, '../docs/2014-14_GRILLES_REFONDUES.pdf');

if (!fs.existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
}

let dataBuffer = fs.readFileSync(pdfPath);

function render_page(pageData) {
    let render_options = {
        normalizeWhitespace: false,
        disableCombineTextItems: true
    }

    return pageData.getTextContent(render_options)
        .then(function (textContent) {
            let items = textContent.items.map(item => ({
                str: item.str,
                x: item.transform[4], // translation x
                y: item.transform[5], // translation y
                w: item.width         // width
            }));

            // Return JSON string so the main promise resolves with it
            return JSON.stringify(items, null, 2);
        });
}

let options = {
    pagerender: render_page,
    max: 1 // Only inspect first page for structure
}

pdf(dataBuffer, options).then(function (data) {
    console.log(data.text);
}).catch(err => {
    console.error("Error parsing PDF:", err);
});
