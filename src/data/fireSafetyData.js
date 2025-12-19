/**
 * Tableau 3.1.17.1 du Code national du bâtiment (CNB) 2015
 * Nombre de personnes - Surface par occupant
 */
export const CNB_OCCUPANT_LOAD_TABLE = [
    { label: "Locaux à sièges amovibles", factor: 0.75 },
    { label: "Scènes", factor: 0.75 },
    { label: "Locaux avec tables et sièges amovibles", factor: 0.95 },
    { label: "Locaux de réunion sans sièges", factor: 0.40 },
    { label: "Stades et tribunes", factor: 0.60 },
    { label: "Salles de quilles et de billard", factor: 9.30 },
    { label: "Salles de classe", factor: 1.85 },
    { label: "Ateliers et salles de formation professionnelle", factor: 9.30 },
    { label: "Salles de lecture, d'étude ou de repos", factor: 1.85 },
    { label: "Salles à manger, bars et cafétérias", factor: 1.20 },
    { label: "Laboratoires scolaires", factor: 4.60 },
    { label: "Arcades", factor: 1.85 },
    { label: "Bibliothèques, musées et patinoires", factor: 3.00 },
    { label: "Gymnases et salles de culture physique", factor: 9.30 },
    { label: "Pistes de danse", factor: 0.40 },
    { label: "Salles d'exposition et centres d'interprétation", factor: 3.00 },
    { label: "Locaux où sont administrés les soins/traitements (dormir)", factor: 10.00 },
    { label: "Locaux de détention", factor: 11.60 },
    { label: "Dortoirs", factor: 4.60 },
    { label: "Boutiques de services personnels", factor: 4.60 },
    { label: "Bureaux", factor: 9.30 },
    { label: "Sous-sols et premiers étages (Commerciaux)", factor: 3.70 },
    { label: "Deuxièmes étages (entrée principale commune)", factor: 3.70 },
    { label: "Autres étages (Commerciaux)", factor: 5.60 },
    { label: "Ateliers de fabrication et de transformation", factor: 4.60 },
    { label: "Garages de stationnement", factor: 46.00 },
    { label: "Dépôts de marchandises (entrepôts)", factor: 28.00 },
    { label: "Hangars d'aéronefs", factor: 46.00 },
    // Special cases or manual override needed
    { label: "Locaux à sièges fixes (Nombre)", factor: null },
    { label: "Logements / Habitations", factor: null },
    { label: "Piscines", factor: null }
];
