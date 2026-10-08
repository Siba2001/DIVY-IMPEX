import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorType, subtitle }) => {
  return (
    <div className={`stat-kpi-card kpi-${colorType} h-100 shadow-sm`}>
      <div className="d-flex align-items-center justify-content-between mb-1">
        <span className="text-muted text-uppercase fw-semibold text-truncate me-1" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-2 flex-shrink-0" style={{ backgroundColor: 'rgba(10, 25, 47, 0.04)' }}>
            <Icon size={15} style={{ color: '#0A192F' }} />
          </div>
        )}
      </div>
      <div className="font-heading fw-bold fs-4 text-dark mb-0.5" style={{ lineHeight: 1.2 }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatCard;
