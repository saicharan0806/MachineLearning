import React, { useState, useEffect } from 'react';
import { History, Trash2, RefreshCw, Eye, Database, Download } from 'lucide-react';
import { CustomerModal } from '../components/CustomerModal';
import { api } from '../services/api';

export const PredictionHistory = ({ onSelectCustomerForPrediction }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOutcome, setFilterOutcome] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [clearing, setClearing] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory(150);
      setHistory(res.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleClear = async () => {
    if (!window.confirm('Clear all prediction history records from SQLite?')) return;
    setClearing(true);
    try {
      await api.clearHistory();
      setHistory([]);
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleExport = () => {
    if (!history.length) return;
    const headers = ['ID', 'Customer ID', 'Timestamp', 'Contract', 'Internet', 'Monthly', 'Churn Prob (%)', 'Risk Level', 'Prediction'];
    const rows = history.map(r => [
      r.id, r.customer_id, r.timestamp, r.contract, r.internet_service,
      r.monthly_charges, ((r.churn_probability || 0) * 100).toFixed(1),
      r.risk_level, r.outcome_label
    ].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'prediction_history.csv' });
    a.click();
  };

  const filtered = history.filter(r => {
    if (filterOutcome === 'All') return true;
    if (filterOutcome === 'Churn') return r.prediction === 1 || r.outcome_label === 'Churn';
    return r.prediction === 0 || r.outcome_label === 'Stay';
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="page-title">Prediction History</h2>
          <p className="page-description">
            SQLite audit trail of all inferences generated via the web application or REST API.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchHistory} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExport} disabled={!history.length}>
            <Download size={12} />
            Export CSV
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleClear} disabled={clearing || !history.length}>
            <Trash2 size={12} />
            Clear All
          </button>
        </div>
      </div>

      {/* Filter + counts */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Filter:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '5px 8px', fontSize: '0.75rem' }}
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
            >
              <option value="All">All ({history.length})</option>
              <option value="Churn">Predicted Churn</option>
              <option value="Stay">Predicted Retained</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--churn)', fontWeight: 600 }}>
              Churn: {history.filter(r => r.prediction === 1).length}
            </span>
            <span style={{ color: 'var(--retention)', fontWeight: 600 }}>
              Retained: {history.filter(r => r.prediction === 0).length}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>Showing {filtered.length}</span>
          </div>
        </div>
      </div>

      {/* Table or empty state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading history…</div>
      ) : filtered.length > 0 ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer ID</th>
                <th>Timestamp</th>
                <th>Contract</th>
                <th>Internet</th>
                <th>Monthly</th>
                <th>Churn Prob</th>
                <th>Stay Prob</th>
                <th>Risk</th>
                <th>Prediction</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>#{item.id}</td>
                  <td style={{ fontWeight: 600 }}>{item.customer_id}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{item.timestamp}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{item.contract}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{item.internet_service}</td>
                  <td>${Number(item.monthly_charges || 0).toFixed(2)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--churn)' }}>
                    {((item.churn_probability || 0) * 100).toFixed(1)}%
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--retention)' }}>
                    {((item.stay_probability || 0) * 100).toFixed(1)}%
                  </td>
                  <td>
                    <span className={`badge ${
                      item.risk_level === 'High' ? 'badge-churn'
                        : item.risk_level === 'Moderate' ? 'badge-moderate'
                          : 'badge-stay'
                    }`}>{item.risk_level}</span>
                  </td>
                  <td>
                    <span className={`badge ${item.prediction === 1 ? 'badge-churn' : 'badge-stay'}`}>
                      {item.outcome_label || (item.prediction === 1 ? 'Churn' : 'Stay')}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px' }}
                      onClick={() => setSelectedRecord({
                        ...(item.input_data || {}),
                        CustomerID: item.customer_id,
                        Contract: item.contract,
                        'Tenure Months': item.tenure_months,
                        'Monthly Charges': item.monthly_charges,
                        'Total Charges': item.total_charges,
                        'Internet Service': item.internet_service,
                        outcome_label: item.outcome_label,
                        churn_probability: item.churn_probability
                      })}
                    >
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Database size={32} className="empty-state-icon" />
            <div className="empty-state-title">No predictions found</div>
            <p className="empty-state-desc">
              {filterOutcome !== 'All'
                ? 'No records match the current filter. Try changing the filter above.'
                : 'Predictions made via the Customer Prediction form will appear here.'}
            </p>
          </div>
        </div>
      )}

      {selectedRecord && (
        <CustomerModal
          customer={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onPredictThisCustomer={onSelectCustomerForPrediction}
        />
      )}
    </div>
  );
};
