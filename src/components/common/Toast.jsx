import React from 'react';
import { useDiamonds } from '../../context/DiamondContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = () => {
  const { toastMessage, hideToast } = useDiamonds();

  if (!toastMessage) return null;

  const { message, type = 'success' } = toastMessage;

  const typeConfig = {
    success: {
      border: '#10B981',
      bgBadge: 'rgba(16, 185, 129, 0.15)',
      icon: <CheckCircle2 size={20} className="text-success flex-shrink-0" />,
      title: 'Success'
    },
    danger: {
      border: '#EF4444',
      bgBadge: 'rgba(239, 68, 68, 0.15)',
      icon: <AlertCircle size={20} className="text-danger flex-shrink-0" />,
      title: 'Alert'
    },
    warning: {
      border: '#F59E0B',
      bgBadge: 'rgba(245, 158, 11, 0.15)',
      icon: <AlertTriangle size={20} className="text-warning flex-shrink-0" />,
      title: 'Notice'
    },
    info: {
      border: '#38BDF8',
      bgBadge: 'rgba(56, 189, 248, 0.15)',
      icon: <Info size={20} className="text-info flex-shrink-0" />,
      title: 'Info'
    }
  }[type] || {
    border: '#D4AF37',
    bgBadge: 'rgba(212, 175, 55, 0.15)',
    icon: <CheckCircle2 size={20} className="text-warning flex-shrink-0" />,
    title: 'Success'
  };

  return (
    <div
      className="position-fixed start-50 translate-middle-x px-3"
      style={{
        top: '20px',
        zIndex: 99999,
        maxWidth: '92vw',
        width: 'max-content',
        minWidth: '320px',
        animation: 'slideDownToast 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        className="d-flex align-items-center justify-content-between p-3 rounded-4 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #0A192F 0%, #112240 100%)',
          color: '#FFFFFF',
          border: `1.5px solid ${typeConfig.border}`,
          boxShadow: '0 12px 35px -5px rgba(0, 0, 0, 0.45), 0 0 15px -3px rgba(212, 175, 55, 0.25)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <div className="d-flex align-items-center me-3 min-w-0">
          <div
            className="p-1.5 rounded-circle me-2.5 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ backgroundColor: typeConfig.bgBadge }}
          >
            {typeConfig.icon}
          </div>
          <div className="font-body fw-semibold text-break" style={{ fontSize: '0.9rem', letterSpacing: '0.01em' }}>
            {message}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-link text-white-50 p-1 ms-2 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: '26px', height: '26px', textDecoration: 'none' }}
          onClick={() => hideToast && hideToast()}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        @keyframes slideDownToast {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
