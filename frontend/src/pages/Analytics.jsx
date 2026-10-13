import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { BarChart3 } from 'lucide-react';

const CHURN   = '#C2414B';
const STAY    = '#21865B';
const PRIMARY = '#2563EB';
const WARM    = '#B7791F';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 6, padding: '8px 12px', fontSize: '0.8125rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, background: p.fill || p.color, borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {typeof p.value === 'number' && p.name?.includes('%')
              ? `${p.value}%`
              : typeof p.value === 'number'
                ? p.value.toLocaleString()
                : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const fallbackData = {
  churn_by_contract: [
    { contract: 'Month-to-month', total: 3875, churned: 1655, retained: 2220, churn_rate: 42.71 },
    { contract: 'One year',        total: 1472, churned: 166,  retained: 1306, churn_rate: 11.28 },
    { contract: 'Two year',        total: 1685, churned: 48,   retained: 1637, churn_rate: 2.85  },
  ],
  churn_by_tenure_group: [
    { cohort: '0–12 Mos',  total: 2175, churned: 1031, retained: 1144, churn_rate: 47.40 },
    { cohort: '13–24 Mos', total: 1024, churned: 294,  retained: 730,  churn_rate: 28.71 },
    { cohort: '25–48 Mos', total: 1594, churned: 326,  retained: 1268, churn_rate: 20.45 },
    { cohort: '49–72 Mos', total: 2239, churned: 218,  retained: 2021, churn_rate: 9.74  },
  ],
  churn_by_internet_service: [
    { service: 'Fiber optic', total: 3096, churned: 1297, retained: 1799, churn_rate: 41.89 },
    { service: 'DSL',         total: 2416, churned: 459,  retained: 1957, churn_rate: 19.00 },
    { service: 'No Internet', total: 1520, churned: 113,  retained: 1407, churn_rate: 7.43  },
  ],
  monthly_charges_bands: [
    { range: '$18–$35',   churn_rate: 8.9  },
    { range: '$36–$65',   churn_rate: 22.4 },
    { range: '$66–$90',   churn_rate: 34.6 },
    { range: '$91–$119',  churn_rate: 38.5 },
  ],
  feature_importance: [
    { feature: 'Tenure Months',           coefficient: -1.3655 },
    { feature: 'Dependents (Yes)',         coefficient: -0.8296 },
    { feature: 'Contract: Month-to-month',coefficient: 0.8015  },
    { feature: 'Dependents (No)',          coefficient: 0.8009  },
    { feature: 'Contract: Two year',       coefficient: -0.7100 },
    { feature: 'Internet: Fiber optic',    coefficient: 0.6677  },
    { feature: 'Total Charges',            coefficient: 0.6260  },
    { feature: 'Contract: One year',       coefficient: -0.4500 },
    { feature: 'Online Security (No)',     coefficient: 0.4040  },
    { feature: 'Tech Support (No)',        coefficient: 0.3882  },
    { feature: 'Online Security (Yes)',    coefficient: -0.3800 },
    { feature: 'Payment: Elec. check',    coefficient: 0.3052  },
  ]
};

const ChartCard = ({ title, subtitle, children, height = 260 }) => (
  <div className="card">
    <div className="card-title">{title}</div>
    {subtitle && <p className="card-subtitle">{subtitle}</p>}
    <div style={{ height }}>{children}</div>
  </div>
);

