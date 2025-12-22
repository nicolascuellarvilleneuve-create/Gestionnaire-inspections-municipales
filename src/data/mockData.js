
// Données réelles basées sur les images fournies par l'utilisateur
import zoningData from './zoningData.json';

export const STORAGE_DEFINITIONS = {
    'A': "biens de consommation mis en démonstration pour fins de vente",
    'B': "véhicules automobiles neufs ou usagés et, de façon non limitative, bateaux, motoneiges, motocyclettes et autres véhicules récréatifs mis en démonstration pour fins de vente ou de location",
    'C': "machinerie, équipements mobiles lourds, biens de consommation liés à l'automobile, maisons mobiles et roulottes de chantier mis en démonstration pour fins de vente ou de location",
    'D': "marchandises en vrac et tout type de produit ou autre ne répondant pas aux autres types d'entreposage"
};

export const REGLEMENTS = zoningData;

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
