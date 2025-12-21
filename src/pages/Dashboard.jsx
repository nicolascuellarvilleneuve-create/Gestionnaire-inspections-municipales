
import React from 'react';
import InspectionMap from '../components/InspectionMap';
import PlanAuditPanel from '../components/PlanAuditPanel';
import { useInspections } from '../context/InspectionContext';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, FileText, CheckCircle, AlertCircle, TrendingUp, Download, Upload, Database, FileSpreadsheet, LayoutDashboard, Trash2, Pencil } from 'lucide-react';
import { exportFullDatabase, exportToExcel, importDatabase } from '../utils/dataManager';
import { generateInspectionPDF } from '../utils/pdfGenerator';
import { CITY_CONFIG } from '../config/cityConfig';

const Dashboard = ({ onNewInspection }) => {
    const { inspections, deleteInspection } = useInspections();
    const { getToken } = useAuth();
    const [ghostLayer, setGhostLayer] = React.useState(null);

    const stats = {
        total: inspections.length,
        conforme: inspections.filter(i => i.status === 'Conforme').length,
        nonConforme: inspections.filter(i => i.status === 'Non-conforme').length,
    };

    const handleEdit = async (id) => {
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:3001/api/inspections/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Erreur lors du chargement");

            const data = await response.json();
            onNewInspection(data); // Pass full data to Grid
        } catch (e) {
            alert("Impossible de charger l'inspection: " + e.message);
        }
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (window.confirm("Attention: L'importation va remplacer les données actuelles. Voulez-vous continuer ?")) {
                importDatabase(file, (success, data) => {
                    if (success) {
                        window.location.reload();
                    } else {
                        alert("Erreur d'import : " + data);
                    }
                });
            }
        }
    };

    const [selectedIds, setSelectedIds] = React.useState([]);

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === inspections.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(inspections.map(i => i.id));
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Supprimer ${selectedIds.length} inspections ?`)) {
            await deleteInspection(selectedIds);
            setSelectedIds([]);
        }
    };

    return (
        <div className="space-y-8 pb-20 p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Tableau de Bord - {CITY_CONFIG.name}</h2>
                    <p className="text-slate-500 mt-1">Gestion des inspections ({CITY_CONFIG.province})</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => document.getElementById('import-input').click()}
                        className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Upload size={18} className="mr-2" /> Restaurer
                    </button>
                    <input type="file" id="import-input" className="hidden" accept=".json" onChange={handleImport} />

                    <button
                        onClick={() => exportFullDatabase(inspections)}
                        className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Database size={18} className="mr-2" /> Sauvegarder
                    </button>

                    <button
                        onClick={onNewInspection}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold flex items-center shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5"
                    >
                        <PlusCircle className="mr-2" size={20} />
                        Nouvelle Inspection
                    </button>
                </div>
            </div>

            {/* MAP SECTION (NEW) - SPLIT VIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* MAP (3 Cols) */}
                <div className="lg:col-span-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <LayoutDashboard size={20} className="text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-800">Carte Interactive des Inspections</h2>
                    </div>
                    {/* Ghost Layer State passed here */}
                    <InspectionMap
                        onSelectLocation={onNewInspection}
                        ghostLayer={ghostLayer}
                    />
                </div>

                {/* AUDIT COMPLIANCE PANEL (1 Col) */}
                <div className="lg:col-span-1 h-full min-h-[600px]">
                    <PlanAuditPanel
                        onProjectGhost={(coords) => {
                            // Quick Hack using React State would be better.
                            // I will use a ref or state in parent. 
                            // Actually, I need to wrap this in a stateful logic block in the parent component.
                            setGhostLayer(coords);
                        }}
                        onAuditComplete={(data) => {
                            // Transform Audit Metadata to Inspection Form Data
                            const formData = {
                                matricule: data.lot_number,
                                number: "", // Need to parse address from lot or user input?
                                street: "",
                                // We trust the user to fill address, or we could parse.
                                // But we have valid georef now!
                                latitude: data.lat,
                                longitude: data.lng,
                                source_localisation: "Plan Arpenteur (Audit #" + data.permit_number + ")",
                                validation_professionnelle: [
                                    {
                                        nom: data.surveyor,
                                        type_professionnel: "Arpenteur-Géomètre",
                                        date_validation: data.date,
                                        lien_verification: "https://oagq.qc.ca" // Auto-link
                                    }
                                ]
                            };
                            onNewInspection(formData);
                        }}
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Inspections</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Conformes</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.conforme}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Non-conformes</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.nonConforme}</p>
                    </div>
                </div>
            </div>

            {/* Recent Inspections List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center">
                        <TrendingUp size={20} className="mr-2 text-slate-400" /> Inspections Récentes
                    </h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleBulkDelete}
                            disabled={selectedIds.length === 0}
                            className={`flex items-center px-3 py-1.5 border rounded-lg transition-all shadow-sm font-bold text-xs ${selectedIds.length > 0
                                ? 'bg-red-100 border-red-200 text-red-700 hover:bg-red-200'
                                : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                                }`}
                        >
                            <Trash2 size={16} className="mr-1" /> Supprimer {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                        </button>
                        <button
                            onClick={() => exportToExcel(inspections)}
                            className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-colors"
                        >
                            <FileSpreadsheet size={16} className="mr-1" /> Excel Export
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4 text-left w-10">
                                    <input type="checkbox" onChange={toggleAll} checked={selectedIds.length === inspections.length && inspections.length > 0} />
                                </th>
                                <th className="px-6 py-4 text-left">Date</th>
                                <th className="px-6 py-4 text-left">Adresse</th>
                                <th className="px-6 py-4 text-left">Zone</th>
                                <th className="px-6 py-4 text-left">Propriétaire</th>
                                <th className="px-6 py-4 text-left">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {inspections.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-400 italic">
                                        Aucune inspection pour le moment.
                                    </td>
                                </tr>
                            ) : (
                                inspections.slice().reverse().map((inspection) => (
                                    <tr key={inspection.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(inspection.id) ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(inspection.id)}
                                                onChange={() => toggleSelection(inspection.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">{new Date(inspection.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-bold">{inspection.adresse}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono bg-slate-100 rounded px-2 py-1 w-fit mx-6">{inspection.zone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{inspection.proprietaire}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${inspection.status === 'Conforme'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {inspection.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors mr-2"
                                                onClick={() => generateInspectionPDF(inspection)}
                                                title="Télécharger PDF"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                className="text-amber-600 hover:text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors mr-2"
                                                onClick={() => handleEdit(inspection.id)}
                                                title="Modifier / Reprendre"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                                onClick={() => {
                                                    if (window.confirm('Voulez-vous vraiment supprimer cette inspection ? Cette action est irréversible.')) {
                                                        deleteInspection(inspection.id);
                                                    }
                                                }}
                                                title="Supprimer / Nettoyer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
