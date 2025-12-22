import React, { useState, Suspense, lazy } from 'react';
import Layout from './components/Layout';
// import Dashboard from './pages/Dashboard';
// import InspectionGrid from './pages/InspectionGrid';
// import Login from './pages/Login';
// import AdminPanel from './pages/AdminPanel';
import { InspectionProvider } from './context/InspectionContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load pages for performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InspectionGrid = lazy(() => import('./pages/InspectionGrid'));
const Login = lazy(() => import('./pages/Login'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
  </div>
);


// Inner App Component to handle Routing based on Auth State
const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initialData, setInitialData] = useState(null);

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Chargement...</div>;
  }

  // === KILLSWITCH HEARTBEAT ===
  React.useEffect(() => {
    // Ping backend every 2 seconds to keep it alive
    const interval = setInterval(() => {
      fetch('http://localhost:3001/api/heartbeat', { method: 'POST' })
        .catch(() => { /* Ignore errors, e.g. if running in prod without local server */ });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Unauthenticated -> Show Login
  if (!user) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Chargement...</div>}>
        <Login />
      </Suspense>
    );
  }

  const handleNewInspection = (data = null) => {
    setInitialData(data);
    setActiveTab('new-inspection');
  };

  // Authenticated -> Show App
  return (
    <InspectionProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={logout}>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
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
