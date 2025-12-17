
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InspectionGrid from './pages/InspectionGrid';
import { InspectionProvider } from './context/InspectionContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <InspectionProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'dashboard' && (
          <Dashboard onNewInspection={() => setActiveTab('new-inspection')} />
        )}
        {activeTab === 'new-inspection' && (
          <InspectionGrid onSave={() => setActiveTab('dashboard')} />
        )}
      </Layout>
    </InspectionProvider>
  );
}

export default App;
