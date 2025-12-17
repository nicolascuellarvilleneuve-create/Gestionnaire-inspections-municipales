
import React from 'react';
import { useInspections } from '../context/InspectionContext';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';

const Dashboard = ({ onNewInspection }) => {
    const { inspections } = useInspections();

    const getStatusColor = (status) => {
        switch (status) {
            case 'Conforme': return 'bg-green-100 text-green-800';
            case 'Non-conforme': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Conforme': return <CheckCircle size={16} className="text-green-600" />;
            case 'Non-conforme': return <XCircle size={16} className="text-red-600" />;
            default: return <Clock size={16} className="text-yellow-600" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Tableau de bord</h2>
                <button
                    onClick={onNewInspection}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span>Nouvelle Inspection</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm">Total Inspections</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{inspections.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm">Conformes</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        {inspections.filter(i => i.status === 'Conforme').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm">Non-conformes</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">
                        {inspections.filter(i => i.status === 'Non-conforme').length}
                    </p>
                </div>
            </div>

            {/* Recent Inspections Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-700">Inspections Récentes</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Adresse</th>
                                <th className="px-6 py-3 font-medium">Zone</th>
                                <th className="px-6 py-3 font-medium">Propriétaire</th>
                                <th className="px-6 py-3 font-medium">Statut</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {inspections.map((inspection) => (
                                <tr key={inspection.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600">{inspection.date}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{inspection.adresse}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">
                                            {inspection.zone}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{inspection.proprietaire}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(inspection.status)} bg-opacity-10 border-opacity-10`}>
                                            {getStatusIcon(inspection.status)}
                                            <span>{inspection.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                                            Voir détails
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {inspections.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                        Aucune inspection enregistrée.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
