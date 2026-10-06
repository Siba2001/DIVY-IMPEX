import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClass = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl'
  }[size] || '';

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(10, 25, 47, 0.6)' }}>
      <div className={`modal-dialog ${sizeClass} modal-dialog-centered`}>
        <div className="modal-content border-0 shadow-lg rounded-3">
          <div className="modal-header border-bottom py-3 px-4" style={{ backgroundColor: '#F8FAFC' }}>
            <h5 className="modal-title font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body p-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
