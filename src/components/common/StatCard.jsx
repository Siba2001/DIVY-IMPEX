import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorType, subtitle }) => {
  return (
    <div className={`stat-kpi-card kpi-${colorType} h-100 shadow-sm`}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-2" style={{ backgroundColor: 'rgba(10, 25, 47, 0.04)' }}>
            <Icon size={18} style={{ color: '#0A192F' }} />
          </div>
        )}
      </div>
      <div className="font-heading fw-bold fs-3 text-dark mb-1">
        {value}
      </div>
      {subtitle && (
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatCard;
