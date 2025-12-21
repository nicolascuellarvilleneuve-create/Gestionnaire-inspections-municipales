
// CITY CONFIGURATION - "The DNA of the City"
// Change this file to deploy the app to a different municipality.

export const CITY_CONFIG = {
    name: "Val-d'Or",
    province: "Québec",

    // Geospatial Center (Leaflet / Maps)
    coordinates: {
        lat: 48.0975,
        lng: -77.7828
    },

    // Default Map Zoom Level
    zoom: 13,

    // Branding / Logo (Optional placeholder)
    logo: "/logo_valdor.png",

    // WMS Services (Quebec Official Data)
    layers: {
        cadastre: {
            url: "https://geoegl.msp.gouv.qc.ca/carto/wms",
            layers: "carte_gouv_qc_public",
            format: "image/png",
            attribution: "&copy; MSP (Cadastre indisponible)"
        },
        adresses: {
            // Using MRNF for now or Adresses Québec if available. 
            // Note: Public WMS for addresses can be tricky. Using a placeholder or verified one.
            // "AQ_ADRESSES_WMS" is the standard name.
            url: "https://services.donneesquebec.ca/IGS/SrvCarte/WMS",
            layers: "AQ_ADRESSES_WMS",
            format: "image/png",
            attribution: "&copy; Adresses Québec"
        }
    }
};

export default CITY_CONFIG;
