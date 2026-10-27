import React from 'react';
import { AlertTriangle, LogOut, Trash2, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title = 'Confirmation Required',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'navy' | 'gold'
  iconType,
  icon = 'alert', // 'alert' | 'logout' | 'delete'
  onConfirm,
  onCancel,
  onClose,
  isSubmitting = false,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const handleCancel = onCancel || onClose;
  const loading = isSubmitting || isLoading;
  const activeIcon = iconType || icon;

  const renderIcon = () => {
    switch (activeIcon) {
      case 'logout':
        return <LogOut size={24} className="text-warning" />;
      case 'delete':
        return <Trash2 size={24} className="text-danger" />;
      default:
        return <AlertTriangle size={24} className="text-danger" />;
    }
  };

  const buttonClass = {
    danger: 'btn-danger text-white',
    warning: 'btn-warning text-dark',
    navy: 'btn-navy text-white',
    gold: 'btn-gold'
  }[confirmVariant] || 'btn-danger text-white';

  return (
    <div
      className="modal fade show d-block modal-animate-backdrop"
      tabIndex="-1"
      onClick={() => {
        if (!loading && handleCancel) handleCancel();
      }}
      style={{ backgroundColor: 'rgba(10, 25, 47, 0.65)', backdropFilter: 'blur(5px)', zIndex: 1060 }}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-animate-dialog"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden bg-white">
          {/* Header */}
          <div className="p-4 pb-0 d-flex align-items-start justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div
                className="p-2.5 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  backgroundColor:
                    confirmVariant === 'danger'
                      ? '#FEE2E2'
                      : confirmVariant === 'warning'
                        ? '#FEF3C7'
                        : confirmVariant === 'gold'
                          ? '#FEF9C3'
                          : '#E0E7FF'
                }}
              >
                {renderIcon()}
              </div>
              <h5 className="font-heading fw-bold text-dark mb-0 fs-5" style={{ color: '#0A192F' }}>
                {title}
              </h5>
            </div>
            {handleCancel && (
              <button
                type="button"
                className="btn btn-sm btn-light rounded-circle p-1 text-muted"
                onClick={handleCancel}
                disabled={loading}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="modal-body p-4 pt-3 text-secondary" style={{ fontSize: '0.925rem', lineHeight: '1.5' }}>
            {message}
          </div>

          {/* Footer */}
          <div className="p-3 px-4 bg-light border-top d-flex align-items-center justify-content-end gap-2">
            {handleCancel && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 fw-semibold"
                onClick={handleCancel}
                disabled={loading}
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              className={`btn btn-sm ${buttonClass} rounded-pill px-4 py-1.5 font-heading fw-bold d-flex align-items-center gap-1.5 shadow-sm`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading && (
                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
