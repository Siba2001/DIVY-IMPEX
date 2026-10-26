import React from 'react';

const colorMap = {
  total:      { iconBg: '#EFF6FF', iconColor: '#3B82F6', badgeBg: '#EFF6FF', badgeColor: '#3B82F6', curve: '#3B82F6' },
  diamonds:   { iconBg: '#FFFBEB', iconColor: '#D97706', badgeBg: '#FFFBEB', badgeColor: '#D97706', curve: '#D97706' },
  received:   { iconBg: '#E0F2FE', iconColor: '#0284C7', badgeBg: '#E0F2FE', badgeColor: '#0284C7', curve: '#0284C7' },
  pending:    { iconBg: '#FEF3C7', iconColor: '#B45309', badgeBg: '#FEF3C7', badgeColor: '#B45309', curve: '#F59E0B' },
  production: { iconBg: '#EDE9FE', iconColor: '#7C3AED', badgeBg: '#EDE9FE', badgeColor: '#7C3AED', curve: '#8B5CF6' },
  completed:  { iconBg: '#D1FAE5', iconColor: '#059669', badgeBg: '#D1FAE5', badgeColor: '#059669', curve: '#10B981' },
  deposited:  { iconBg: '#EEF2FF', iconColor: '#4338CA', badgeBg: '#EEF2FF', badgeColor: '#4338CA', curve: '#6366F1' },
  verified:   { iconBg: '#CCFBF1', iconColor: '#0F766E', badgeBg: '#CCFBF1', badgeColor: '#0F766E', curve: '#14B8A6' },
  submitted:  { iconBg: '#F5F3FF', iconColor: '#7C3AED', badgeBg: '#F5F3FF', badgeColor: '#7C3AED', curve: '#8B5CF6' },
  balance:    { iconBg: '#ECFDF5', iconColor: '#059669', badgeBg: '#ECFDF5', badgeColor: '#059669', curve: '#10B981' },
};

/* Decorative mini sparkline SVG — purely aesthetic */
const SparkLine = ({ color }) => (
  <svg
    viewBox="0 0 80 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', bottom: 0, right: 0, width: '80px', height: '36px', opacity: 0.18 }}
  >
    <path
      d="M0 32 C12 28, 20 18, 32 20 C44 22, 52 10, 64 8 C70 7, 75 9, 80 6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const StatCard = ({ title, value, icon: Icon, colorType, subtitle }) => {
  const colors = colorMap[colorType] || colorMap.total;

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '16px 18px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 18px rgba(0,0,0,0.06)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05), 0 4px 18px rgba(0,0,0,0.06)';
      }}
    >
      {/* Row 1: Icon + Title + Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        {Icon && (
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: colors.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={16} style={{ color: colors.iconColor }} />
          </div>
        )}

        <span
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: '#64748B',
            flex: 1,
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.3,
          }}
        >
          {title}
        </span>

        {/* Value badge — top right */}
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: colors.badgeColor,
            backgroundColor: colors.badgeBg,
            borderRadius: '20px',
            padding: '2px 9px',
            flexShrink: 0,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.01em',
          }}
        >
          {value}
        </span>
      </div>

      {/* Row 2: Large value */}
      <div
        style={{
          fontSize: '2.1rem',
          fontWeight: 800,
          color: '#0F172A',
          lineHeight: 1,
          fontFamily: 'Outfit, sans-serif',
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </div>

      {/* Row 3: Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: '0.69rem',
            color: '#94A3B8',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {subtitle}
        </div>
      )}

      {/* Decorative sparkline */}
      <SparkLine color={colors.curve} />
    </div>
  );
};

export default StatCard;
