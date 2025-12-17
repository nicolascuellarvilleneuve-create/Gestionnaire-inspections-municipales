
import React, { useState, useEffect } from 'react';
import { REGLEMENTS } from '../data/mockData';
import { FORM_SECTIONS } from '../data/formStructure';
import { useInspections } from '../context/InspectionContext';
import { Save, AlertTriangle, Check, AlertCircle, Calculator, Plus, Trash2, FileDown } from 'lucide-react';
import { generateInspectionPDF } from '../utils/pdfGenerator';
import * as XLSX from 'xlsx';

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
            // For repeatable sections, we start with one empty item
            initialFormState[section.id] = [createSectionState(section.fields)];
        } else {
            section.fields.forEach(field => {
                initialFormState[field.id] = '';
            });
        }
    });

    const [formData, setFormData] = useState(initialFormState);
    const [validation, setValidation] = useState({});
    const [selectedZoneNorms, setSelectedZoneNorms] = useState(null);

    // Update zone norms when zone changes
    useEffect(() => {
        if (formData.zone) {
            const norms = REGLEMENTS.find(r => r.zone === formData.zone);
            setSelectedZoneNorms(norms || null);
        } else {
            setSelectedZoneNorms(null);
        }
    }, [formData.zone]);

    // Real-time validation for measurement fields
    useEffect(() => {
        if (!selectedZoneNorms) {
            setValidation({});
            return;
        }

        const newValidation = {};

        // Find measurement fields that have a normField
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

        setValidation(newValidation);
    }, [formData, selectedZoneNorms]);

    // Auto-Calculate CES
    useEffect(() => {
        const terrain = parseFloat(formData.superficie_terrain) || 0;
        // Updated IDs to match Section 4 and 5
        const batPrincipal = parseFloat(formData.superficie_batiment_princ) || 0;
        const batAccessoire = parseFloat(formData.superficie_batiment_acc) || 0;

        const totalBatiments = batPrincipal + batAccessoire;

        // Calculate CES % = (Total Bats / Terrain) * 100
        let ces = 0;
        if (terrain > 0) {
            ces = (totalBatiments / terrain) * 100;
        }

        // Only update if values changed to avoid loop
        const newTotal = totalBatiments > 0 ? totalBatiments.toFixed(2) : '';
        const newCes = ces > 0 ? ces.toFixed(2) + '%' : '';

        if (formData.total_superficie_batiments !== newTotal || formData.ces !== newCes) {
            setFormData(prev => ({
                ...prev,
                total_superficie_batiments: newTotal,
                ces: newCes,
            }));
        }

    }, [formData.superficie_terrain, formData.superficie_batiment_princ, formData.superficie_batiment_acc, formData.total_superficie_batiments, formData.ces]);

    // Standard Field Change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Repeatable Section Change
    const handleRepeatableChange = (sectionId, index, e) => {
        const { name, value, type, checked } = e.target;
        const actualName = name.split(`_${index}_`)[1] || name; // Handle if we prefixed, or just use raw name matching field id

        setFormData(prev => {
            const newArray = [...prev[sectionId]];
            newArray[index] = {
                ...newArray[index],
                [actualName]: type === 'checkbox' ? checked : value
            };
            return { ...prev, [sectionId]: newArray };
        });
    };

    const addRepeatableItem = (section) => {
        setFormData(prev => ({
            ...prev,
            [section.id]: [...prev[section.id], createSectionState(section.fields)]
        }));
    };

    // Auto-Calculate Drainage
    useEffect(() => {
        const surfaces = formData.surfaces_impermeabilisees || [];

        let total = 0;
        if (Array.isArray(surfaces)) {
            total = surfaces.reduce((acc, item) => {
                const val = parseFloat(item.superficie_surface) || 0;
                return acc + val;
            }, 0);
        }

        const newTotalStr = total > 0 ? total.toFixed(2) : '';
        const puisardStatus = total > 500 ? 'REQUIS' : 'NON REQUIS';

        if (formData.total_impermeabilise_calc !== newTotalStr || formData.puisard_obligatoire_statut !== puisardStatus) {
            setFormData(prev => ({
                ...prev,
                total_impermeabilise_calc: newTotalStr,
                puisard_obligatoire_statut: puisardStatus
            }));
        }

    }, [formData.surfaces_impermeabilisees, formData.total_impermeabilise_calc, formData.puisard_obligatoire_statut]);

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

    const handleSubmit = (e) => {
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
            details: {}, // Can optionally populate with specific verified margins for quick access
            date: new Date().toLocaleDateString()
        };

        // Add margin details for history/pdf validity
        Object.keys(validation).forEach(key => {
            if (formData[key]) {
                // Try to find norm value
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

        addInspection(inspection);

        // Ask if user wants PDF immediately
        if (window.confirm("Inspection enregistrée ! Voulez-vous télécharger le PDF maintenant ?")) {
            generateInspectionPDF(inspection);
        }

        if (onSave) onSave();
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Grille d'Inspection</h2>
                    <p className="text-slate-500 mt-1">Saisie complète et validation normative</p>
                </div>
                <div className="text-sm font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-slate-600">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {FORM_SECTIONS.map((section, index) => {

                    // -------------- REPEATABLE SECTION RENDERING --------------
                    if (section.repeatable) {
                        return (
                            <section key={section.id} className="space-y-4">
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
                                            {formData[section.id].length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRepeatableItem(section.id, itemIndex)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            {section.fields.map(field => (
                                                <div key={`${field.id}_${itemIndex}`} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                                                    {field.type === 'checkbox' ? (
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
                        <section key={section.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
                            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm mr-4 shadow-sm">
                                    {index + 1}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">{section.title}</h3>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {section.fields.map(field => {
                                    // Special rendering for Zones (Select via Data) or Generic Select (Array options)
                                    if (field.type === 'select') {
                                        let options = [];
                                        if (field.options === 'zones') {
                                            options = REGLEMENTS.map(r => r.zone);
                                        } else if (Array.isArray(field.options)) {
                                            options = field.options;
                                        }

                                        return (
                                            <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                                                <select
                                                    name={field.id}
                                                    value={formData[field.id]}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium"
                                                >
                                                    <option value="">Sélectionner...</option>
                                                    {options.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                {/* Special display for Zones norms */}
                                                {field.options === 'zones' && selectedZoneNorms && (
                                                    <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-blue-800 grid grid-cols-2 gap-2">
                                                        <div><span className="font-bold">Avant:</span> {selectedZoneNorms.margeAvant}m</div>
                                                        <div><span className="font-bold">Arrière:</span> {selectedZoneNorms.margeArriere}m</div>
                                                        <div><span className="font-bold">Latérale:</span> {selectedZoneNorms.margeLaterale}m</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    // Special rendering for Comparisons (Measurements)
                                    if (field.type === 'measurement') {
                                        const norm = selectedZoneNorms ? selectedZoneNorms[field.normField] : null;
                                        const valStatus = validation[field.id];
                                        const gap = calculateGap(formData[field.id], norm);

                                        return (
                                            <div key={field.id} className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-semibold text-slate-700 mb-1">{field.label}</label>
                                                        <div className="text-xs text-slate-500 font-mono">
                                                            Norme: <span className="font-bold text-slate-700">{norm ?? '-'} m</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full md:w-1/3">
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                name={field.id}
                                                                value={formData[field.id]}
                                                                onChange={handleChange}
                                                                className={`w-full pl-4 pr-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${valStatus === 'non-conforme' ? 'border-red-300 focus:ring-red-200 text-red-700' :
                                                                    valStatus === 'conforme' ? 'border-green-300 focus:ring-green-200 text-green-700' :
                                                                        'border-slate-300 focus:ring-blue-200'
                                                                    }`}
                                                                placeholder="Saisir mesure..."
                                                                disabled={!selectedZoneNorms}
                                                            />
                                                            <Calculator className="absolute right-3 top-2.5 text-slate-400" size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="min-w-[140px] flex justify-end">
                                                        {getStatusBadge(valStatus, gap)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Default rendering
                                    return (
                                        <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                                            {field.type === 'checkbox' ? (
                                                <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        name={field.id}
                                                        checked={formData[field.id]}
                                                        onChange={handleChange}
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                                    />
                                                    <span className="text-sm text-slate-600">Oui / Confirmé</span>
                                                </label>
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    name={field.id}
                                                    value={formData[field.id]}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                                    placeholder={field.label}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
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
    );
};

export default InspectionGrid;
