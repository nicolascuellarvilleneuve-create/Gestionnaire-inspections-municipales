
// Auto-Calculate Parking Requirements
useEffect(() => {
    const typeCtx = formData.type_activite;
    const subCtx = formData.sous_type_activite;
    let casesRequises = 0;

    if (typeCtx && subCtx && PARKING_RULES[typeCtx] && PARKING_RULES[typeCtx].subtypes[subCtx]) {
        const rule = PARKING_RULES[typeCtx].subtypes[subCtx];
        try {
            casesRequises = rule.calc(formData);
        } catch (err) {
            console.error("Error calculating parking:", err);
        }
    }

    const casesStr = casesRequises > 0 ? casesRequises.toString() : '';
    if (formData.nb_cases_requises !== casesStr) {
        setFormData(prev => ({ ...prev, nb_cases_requises: casesStr }));
    }

}, [
    formData.type_activite,
    formData.sous_type_activite,
    formData.superficie_plancher,
    formData.nb_sieges,
    formData.nb_employes,
    formData.nb_logement,
    formData.nb_chambre,
    formData.nb_classes,
    formData.nb_etudiants,
    formData.nb_medecins,
    formData.nb_lits,
    formData.nb_salle_expo,
    formData.nb_unite_jeux,
    formData.superficie_plancher_bureau,
    formData.superficie_plancher_admin
]);
