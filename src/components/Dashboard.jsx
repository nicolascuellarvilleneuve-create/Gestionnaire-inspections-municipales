
import React, { useRef } from 'react';
import { useInspections } from '../context/InspectionContext';
import { PlusCircle, FileText, CheckCircle, AlertCircle, TrendingUp, Download, Upload, Database, FileSpreadsheet } from 'lucide-react';
import { exportFullDatabase, exportToExcel, importDatabase } from '../utils/dataManager';
import { generateInspectionPDF } from '../utils/pdfGenerator';

const Dashboard = ({ onNewInspection }) => {
    const { inspections, setInspections } = useInspections(); // We need access to SET for import
    const fileInputRef = useRef(null);

    const stats = {
        total: inspections.length,
        conforme: inspections.filter(i => i.status === 'Conforme').length,
        nonConforme: inspections.filter(i => i.status === 'Non-conforme').length,
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (window.confirm("Attention: L'importation va remplacer les données actuelles. Voulez-vous continuer ?")) {
                importDatabase(file, (success, data) => {
                    if (success) {
                        // Force context update ? Ideally context exposes a setter or reload
                        // Since we modified localStorage in the util, we need to trigger a reload or update state
                        window.location.reload(); // Simple brute force to reload context from LS
                    } else {
                        alert("Erreur d'import : " + data);
                    }
                });
            }
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Tableau de bord</h2>
                    <p className="text-slate-500 mt-1">Aperçu global des activités d'inspection</p>
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
                        <Database size={18} className="mr-2" /> Sauvegarder (Backup)
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
                    <button
                        onClick={() => exportToExcel(inspections)}
                        className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-colors"
                    >
                        <FileSpreadsheet size={16} className="mr-1" /> Excel Export
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
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
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400 italic">
                                        Aucune inspection pour le moment.
                                    </td>
                                </tr>
                            ) : (
                                inspections.slice().reverse().map((inspection) => (
                                    <tr key={inspection.id} className="hover:bg-slate-50/80 transition-colors">
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
                                            >
                                                PDF
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
