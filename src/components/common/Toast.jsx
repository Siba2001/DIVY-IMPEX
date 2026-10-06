import React from 'react';
import { useDiamonds } from '../../context/DiamondContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = () => {
  const { toastMessage } = useDiamonds();

  if (!toastMessage) return null;

  const { message, type } = toastMessage;

  const bgClass = {
    success: 'bg-emerald-600 text-white',
    danger: 'bg-rose-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-sky-600 text-white'
  }[type] || 'bg-slate-800 text-white';

  const iconMap = {
    success: <CheckCircle2 size={18} className="me-2 text-success" />,
    danger: <AlertCircle size={18} className="me-2 text-danger" />,
    warning: <AlertTriangle size={18} className="me-2 text-warning" />,
    info: <Info size={18} className="me-2 text-info" />
  };

  return (
    <div
      className="position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 1090 }}
    >
      <div className="toast show align-items-center border-0 shadow-lg" role="alert" style={{ background: '#0A192F', color: '#FFFFFF', minWidth: '280px', borderRadius: '10px' }}>
        <div className="d-flex p-3 align-items-center">
          {iconMap[type] || iconMap.info}
          <div className="toast-body p-0 font-body fw-medium" style={{ fontSize: '0.875rem' }}>
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
