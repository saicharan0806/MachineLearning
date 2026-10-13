import React from 'react';
import { BookOpen, Database, Cpu, Layers, Award, CheckCircle } from 'lucide-react';

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="card" style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: 32, height: 32, background: 'var(--primary-light)', borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={15} style={{ color: 'var(--primary)' }} />
      </div>
      <h3 className="card-title" style={{ margin: 0 }}>{title}</h3>
    </div>
    {children}
  </div>
);

const MetricRow = ({ metric, value, benchmark, assessment, color }) => (
  <tr>
    <td style={{ fontWeight: 600 }}>{metric}</td>
    <td style={{ fontWeight: 700, color: color || 'var(--primary)' }}>{value}</td>
    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{benchmark}</td>
    <td><span className="badge badge-stay">{assessment}</span></td>
  </tr>
);

const ConfusionCell = ({ value, label, sub, type }) => {
  const styles = {
    tp: { bg: 'var(--retention-light)', border: 'var(--retention-border)', color: 'var(--retention)' },
    tn: { bg: 'var(--retention-light)', border: 'var(--retention-border)', color: 'var(--retention)' },
    fp: { bg: 'var(--warning-light)', border: 'var(--warning-border)', color: 'var(--warning)' },
    fn: { bg: 'var(--warning-light)', border: 'var(--warning-border)', color: 'var(--warning)' },
  }[type] || {};
  return (
    <div style={{
      backgroundColor: styles.bg, border: `1px solid ${styles.border}`,
      padding: '16px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center'
    }}>
      <div style={{ fontSize: '1.625rem', fontWeight: 700, color: styles.color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>
    </div>
  );
};

export const AboutProject = () => {
  return (
    <div className="page-container" style={{ maxWidth: 1080 }}>
      <div className="page-header">
        <h2 className="page-title">About the Project</h2>
        <p className="page-description">
          Customer Churn Prediction using Elastic Net Regularized Logistic Regression — College ML Project Documentation.
        </p>
      </div>

      {/* 1. Objective */}
      <SectionCard icon={BookOpen} title="1. Project Objective & Problem Statement">
        <p style={{ marginBottom: 12, lineHeight: 1.7 }}>
          In the telecommunications sector, customer acquisition costs exceed retention costs by an estimated 5–7×.
          The objective of this project is to develop an <strong>accurate, interpretable classification model</strong> to
          predict customer churn before contract expiration, enabling targeted proactive retention campaigns.
        </p>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Unlike black-box ensemble methods, regularized linear models provide exact feature coefficients that allow
          analysts to immediately understand <em>why</em> a customer is likely to churn — enabling actionable business decisions.
        </p>
      </SectionCard>

      {/* 2. Dataset */}
      <SectionCard icon={Database} title="2. Dataset & Preprocessing Pipeline">
        <p style={{ marginBottom: 14, color: 'var(--text-secondary)' }}>
          IBM Telco Customer Churn dataset — <strong>7,043 subscriber records</strong> across California with 33 initial columns.
        </p>
        <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: 10 }}>
            Data Cleaning Steps (Notebook Cells 13–17, 76):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8125rem' }}>
            {[
              ['Total Charges Coercion', '11 blank-string records removed (zero-tenure accounts) → 7,032 clean rows (5,163 retained, 1,869 churned).'],
              ['Target Leakage Removal', 'Dropped Churn Value, Churn Score, and Churn Reason — all available only post-churn.'],
              ['Identifier Exclusion', 'Dropped CustomerID, Count, Country, State, City, Zip Code, Lat Long, Latitude, Longitude.'],
              ['ColumnTransformer Pipeline', 'StandardScaler on 4 numeric features + OneHotEncoder(handle_unknown=\'ignore\') on 16 categorical → 47 model inputs.'],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 10 }}>
                <CheckCircle size={13} style={{ color: 'var(--retention)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{title}:</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 3. Algorithm */}
      <SectionCard icon={Cpu} title="3. Elastic Net Regularized Logistic Regression">
        <p style={{ marginBottom: 12, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Elastic Net blends L₁ (Lasso) and L₂ (Ridge) regularization to handle collinearity between tenure and billing charges while producing sparse, interpretable coefficients.
        </p>
        <div className="code-block" style={{ marginBottom: 14 }}>
          Loss = -(1/N) × Σ [y·log(p) + (1-y)·log(1-p)] + λ × [α·‖w‖₁ + ((1-α)/2)·‖w‖₂²]
        </div>
        <div className="grid-cols-3">
          {[
            { title: 'l1_ratio = 0.5',    desc: 'Equal weighting between L₁ (sparsity) and L₂ (group shrinkage).' },
            { title: 'C = 1.0',           desc: 'Inverse penalty strength λ = 1.0 — balanced generalization.' },
            { title: 'Solver: SAGA',      desc: 'Stochastic Average Gradient Descent — supports non-smooth L₁ with fast convergence.' },
          ].map(({ title, desc }) => (
            <div key={title} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 4. Results */}
      <SectionCard icon={Award} title="4. Model Evaluation Results (Notebook Cell 90)">
        <p style={{ marginBottom: 14, color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
          Evaluated on 20% stratified holdout test split — 1,407 test customers (1,033 retained, 374 churned).
        </p>

        <div className="table-wrapper" style={{ marginBottom: 20 }}>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Result</th>
                <th>Benchmark</th>
                <th>Assessment</th>
              </tr>
            </thead>
            <tbody>
              <MetricRow metric="Accuracy"              value="80.74%"  benchmark="> 75.0%"  assessment="Strong" />
              <MetricRow metric="ROC-AUC Score"         value="84.33%"  benchmark="> 80.0%"  assessment="Excellent" color="var(--retention)" />
              <MetricRow metric="Precision (Churn)"     value="64.67%"  benchmark="> 60.0%"  assessment="Good" />
              <MetricRow metric="Recall (Sensitivity)"  value="60.70%"  benchmark="> 55.0%"  assessment="Balanced" />
              <MetricRow metric="F1-Score"              value="62.62%"  benchmark="> 60.0%"  assessment="Balanced" />
            </tbody>
          </table>
        </div>

        {/* Confusion Matrix */}
        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: 12 }}>
          Confusion Matrix — Test Set (N = 1,407)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 480 }}>
          <ConfusionCell value="909" label="True Negatives"  sub="Correctly predicted Stay"   type="tn" />
          <ConfusionCell value="124" label="False Positives" sub="Predicted Churn, Stayed"    type="fp" />
          <ConfusionCell value="147" label="False Negatives" sub="Predicted Stay, Churned"    type="fn" />
          <ConfusionCell value="227" label="True Positives"  sub="Correctly identified Churn" type="tp" />
        </div>
      </SectionCard>

      {/* 5. Tech Stack */}
      <SectionCard icon={Layers} title="5. Architecture & Technology Stack">
        <div className="grid-cols-3">
          {[
            {
              title: 'Frontend',
              color: 'var(--primary)',
              items: ['React 18 + Vite', 'Vanilla CSS Design System', 'Recharts Data Visualization', 'Lucide React Icons']
            },
            {
              title: 'Backend',
              color: 'var(--secondary)',
              items: ['Python Flask REST API', 'Flask-CORS Middleware', 'SQLite Audit Logging', 'Ngrok / Cloudflare Tunnel']
            },
            {
              title: 'Machine Learning',
              color: 'var(--warning)',
              items: ['Scikit-Learn (SAGA Solver)', 'Joblib Model Serialization', 'Pandas & NumPy', 'Google Colab GPU/CPU']
            },
          ].map(({ title, color, items }) => (
            <div key={title} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.8125rem', color, marginBottom: 10 }}>{title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {items.map(item => (
                  <div key={item} style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <span style={{ width: 4, height: 4, background: color, borderRadius: '50%', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};
