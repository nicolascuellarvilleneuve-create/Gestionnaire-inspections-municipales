export const USAGE_DEFINITIONS = {
    "H-a": "Unifamiliale isolée",
    "H-b": "Unifamiliale jumelée",
    "H-c": "Bifamiliale isolée",
    "H-d": "Bifamiliale jumelée",
    "H-e": "Trifamiliale isolée",
    "H-f": "Trifamiliale jumelée",
    "H-g": "Moins de 4 logements",
    "H-h": "Maison de chambres (3 à 9 chambres)",
    "H-i": "Unifamiliale en rangée (4 à 8 unités)",
    "H-j": "Multifamiliale (4 à 6 logements)",
    "H-k": "Multifamiliale (6 logements et plus)",
    "H-m": "Maison unimodulaire",
    "H-n": "Résidence secondaire (chalet)",
    "H-l": "Maison de chambres (10 chambres et plus)",

    "C-a": "Récréation intensive",
    "C-b": "Récréation extensive",
    "REC-b": "Récréation extensive",
    "C-c": "Service professionnel et personnel",
    "C-d": "Commerce et service d'hébergement et de restauration",
    "C-e": "Commerce et service à contrainte", // Cleaned trailing X
    "C-f": "Commerce et service lié à l'automobile",

    "I-a": "Commerce de gros et industrie à incidence faible", // Cleaned trailing X
    "I-b": "Commerce de gros et industrie à incidence modérée", // Cleaned trailing X
    "I-c": "Commerce de gros et industrie à incidence élevée",
    "I-d": "Industrie extractive",
    "I-e": "Aéroportuaire type 1",
    "I-f": "Aéroportuaire type 2",

    "P-a": "Publique et institutionnelle de nature locale",
    "P-b": "Publique et institutionnelle de nature régionale",

    "Ag-a": "Ferme et élevage",
    "Ag-b": "Culture du sol",
    "Ag-c": "Agriculture artisanale (fermette)",

    "X-a": "Mixte type 1",
    "X-b": "Mixte type 2",
    "X-c": "Mixte type 3"
};

// Map Groups to Short Codes for Filtering logic
export const GROUP_MAPPING = {
    "HABITATION": ["H"],
    "COMMERCE": ["C"],
    "INDUSTRIE": ["I"],
    "PUBLIQUE": ["P"],
    "AGRICOLE": ["Ag"],
    "MIXTE": ["X"] // Assuming X maps to Mixte zones
};
