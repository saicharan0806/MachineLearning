import React from 'react';
import { Settings, RefreshCw } from 'lucide-react';

export const Navbar = ({
  pageTitle,
  backendStatus,
  isColab,
  modelLoaded,
  onOpenConfig,
  onRefreshHealth
}) => {
  const statusLabel =
    backendStatus === 'connected'
      ? isColab ? 'Colab Connected' : 'Backend Active'
      : backendStatus === 'checking'
        ? 'Connecting…'
        : 'Backend Offline';

  return (
    <header className="navbar">
      <h1 className="navbar-title">{pageTitle}</h1>

      <div className="navbar-actions">
        {/* Status pill */}
        <div
          className={`connection-badge ${backendStatus}`}
          title={
            backendStatus === 'connected'
              ? `Connected (${isColab ? 'Colab tunnel' : 'localhost:5000'})${!modelLoaded ? ' — Model not loaded yet' : ''}`
              : backendStatus === 'checking'
                ? 'Checking backend health…'
                : 'Backend unreachable. Click API Settings to configure.'
          }
        >
          <span className="dot" />
          <span>{statusLabel}</span>
          {backendStatus === 'connected' && !modelLoaded && (
            <span style={{ opacity: 0.7, fontWeight: 400 }}> · No Model</span>
          )}
        </div>

        {/* Refresh */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefreshHealth}
          title="Refresh health check"
          style={{ padding: '5px 8px' }}
        >
          <RefreshCw size={13} className={backendStatus === 'checking' ? 'spin' : ''} />
        </button>

        {/* Settings */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenConfig}
          id="btn-api-settings"
        >
          <Settings size={13} />
          <span>API Settings</span>
        </button>
      </div>
    </header>
  );
};
