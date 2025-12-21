
import React, { useState } from 'react';
import { Upload, FileCheck, MapPin, ShieldCheck, AlertTriangle, Loader, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PlanAuditPanel = ({ onProjectGhost, onAuditComplete }) => {
    const { getToken } = useAuth();
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('IDLE'); // IDLE, UPLOADING, REVIEW, COMMITTING
    const [auditData, setAuditData] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('IDLE');
            setError('');
            setAuditData(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setStatus('UPLOADING');
        setError('');

        const formData = new FormData();
        formData.append('plan', file);

        try {
            const token = getToken();
            const res = await fetch('http://localhost:3001/api/audit/session/start', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erreur d'analyse");
            }

            const result = await res.json();
            setAuditData(result.data);
            setStatus('REVIEW');

            // Automatically project to map if coords found
            if (result.data.ghost_centroid && onProjectGhost) {
                onProjectGhost(result.data.ghost_centroid);
            }

        } catch (e) {
            console.error(e);
            setError(e.message);
            setStatus('IDLE');
        }
    };

    const handleCertify = async () => {
        if (!auditData) return;
        setStatus('COMMITTING');

        try {
            const token = getToken();
            const payload = {
                inspector_id: 1, // Placeholder - should come from AuthContext user
                action: 'PERMIT_ISSUED',
                location: auditData.ghost_centroid,
                metadata: {
                    ...auditData.metadata,
                    filename: auditData.filename,
                    certified: true
                }
            };

            const res = await fetch('http://localhost:3001/api/audit/commit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Erreur de certification");

            const result = await res.json();

            // Notify Parent (Dashboard) to open Form with data
            if (onAuditComplete) {
                onAuditComplete({
                    ...auditData.metadata,
                    audit_id: result.audit_id,
                    permit_number: result.permit_number,
                    lat: auditData.ghost_centroid.lat,
                    lng: auditData.ghost_centroid.lng
                });
            }
            setStatus('SUCCESS');

        } catch (e) {
            setError(e.message);
            setStatus('REVIEW');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    <h3 className="font-bold tracking-wide">Auditeur de Conformité</h3>
                </div>
                <span className="text-xs bg-slate-700 px-2 py-1 rounded border border-slate-600">v1.0</span>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
                {/* STEP 1: UPLOAD */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">1. Charger le Plan d'Implantation</label>
                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500 py-2
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100 cursor-pointer"
                            />
                        </div>

                        {/* Explicit File Feedback */}
                        {file && (
                            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-3 rounded-lg">
                                <span className="text-sm font-medium text-blue-900 truncate flex-1" title={file.name}>
                                    📄 {file.name}
                                </span>
                                <span className="text-xs text-blue-500 ml-2 whitespace-nowrap">
                                    {(file.size / 1024).toFixed(1)} KB
                                </span>
                            </div>
                        )}

                        <button
                            onClick={(e) => {
                                console.log("Analyze Clicked");
                                handleAnalyze();
                            }}
                            disabled={!file || status === 'UPLOADING'}
                            className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${!file || status === 'UPLOADING'
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                                }`}
                        >
                            {status === 'UPLOADING' ? (
                                <>
                                    <Loader className="animate-spin mr-2" size={18} />
                                    Analyse en cours...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} className="mr-2" />
                                    Lancer l'Analyse
                                </>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start text-red-700 text-sm">
                            <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* STEP 2: REVIEW */}
                {status === 'REVIEW' && auditData && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center">
                                <FileCheck size={16} className="mr-2 text-blue-600" /> Données Extraites
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Numéro de Lot</p>
                                    <p className="font-mono font-bold text-slate-900 bg-white border px-2 py-1 rounded inline-block">
                                        {auditData.metadata.lot_number || "Non détecté"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Arpenteur</p>
                                    <p className="font-medium text-slate-900">{auditData.metadata.surveyor}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Échelle</p>
                                    <p className={`font-medium ${auditData.metadata.scale.includes("?") ? "text-amber-600" : "text-slate-900"}`}>
                                        {auditData.metadata.scale}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Date</p>
                                    <p className="font-medium text-slate-900">{auditData.metadata.date}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center">
                                <MapPin size={16} className="mr-2" /> Validation Géospatiale
                            </h4>
                            <p className="text-xs text-blue-800 mb-2">
                                Le système a projeté l'empreinte "Fantôme" sur la carte. Veuillez vérifier l'alignement avec le cadastre officiel (WMS).
                            </p>
                            <div className="flex items-center gap-2 text-xs font-mono text-blue-700 bg-blue-100/50 p-2 rounded">
                                <span>CRS: {auditData.metadata.crs}</span>
                                <span>→</span>
                                <span>WGS84: {auditData.ghost_centroid?.lat.toFixed(5)}, {auditData.ghost_centroid?.lng.toFixed(5)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCertify}
                            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center transform hover:scale-[1.02]"
                        >
                            <Check size={20} className="mr-2" />
                            Certifier & Créer Inspection
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-slate-50 p-3 text-center border-t border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Système de Conformité Municipal • Val-d'Or</p>
            </div>
        </div>
    );
};

export default PlanAuditPanel;
