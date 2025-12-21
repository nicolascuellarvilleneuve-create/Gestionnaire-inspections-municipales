import fs from 'fs';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const QUERY = `
    [out:json];
    area["name"="Val-d'Or"]->.searchArea;
    (
      way["highway"]["name"](area.searchArea);
    );
    out body;
`;

async function fetchStreets() {
    console.log("Fetching streets for Val-d'Or...");
    try {
        const encodedQuery = encodeURIComponent(QUERY);
        const response = await fetch(`${OVERPASS_URL}?data=${encodedQuery}`);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        // console.log("Response Preview:", text.substring(0, 100));

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON. Response might be XML:", text.substring(0, 500));
            return;
        }

        const streets = new Set();
        data.elements.forEach(element => {
            if (element.tags && element.tags.name) {
                streets.add(element.tags.name);
            }
        });

        const sortedStreets = Array.from(streets).sort();

        const fileContent = `export const VAL_DOR_STREETS = ${JSON.stringify(sortedStreets, null, 4)};`;

        fs.writeFileSync('src/data/valdorStreets.js', fileContent);
        console.log(`Successfully saved ${sortedStreets.length} streets to src/data/valdorStreets.js`);

    } catch (error) {
        console.error("Error fetching streets:", error);
    }
}

fetchStreets();
