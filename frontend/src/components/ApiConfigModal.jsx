import React, { useState } from 'react';
import { X, Check, Laptop, AlertTriangle, Wifi } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, api } from '../services/api';

export const ApiConfigModal = ({ isOpen, onClose, onConfigSaved }) => {
  if (!isOpen) return null;

  const [url, setUrl] = useState(getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await api.checkHealth(url);
      setTestResult({
        success: true,
        message: `Connected! Environment: ${data.environment || 'Flask'}. Model loaded: ${data.model_loaded ? 'Yes' : 'No — place .pkl files in ml_model/'}`
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: `Failed: ${err.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const saved = setApiBaseUrl(url);
    if (onConfigSaved) onConfigSaved(saved);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Backend API Configuration</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Connect to your Flask backend or Google Colab tunnel.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">API Base URL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="form-input"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setTestResult(null); }}
                placeholder="http://127.0.0.1:5000 or https://xxxx.ngrok-free.app"
                id="input-api-url"
              />
              <button
                className="btn btn-secondary"
                onClick={handleTest}
                disabled={testing || !url.trim()}
                id="btn-test-connection"
                style={{ flexShrink: 0 }}
              >
                {testing ? 'Testing…' : 'Test'}
              </button>
            </div>
            <p className="form-hint">No trailing slash. Example: <code>http://127.0.0.1:5000</code></p>
          </div>

          {/* Preset */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: 16 }}
            onClick={() => { setUrl('http://127.0.0.1:5000'); setTestResult(null); }}
          >
            <Laptop size={13} />
            <span>Use Localhost :5000</span>
          </button>

          {/* Test result */}
          {testResult && (
            <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
              <span className="alert-icon">
                {testResult.success ? <Check size={14} /> : <AlertTriangle size={14} />}
              </span>
              <span style={{ fontSize: '0.8125rem' }}>{testResult.message}</span>
            </div>
          )}

          {/* Colab instructions */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontSize: '0.8125rem'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wifi size={13} style={{ color: 'var(--primary)' }} />
              Running from Google Colab?
            </div>
            <ol style={{ paddingLeft: 16, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
              <li>Paste <code>colab_backend_runner.py</code> in a new Colab cell and run it.</li>
              <li>Copy the public HTTPS ngrok URL it prints.</li>
              <li>Paste it above and click <strong>Test</strong>, then <strong>Save & Apply</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} id="btn-save-api">
            Save &amp; Apply
          </button>
        </div>
      </div>
    </div>
  );
};
