import React from 'react';

// Direct photo image component of the DIVY IMPEX emblem logo
export const DivyLogoIcon = ({ size = 44, className = "" }) => (
  <img
    src="/images/divy_logo.png"
    alt="DIVY IMPEX Logo"
    width={size}
    height={size}
    className={`object-fit-contain ${className}`}
    style={{ minWidth: size, minHeight: size, maxHeight: size }}
  />
);

const DivyLogo = ({ showText = true, iconSize = 44, textClassName = "", className = "", stacked = false, subtitle = "" }) => {
  if (stacked) {
    return (
      <div className={`d-flex flex-column align-items-center text-center ${className}`}>
        <DivyLogoIcon size={iconSize} className="mb-2" />
        {showText && (
          <div className="lh-1">
            <span className={`font-heading fw-bold gold-gradient-text d-block ${textClassName || 'fs-4'}`} style={{ letterSpacing: '0.24em' }}>
              DIVY IMPEX
            </span>
            {subtitle && (
              <small className="text-uppercase text-warning d-block mt-1 text-nowrap" style={{ fontSize: '0.62rem', letterSpacing: '0.12em' }}>
                {subtitle}
              </small>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`d-flex align-items-center ${className}`}>
      <DivyLogoIcon size={iconSize} className="me-2.5 flex-shrink-0" />
      {showText && (
        <div className="lh-1 ms-1">
          <span className={`font-heading fw-bold gold-gradient-text d-block ${textClassName || 'fs-4'}`} style={{ letterSpacing: '0.20em' }}>
            DIVY IMPEX
          </span>
          {subtitle && (
            <small className="text-uppercase text-warning d-block text-nowrap" style={{ fontSize: '0.58rem', letterSpacing: '0.08em', marginTop: '3px' }}>
              {subtitle}
            </small>
          )}
        </div>
      )}
    </div>
  );
};

export default DivyLogo;
