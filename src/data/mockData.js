
// Données simulées étendues basées sur l'aperçu du fichier Excel
export const REGLEMENTS = [
    { zone: "657-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 4, margeLateraleCombinee: 10 },
    { zone: "632-Ib", margeAvant: 20, margeArriere: 15, margeLaterale: 4.5, margeLateraleCombinee: 10 },
    { zone: "894-Ia", margeAvant: 9.5, margeArriere: 5, margeLaterale: 2, margeLateraleCombinee: 6 },
    { zone: "700-Ha", margeAvant: 12, margeArriere: 8, margeLaterale: 3, margeLateraleCombinee: 8 },
    { zone: "400-Hc", margeAvant: 18, margeArriere: 10, margeLaterale: 5, margeLateraleCombinee: 12 },
    { zone: "100-Ra", margeAvant: 6, margeArriere: 6, margeLaterale: 1.5, margeLateraleCombinee: 4 },
];

export const MOCK_INSPECTIONS = [
    {
        id: 1,
        date: "2025-12-10",
        adresse: "123 Rue Principale",
        proprietaire: "Jean Dupont",
        zone: "657-Ia",
        status: "Non-conforme",
        details: {
            margeAvant: { requis: 15, releve: 14, conforme: false },
            margeArriere: { requis: 7.5, releve: 8, conforme: true }
        }
    }
];
