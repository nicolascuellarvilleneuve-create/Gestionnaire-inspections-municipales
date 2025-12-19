export const FORM_SECTIONS = [
    {
        id: 'info_immeuble',
        title: "INFORMATION IMMEUBLE",
        fields: [
            { id: 'nom_rue', label: "Nom de rue", type: "text", width: "half" },
            { id: 'numero_civique', label: "Numéro civique", type: "text", width: "half" },
            { id: 'zone', label: "Zone", type: "select", options: "zones", width: "half" },
            { id: 'numero_lot', label: "Numéro de lot", type: "text", width: "half" },
            { id: 'nom_proprietaire', label: "Nom propriétaire", type: "text", width: "full" },
            { id: 'telephone', label: "Téléphone", type: "text", width: "half" },
            // Marges Relevées vs Actuelles ? Le tableau image montre Requis (Zone) vs Actuel (Relevé)
            // On garde la logique de comparaison
            { id: 'superficie_terrain', label: "Superficie terrain (m²)", type: "number", width: "half" },
            {
                id: 'type_terrain',
                label: "Type de terrain",
                type: "select",
                options: ["Terrain intérieur", "Terrain d'angle", "Terrain transversal"],
                width: "half"
            },
            { id: 'presence_locataire', label: "Présence de locataire", type: "checkbox", width: "half" },
            { id: 'dob', label: "DOB (densité occupation bâtiment)", type: "text", width: "half", readonly: true },

            // New Activity Fields for Parking Calculation
            {
                id: 'type_activite',
                label: "Type Activité (Zonage 11.1.8)",
                type: "select",
                options: "type_activite_options", // We'll load this from PARKING_RULES keys
                width: "half"
            },
            {
                id: 'sous_type_activite',
                label: "Sous-catégorie",
                type: "select",
                options: "sous_type_activite_options", // Dynamic
                width: "half"
            },
            // Dynamic inputs will be rendered by Grid but we can define the result field here
            { id: 'nb_cases_requises', label: "Nombre de cases requises (Calculé)", type: "number", width: "half", readonly: true },

        ]
    },
    {
        id: 'locataires',
        title: "LOCATAIRES",
        repeatable: true,
        repeatLabel: "Locataire",
        fields: [
            { id: 'nom_locataire', label: "Nom du locataire", type: "text", width: "full" },
            { id: 'telephone_locataire', label: "Numéro de téléphone", type: "text", width: "half" },
            { id: 'activite_exercee', label: "Activité exercée", type: "text", width: "half" },
            { id: 'numero_cubf', label: "Numéro CUBF", type: "text", width: "half" },
            { id: 'superficie_occupe', label: "Superficie occupée (m²)", type: "number", width: "half" },
        ]
    },
    {
        id: 'batiment_principal',
        title: "BÂTIMENT PRINCIPAL",
        fields: [
            { id: 'superficie_batiment_princ', label: "Superficie bâtiment (m²)", type: "number", width: "half" },
            { id: 'nombre_etage', label: "Nombre étage", type: "number", width: "half" },
            { id: 'dimension_facade', label: "Dimension façade (m)", type: "number", width: "half" },
            { id: 'hauteur_batiment', label: "Hauteur bâtiment", type: "text", width: "half" },
            { id: 'dimension_mur_lat_droit', label: "Dimension mur latéral droit (m)", type: "number", width: "half" },
            { id: 'revetement_mural_prohibe', label: "Revêtement mural prohibé", type: "text", width: "half" },
            { id: 'dimension_mur_lat_gauche', label: "Dimension mur latéral gauche (m)", type: "number", width: "half" },
            { id: 'revetement_toiture', label: "Revêtement toiture", type: "text", width: "half" },
            { id: 'dimension_mur_arriere', label: "Dimension mur arrière (m)", type: "number", width: "half" },
            { id: 'superficie_plancher', label: "Superficie de plancher nette (m²)", type: "number", width: "half" },
            { id: 'type_toit', label: "Type de toit", type: "text", width: "half" },
        ]
    },
    {
        id: 'marges_verifications',
        title: "MARGES (ZONAGE)",
        fields: [
            { id: 'marge_avant', label: "Marge avant (m)", type: "measurement", normField: "margeAvant" },
            { id: 'marge_arriere', label: "Marge arrière (m)", type: "measurement", normField: "margeArriere" },
            { id: 'marge_laterale', label: "Marge latérale (m)", type: "measurement", normField: "margeLaterale" },
            { id: 'marge_laterale_combinee', label: "Marge latérale combinée (m)", type: "measurement", normField: "margeLateraleCombinee" },
        ]
    },
    {
        id: 'batiment_complementaire',
        title: "BÂTIMENT COMPLÉMENTAIRE",
        repeatable: true,
        repeatLabel: "Bâtiment",
        fields: [
            // nb_batiment_acc moved to calcul_ces as it is a summary field
            { id: 'type_batiment_acc', label: "Type bâtiment", type: "text", width: "half" },
            { id: 'superficie_batiment_acc', label: "Superficie bâtiment (m²)", type: "number", width: "half" },
            { id: 'hauteur_batiment_acc', label: "Hauteur bâtiment", type: "text", width: "half" },
            { id: 'permis_delivre_acc', label: "Permis délivré", type: "checkbox", width: "half" },
            { id: 'numero_permis_acc', label: "Numéro permis", type: "text", width: "half" },
            { id: 'inspecteur', label: "Inspecteur", type: "text", width: "half" },
            { id: 'date_delivrance_permis', label: "Date délivrance permis", type: "date", width: "half" },
            { id: 'date_inspection_permis', label: "Date inspection permis", type: "date", width: "half" },
        ]
    },
    {
        id: 'calcul_ces',
        title: "CALCUL DU C.E.S (EMPRISE AU SOL)",
        fields: [
            // Linked to Section 4 (Bâtiment Principal)
            { id: 'superficie_batiment_princ', label: "Superficie Bâtiment Principal (m²) (Voir Onglet 4)", type: "number", width: "half", readonly: true },
            // Linked to Section 5 (Bâtiment Complémentaire)
            { id: 'superficie_batiment_acc', label: "Sup. Bâtiments Accessoires (Voir Onglet 5)", type: "number", width: "half", readonly: true },

            { id: 'total_superficie_batiments', label: "Total Superficie Bâtiments (Calculé)", type: "number", width: "half", readonly: true },
            { id: 'nb_batiment_acc', label: "Nombre de Bâtiments Complémentaires", type: "number", width: "half", readonly: true },
            { id: 'ces', label: "CES Résultant (%)", type: "text", width: "half", readonly: true },
            { id: 'usage_batiment', label: "Usage bâtiment (CUBF)", type: "text", width: "full" },
            { id: 'adjacent_residentiel', label: "Adjacent terrain résidentiel", type: "checkbox", width: "half" },
        ]
    },
    {
        id: 'securite_incendie',
        title: "SÉCURITÉ INCENDIE",
        fields: [
            {
                id: 'usage_cnb',
                label: "Usage selon CNB 2015 art 3.1.17.1",
                type: "select",
                options: "usage_cnb", // Special identifier to load from data
                width: "full"
            },
            { id: 'facteur_charge', label: "Facteur de charge (m²/pers)", type: "text", width: "half", readonly: true },
            { id: 'superficie_plancher_ref', label: "Superficie de plancher nette (m²) (Réf)", type: "text", width: "half", readonly: true },
            { id: 'charge_occupation', label: "Charge d'occupation (Personnes)", type: "text", width: "full", readonly: true },
        ]
    },
    {
        id: 'stationnement',
        title: "AIRE DE STATIONNEMENT",
        fields: [
            { id: 'largeur_allee', label: "Largeur (m)", type: "number", width: "half" },
            { id: 'bordure_stationnement', label: "Bordure stationnement", type: "checkbox", width: "half" },
            { id: 'profondeur_allee', label: "Profondeur (m)", type: "number", width: "half" },
            { id: 'hauteur_bordure', label: "Hauteur bordure (0.10 <> 0.5)", type: "text", width: "half" },
            { id: 'superficie_totale_stationnement', label: "Superficie totale stationnement (m²)", type: "number", width: "full" },
            { id: 'materiaux_bordure', label: "Matériaux bordure", type: "text", width: "half" },
            { id: 'superficie_impermeabilise_stat', label: "Superficie impérméabilisée", type: "number", width: "half" },
            { id: 'profondeur_mini_acces', label: "Profondeur mini allée d'accès (> 6m)", type: "text", width: "half" },
            { id: 'largeur_mini_acces', label: "Largeur mini allée d'accès (> 6.7m)", type: "text", width: "half" },
            { id: 'distance_coin', label: "Distance coin terrain/ entrée charretière. (12m min)", type: "text", width: "half" },
            { id: 'largeur_entree_char', label: "Largeur entrée charretière (6.7 < x > 15)", type: "text", width: "half" },
            { id: 'dim_mini_case', label: "Dimension mini case (2.75 x 5.5)", type: "text", width: "half" },
            { id: 'nb_case', label: "Nombre de case", type: "number", width: "half" },
            { id: 'aire_deneigement', label: "Aire de déneigement", type: "text", width: "half" },
        ]
    },
    {
        id: 'amenagement_terrain',
        title: "AMÉNAGEMENT TERRAIN - VÉGÉTALISATION",
        fields: [
            { id: 'superficie_vegetalise', label: "Superficie végétalisée", type: "number", width: "half" },
            { id: 'pourcentage_vegetalisation', label: "Pourcentage végétalisation", type: "text", width: "half" },
            { id: 'ilot_vegetalise', label: "Ilot végétalisé présent", type: "checkbox", width: "half" },
            { id: 'profondeur_minimale', label: "Profondeur minimale 2.4m", type: "text", width: "half" },
            { id: 'triangle_visibilite_veg', label: "Triangle de visibilité requis", type: "checkbox", width: "half" },
        ]
    },
    {
        id: 'surfaces_impermeabilisees',
        title: "DÉTAIL SURFACES IMPERMÉABILISÉES",
        repeatable: true,
        repeatLabel: "Surface",
        fields: [
            {
                id: 'type_surface',
                label: "Type de surface",
                type: "select",
                options: ["Surface de stationnement", "Surface minéralisée", "Non applicable"],
                width: "half"
            },
            { id: 'superficie_surface', label: "Superficie (m²)", type: "number", width: "half" }
        ]
    },
    {
        id: 'drainage_resume',
        title: "RÉSUMÉ DRAINAGE EAUX PLUVIALES",
        fields: [
            { id: 'total_impermeabilise_calc', label: "Total superficie imperméabilisée (Calculé)", type: "number", width: "full", readonly: true },
            { id: 'puisard_obligatoire_statut', label: "Puisard obligatoire (> 500m²)", type: "text", width: "half", readonly: true },
            { id: 'puisard_present', label: "Puisard présent sur le site", type: "checkbox", width: "half" },
            { id: 'separateur_hydro', label: "Séparateur hydrodynamique requis", type: "checkbox", width: "half" },
        ]
    },
    {
        id: 'entreposage',
        title: "ENTREPOSAGE",
        fields: [
            { id: 'type_entreposage', label: "Type d'entreposage", type: "text", width: "full", readonly: true }, // C D
            { id: 'nature_entreposage', label: "Nature d'entreposage", type: "textarea", width: "full", readonly: true },
            // Tableaux imbriqués complexes (Localisation / % Max / Hauteur)
            // Simplification pour l'UI, on pourrait faire un composant custom si nécessaire
            { id: 'entreposage_cour_avant', label: "Cour Avant (Conformité)", type: "checkbox", width: "half" },
            { id: 'entreposage_cour_arriere', label: "Cour Arrière (Conformité)", type: "checkbox", width: "half" },
            { id: 'entreposage_cour_laterale', label: "Cour Latérale (Conformité)", type: "checkbox", width: "half" },
        ]
    },
    {
        id: 'conteneur',
        title: "CONTENEUR",
        repeatable: true,
        repeatLabel: "Conteneur",
        fields: [
            { id: 'loc_conteneurs_conforme', label: "Localisation conteneurs conforme", type: "checkbox", width: "full" },
            { id: 'conteneur_cour_avant', label: "Cour Avant (Présence)", type: "checkbox", width: "third" },
            { id: 'conteneur_cour_arriere', label: "Cour Arrière (Présence)", type: "checkbox", width: "third" },
            { id: 'conteneur_cour_laterale', label: "Cour Latérale (Présence)", type: "checkbox", width: "third" },
            { id: 'distance_limite_prop', label: "Distance limite propriété", type: "text", width: "half" },
            { id: 'hauteur_base', label: "Hauteur Base (< 0.6m)", type: "text", width: "half" },
            { id: 'hauteur_haut', label: "Hauteur Haut (< 3.2m)", type: "text", width: "half" },
            { id: 'superpose', label: "Superposé", type: "checkbox", width: "half" },
        ]
    }
];
