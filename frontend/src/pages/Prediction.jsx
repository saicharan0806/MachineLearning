import React, { useState } from 'react';
import {
  UserCheck, UserX, AlertCircle, CheckCircle,
  Zap, RotateCcw, Send, TrendingUp, TrendingDown, Info
} from 'lucide-react';
import { api } from '../services/api';

const defaultValues = {
  CustomerID: 'CUST-DEMO',
  Gender: 'Male',
  'Senior Citizen': 'No',
  Partner: 'No',
  Dependents: 'No',
  'Tenure Months': 29,
  'Phone Service': 'Yes',
  'Multiple Lines': 'No',
  'Internet Service': 'Fiber optic',
  'Online Security': 'No',
  'Online Backup': 'No',
  'Device Protection': 'No',
  'Tech Support': 'No',
  'Streaming TV': 'No',
  'Streaming Movies': 'No',
  Contract: 'Month-to-month',
  'Paperless Billing': 'Yes',
  'Payment Method': 'Electronic check',
  'Monthly Charges': 70.35,
  'Total Charges': 1397.48,
  CLTV: 4528
};

const highRiskPreset = {
  CustomerID: 'CUST-HIGH-RISK',
  Gender: 'Female', 'Senior Citizen': 'Yes', Partner: 'No', Dependents: 'No',
  'Tenure Months': 3, 'Phone Service': 'Yes', 'Multiple Lines': 'Yes',
  'Internet Service': 'Fiber optic', 'Online Security': 'No', 'Online Backup': 'No',
  'Device Protection': 'No', 'Tech Support': 'No', 'Streaming TV': 'Yes', 'Streaming Movies': 'Yes',
  Contract: 'Month-to-month', 'Paperless Billing': 'Yes', 'Payment Method': 'Electronic check',
  'Monthly Charges': 98.50, 'Total Charges': 295.50, CLTV: 2450
};

const lowRiskPreset = {
  CustomerID: 'CUST-LOYAL',
  Gender: 'Male', 'Senior Citizen': 'No', Partner: 'Yes', Dependents: 'Yes',
  'Tenure Months': 60, 'Phone Service': 'Yes', 'Multiple Lines': 'Yes',
  'Internet Service': 'DSL', 'Online Security': 'Yes', 'Online Backup': 'Yes',
  'Device Protection': 'Yes', 'Tech Support': 'Yes', 'Streaming TV': 'Yes', 'Streaming Movies': 'Yes',
  Contract: 'Two year', 'Paperless Billing': 'No', 'Payment Method': 'Bank transfer (automatic)',
  'Monthly Charges': 82.00, 'Total Charges': 4920.00, CLTV: 5800
};

const SelectField = ({ label, field, value, onChange, options, hint }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <select className="form-select" value={value} onChange={(e) => onChange(field, e.target.value)}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
    {hint && <p className="form-hint">{hint}</p>}
  </div>
);

const NumberField = ({ label, field, value, onChange, step, min, max, error, hint }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input
      type="number"
      className={`form-input ${error ? 'error' : ''}`}
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      step={step}
      min={min}
      max={max}
    />
    {error && <p className="form-error"><AlertCircle size={11} />{error}</p>}
    {hint && !error && <p className="form-hint">{hint}</p>}
  </div>
);

