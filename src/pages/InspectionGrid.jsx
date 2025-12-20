
import React, { useState, useEffect } from 'react';
import { REGLEMENTS, STORAGE_DEFINITIONS } from '../data/mockData';
import { FORM_SECTIONS } from '../data/formStructure';
import { CNB_OCCUPANT_LOAD_TABLE } from '../data/fireSafetyData';
import { PARKING_RULES } from '../data/parkingData';
import { useInspections } from '../context/InspectionContext';
import { Save, Check, AlertCircle, Plus, Trash2, FileDown } from 'lucide-react';
import { generateInspectionPDF } from '../utils/pdfGenerator';

const InspectionGrid = ({ onSave }) => {
    const { addInspection } = useInspections();

    // Helper to create initial state for a section's fields
    const createSectionState = (fields) => {
        const state = {};
        fields.forEach(field => {
            state[field.id] = '';
        });
        return state;
    };

    // Dynamic initial state
    const initialFormState = {};
    FORM_SECTIONS.forEach(section => {
        if (section.repeatable) {
            // For repeatable sections, we start with an empty array to allow 0 items (Optional)
            initialFormState[section.id] = [];
        } else {
            section.fields.forEach(field => {
                initialFormState[field.id] = '';
            });
        }
    });

    const [formData, setFormData] = useState(initialFormState);
    // DERIVED STATE (No Effects needed for display logic)
    const selectedZoneNorms = formData.zone ? (REGLEMENTS.find(r => r.zone === formData.zone) || null) : null;

    const validation = (() => {
        const newValidation = {};

        // 1. Validate Zone-based Norms (if zone selected)
        if (selectedZoneNorms) {
            const measurementFields = FORM_SECTIONS.find(s => s.id === 'marges_verifications')?.fields || [];
            measurementFields.forEach(field => {
                if (field.type === 'measurement' && field.normField) {
                    const relevee = formData[field.id];
                    const norme = selectedZoneNorms[field.normField];

                    if (relevee === '' || relevee === null) {
                        newValidation[field.id] = 'empty';
                    } else {
                        const val = parseFloat(relevee);
                        if (isNaN(val)) {
                            newValidation[field.id] = 'invalid';
                        } else if (val < norme) {
                            newValidation[field.id] = 'non-conforme';
                        } else {
                            newValidation[field.id] = 'conforme';
                        }
                    }
                }
            });
        }

        // 2. Specific validation for Distance Coin Terrain
        if (formData.type_terrain === "Terrain d'angle") {
            const distCoin = formData.distance_coin;
            if (distCoin !== '' && distCoin !== null && distCoin !== undefined) {
                const val = parseFloat(distCoin);
                if (!isNaN(val)) {
                    if (val < 12) {
                        newValidation['distance_coin'] = 'non-conforme';
                    } else {
                        newValidation['distance_coin'] = 'conforme';
                    }
                }
            }
        }

        return newValidation;
    })();

    // Auto-Calculate CES and Complementary Buildings Summary
    useEffect(() => {
        const terrain = parseFloat(formData.superficie_terrain) || 0;
        const batPrincipal = parseFloat(formData.superficie_batiment_princ) || 0;

        // Sum of all complementary buildings
        const batAccessoires = Array.isArray(formData.batiment_complementaire)
            ? formData.batiment_complementaire.reduce((sum, b) => sum + (parseFloat(b.superficie_batiment_acc) || 0), 0)
            : 0;

        const totalBat = batPrincipal + batAccessoires;
        let ces = 0;
        if (terrain > 0) {
            ces = (totalBat / terrain) * 100;
        }

        // Count of Acc Buildings
        const countAcc = Array.isArray(formData.batiment_complementaire) ? formData.batiment_complementaire.length : 0;

        // Update computed fields if changed

        setFormData(prev => {
            if (
                prev.total_superficie_batiments !== totalBat.toFixed(2) ||
                prev.ces !== ces.toFixed(2) + '%' ||
                prev.nb_batiment_acc !== countAcc
            ) {
                return {
                    ...prev,
                    total_superficie_batiments: totalBat.toFixed(2),
                    ces: ces.toFixed(2) + '%',
                    nb_batiment_acc: countAcc,
                    // Also update the read-only reflection fields
                    superficie_batiment_princ_ces: batPrincipal, // We need to sync this if we want it shown there? 
                    // Actually the form structure links them by ID, but we have separate read-only fields for display in CES tab?
                    // formStructure says: id: 'superficie_batiment_princ' (Same ID as in Section 4!)
                    // Since IDs are unique in formData state, they share the value. 
                    // Ah, Section 6 fields use SAME IDs as Section 4? 
                    // Let's check formStructure.js. 
                    // Section 4: { id: 'superficie_batiment_princ', ... }
                    // Section 6: { id: 'superficie_batiment_princ', ..., readonly: true }
                    // Yes, they share the exact same key in formData. So updating one updates the other. 
                    // EXCEPT 'superficie_batiment_acc' in Section 6 is supposed to be the SUM.
                    // But Section 5 is repeatable 'superficie_batiment_acc'. 
                    // Repeatable sections use Arrays. Standard fields use Strings/Numbers.
                    // Wait. In Section 5 (Repeatable), the field ID is 'superficie_batiment_acc'. 
                    // So inside the array items, we have { superficie_batiment_acc: ... }.
                    // In Section 6 (CES), we have a field { id: 'superficie_batiment_acc' }.
                    // This conflicts! formData['superficie_batiment_acc'] can't be both a top-level summary AND an array item property?
                    // Actually, the repeatable section data is stored in formData['batiment_complementaire'] (the section ID).
                    // So formData['superficie_batiment_acc'] (top level) is FREE to be used as a summary field.
                    // So we must explicitly calculate the sum and put it into formData['superficie_batiment_acc'].
                    superficie_batiment_acc: batAccessoires.toFixed(2)
                };
            }
            return prev;
        });

    }, [
        formData.superficie_terrain,
        formData.superficie_batiment_princ,
        formData.batiment_complementaire // dependency on the array
    ]);

    // Format DOB Display
    // Calculate and format DOB when relevant fields change
    useEffect(() => {
        const totalTenantArea = formData.locataires
            ? formData.locataires.reduce((sum, l) => sum + (parseFloat(l.superficie_occupe) || 0), 0)
            : 0;

        const batimentPrincipal = parseFloat(formData.superficie_batiment_princ) || 0;

        let dob = 0;
        if (batimentPrincipal > 0) {
            dob = (totalTenantArea / batimentPrincipal) * 100;
        }

        // Format: "50.00%"
        const newDob = dob > 0 ? dob.toFixed(2) + '%' : '';

        if (formData.dob !== newDob) {

            setFormData(prev => ({
                ...prev,
                dob: newDob
            }));
        }
    }, [formData.locataires, formData.superficie_batiment_princ, formData.dob]);

    // Parking Calculation Logic
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

        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        formData.superficie_plancher_admin,
        formData.nb_cases_requises
    ]);

    // Auto-check presence_locataire for Industrie
    useEffect(() => {
        if (formData.type_activite === 'industrie') {
            setFormData(prev => {
                if (!prev.presence_locataire) {
                    return { ...prev, presence_locataire: true };
                }
                return prev;
            });
        }
    }, [formData.type_activite]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // console.log("Change", name, value); // Debug
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRepeatableChange = (sectionId, index, e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const sectionArray = [...prev[sectionId]];
            sectionArray[index] = {
                ...sectionArray[index],
                [name]: type === 'checkbox' ? checked : value
            };
            return {
                ...prev,
                [sectionId]: sectionArray
            };
        });
    };

    const handleInputChange = (sectionId, fieldId, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const renderField = (field, sectionId) => {
        // Handle Dynamic Options for Parking Activity
        if (field.id === 'type_activite') {
            const options = Object.keys(PARKING_RULES).map(k => ({ value: k, label: PARKING_RULES[k].label }));
            return (
                <select
                    key={field.id}
                    value={formData.type_activite || ''}
                    onChange={(e) => handleInputChange(sectionId, field.id, e.target.value)}
                    className="w-full p-2 border rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Sélectionner...</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        if (field.id === 'sous_type_activite') {
            if (!formData.type_activite || !PARKING_RULES[formData.type_activite]) return null;

            const subtypes = PARKING_RULES[formData.type_activite].subtypes;
            const options = Object.keys(subtypes).map(k => ({ value: k, label: subtypes[k].label }));

            return (
                <select
                    key={field.id}
                    value={formData.sous_type_activite || ''}
                    onChange={(e) => handleInputChange(sectionId, field.id, e.target.value)}
                    className="w-full p-2 border rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Sélectionner...</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        return null;
    };

    const addRepeatableItem = (section) => {
        setFormData(prev => ({
            ...prev,
            [section.id]: [...prev[section.id], createSectionState(section.fields)]
        }));
    };

    const handleGeneratePDF = () => {
        const inspection = {
            id: Date.now(),
            adresse: formData.nom_rue ? `${formData.numero_civique || ''} ${formData.nom_rue}` : 'Adresse Inconnue',
            proprietaire: formData.nom_proprietaire,
            zone: formData.zone,
            status: Object.values(validation).some(v => v === 'non-conforme') ? 'Non-conforme' : 'Conforme',
            formData: formData,
            details: {},
            date: new Date().toLocaleDateString()
        };
        generateInspectionPDF(inspection);
    };

    const handleSave = () => {
        // Just trigger submit for now, or save to context
        // We'll trust the form submit handler
        document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    };

    // New useEffect for Nature d'entreposage mapping
    useEffect(() => {
        const z = selectedZoneNorms;
        if (z && z.nature_entreposage) {
            // Map the codes (A, B, C, D) to full text from STORAGE_DEFINITIONS
            const codes = z.nature_entreposage.split(',').map(c => c.trim());
            const definitions = codes.map(code => {
                const def = STORAGE_DEFINITIONS[code];
                return def ? `${code} : ${def}` : code;
            }).join('\n\n'); // Double newline for readable separation

            if (formData.nature_entreposage !== definitions) {

                setFormData(prev => ({
                    ...prev,
                    nature_entreposage: definitions
                }));
            }
        }
    }, [selectedZoneNorms, formData.type_entreposage, formData.nature_entreposage]);

    // Fire Safety: Auto-Calculate Occupant Load
    useEffect(() => {
        const usageLabel = formData.usage_cnb;
        const netArea = parseFloat(formData.superficie_plancher) || 0;

        let factor = '';
        let load = '';

        if (usageLabel) {
            const usageData = CNB_OCCUPANT_LOAD_TABLE.find(item => item.label === usageLabel);
            if (usageData && usageData.factor !== null) {
                factor = usageData.factor;
            }
        }

        if (netArea > 0 && factor) {
            load = Math.round(netArea / factor); // Round to nearest person
        }

        const currentFactor = formData.facteur_charge;
        const currentRefArea = formData.superficie_plancher_ref;
        const currentLoad = formData.charge_occupation;

        const newFactor = factor ? factor.toString() : '';
        const newRefArea = netArea > 0 ? netArea.toString() : '';
        const newLoad = load !== '' ? load.toString() : '';

        if (currentFactor !== newFactor || currentRefArea !== newRefArea || currentLoad !== newLoad) {

            setFormData(prev => ({
                ...prev,
                facteur_charge: newFactor,
                superficie_plancher_ref: newRefArea,
                charge_occupation: newLoad
            }));
        }

    }, [formData.usage_cnb, formData.superficie_plancher, formData.facteur_charge, formData.superficie_plancher_ref, formData.charge_occupation]);

    const removeRepeatableItem = (sectionId, index) => {
        setFormData(prev => ({
            ...prev,
            [sectionId]: prev[sectionId].filter((_, i) => i !== index)
        }));
    };

    const calculateGap = (relevee, norme) => {
        if (!relevee || !norme) return null;
        const val = parseFloat(relevee);
        if (isNaN(val)) return null;
        return (val - norme).toFixed(2);
    };

    const getStatusBadge = (status, gap) => {
        if (status === 'conforme') {
            return (
                <span className="flex items-center text-green-600 text-xs font-bold uppercase tracking-wider bg-green-50 px-2 py-1 rounded-md border border-green-100">
                    <Check size={14} className="mr-1" /> Conforme (+{gap}m)
                </span>
            );
        }
        if (status === 'non-conforme') {
            return (
                <span className="flex items-center text-red-600 text-xs font-bold uppercase tracking-wider bg-red-50 px-2 py-1 rounded-md border border-red-100 animate-pulse">
                    <AlertCircle size={14} className="mr-1" /> Non-conforme ({gap}m)
                </span>
            );
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const hasNonConformity = Object.values(validation).some(v => v === 'non-conforme');
        const status = hasNonConformity ? 'Non-conforme' : 'Conforme';

        const inspection = {
            id: Date.now(), // Simple ID
            adresse: formData.nom_rue ? `${formData.numero_civique || ''} ${formData.nom_rue}` : 'Adresse Inconnue',
            proprietaire: formData.nom_proprietaire,
            zone: formData.zone,
            status: status,
            formData: formData, // Save full data containing arrays
            details: {},
            date: new Date().toLocaleDateString()
        };

        // Add margin details for history/pdf validity
        Object.keys(validation).forEach(key => {
            if (formData[key]) {
                const field = FORM_SECTIONS.find(s => s.id === 'marges_verifications')?.fields.find(f => f.id === key);
                if (field && selectedZoneNorms) {
                    if (!inspection.details) inspection.details = {};
                    inspection.details[key] = {
                        requis: selectedZoneNorms[field.normField],
                        releve: formData[key],
                        conforme: validation[key] === 'conforme'
                    };
                }
            }
        });

        // 1. SAVE TO FLOPPY DISK (Federated Database)
        try {
            console.log("Saving to Federation...", inspection);
            const response = await fetch('http://localhost:3001/api/inspections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData) // Send raw form data to Router
            });

            if (!response.ok) {
                throw new Error("Erreur serveur: " + response.statusText);
            }
            const result = await response.json();
            console.log("Saved to Vault ID:", result.id);
            alert("✅ Inspection sauvegardée dans la voute sécurisée!");

        } catch (err) {
            console.error("Federation Error:", err);
            alert("⚠️ AVERTISSEMENT: Le serveur est hors ligne. Données sauvegardées localement seulement.");
        }

        // 2. SAVE LOCAL (Context/React)
        addInspection(inspection);

        // Ask if user wants PDF immediately
        if (window.confirm("Voulez-vous télécharger le PDF maintenant ?")) {
            generateInspectionPDF(inspection);
        }

        if (onSave) onSave();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Global - NOT STICKY anymore */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm mb-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inspection Municipale</h1>
                        <p className="text-slate-500 mt-1">Formulaire de saisie et de calcul</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={handleGeneratePDF}
                            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-700 hover:shadow-xl transition-all flex items-center"
                        >
                            <FileDown size={20} className="mr-2" />
                            PDF
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-500 hover:shadow-blue-300 transition-all flex items-center"
                        >
                            <Save size={20} className="mr-2" />
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto p-8 flex items-start gap-8">
                {/* STICKY SIDEBAR NAVIGATION - Collapsible */}
                {/* Fixed positioning or Sticky? Sticky is better for alignment with form top. */}
                {/* We increase z-index to ensure it expands over content if needed, though pushing content is safer for "not reducing width" interpreted as "use void space". 
                   The user said "doit etre plus a gauche pour ne pas réduire la largeur". 
                   If it expands, it might push content. 
                   If we make it 'absolute' or 'fixed' it won't push content but might overlap.
                   "plus a gauche" implies using the margin.
                   Let's keep it sticky but compact (w-20) so the form gets more space (flex-1).
                   When hovered, we can make it absolute/fixed-like visual expansion OR just expand width.
                   Expanding width SHIFTS the content, which feels jerky.
                   Better: The container has a fixed width of 5rem (20), but the NAV itself expands absolute-ly or has an inner container that expands?
                   
                   Let's try a cleaner approach: stick sidebar is purely icons (width 20). 
                   When hovered, it expands into a floating drawer? 
                   OR, we just output the icon and the text is hidden.
                   
                   Let's use `w-20 hover:w-80` with `transition-width`.
                   To prevent layout shift of the form, the `nav` container should perhaps stay `w-20`, and the content inside expands absolutely?
                   Let's try that. The parent is a placeholder `w-20`. The child `div` is `fixed` or `absolute` relative to something?
                   Sticky + Absolute expansion is tricky.
                   
                   Easier: The nav is `sticky top-8`. It has base width `w-20`.
                   On hover, it becomes `w-80`. 
                   Issue: The form next to it will shrink/resize. User specifically said "ne pas réduire la largeur du formulaire".
                   This implies the sidebar shouldn't take up space from the form.
                   
                   Solution: Position Fixed Left.
                   "l'onglet navigation doit etre plus a gauche".
                   Let's move it OUT of the flex container and make it `fixed left-4 top-32 z-50`.
                   Then the form can take full width (max-w-7xl centered).
                 */}

                <nav className="fixed left-0 md:left-64 top-32 z-50 group">
                    <div
                        className="bg-[#1a1b26] rounded-r-2xl shadow-md border border-[#414868] overflow-hidden w-16 hover:w-72 transition-all duration-300 ease-in-out h-[calc(100vh-10rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <div className="p-4 border-b border-[#414868] bg-[#1a1b26] flex items-center overflow-hidden whitespace-nowrap">
                            <h3 className="font-bold text-[#c0caf5] uppercase text-xs tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 pl-2">Navigation</h3>
                        </div>
                        <ul className="py-2">
                            {FORM_SECTIONS.map((section, idx) => (
                                <li key={section.id}>
                                    <button
                                        onClick={() => {
                                            document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium text-[#7aa2f7] hover:bg-[#24283b] hover:text-[#bb9af7] transition-colors flex items-center border-l-4 border-transparent hover:border-[#7aa2f7] overflow-hidden whitespace-nowrap"
                                        title={section.title} // Tooltip for collapsed state
                                    >
                                        <span className="w-8 h-8 rounded bg-[#24283b] text-[#565f89] flex items-center justify-center text-sm font-bold shrink-0 shadow-sm group-hover:bg-[#414868] group-hover:text-[#c0caf5] transition-colors">
                                            {idx + 1}
                                        </span>
                                        <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 truncate block text-[#c0caf5]">
                                            {section.title}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                {/* MAIN FORM - Add margin-left to avoid overlap with collapsed sidebar */}
                <form onSubmit={handleSubmit} className="flex-1 space-y-8 pb-24 ml-16 md:ml-32 w-full">
                    {FORM_SECTIONS.map((section, index) => {

                        // Conditional logic for Residential vs Commercial sections
                        if (section.id === 'locataires') {
                            // Hide "LOCATAIRES" if activity is "Habitation" or presence_locataire is false
                            const isResidential = formData.type_activite === 'habitation';
                            if (isResidential || !formData.presence_locataire) {
                                return null;
                            }
                        }

                        if (section.id === 'logements') {
                            // Show "LOGEMENTS" ONLY if activity is "Habitation"
                            if (formData.type_activite !== 'habitation') {
                                return null;
                            }
                        }

                        // -------------- REPEATABLE SECTION RENDERING --------------
                        if (section.repeatable) {
                            return (
                                <section id={section.id} key={section.id} className="space-y-4 scroll-mt-32">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase flex items-center">
                                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm mr-4 shadow-sm">
                                                {index + 1}
                                            </div>
                                            {section.title}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => addRepeatableItem(section)}
                                            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-blue-100 transition-colors"
                                        >
                                            <Plus size={16} className="mr-2" /> Ajouter {section.repeatLabel}
                                        </button>
                                    </div>

                                    {formData[section.id].map((item, itemIndex) => (
                                        <div key={itemIndex} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
                                            {/* Header for Item */}
                                            <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                                                <span className="font-bold text-slate-700 text-sm">{section.repeatLabel} #{itemIndex + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRepeatableItem(section.id, itemIndex)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                {section.fields.map(field => (
                                                    <div key={`${field.id}_${itemIndex}`} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                        <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                                                        {field.type === 'select' ? (
                                                            <select
                                                                name={field.id}
                                                                value={item[field.id]}
                                                                onChange={(e) => handleRepeatableChange(section.id, itemIndex, e)}
                                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium"
                                                            >
                                                                <option value="">Sélectionner...</option>
                                                                {Array.isArray(field.options) && field.options.map(opt => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : field.type === 'checkbox' ? (
                                                            <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    name={`${field.id}`} // We use raw id because handleRepeatableChange pulls from params
                                                                    checked={item[field.id]}
                                                                    onChange={(e) => handleRepeatableChange(section.id, itemIndex, e)}
                                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                                                />
                                                                <span className="text-sm text-slate-600">Oui / Confirmé</span>
                                                            </label>
                                                        ) : (
                                                            <input
                                                                type={field.type}
                                                                name={`${field.id}`}
                                                                value={item[field.id]}
                                                                onChange={(e) => handleRepeatableChange(section.id, itemIndex, e)}
                                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                                                placeholder={field.label}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </section>
                            );
                        }

                        // -------------- STANDARD SECTION RENDERING --------------
                        return (
                            <section id={section.id} key={section.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md scroll-mt-32">
                                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm mr-4 shadow-sm">
                                        {index + 1}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">{section.title}</h3>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {section.fields.map(field => {
                                        // Conditional rendering for distance_coin
                                        if (field.id === 'distance_coin' && formData.type_terrain !== "Terrain d'angle") {
                                            return null;
                                        }

                                        // Special rendering for distance_coin with validation badge
                                        if (field.id === 'distance_coin') {
                                            if (formData.type_terrain !== "Terrain d'angle") return null;

                                            const valStatus = validation[field.id];
                                            const gap = calculateGap(formData[field.id], 12); // Hardcoded 12m norm

                                            return (
                                                <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            name={field.id}
                                                            value={formData[field.id] || ''}
                                                            onChange={handleChange}
                                                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 transition-all outline-none ${valStatus === 'non-conforme' ? 'border-red-300 focus:ring-red-200 text-red-700' :
                                                                valStatus === 'conforme' ? 'border-green-300 focus:ring-green-200 text-green-700' :
                                                                    'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                                                                }`}
                                                            placeholder={field.label}
                                                        />
                                                        <div className="absolute right-3 top-2.5">
                                                            {getStatusBadge(valStatus, gap)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Measurement Fields with Zone Validation
                                        if (field.type === 'measurement') {
                                            const valStatus = validation[field.id];
                                            const normValue = selectedZoneNorms ? selectedZoneNorms[field.normField] : null;
                                            const gap = calculateGap(formData[field.id], normValue);

                                            return (
                                                <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="block text-sm font-semibold text-slate-700">{field.label}</label>
                                                        {normValue && (
                                                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                                Requis: {normValue}m
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            name={field.id}
                                                            value={formData[field.id] || ''}
                                                            onChange={handleChange}
                                                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 transition-all outline-none ${valStatus === 'non-conforme' ? 'border-red-300 focus:ring-red-200 text-red-700' :
                                                                valStatus === 'conforme' ? 'border-green-300 focus:ring-green-200 text-green-700' :
                                                                    'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                                                                }`}
                                                            placeholder={normValue ? `Norme: ${normValue}m` : field.label}
                                                        />
                                                        <div className="absolute right-3 top-2.5">
                                                            {getStatusBadge(valStatus, gap)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Conditional Rendering for 'presence_locataire'
                                        if (field.id === 'presence_locataire') {
                                            if (formData.type_activite !== 'industrie') {
                                                return null;
                                            }
                                        }

                                        // Special rendering for Zones (Select via Data) or Generic Select (Array options)
                                        if (field.type === 'select') {
                                            if (field.id === 'zone') {
                                                return (
                                                    <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                        <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                                                        <select
                                                            name={field.id}
                                                            value={formData[field.id] || ''}
                                                            onChange={handleChange}
                                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium"
                                                        >
                                                            <option value="">Sélectionner...</option>
                                                            {REGLEMENTS.map(zone => (
                                                                <option key={zone.zone} value={zone.zone}>{zone.zone}</option>
                                                            ))}
                                                        </select>

                                                        {selectedZoneNorms && (
                                                            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 grid grid-cols-2 gap-2">
                                                                <div><span className="font-semibold">Avant:</span> {selectedZoneNorms.margeAvant}m</div>
                                                                <div><span className="font-semibold">Arrière:</span> {selectedZoneNorms.margeArriere}m</div>
                                                                <div><span className="font-semibold">Latérale:</span> {selectedZoneNorms.margeLaterale}m</div>
                                                                <div><span className="font-semibold">Lat. Comb:</span> {selectedZoneNorms.margeLateraleCombinee}m</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            // Dynamic fields (activity) - Handled via renderField
                                            if (field.id === 'type_activite' || field.id === 'sous_type_activite') {
                                                return (
                                                    <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                        <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                                                        {renderField(field, section.id)}
                                                    </div>
                                                );
                                            }
                                            // General Select (simple array)
                                            if (field.options && Array.isArray(field.options)) {
                                                return (
                                                    <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                        <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                                                        <select
                                                            name={field.id}
                                                            value={formData[field.id] || ''}
                                                            onChange={handleChange}
                                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium"
                                                        >
                                                            <option value="">Sélectionner...</option>
                                                            {field.options.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                );
                                            }
                                            // Skip specialized selects that are handled by renderField or other logic if here
                                            return renderField(field, section.id, index);
                                        }

                                        // Checkbox/Radio
                                        if (field.type === 'checkbox') {
                                            return (
                                                <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                                                    <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            name={field.id}
                                                            checked={formData[field.id] || false}
                                                            onChange={handleChange}
                                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                                        />
                                                        <span className="text-sm text-slate-600">Oui / Confirmé</span>
                                                    </label>
                                                </div>
                                            );
                                        }

                                        // TextArea
                                        if (field.type === 'textarea') {
                                            return (
                                                <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                                                    <textarea
                                                        name={field.id}
                                                        value={formData[field.id] || ''}
                                                        onChange={handleChange}
                                                        readOnly={field.readonly}
                                                        rows={field.rows || 3}
                                                        className={`w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${field.readonly ? 'bg-slate-100/50 text-slate-500' : ''}`}
                                                        placeholder={field.label}
                                                    />
                                                </div>
                                            );
                                        }

                                        // Default Input (Text, Number, Date, etc.) - or Custom renderField fallback
                                        const customRender = renderField(field, section.id);
                                        if (customRender) return customRender;

                                        return (
                                            <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                                                <input
                                                    type={field.type}
                                                    name={field.id}
                                                    value={formData[field.id] || ''}
                                                    onChange={handleChange}
                                                    readOnly={field.readonly}
                                                    className={`w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${field.readonly ? 'bg-slate-100/50 text-slate-500' : ''}`}
                                                    placeholder={field.label}
                                                />
                                            </div>
                                        );
                                    })}

                                    {/* DYNAMIC PARKING INPUTS */}
                                    {section.id === 'info_immeuble' && formData.type_activite && formData.sous_type_activite && (
                                        (() => {
                                            const rule = PARKING_RULES[formData.type_activite]?.subtypes[formData.sous_type_activite];
                                            if (!rule || !rule.inputs) return null;

                                            // Define labels for dynamic inputs
                                            const INPUT_LABELS = {
                                                "nb_logement": "Nombre de logements",
                                                "nb_sieges": "Nombre de sièges",
                                                "nb_employes": "Nombre d'employés",
                                                "nb_chambre": "Nombre de chambres",
                                                "superficie_plancher_bureau": "Sup. Bureaux (m²)",
                                                "superficie_plancher_admin": "Sup. Admin (m²)",
                                                "nb_classes": "Nombre de classes",
                                                "nb_etudiants": "Nombre d'étudiants",
                                                "nb_medecins": "Nombre de médecins",
                                                "nb_lits": "Nombre de lits",
                                                "nb_salle_expo": "Nombre de salles d'expo",
                                                "nb_unite_jeux": "Nombre d'unités de jeux"
                                            };

                                            return rule.inputs.map(inputId => {
                                                if (inputId === 'superficie_plancher') return null; // Already exists

                                                return (
                                                    <div key={inputId} className="col-span-1 border-l-4 border-blue-400 pl-3 bg-blue-50 py-2 rounded-r-md">
                                                        <label className="block text-sm font-medium text-blue-900 mb-1">
                                                            {INPUT_LABELS[inputId] || inputId} (Requis)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            name={inputId}
                                                            value={formData[inputId] || ''}
                                                            onChange={handleChange}
                                                            className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Entrer valeur..."
                                                        />
                                                    </div>
                                                );
                                            });
                                        })()
                                    )}
                                </div>
                            </section>
                        );
                    })}

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-end z-30 md:static md:bg-transparent md:border-0 md:p-0">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
                        >
                            <Save className="mr-3" size={24} />
                            Compter et Enregistrer l'Inspection
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default InspectionGrid;
