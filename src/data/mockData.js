
export const REGLEMENTS = [
    { zone: "657-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 4, margeLateraleCombinee: 10 },
    { zone: "632-Ib", margeAvant: 20, margeArriere: 15, margeLaterale: 4.5, margeLateraleCombinee: 10 },
    { zone: "894-Ia", margeAvant: 9.5, margeArriere: 5, margeLaterale: 2, margeLateraleCombinee: 6 }
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