export const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then(res => setData(res?.churn_by_contract ? res : fallbackData))
      .catch(() => setData(fallbackData))
      .finally(() => setLoading(false));
  }, []);

  const d = data || fallbackData;

  const axisStyle  = { fill: 'var(--text-secondary)', fontSize: 11 };
  const gridStyle  = { strokeDasharray: '2 4', stroke: '#F1F5F9', vertical: false };

  if (loading) return (
    <div className="page-container">
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>Loading analytics…</div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Dataset &amp; Model Analytics</h2>
        <p className="page-description">
          Exploratory analysis of the IBM Telco dataset and Elastic Net model coefficient interpretation.
        </p>
      </div>

      {/* Row 1 */}
      <div className="grid-cols-2">
        <ChartCard
          title="1. Churn Rate by Contract Type"
          subtitle="Month-to-month subscribers churn at 42.7% vs 2.8% for two-year contracts."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.churn_by_contract} margin={{ top: 8, right: 8, left: -10, bottom: 0 }} barSize={22}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="contract" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="square" iconSize={8} formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{v}</span>} />
              <Bar dataKey="retained" name="Retained" fill={STAY}  radius={[3, 3, 0, 0]} />
              <Bar dataKey="churned"  name="Churned"  fill={CHURN} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="2. Churn Vulnerability by Tenure Cohort"
          subtitle="Customers in months 0–12 exhibit the highest risk: 47.4% churn rate."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.churn_by_tenure_group} margin={{ top: 8, right: 8, left: -10, bottom: 0 }} barSize={22}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="cohort" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="square" iconSize={8} formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{v}</span>} />
              <Bar dataKey="retained" name="Retained" fill={STAY}  radius={[3, 3, 0, 0]} />
              <Bar dataKey="churned"  name="Churned"  fill={CHURN} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid-cols-2">
        <ChartCard
          title="3. Churn by Internet Service Type"
          subtitle="Fiber optic subscribers churn at 41.9% — more than double DSL (19.0%)."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.churn_by_internet_service} margin={{ top: 8, right: 8, left: -10, bottom: 0 }} barSize={28}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="service" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="square" iconSize={8} formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{v}</span>} />
              <Bar dataKey="retained" name="Retained" fill={STAY}  radius={[3, 3, 0, 0]} />
              <Bar dataKey="churned"  name="Churned"  fill={CHURN} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="4. Churn Propensity by Monthly Billing Tier"
          subtitle="Accounts billed above $90/month churn at 4× the rate of basic plans ($18–$35)."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.monthly_charges_bands} margin={{ top: 8, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="range" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis unit="%" tick={axisStyle} axisLine={false} tickLine={false} domain={[0, 50]} />
              <Tooltip formatter={(v) => [`${v}%`, 'Churn Rate']} contentStyle={{ fontSize: '0.8125rem', border: '1px solid var(--border)', borderRadius: 6 }} />
              <Line
                type="monotone" dataKey="churn_rate" name="Churn Rate (%)"
                stroke={PRIMARY} strokeWidth={2.5}
                dot={{ r: 4, fill: PRIMARY, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Feature Importance (full width) */}
      <div className="card">
        <div className="card-title">5. Elastic Net Model Coefficients — Feature Importance</div>
        <p className="card-subtitle">
          Derived from the trained Logistic Regression pipeline (SAGA, C=1.0, l1_ratio=0.5).
          Positive coefficients increase churn risk; negative coefficients indicate retention anchors.
        </p>

        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={d.feature_importance}
              margin={{ top: 8, right: 24, left: 160, bottom: 8 }}
              barSize={14}
            >
              <CartesianGrid strokeDasharray="2 4" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} domain={['dataMin - 0.1', 'dataMax + 0.1']} />
              <YAxis dataKey="feature" type="category" tick={{ fill: 'var(--text-primary)', fontSize: 11 }} width={155} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [`${Number(v).toFixed(4)}`, 'Coefficient']}
                contentStyle={{ fontSize: '0.8125rem', border: '1px solid var(--border)', borderRadius: 6 }}
              />
              <Bar dataKey="coefficient" name="Elastic Net Coefficient" radius={[0, 3, 3, 0]}>
                {d.feature_importance.map((entry, i) => (
                  <Cell key={i} fill={entry.coefficient > 0 ? CHURN : STAY} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, background: CHURN, borderRadius: 2, display: 'inline-block' }} />
            Positive — Higher Churn Risk
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, background: STAY, borderRadius: 2, display: 'inline-block' }} />
            Negative — Stronger Retention
          </div>
        </div>
      </div>
    </div>
  );
};
