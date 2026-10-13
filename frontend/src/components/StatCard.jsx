import React from 'react';

export const StatCard = ({ label, value, detail, icon: Icon, color, bgLight }) => {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div
            className="stat-icon-box"
            style={{ backgroundColor: bgLight || '#F1F5F9', color: color || 'var(--text-secondary)' }}
          >
            <Icon size={14} />
          </div>
        )}
      </div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      {detail && <div className="stat-detail">{detail}</div>}
    </div>
  );
};
