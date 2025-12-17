import React from 'react';
import { LayoutDashboard, FileText, Menu } from 'lucide-react';

const Layout = ({ children, activeTab, setActiveTab }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:block">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-tight">GIM Urbanisme</h1>
                    <p className="text-xs text-slate-400 mt-1">Gestion des Inspections</p>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Tableau de bord</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('new-inspection')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'new-inspection' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <FileText size={20} />
                        <span className="font-medium">Nouvelle Inspection</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Mobile Header */}
                <header className="bg-white border-b border-slate-200 p-4 md:hidden flex items-center justify-between shadow-sm">
                    <h1 className="font-bold text-slate-800">GIM Urbanisme</h1>
                    <button className="p-2 text-slate-600">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
