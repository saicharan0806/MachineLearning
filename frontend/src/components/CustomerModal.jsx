import React from 'react';
import { X, User, Wifi, CreditCard } from 'lucide-react';

const Field = ({ label, value }) => (
  <div className="info-row">
    <span className="info-row-label">{label}</span>
    <span className="info-row-value">{value ?? '—'}</span>
  </div>
);

export const CustomerModal = ({ customer, onClose, onPredictThisCustomer }) => {
  if (!customer) return null;

  const isChurned = customer['Churn Label'] === 'Yes' || customer.outcome_label === 'Churn';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              {customer.CustomerID || customer.customer_id || 'Customer Profile'}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {customer.City ? `${customer.City}, California` : 'IBM Telco Subscriber Record'}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Churn status banner */}
        <div style={{
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: isChurned ? 'var(--churn-light)' : 'var(--retention-light)',
          borderBottom: `1px solid ${isChurned ? 'var(--churn-border)' : 'var(--retention-border)'}`,
          fontSize: '0.8125rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="badge"
              style={{
                backgroundColor: isChurned ? 'var(--churn)' : 'var(--retention)',
                color: '#fff',
                border: 'none',
                fontSize: '0.6875rem'
              }}
            >
              {isChurned ? 'CHURNED' : 'RETAINED'}
            </span>
            <span style={{ color: isChurned ? 'var(--churn-dark)' : 'var(--retention-dark)', fontWeight: 500 }}>
              Actual outcome on record
            </span>
          </div>
          {customer.churn_probability !== undefined && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              Model prob: <strong style={{ color: isChurned ? 'var(--churn)' : 'var(--retention)' }}>
                {(customer.churn_probability * 100).toFixed(1)}% churn
              </strong>
            </span>
          )}
        </div>

        {/* Attributes */}
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {/* Demographics */}
            <div>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <User size={11} /> Demographics
              </div>
              <Field label="Gender" value={customer.Gender} />
              <Field label="Senior Citizen" value={customer['Senior Citizen'] || 'No'} />
              <Field label="Partner" value={customer.Partner} />
              <Field label="Dependents" value={customer.Dependents} />
            </div>

            {/* Services */}
            <div>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Wifi size={11} /> Services
              </div>
              <Field label="Internet" value={customer['Internet Service']} />
              <Field label="Phone" value={customer['Phone Service']} />
              <Field label="Multi-Lines" value={customer['Multiple Lines']} />
              <Field label="Online Security" value={customer['Online Security']} />
              <Field label="Tech Support" value={customer['Tech Support']} />
            </div>

            {/* Billing */}
            <div>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CreditCard size={11} /> Contract & Billing
              </div>
              <Field label="Contract" value={customer.Contract} />
              <Field label="Tenure" value={customer['Tenure Months'] ? `${customer['Tenure Months']} mos` : '—'} />
              <Field label="Monthly" value={customer['Monthly Charges'] ? `$${Number(customer['Monthly Charges']).toFixed(2)}` : '—'} />
              <Field label="Total" value={customer['Total Charges'] ? `$${Number(customer['Total Charges']).toFixed(2)}` : '—'} />
              <Field label="CLTV" value={customer.CLTV} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {onPredictThisCustomer && (
            <button
              className="btn btn-primary"
              onClick={() => { onPredictThisCustomer(customer); onClose(); }}
            >
              Load into Prediction Form
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
