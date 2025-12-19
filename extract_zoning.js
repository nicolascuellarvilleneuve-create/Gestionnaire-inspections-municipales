import fs from 'fs';
import path from 'path';

const filePath = path.resolve("2014-14 - Refondu - Règlement Zonage.doc");

try {
    const buffer = fs.readFileSync(filePath);
    // Decode as latin1 to preserve bytes as chars
    const text = buffer.toString('latin1');

    // Clean text: remove non-printable except newlines/tabs
    // This is rough but might work for getting strings
    const cleanText = text.replace(/[^\x20-\x7E\r\n\t]/g, '');

    const searchTerm = "11.1.8";
    const index = cleanText.indexOf(searchTerm);

    if (index !== -1) {
        console.log(`Found ${searchTerm} at index ${index}`);
        console.log(cleanText.substring(index, index + 2000));
    } else {
        console.log(`${searchTerm} not found.`);
        // Try printing a chunk from middle to see if it worked at all
        console.log("Sample text:", cleanText.substring(10000, 11000));
    }

} catch (e) {
    console.error("Error:", e);
}
