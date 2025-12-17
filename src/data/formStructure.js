
export const FORM_SECTIONS = [
    {
        id: 'info_immeuble',
        title: "INFORMATION IMMEUBLE",
        fields: [
            { id: 'nom_rue', label: "Nom de rue", type: "text", width: "half" },
            { id: 'numero_civique', label: "Numéro civique", type: "text", width: "half" },
            { id: 'type_terrain', label: "Type de terrain", type: "text", width: "half" }, // En angle...
            { id: 'nom_proprietaire', label: "Nom propriétaire", type: "text", width: "full" },
            { id: 'zone', label: "Zone", type: "select", options: "zones", width: "half" }, // Special handling
            { id: 'numero_lot', label: "Numéro de lot", type: "text", width: "half" },
            { id: 'usage_batiment', label: "Usage bâtiment (CUBF)", type: "text", width: "full" },
            { id: 'adjacent_residentiel', label: "Adjacent terrain résidentiel", type: "checkbox", width: "half" },
        ]
    },
    {
        id: 'marges_verifications',
        title: "VÉRIFICATION DES MARGES (ZONAGE)",
        fields: [
            { id: 'marge_avant', label: "Marge avant (m)", type: "measurement", normField: "margeAvant" },
            { id: 'marge_arriere', label: "Marge arrière (m)", type: "measurement", normField: "margeArriere" },
            { id: 'marge_laterale', label: "Marge latérale (m)", type: "measurement", normField: "margeLaterale" },
            { id: 'marge_laterale_combinee', label: "Marge latérale combinée (m)", type: "measurement", normField: "margeLateraleCombinee" },
        ]
    },
    {
        id: 'batiment_principal',
        title: "BÂTIMENT PRINCIPAL",
        fields: [
            { id: 'superficie_batiment', label: "Superficie bâtiment (m²)", type: "number", width: "half" },
            { id: 'nombre_etage', label: "Nombre étage", type: "number", width: "half" },
            { id: 'dimension_facade', label: "Dimension façade (m)", type: "number", width: "half" },
            { id: 'hauteur_batiment', label: "Hauteur bâtiment", type: "text", width: "half" },
            { id: 'mur_lateral_droit', label: "Mur latéral droit (m)", type: "number", width: "half" },
            { id: 'revetement_mural_prohibe', label: "Revêtement mural prohibé", type: "text", width: "half" },
            { id: 'mur_lateral_gauche', label: "Mur latéral gauche (m)", type: "number", width: "half" },
            { id: 'revetement_toiture', label: "Revêtement toiture", type: "text", width: "half" },
            { id: 'mur_arriere', label: "Mur arrière (m)", type: "number", width: "half" },
            { id: 'type_toit', label: "Type de toit", type: "text", width: "half" },
        ]
    },
    {
        id: 'batiment_complementaire',
        title: "BÂTIMENT COMPLÉMENTAIRE",
        fields: [
            { id: 'nb_batiment_acc', label: "Nombre bâtiment", type: "number", width: "full" },
            { id: 'type_batiment_acc', label: "Type bâtiment", type: "text", width: "half" },
            { id: 'superficie_batiment_acc', label: "Superficie (m²)", type: "number", width: "half" },
            { id: 'hauteur_batiment_acc', label: "Hauteur", type: "number", width: "half" },
            { id: 'permis_delivre_acc', label: "Permis délivré", type: "checkbox", width: "half" },
            { id: 'numero_permis_acc', label: "Numéro permis", type: "text", width: "half" },
        ]
    },
    {
        id: 'amenagement_terrain',
        title: "AMÉNAGEMENT TERRAIN & VÉGÉTALISATION",
        fields: [
            { id: 'superficie_vegetalise', label: "Superficie végétalisée (m²)", type: "number", width: "half" },
            { id: 'pourcentage_vegetalisation', label: "% Végétalisation", type: "number", width: "half" },
            { id: 'ilot_vegetalise', label: "Ilot végétalisé présent", type: "checkbox", width: "half" },
            { id: 'triangle_visibilite', label: "Triangle de visibilité requis", type: "checkbox", width: "half" },
        ]
    },
    {
        id: 'stationnement',
        title: "STATIONNEMENT & CIRCULATION",
        fields: [
            { id: 'largeur_allee', label: "Largeur allée (m)", type: "number", width: "half" },
            { id: 'profondeur_allee', label: "Profondeur allée (m)", type: "number", width: "half" },
            { id: 'superficie_stationnement', label: "Superficie Stationnement (m²)", type: "number", width: "full" },
            { id: 'nb_cases', label: "Nombre de cases", type: "number", width: "half" },
            { id: 'case_mobilite_reduite', label: "Case mobilité réduite", type: "checkbox", width: "half" },
        ]
    },
    {
        id: 'drainage',
        title: "DRAINAGE EAUX PLUVIALES",
        fields: [
            { id: 'superficie_impermeabilise', label: "Total superficie imperméabilisée", type: "number", width: "full" },
            { id: 'puisard_obligatoire', label: "Puisard obligatoire (> 500m²)", type: "checkbox", width: "half" },
            { id: 'separateur_hydro', label: "Séparateur hydrodynamique requis", type: "checkbox", width: "half" },
        ]
    },
    {
        id: 'entreposage',
        title: "ENTREPOSAGE & CONTENEURS",
        fields: [
            { id: 'type_entreposage', label: "Type d'entreposage", type: "text", width: "full" },
            { id: 'localisation_cont_conforme', label: "Localisation conteneurs conforme", type: "checkbox", width: "half" },
            { id: 'hauteur_cloture', label: "Hauteur clôture (m)", type: "number", width: "half" },
        ]
    }
];
