const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = './docs/2014-14_GRILLES_REFONDUES.pdf';

function render_page(pageData) {
    let render_options = {
        normalizeWhitespace: false,
        disableCombineTextItems: true
    }
    return pageData.getTextContent(render_options)
        .then(function (textContent) {
            let items = textContent.items.map(item => ({
                str: item.str,
                x: item.transform[4],
                y: item.transform[5]
            }));
            return JSON.stringify(items);
        });
}

async function extract() {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer, { pagerender: render_page });

    // pdf-parse concatenates page results with \n which breaks valid JSON.
    // However, our render_page returns a JSON string per page.
    // The library output `data.text` is basically "JSONofPage1\nJSONofPage2..."
    // We need to split and parse each line.

    const pages = data.text.split('\n\n'); // pdf-parse separates pages by double newline usually? or just look for [
    // Actually, checking raw output is safer.

    let definitions = {};

    // Let's rely on the fact that each Page render is a JSON array string.
    // We can regex for \[.*?\] but that might be fragile.
    // Better: Filter lines that look like JSON arrays.

    const pageStrings = data.text.match(/\[.*?\]/g);

    if (!pageStrings) {
        console.log("No page data found");
        return;
    }

    pageStrings.forEach(pageStr => {
        try {
            const items = JSON.parse(pageStr);

            // Group by Row (Y coordinate with tolerance)
            let rows = [];
            let currentRow = [];
            let currentY = -1;

            // Sort items by Y (descending typically for PDF) then X
            items.sort((a, b) => b.y - a.y || a.x - b.x);

            items.forEach(item => {
                if (currentY === -1 || Math.abs(item.y - currentY) < 4.0) {
                    currentRow.push(item);
                    currentY = item.y;
                } else {
                    rows.push(currentRow.sort((a, b) => a.x - b.x));
                    currentRow = [item];
                    currentY = item.y;
                }
            });
            if (currentRow.length > 0) rows.push(currentRow.sort((a, b) => a.x - b.x));

            // Analyze Rows for Definition Pattern
            // Look for a row that has text matching "X-y" followed by ": " or similar.
            // Or "X-y" in one item and ":" and "Description" in subsequent items.

            rows.forEach(row => {
                // Join text in row
                const lineText = row.map(i => i.str).join('');
                // Regex for "H-a : ..." or "I-b : ..."
                // The colon might be surrounded by spaces in PDF item stream or separate.

                // Simple regex on joined text
                const match = lineText.match(/([A-Z][a-z0-9]?-[a-z0-9]+)\s*:\s*(.+)/);
                if (match) {
                    definitions[match[1]] = match[2];
                }
            });

        } catch (e) {
            // ignore parse errors
        }
    });

    console.log(JSON.stringify(definitions, null, 2));
}

extract();
