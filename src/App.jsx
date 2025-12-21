import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InspectionGrid from './pages/InspectionGrid';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import { InspectionProvider } from './context/InspectionContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Inner App Component to handle Routing based on Auth State
const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initialData, setInitialData] = useState(null);

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Chargement...</div>;
  }

  // Unauthenticated -> Show Login
  if (!user) {
    return <Login />;
  }

  const handleNewInspection = (data = null) => {
    setInitialData(data);
    setActiveTab('new-inspection');
  };

  // Authenticated -> Show App
  return (
    <InspectionProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={logout}>
        {activeTab === 'dashboard' && (
          <Dashboard onNewInspection={handleNewInspection} />
        )}
        {activeTab === 'new-inspection' && (
          <InspectionGrid
            initialData={initialData}
            onSave={() => setActiveTab('dashboard')}
          />
        )}
        {activeTab === 'admin' && (
          <AdminPanel />
        )}
      </Layout>
    </InspectionProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
