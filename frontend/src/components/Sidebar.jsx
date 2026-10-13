import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  BarChart3,
  History,
  Info,
  Activity
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard',  label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'predict',    label: 'Customer Prediction', icon: UserCheck },
  { id: 'records',    label: 'Customer Records',    icon: Users },
  { id: 'analytics',  label: 'Analytics',           icon: BarChart3 },
  { id: 'history',    label: 'Prediction History',  icon: History },
  { id: 'about',      label: 'About Project',       icon: Info },
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Activity size={17} />
          </div>
          <div>
            <div className="sidebar-title">ChurnPredict</div>
            <div className="sidebar-subtitle">Elastic Net · ML Analytics</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Navigation</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <a
              key={item.id}
              href={`#/${item.id}`}
              onClick={(e) => { e.preventDefault(); setActiveTab(item.id); }}
              className={`nav-link ${isActive ? 'active' : ''}`}
              id={`nav-${item.id}`}
              title={item.label}
            >
              <Icon size={16} className="nav-link-icon" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>
          College ML Project
        </div>
        <div>IBM Telco · 7,032 Records</div>
        <div>SAGA Solver · C=1.0 · l1=0.5</div>
      </div>
    </aside>
  );
};
