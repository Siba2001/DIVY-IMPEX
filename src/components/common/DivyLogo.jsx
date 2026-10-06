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

const DivyLogo = ({ showText = true, iconSize = 44, textClassName = "", className = "", stacked = false }) => {
  if (stacked) {
    return (
      <div className={`d-flex flex-column align-items-center text-center ${className}`}>
        <DivyLogoIcon size={iconSize} className="mb-2" />
        {showText && (
          <div className="lh-1">
            <span className={`font-heading fw-bold text-white d-block ${textClassName || 'fs-4'}`} style={{ letterSpacing: '0.28em' }}>
              DIVY IMPEX
            </span>
            <small className="text-uppercase text-warning d-block mt-1" style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}>
              All Fancy Cut Manufacturer
            </small>
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
          <span className={`font-heading fw-bold text-white d-block ${textClassName || 'fs-4'}`} style={{ letterSpacing: '0.22em' }}>
            DIVY IMPEX
          </span>
          <small className="text-uppercase text-warning d-block" style={{ fontSize: '0.62rem', letterSpacing: '0.14em', marginTop: '3px' }}>
            All Fancy Cut Manufacturer
          </small>
        </div>
      )}
    </div>
  );
};

export default DivyLogo;
