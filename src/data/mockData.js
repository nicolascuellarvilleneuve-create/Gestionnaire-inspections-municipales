
// Données réelles basées sur les images fournies par l'utilisateur
export const STORAGE_DEFINITIONS = {
    'A': "biens de consommation mis en démonstration pour fins de vente",
    'B': "véhicules automobiles neufs ou usagés et, de façon non limitative, bateaux, motoneiges, motocyclettes et autres véhicules récréatifs mis en démonstration pour fins de vente ou de location",
    'C': "machinerie, équipements mobiles lourds, biens de consommation liés à l'automobile, maisons mobiles et roulottes de chantier mis en démonstration pour fins de vente ou de location",
    'D': "marchandises en vrac et tout type de produit ou autre ne répondant pas aux autres types d'entreposage"
};

export const REGLEMENTS = [
    { zone: "604-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 6, margeLateraleCombinee: 12, typeEntreposage: "C D" },
    { zone: "632-Ib", margeAvant: 20, margeArriere: 15, margeLaterale: 15, margeLateraleCombinee: 30, typeEntreposage: "C D" },
    { zone: "633-Ib", margeAvant: 20, margeArriere: 15, margeLaterale: 15, margeLateraleCombinee: 30, typeEntreposage: "C D" },
    { zone: "657-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 4, margeLateraleCombinee: 10, typeEntreposage: "C D" },
    { zone: "658-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 4, margeLateraleCombinee: 10, typeEntreposage: "C D" },
    { zone: "660-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 6, margeLateraleCombinee: 12, typeEntreposage: "C D" },
    { zone: "699-Ib", margeAvant: 20, margeArriere: 7.5, margeLaterale: 6, margeLateraleCombinee: 10, typeEntreposage: "N/A" },
    { zone: "804-Ia", margeAvant: 12, margeArriere: 7.5, margeLaterale: 4, margeLateraleCombinee: 10, typeEntreposage: "C D" },
    { zone: "826-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 6, margeLateraleCombinee: 12, typeEntreposage: "C D" },
    { zone: "890-Ib", margeAvant: 15, margeArriere: 7.5, margeLaterale: 6, margeLateraleCombinee: 12, typeEntreposage: "C D" },
    { zone: "892-Ib", margeAvant: 20, margeArriere: 7.5, margeLaterale: 6, margeLateraleCombinee: 10, typeEntreposage: "D" },
    { zone: "894-Ia", margeAvant: 15, margeArriere: 6, margeLaterale: 12, margeLateraleCombinee: 24, typeEntreposage: "B C" },
    { zone: "898-Ia", margeAvant: 9.5, margeArriere: 5, margeLaterale: 6, margeLateraleCombinee: 12, typeEntreposage: "B C D" },
    { zone: "899-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 6, margeLateraleCombinee: 12, typeEntreposage: "B C D" },
    { zone: "900-Ia", margeAvant: 0, margeArriere: 0, margeLaterale: 0, margeLateraleCombinee: 0, typeEntreposage: "B" },
    { zone: "901-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 6, margeLateraleCombinee: 12, typeEntreposage: "B C D" },
    { zone: "939-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 8, margeLateraleCombinee: 12, typeEntreposage: "B C D" },
    { zone: "940-Ia", margeAvant: 25, margeArriere: 10, margeLaterale: 10, margeLateraleCombinee: 20, typeEntreposage: "N/A" },
    { zone: "945-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 6, margeLateraleCombinee: 12, typeEntreposage: "B C D" },
    { zone: "946-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 6, margeLateraleCombinee: 12, typeEntreposage: "B" },
    { zone: "1000-Ia", margeAvant: 15, margeArriere: 7.5, margeLaterale: 4, margeLateraleCombinee: 10, typeEntreposage: "C D" }
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
