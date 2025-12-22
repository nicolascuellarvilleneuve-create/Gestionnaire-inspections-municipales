import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, Activity } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showLegal, setShowLegal] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(username, password);

        if (!result.success) {
            setError(result.error);
            setIsLoading(false);
        }
        // If success, AuthContext acts, and App.jsx redirects automatically
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">

            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[100px] rounded-full"></div>
            </div>

            <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-2xl relative z-10">

                {/* Header / Logo */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-6 transition-transform">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
                        Urbk
                    </h1>
                    <p className="text-slate-400 font-medium text-sm">
                        Système de Gestion Municipale Sécurisé
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm flex items-center animate-shake">
                        <Activity size={16} className="mr-2 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Utilisateur</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="Identifiant"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Mot de passe</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                <Lock size={20} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                                Connexion...
                            </span>
                        ) : (
                            "Accéder au Tableau de Bord"
                        )}
                    </button>

                </form>

                <div className="mt-8 text-center space-y-2">
                    <button
                        onClick={() => setShowLegal(true)}
                        className="text-xs text-slate-500 hover:text-blue-400 underline transition-colors"
                    >
                        Conditions d'utilisation / Avis de non responsabilité
                    </button>
                    <div className="text-xs text-slate-600">
                        &copy; 2025 Urbk Inc. Tous droits réservés.
                    </div>
                </div>
            </div>

            {/* Legal Modal */}
            {showLegal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white text-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative animate-in fade-in zoom-in duration-300">
                        <h2 className="text-xl font-bold mb-4 text-slate-900">Avis de non responsabilité et Conditions d'utilisation</h2>

                        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                            <div>
                                <h3 className="font-bold text-slate-800 mb-1">1. Nature de l'outil</h3>
                                <p>L'application <strong>Urbk</strong> est un outil technologique conçu pour faciliter la gestion des données urbaines et le traitement des règlements de zonage (tels que le RPT, le COS et le CES). Il s'agit d'un système de soutien à la décision destiné à optimiser l'efficience réglementaire et ne constitue en aucun cas un avis professionnel.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-800 mb-1">2. Absence de prestation de services professionnels</h3>
                                <p>L'utilisation de cet outil, y compris ses fonctions de checklist d'inspection basées sur les règlements municipaux, ne remplace pas le jugement, l'analyse ou la signature d'un urbaniste certifié membre de l'O.U.Q. L'initiateur du projet ne détient pas le titre d'urbaniste au sens du Code des professions du Québec et n'émet aucune recommandation officielle au nom de la profession.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-800 mb-1">3. Exactitude des données et vérification</h3>
                                <p>Bien que l'outil soit conçu pour refléter les exigences de la Loi sur l'aménagement et l'urbanisme (LAU), l'utilisateur a la responsabilité finale de valider l'exactitude des calculs et des informations générées par l'application auprès des instances municipales officielles.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-800 mb-1">4. Limitation de responsabilité</h3>
                                <p>Le développeur ne pourra être tenu responsable de toute erreur matérielle, omission ou conséquence financière découlant d'une interprétation erronée des règlements par l'outil ou d'une mauvaise utilisation des données par l'utilisateur final.</p>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setShowLegal(false)}
                                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                            >
                                J'ai compris
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
