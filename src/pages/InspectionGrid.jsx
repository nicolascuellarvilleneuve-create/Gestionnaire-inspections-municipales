
import React, { useState, useEffect } from 'react';
import { REGLEMENTS } from '../data/mockData';
import { useInspections } from '../context/InspectionContext';
import { Save, AlertTriangle, Check, AlertCircle } from 'lucide-react';

const InspectionGrid = ({ onSave }) => {
    const { addInspection } = useInspections();

    // State for form data - mimicking Excel structure
    const [formData, setFormData] = useState({
        // Information Immeuble
        adresse: '',
        proprietaire: '',
        zone: '',

        // Marges (Relevées)
        margeAvantRelevee: '',
        margeArriereRelevee: '',
        margeLateraleRelevee: '',
        margeLateraleCombineeRelevee: '',

        // Bâtiment
        superficieTerrain: '',
        nbEtages: '',
        hauteurBatiment: '',

        // Autres
        commentaires: ''
    });

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

    // Real-time validation
    useEffect(() => {
        if (!selectedZoneNorms) {
            setValidation({});
            return;
        }

        const validateField = (relevee, norme) => {
            if (relevee === '' || relevee === null) return 'empty';
            const val = parseFloat(relevee);
            if (isNaN(val)) return 'invalid';
            if (val < norme) return 'non-conforme';
            return 'conforme';
        };

        const newValidation = {
            margeAvant: validateField(formData.margeAvantRelevee, selectedZoneNorms.margeAvant),
            margeArriere: validateField(formData.margeArriereRelevee, selectedZoneNorms.margeArriere),
            margeLaterale: validateField(formData.margeLateraleRelevee, selectedZoneNorms.margeLaterale),
            margeLateraleCombinee: validateField(formData.margeLateraleCombineeRelevee, selectedZoneNorms.margeLateraleCombinee),
        };

        setValidation(newValidation);
    }, [formData, selectedZoneNorms]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                <span className="flex items-center text-green-600 text-sm font-medium">
                    <Check size={16} className="mr-1" /> Conforme (+{gap}m)
                </span>
            );
        }
        if (status === 'non-conforme') {
            return (
                <span className="flex items-center text-red-600 text-sm font-medium animate-pulse">
                    <AlertCircle size={16} className="mr-1" /> Non-conforme ({gap}m)
                </span>
            );
        }
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Determine global status
        const hasNonConformity = Object.values(validation).some(v => v === 'non-conforme');
        const status = hasNonConformity ? 'Non-conforme' : 'Conforme';

        const inspection = {
            adresse: formData.adresse,
            proprietaire: formData.proprietaire,
            zone: formData.zone,
            status: status,
            details: {
                margeAvant: { requis: selectedZoneNorms?.margeAvant, releve: formData.margeAvantRelevee, conforme: validation.margeAvant === 'conforme' },
                margeArriere: { requis: selectedZoneNorms?.margeArriere, releve: formData.margeArriereRelevee, conforme: validation.margeArriere === 'conforme' }
            }
        };

        addInspection(inspection);
        if (onSave) onSave();
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Grille d'Inspection</h2>
                <div className="text-sm text-slate-500">Date: {new Date().toLocaleDateString()}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Section 1: Informations de Base */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                        Information Immeuble
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Adresse</label>
                            <input
                                type="text"
                                name="adresse"
                                value={formData.adresse}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="ex: 123 rue Principale"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Propriétaire</label>
                            <input
                                type="text"
                                name="proprietaire"
                                value={formData.proprietaire}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="ex: Jean Tremblay"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-600 mb-1">Zone (Zonage)</label>
                            <select
                                name="zone"
                                value={formData.zone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                required
                            >
                                <option value="">Sélectionner une zone...</option>
                                {REGLEMENTS.map(r => (
                                    <option key={r.zone} value={r.zone}>{r.zone}</option>
                                ))}
                            </select>
                            {selectedZoneNorms && (
                                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <div><span className="font-semibold">Marge Av. Min:</span> {selectedZoneNorms.margeAvant}m</div>
                                    <div><span className="font-semibold">Marge Arr. Min:</span> {selectedZoneNorms.margeArriere}m</div>
                                    <div><span className="font-semibold">Marge Lat. Min:</span> {selectedZoneNorms.margeLaterale}m</div>
                                    <div><span className="font-semibold">Marge Comb. Min:</span> {selectedZoneNorms.margeLateraleCombinee}m</div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Section 2: Marges et Validations (Le "Core" demandé) */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                        Validation des Marges (Zonage)
                    </h3>

                    <div className="space-y-6">
                        {/* Marge Avant */}
                        <div className={`p-4 rounded-lg border ${validation.margeAvant === 'non-conforme' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-4">
                                    <label className="block text-sm font-medium text-slate-700">Marge Avant</label>
                                    <div className="text-xs text-slate-500">Norme: {selectedZoneNorms?.margeAvant || '-'} m</div>
                                </div>
                                <div className="md:col-span-4">
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="margeAvantRelevee"
                                        value={formData.margeAvantRelevee}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        placeholder="Mesure relevée (m)"
                                        disabled={!formData.zone}
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    {getStatusBadge(validation.margeAvant, calculateGap(formData.margeAvantRelevee, selectedZoneNorms?.margeAvant))}
                                </div>
                            </div>
                        </div>

                        {/* Marge Arrière */}
                        <div className={`p-4 rounded-lg border ${validation.margeArriere === 'non-conforme' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-4">
                                    <label className="block text-sm font-medium text-slate-700">Marge Arrière</label>
                                    <div className="text-xs text-slate-500">Norme: {selectedZoneNorms?.margeArriere || '-'} m</div>
                                </div>
                                <div className="md:col-span-4">
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="margeArriereRelevee"
                                        value={formData.margeArriereRelevee}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        placeholder="Mesure relevée (m)"
                                        disabled={!formData.zone}
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    {getStatusBadge(validation.margeArriere, calculateGap(formData.margeArriereRelevee, selectedZoneNorms?.margeArriere))}
                                </div>
                            </div>
                        </div>

                        {/* Marge Latérale */}
                        <div className={`p-4 rounded-lg border ${validation.margeLaterale === 'non-conforme' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-4">
                                    <label className="block text-sm font-medium text-slate-700">Marge Latérale</label>
                                    <div className="text-xs text-slate-500">Norme: {selectedZoneNorms?.margeLaterale || '-'} m</div>
                                </div>
                                <div className="md:col-span-4">
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="margeLateraleRelevee"
                                        value={formData.margeLateraleRelevee}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        placeholder="Mesure relevée (m)"
                                        disabled={!formData.zone}
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    {getStatusBadge(validation.margeLaterale, calculateGap(formData.margeLateraleRelevee, selectedZoneNorms?.margeLaterale))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Autres Détails (Simplifié pour MVP mais extensible) */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 opacity-75">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                        Autres Informations (Bâtiment & Terrain)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Superficie Terrain (m²)</label>
                            <input type="number" name="superficieTerrain" value={formData.superficieTerrain} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Nombre d'étages</label>
                            <input type="number" name="nbEtages" value={formData.nbEtages} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Hauteur Bâtiment (m)</label>
                            <input type="number" name="hauteurBatiment" value={formData.hauteurBatiment} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                        </div>
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center shadow-lg transition-transform transform hover:scale-105"
                    >
                        <Save className="mr-2" size={20} />
                        Enregistrer l'Inspection
                    </button>
                </div>

            </form>
        </div>
    );
};

export default InspectionGrid;
