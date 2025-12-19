export const PARKING_RULES = {
    "habitation": {
        label: "Habitation",
        subtypes: {
            "unifamiliale": {
                label: "Unifamiliale / Bi-familiale",
                inputs: ["nb_logement"],
                calc: (data) => Math.ceil((data.nb_logement || 1) * 2), // Placeholder assumption
                desc: "2 par logement (Standard présumé)"
            },
            "multifamiliale": {
                label: "Multifamiliale",
                inputs: ["nb_logement"],
                calc: (data) => Math.ceil((data.nb_logement || 1) * 1.5), // Placeholder
                desc: "1.5 par logement (Standard présumé)"
            }
        }
    },
    "commerce_service": {
        label: "Commerce et service",
        subtypes: {
            "general": {
                label: "Voisinage, Artériel, Régional, Contrainte (Général)",
                inputs: [], // Uses global superficie_plancher
                calc: (data) => Math.ceil((parseFloat(data.superficie_plancher) || 0) / 30),
                desc: "1 case par 30 m² de plancher"
            },
            "cinema": {
                label: "Cinéma, Théâtre",
                inputs: ["nb_sieges"],
                calc: (data) => {
                    const s = parseFloat(data.nb_sieges) || 0;
                    if (s <= 800) return Math.ceil(s / 5);
                    return Math.ceil(800 / 5) + Math.ceil((s - 800) / 8);
                },
                desc: "1/5 sièges (<800) + 1/8 surplus"
            },
            "auto": {
                label: "Liés à l'automobile",
                inputs: ["nb_employes"], // + superficie_plancher (global)
                calc: (data) => Math.ceil((parseFloat(data.nb_employes) || 0) / 5) + Math.ceil((parseFloat(data.superficie_plancher) || 0) / 90),
                desc: "1/5 employés + 1/90 m² plancher"
            },
            "centre_commercial": {
                label: "Centre commercial",
                inputs: ["superficie_plancher_bureau"], // + superficie_plancher which we assume is COMMERCIAL here?
                // Rule says: 5.5 per 90m2 commercial + 1 per 35m2 office.
                // We'll use 'superficie_plancher' as the Commercial part.
                calc: (data) => Math.ceil(((parseFloat(data.superficie_plancher) || 0) / 90) * 5.5) + Math.ceil((parseFloat(data.superficie_plancher_bureau) || 0) / 35),
                desc: "5.5/90m² comm + 1/35m² bureaux"
            },
            "service_pro": {
                label: "Service professionnel et personnel",
                inputs: [],
                calc: (data) => Math.ceil((parseFloat(data.superficie_plancher) || 0) / 35),
                desc: "1 case par 35 m² de plancher"
            },
            "hotel": {
                label: "Hôtels",
                inputs: ["nb_chambre"],
                calc: (data) => {
                    const c = parseFloat(data.nb_chambre) || 0;
                    if (c <= 30) return Math.ceil(c); // 1 per room first 30
                    return 30 + Math.ceil((c - 30) / 2); // 1 per 2 for others
                },
                desc: "1/chambre (30 premières) + 1/2 chambres (reste)"
            },
            "motel": {
                label: "Motels / Maisons de touristes",
                inputs: ["nb_chambre", "nb_employes"],
                calc: (data) => Math.ceil(parseFloat(data.nb_chambre) || 0) + Math.ceil((parseFloat(data.nb_employes) || 0) / 2),
                desc: "1/chambre + 1/2 employés"
            },
            "resto_bar": {
                label: "Resto, Bar, Boîte de nuit",
                inputs: ["nb_sieges"], // + superficie_plancher
                calc: (data) => {
                    const bySeat = Math.ceil((parseFloat(data.nb_sieges) || 0) / 3);
                    const byArea = Math.ceil((parseFloat(data.superficie_plancher) || 0) / 9);
                    return Math.max(bySeat, byArea);
                },
                desc: "Max de: 1/3 sièges OU 1/9 m² plancher"
            },
            "meuble": {
                label: "Magasins de meubles",
                inputs: ["superficie_plancher_admin", "nb_employes"], // + superficie_plancher (Vente)
                // Note: 'superficie_plancher' will be used as Vente.
                calc: (data) => Math.ceil((parseFloat(data.superficie_plancher) || 0) / 90) +
                    Math.ceil((parseFloat(data.superficie_plancher_admin) || 0) / 35) +
                    Math.ceil((parseFloat(data.nb_employes) || 0) / 2),
                desc: "1/90m² vente + 1/35m² admin + 1/2 employés"
            }
        }
    },
    "industrie": {
        label: "Commerce de gros et Industrie",
        subtypes: {
            "standard": {
                label: "Standard",
                inputs: ["nb_employes"],
                calc: (data) => {
                    // "1 case par employé ou 1 case par 95 m2 de plancher, l’exigence la plus sévère des 2 prévalant"
                    const byEmp = parseFloat(data.nb_employes) || 0;
                    const byArea = Math.ceil((parseFloat(data.superficie_plancher) || 0) / 95);
                    return Math.max(byEmp, byArea);
                    // Note: "plus tout l’espace nécessaire pour stationner les véhicules et l’équipement de l’entreprise" -> Manual add? We'll just do calculation.
                },
                desc: "Max de: 1/employé OU 1/95 m² plancher"
            }
        }
    },
    "public": {
        label: "Public et institutionnel",
        subtypes: {
            "biblio_musee": {
                label: "Bibliothèque et Musée",
                inputs: [],
                calc: (data) => Math.ceil((parseFloat(data.superficie_plancher) || 0) / 35),
                desc: "1 case par 35 m² de plancher"
            },
            "culte": {
                label: "Édifice du culte",
                inputs: ["nb_sieges"],
                calc: (data) => Math.ceil((parseFloat(data.nb_sieges) || 0) / 5),
                desc: "1 case par 5 sièges"
            },
            "ecole_primaire": {
                label: "École primaire / secondaire",
                inputs: ["nb_employes", "nb_classes"],
                calc: (data) => Math.ceil((parseFloat(data.nb_employes) || 0) / 2) + (parseFloat(data.nb_classes) || 0),
                desc: "1/2 employés + 1/classe"
            },
            "ecole_superieur": {
                label: "Collégial / Universitaire",
                inputs: ["nb_etudiants", "nb_employes"],
                calc: (data) => Math.ceil((parseFloat(data.nb_etudiants) || 0) / 4) + Math.ceil((parseFloat(data.nb_employes) || 0) / 2),
                desc: "1/4 étudiants + 1/2 employés"
            },
            "salon_mortuaire": {
                label: "Salon mortuaire",
                inputs: ["nb_salle_expo"], // + superficie_plancher
                calc: (data) => {
                    const byArea = Math.ceil((parseFloat(data.superficie_plancher) || 0) / 10);
                    const byRoom = (parseFloat(data.nb_salle_expo) || 0) * 10;
                    return Math.max(byArea, byRoom);
                },
                desc: "Max de: 1/10 m² plancher OU 10/salle expo"
            },
            "sante_convalescence": {
                label: "Sanatorium, Convalescence, Orphelinat",
                inputs: ["nb_medecins", "nb_employes", "nb_lits"],
                calc: (data) => (parseFloat(data.nb_medecins) || 0) + Math.ceil((parseFloat(data.nb_employes) || 0) / 2) + Math.ceil((parseFloat(data.nb_lits) || 0) / 4),
                desc: "1/médecin + 1/2 employés + 1/4 lits"
            },
            "hopital": {
                label: "Hôpital",
                inputs: ["nb_lits"], // + superficie_plancher
                calc: (data) => {
                    const byBed = Math.ceil(((parseFloat(data.nb_lits) || 0) / 4) * 3); // 3 per 4 beds = 0.75 per bed
                    const byArea = Math.ceil((parseFloat(data.superficie_plancher) || 0) / 95);
                    return Math.max(byBed, byArea);
                },
                desc: "Max de: 3/4 lits OU 1/95 m² plancher"
            },
            "assemblee": {
                label: "Lieux d'assemblées",
                inputs: ["nb_sieges"], // + superficie_plancher
                calc: (data) => {
                    const bySeat = Math.ceil((parseFloat(data.nb_sieges) || 0) / 4);
                    const byArea = Math.ceil((parseFloat(data.superficie_plancher) || 0) / 10); // "10 m² plancher ... pouvant servir à des rassemblements"
                    return Math.max(bySeat, byArea);
                },
                desc: "Max de: 1/4 sièges OU 1/10 m²"
            }
        }
    },
    "recreation": {
        label: "Récréation",
        subtypes: {
            "standard": {
                label: "Standard",
                inputs: ["nb_unite_jeux", "nb_sieges"], // + superficie_plancher
                calc: (data) => {
                    const jeux = (parseFloat(data.nb_unite_jeux) || 0) * 2;
                    const bySeat = Math.ceil((parseFloat(data.nb_sieges) || 0) / 4);
                    const byArea = Math.ceil((parseFloat(data.superficie_plancher) || 0) / 10);
                    return jeux + Math.max(bySeat, byArea);
                },
                desc: "2/unité jeux + Max(1/4 sièges, 1/10 m²)"
            }
        }
    }
};
