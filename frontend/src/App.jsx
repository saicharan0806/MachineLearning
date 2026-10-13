import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ApiConfigModal } from './components/ApiConfigModal';
import { Dashboard } from './pages/Dashboard';
import { Prediction } from './pages/Prediction';
import { CustomerRecords } from './pages/CustomerRecords';
import { Analytics } from './pages/Analytics';
import { PredictionHistory } from './pages/PredictionHistory';
import { AboutProject } from './pages/AboutProject';
import { api, getApiBaseUrl } from './services/api';
import { AlertTriangle } from 'lucide-react';

const VALID_TABS = ['dashboard', 'predict', 'records', 'analytics', 'history', 'about'];

const parseTabFromHash = () => {
  if (typeof window === 'undefined') return 'dashboard';
  const raw = (window.location.hash || '')
    .replace(/^#\/?/, '')
    .split('?')[0]
    .toLowerCase()
    .trim();
  return VALID_TABS.includes(raw) ? raw : 'dashboard';
};

export function App() {
  const [activeTab, setActiveTab] = useState(() => parseTabFromHash());
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const [isColab, setIsColab] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customerToPredict, setCustomerToPredict] = useState(null);

  // Synchronize URL hash with tab selection
  const navigateToTab = useCallback((tabId) => {
    const target = VALID_TABS.includes(tabId) ? tabId : 'dashboard';
    if (parseTabFromHash() !== target) {
      window.location.hash = `#/${target}`;
    }
    setActiveTab(target);
  }, []);

  // Listen to browser Back / Forward arrow clicks (hashchange / popstate)
  useEffect(() => {
    const handleUrlChange = () => {
      const current = parseTabFromHash();
      setActiveTab(current);
    };

    // If initial load has no hash or just #, initialize with current active tab
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      window.history.replaceState({ tab: activeTab }, '', `#/${activeTab}`);
    }

    // Set up a safety history entry on mount so clicking the browser backward arrow on the first
    // screen never abruptly closes the website
    window.history.pushState({ tab: activeTab }, '', window.location.href);

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const checkBackendHealth = async () => {
    setBackendStatus('checking');
    try {
      const data = await api.checkHealth();
      setBackendStatus('connected');
      setIsColab(
        data.environment?.includes('Colab') || 
        getApiBaseUrl().includes('ngrok') || 
        getApiBaseUrl().includes('loca.lt')
      );
      setModelLoaded(Boolean(data.model_loaded));
    } catch (err) {
      setBackendStatus('disconnected');
      setModelLoaded(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const handleSelectCustomerForPrediction = (customer) => {
    setCustomerToPredict(customer);
    navigateToTab('predict');
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Executive Churn Dashboard';
      case 'predict': return 'Customer Churn Prediction';
      case 'records': return 'Customer Records & Dataset Explorer';
      case 'analytics': return 'Exploratory & Model Analytics';
      case 'history': return 'Prediction History (SQLite)';
      case 'about': return 'Project Documentation & Model Evaluation';
      default: return 'Customer Churn Prediction';
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={navigateToTab} />

      {/* Main Content Area */}
      <main className="main-content">
        <Navbar 
          pageTitle={getPageTitle()}
          backendStatus={backendStatus}
          isColab={isColab}
          modelLoaded={modelLoaded}
          onOpenConfig={() => setIsConfigOpen(true)}
          onRefreshHealth={checkBackendHealth}
        />

        {/* Backend offline warning banner */}
        {backendStatus === 'disconnected' && (
          <div className="warning-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} />
              <span>
                <strong>Flask Backend Offline:</strong> Predictions require a running backend.
                Target: <code style={{ fontSize: '0.8125rem' }}>{getApiBaseUrl()}</code>
              </span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
              onClick={() => setIsConfigOpen(true)}
            >
              Configure API
            </button>
          </div>
        )}

        {/* Dynamic Page Rendering */}
        {activeTab === 'dashboard' && (
          <Dashboard onNavigateToPredict={() => navigateToTab('predict')} />
        )}
        {activeTab === 'predict' && (
          <Prediction 
            initialCustomer={customerToPredict} 
            onPredictionSuccess={() => checkBackendHealth()}
          />
        )}
        {activeTab === 'records' && (
          <CustomerRecords 
            onSelectCustomerForPrediction={handleSelectCustomerForPrediction} 
          />
        )}
        {activeTab === 'analytics' && (
          <Analytics />
        )}
        {activeTab === 'history' && (
          <PredictionHistory 
            onSelectCustomerForPrediction={handleSelectCustomerForPrediction} 
          />
        )}
        {activeTab === 'about' && (
          <AboutProject />
        )}
      </main>

      {/* Backend API Configuration Modal */}
      <ApiConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)}
        onConfigSaved={() => checkBackendHealth()}
      />
    </div>
  );
}
export default App;
