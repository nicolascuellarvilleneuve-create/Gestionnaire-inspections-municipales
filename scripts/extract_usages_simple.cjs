const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = './docs/2014-14_GRILLES_REFONDUES.pdf';

function render_page(pageData) {
    return pageData.getTextContent({ normalizeWhitespace: false })
        .then(textContent => {
            return textContent.items.map(item => ({
                str: item.str,
                x: item.transform[4],
                y: item.transform[5]
            }));
        });
}

async function extract() {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer, { pagerender: render_page });

    // We are looking for patterns like "H-a : Unifamiliale isolée"
    // The image shows the code and description might be separate items or concatenated.
    // Let's dump the text items sorted by Y then X to see the structure.

    let definitions = {};
    const regex = /^([A-Z][a-z]?-[a-z0-9]+)\s*:\s*(.+)$/; // Matches "H-a : Description"
    // Also simplified regex for just "H-a" if split

    // Naive approach: Look for lines that look like definitions
    // The PDF parser often splits text. We might see "H-a" then ":" then "Description"

    let allItems = [];
    // Flatten all pages? Or just first few? Usages typically appear on the left.
    // Let's process page by page.

    // actually, pdf-parse with pagerender returns a big text block if we don't handle it carefully.
    // "data.text" is the merged text. Let's inspect that first, it might be enough if formatting is good.

    const lines = data.text.split('\n');
    lines.forEach(line => {
        const match = line.match(/([A-Z][a-z0-9]?-[a-z0-9]+)\s*:\s*(.+)/);
        if (match) {
            const code = match[1].trim();
            const desc = match[2].trim();
            if (!definitions[code]) {
                definitions[code] = desc;
            }
        }
    });

    console.log(JSON.stringify(definitions, null, 2));
}

extract();
