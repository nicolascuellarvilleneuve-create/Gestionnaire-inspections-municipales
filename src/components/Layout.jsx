import React from 'react';
import { LayoutDashboard, FileText, Menu, User, Lock } from 'lucide-react';

const Layout = ({ children, activeTab, setActiveTab, user, onLogout }) => {
    return (
        <div className="min-h-screen bg-gray-50 font-sans antialiased flex text-slate-900">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shadow-xl z-20 sticky top-0 h-screen">
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                            <FileText className="text-white" size={24} />
                        </div>
                        <div>
                            <span className="text-lg font-bold tracking-tight block leading-none">Urbk</span>
                            <span className="text-xs text-slate-400 font-medium">Urbanisme</span>
                        </div>
                    </div>

                    <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Navigation</p>

                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'dashboard'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 translate-x-1'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                                }`}
                        >
                            <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
                            <span className="font-medium">Tableau de bord</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('new-inspection')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'new-inspection'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 translate-x-1'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                                }`}
                        >
                            <FileText size={20} className={activeTab === 'new-inspection' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
                            <span className="font-medium">Nouvelle Inspection</span>
                        </button>

                        {user?.role === 'admin' && (
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'admin'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 translate-x-1'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                                    }`}
                            >
                                <Lock size={20} className={activeTab === 'admin' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
                                <span className="font-medium">Administration</span>
                            </button>
                        )}
                    </nav>
                </div>

                <div className="mt-auto p-6">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 p-0.5">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                <User size={20} className="text-emerald-400" />
                            </div>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{user?.username || 'Utilisateur'}</p>
                            <p className="text-xs text-emerald-400 flex items-center uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                                {user?.role || 'Connecté'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full text-xs text-slate-400 hover:text-white text-center py-2 hover:bg-slate-800 rounded-lg transition"
                    >
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50/50">
                {/* Mobile Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 p-4 md:hidden flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <FileText className="text-white" size={18} />
                        </div>
                        <span className="font-bold text-slate-800 text-lg">GIM</span>
                    </div>
                    <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
