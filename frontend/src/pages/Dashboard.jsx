import React, { useState, useEffect } from 'react';
import {
  Users, UserX, UserCheck, TrendingUp,
  ArrowRight, Database, Activity
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { api } from '../services/api';

const COLORS = {
  churn:     '#C2414B',
  retention: '#21865B',
  primary:   '#2563EB',
  warning:   '#B7791F',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 6, padding: '8px 12px', fontSize: '0.8125rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, background: p.color, borderRadius: 2, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export const Dashboard = ({ onNavigateToPredict }) => {
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [historyRes, analyticsRes] = await Promise.allSettled([
          api.getHistory(6),
          api.getAnalytics()
        ]);
        if (historyRes.status === 'fulfilled') setHistory(historyRes.value.history || []);
        if (analyticsRes.status === 'fulfilled') {
          setAnalytics(analyticsRes.value);
        } else {
          setAnalytics({
            overall_distribution: { total_customers: 7032, retained_count: 5163, churned_count: 1869, churn_rate_percent: 26.58 },
            churn_by_contract: [
              { contract: 'Month-to-month', churned: 1655, retained: 2220 },
              { contract: 'One year',        churned: 166,  retained: 1306 },
              { contract: 'Two year',        churned: 48,   retained: 1637 },
            ]
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const dist = analytics?.overall_distribution || { total_customers: 7032, retained_count: 5163, churned_count: 1869, churn_rate_percent: 26.58 };

  const pieData = [
    { name: 'Retained', value: dist.retained_count || 5163, color: COLORS.retention },
    { name: 'Churned',  value: dist.churned_count  || 1869, color: COLORS.churn },
  ];

  const contractData = analytics?.churn_by_contract || [
    { contract: 'Month-to-month', churned: 1655, retained: 2220 },
    { contract: 'One year',        churned: 166,  retained: 1306 },
    { contract: 'Two year',        churned: 48,   retained: 1637 },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="page-title">Churn Analytics Overview</h2>
          <p className="page-description">
            IBM Telco Customer Churn dataset · Elastic Net Logistic Regression model monitoring.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNavigateToPredict} id="btn-dash-new-prediction">
          <Activity size={14} />
          <span>Run Prediction</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid-cols-4">
        <StatCard
          label="Total Customers"
          value="7,032"
          detail="Cleaned IBM Telco CA dataset"
          icon={Users}
          color="var(--primary)"
          bgLight="var(--primary-light)"
        />
        <StatCard
          label="Retained"
          value="5,163"
          detail="73.42% of subscriber base"
          icon={UserCheck}
          color="var(--retention)"
          bgLight="var(--retention-light)"
        />
        <StatCard
          label="Churned"
          value="1,869"
          detail="26.58% customer cancellations"
          icon={UserX}
          color="var(--churn)"
          bgLight="var(--churn-light)"
        />
        <StatCard
          label="Model ROC-AUC"
          value="84.33%"
          detail="Elastic Net · SAGA solver"
          icon={TrendingUp}
          color="var(--secondary)"
          bgLight="var(--secondary-light)"
        />
      </div>

      {/* Charts */}
      <div className="grid-cols-2">
        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Retention Distribution</div>
              <p className="card-subtitle" style={{ marginBottom: 0 }}>
                Ground-truth class balance across 7,032 subscriber accounts.
              </p>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val.toLocaleString()} (${((val / 7032) * 100).toFixed(1)}%)`, name]}
                  contentStyle={{ fontSize: '0.8125rem', border: '1px solid var(--border)', borderRadius: 6 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v, e) => (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Churn by Contract Type</div>
              <p className="card-subtitle" style={{ marginBottom: 0 }}>
                Month-to-month subscribers account for 88.5% of all churn events.
              </p>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }} barSize={22}>
                <CartesianGrid strokeDasharray="2 4" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="contract" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="square" iconSize={8}
                  formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{v}</span>}
                />
                <Bar dataKey="retained" name="Retained" fill={COLORS.retention} radius={[3, 3, 0, 0]} />
                <Bar dataKey="churned"  name="Churned"  fill={COLORS.churn}     radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Predictions</div>
            <p className="card-subtitle" style={{ marginBottom: 0 }}>
              Live inferences logged to the SQLite audit database.
            </p>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Timestamp</th>
                  <th>Contract</th>
                  <th>Internet</th>
                  <th>Monthly</th>
                  <th>Churn Prob</th>
                  <th>Prediction</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.customer_id}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{item.timestamp}</td>
                    <td>{item.contract}</td>
                    <td>{item.internet_service}</td>
                    <td>${Number(item.monthly_charges || 0).toFixed(2)}</td>
                    <td style={{ fontWeight: 600, color: item.prediction === 1 ? 'var(--churn)' : 'var(--retention)' }}>
                      {((item.churn_probability || 0) * 100).toFixed(1)}%
                    </td>
                    <td>
                      <span className={`badge ${item.prediction === 1 ? 'badge-churn' : 'badge-stay'}`}>
                        {item.outcome_label || (item.prediction === 1 ? 'Churn' : 'Stay')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Database size={32} className="empty-state-icon" />
            <div className="empty-state-title">No predictions yet</div>
            <p className="empty-state-desc">
              Run your first customer prediction to populate the audit log.
            </p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 12 }}
              onClick={onNavigateToPredict}
            >
              Go to Prediction Form
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