export const Prediction = ({ initialCustomer, onPredictionSuccess }) => {
  const [formData, setFormData] = useState(initialCustomer || defaultValues);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) setValidationErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errors = {};
    if (formData['Tenure Months'] === '' || isNaN(formData['Tenure Months']) || Number(formData['Tenure Months']) < 0)
      errors['Tenure Months'] = 'Must be 0 or greater (e.g. 1–72 months).';
    if (formData['Monthly Charges'] === '' || isNaN(formData['Monthly Charges']) || Number(formData['Monthly Charges']) <= 0)
      errors['Monthly Charges'] = 'Must be a positive dollar amount.';
    if (formData['Total Charges'] === '' || isNaN(formData['Total Charges']) || Number(formData['Total Charges']) < 0)
      errors['Total Charges'] = 'Must be 0 or greater.';
    if (formData['CLTV'] === '' || isNaN(formData['CLTV']) || Number(formData['CLTV']) < 0)
      errors['CLTV'] = 'Customer lifetime value must be a positive number.';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {
        ...formData,
        'Tenure Months': Number(formData['Tenure Months']),
        'Monthly Charges': Number(formData['Monthly Charges']),
        'Total Charges': Number(formData['Total Charges']),
        CLTV: Number(formData.CLTV),
      };
      const res = await api.predict(payload);
      setResult(res);
      if (onPredictionSuccess) onPredictionSuccess(res);
    } catch (err) {
      setError(err.message || 'Failed to generate churn prediction.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (type) => {
    setError(null); setResult(null);
    if (type === 'high_risk') setFormData(highRiskPreset);
    else if (type === 'low_risk') setFormData(lowRiskPreset);
    else setFormData(defaultValues);
  };

  const yesNo = ['No', 'Yes'];
  const yesNoNone = ['No', 'Yes', 'No internet service'];
  const yesNoNoPhone = ['No', 'Yes', 'No phone service'];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h2 className="page-title">Customer Churn Prediction</h2>
        <p className="page-description">
          Enter customer attributes to evaluate churn risk using the trained Elastic Net Logistic Regression pipeline (20 features → 47 encoded inputs).
        </p>
      </div>

      {/* Quick Profiles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick Profiles:
        </span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => loadPreset('high_risk')}>
          <TrendingDown size={12} style={{ color: 'var(--churn)' }} />
          High Churn Risk
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => loadPreset('low_risk')}>
          <TrendingUp size={12} style={{ color: 'var(--retention)' }} />
          Low Churn Risk
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => loadPreset('median')}>
          <RotateCcw size={12} />
          Dataset Median
        </button>
      </div>

      {/* Main layout: form + result side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 24, alignItems: 'start' }}>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card" id="form-churn-predict" style={{ padding: '24px' }}>

          {/* Section 1: Demographics */}
          <div className="form-section">
            <div className="form-section-title">
              1 · Customer Demographics
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Customer ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.CustomerID}
                  onChange={(e) => handleInputChange('CustomerID', e.target.value)}
                  placeholder="e.g. CUST-10492"
                />
              </div>
              <SelectField label="Gender" field="Gender" value={formData.Gender} onChange={handleInputChange}
                options={['Male', 'Female']} />
              <SelectField label="Senior Citizen (65+)" field="Senior Citizen" value={formData['Senior Citizen']} onChange={handleInputChange}
                options={yesNo} />
              <SelectField label="Has Partner" field="Partner" value={formData.Partner} onChange={handleInputChange}
                options={yesNo} />
              <SelectField label="Has Dependents" field="Dependents" value={formData.Dependents} onChange={handleInputChange}
                options={yesNo} />
              <NumberField label="Account Tenure (Months)" field="Tenure Months" value={formData['Tenure Months']}
                onChange={handleInputChange} min={0} max={100}
                error={validationErrors['Tenure Months']} hint="Range: 0 – 72 months" />
            </div>
          </div>

          {/* Section 2: Services */}
          <div className="form-section">
            <div className="form-section-title">
              2 · Subscribed Services
            </div>
            <div className="form-grid">
              <SelectField label="Phone Service" field="Phone Service" value={formData['Phone Service']} onChange={handleInputChange}
                options={yesNo} />
              <SelectField label="Multiple Lines" field="Multiple Lines" value={formData['Multiple Lines']} onChange={handleInputChange}
                options={yesNoNoPhone} />
              <SelectField label="Internet Service" field="Internet Service" value={formData['Internet Service']} onChange={handleInputChange}
                options={['DSL', 'Fiber optic', 'No']} />
              <SelectField label="Online Security" field="Online Security" value={formData['Online Security']} onChange={handleInputChange}
                options={yesNoNone} />
              <SelectField label="Online Backup" field="Online Backup" value={formData['Online Backup']} onChange={handleInputChange}
                options={yesNoNone} />
              <SelectField label="Device Protection" field="Device Protection" value={formData['Device Protection']} onChange={handleInputChange}
                options={yesNoNone} />
              <SelectField label="Tech Support" field="Tech Support" value={formData['Tech Support']} onChange={handleInputChange}
                options={yesNoNone} />
              <SelectField label="Streaming TV" field="Streaming TV" value={formData['Streaming TV']} onChange={handleInputChange}
                options={yesNoNone} />
              <SelectField label="Streaming Movies" field="Streaming Movies" value={formData['Streaming Movies']} onChange={handleInputChange}
                options={yesNoNone} />
            </div>
          </div>

          {/* Section 3: Contract & Billing */}
          <div className="form-section">
            <div className="form-section-title">
              3 · Contract &amp; Billing
            </div>
            <div className="form-grid">
              <SelectField label="Contract Type" field="Contract" value={formData.Contract} onChange={handleInputChange}
                options={['Month-to-month', 'One year', 'Two year']} />
              <SelectField label="Paperless Billing" field="Paperless Billing" value={formData['Paperless Billing']} onChange={handleInputChange}
                options={yesNo} />
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={formData['Payment Method']}
                  onChange={(e) => handleInputChange('Payment Method', e.target.value)}>
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                  <option value="Credit card (automatic)">Credit card (automatic)</option>
                </select>
              </div>
              <NumberField label="Monthly Charges ($)" field="Monthly Charges" value={formData['Monthly Charges']}
                onChange={handleInputChange} step={0.05}
                error={validationErrors['Monthly Charges']} />
              <NumberField label="Total Cumulative Charges ($)" field="Total Charges" value={formData['Total Charges']}
                onChange={handleInputChange} step={0.05}
                error={validationErrors['Total Charges']} />
              <NumberField label="CLTV (Customer Lifetime Value)" field="CLTV" value={formData.CLTV}
                onChange={handleInputChange}
                error={validationErrors['CLTV']} />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 4 }}
            disabled={loading}
            id="btn-submit-prediction"
          >
            {loading ? (
              <>
                <span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                <span>Computing Inference…</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Evaluate Churn Risk</span>
              </>
            )}
          </button>
        </form>

        {/* Results Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={14} className="alert-icon" />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Prediction Failed</div>
                <div style={{ fontSize: '0.8125rem' }}>{error}</div>
              </div>
            </div>
          )}

          {result ? (
            <div className="card" style={{
              borderTop: `3px solid ${result.prediction === 1 ? 'var(--churn)' : 'var(--retention)'}`,
              padding: '20px 20px'
            }}>
              {/* Result header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                  Prediction Result
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{result.timestamp}</span>
              </div>

              {/* Outcome */}
              <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontSize: '1.125rem', fontWeight: 700,
                  color: result.prediction === 1 ? 'var(--churn)' : 'var(--retention)',
                  marginBottom: 6
                }}>
                  {result.prediction === 1 ? <UserX size={22} /> : <UserCheck size={22} />}
                  {result.prediction === 1 ? 'Likely to Churn' : 'Likely to Stay'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {result.customer_id} &nbsp;·&nbsp;
                  <span style={{
                    fontWeight: 700,
                    color: result.risk_level === 'High' ? 'var(--churn)' : result.risk_level === 'Moderate' ? 'var(--warning)' : 'var(--retention)'
                  }}>
                    {result.risk_level} Risk
                  </span>
                </div>
              </div>

              {/* Probability bars */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6 }}>
                  <span style={{ color: 'var(--churn)', fontWeight: 600 }}>Churn {result.churn_percentage}%</span>
                  <span style={{ color: 'var(--retention)', fontWeight: 600 }}>Stay {result.stay_percentage}%</span>
                </div>
                <div className="prob-bar-track">
                  <div className="prob-bar-fill-churn" style={{ width: `${result.churn_percentage}%` }} />
                  <div className="prob-bar-fill-stay" style={{ width: `${result.stay_percentage}%` }} />
                </div>
              </div>

              {/* Key Factors */}
              {result.factors?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Key Influencing Factors
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {result.factors.map((f, idx) => (
                      <div key={idx} style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: f.type === 'risk' ? 'var(--churn-light)' : 'var(--retention-light)',
                        border: `1px solid ${f.type === 'risk' ? 'var(--churn-border)' : 'var(--retention-border)'}`,
                        fontSize: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: f.type === 'risk' ? 'var(--churn-dark)' : 'var(--retention-dark)', marginBottom: 2 }}>
                          <span>{f.factor}</span><span>{f.weight}</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>{f.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer note */}
              <div style={{ marginTop: 16, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                <CheckCircle size={12} style={{ color: 'var(--retention)', flexShrink: 0 }} />
                Prediction logged to SQLite audit database.
              </div>
            </div>
          ) : (
            /* Awaiting state */
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <Zap size={28} style={{ color: 'var(--primary)', opacity: 0.5, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                Awaiting Input
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: 240, margin: '0 auto' }}>
                Fill in the form and click <strong>Evaluate Churn Risk</strong> to run the model.
              </p>
            </div>
          )}

          {/* Model info card */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
              <Info size={12} style={{ color: 'var(--primary)' }} />
              Model Details
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8125rem' }}>
              {[
                ['Algorithm', 'Logistic Regression'],
                ['Regularization', 'Elastic Net (L1+L2)'],
                ['Solver', 'SAGA'],
                ['l1_ratio', '0.5 (balanced)'],
                ['C (strength)', '1.0'],
                ['Features', '20 input → 47 encoded'],
                ['Accuracy', '80.74%'],
                ['ROC-AUC', '84.33%'],
              ].map(([k, v]) => (
                <div key={k} className="info-row" style={{ borderColor: 'transparent', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{k}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
