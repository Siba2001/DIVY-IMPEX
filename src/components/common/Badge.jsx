import React from 'react';

const Badge = ({ status }) => {
  const formatted = status ? status.replace(/\s+/g, '_').toUpperCase() : 'UNKNOWN';
  
  return (
    <span className={`badge-status badge-status-${formatted}`}>
      {status}
    </span>
  );
};

export default Badge;
