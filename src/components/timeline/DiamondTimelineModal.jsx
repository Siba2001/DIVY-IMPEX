import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { apiService } from '../../services/apiService';
import { Clock, User, Calendar, Tag, Weight, CheckCircle2, History } from 'lucide-react';

const DiamondTimelineModal = ({ isOpen, onClose, diamond }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && diamond) {
      setLoading(true);
      apiService.getDiamondHistory(diamond.barcode).then((res) => {
        setHistory(res);
        setLoading(false);
      });
    }
  }, [isOpen, diamond]);

  if (!diamond) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Individual Diamond History - ${diamond.barcode}`} size="lg">
      <div className="bg-light p-3 rounded-3 mb-4 border">
        <div className="row g-3 align-items-center">
          <div className="col-md-3">
            <span className="text-muted d-block small">Barcode Number</span>
            <span className="font-heading fw-bold fs-5 text-dark">{diamond.barcode}</span>
          </div>
          <div className="col-md-3">
            <span className="text-muted d-block small">Company</span>
            <span className="fw-semibold text-dark">{diamond.companyName} ({diamond.companyCode})</span>
          </div>
          <div className="col-md-2">
            <span className="text-muted d-block small">Size / Weight</span>
            <span className="fw-semibold text-dark">{diamond.size} ({diamond.weight} ct)</span>
          </div>
          <div className="col-md-4 text-md-end">
            <span className="text-muted d-block small mb-1">Current Status</span>
            <Badge status={diamond.status} />
          </div>
        </div>
      </div>

      <h6 className="font-heading fw-bold text-navy mb-3 d-flex align-items-center">
        <History size={18} className="me-2 text-warning" /> Audit & Tracking Timeline History
      </h6>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-4 text-muted">No history log recorded yet.</div>
      ) : (
        <div className="timeline ps-3 pe-2 py-2">
          {history.map((item, idx) => (
            <div key={item.id || idx} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="card border shadow-sm rounded-3">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="fw-bold text-navy mb-0" style={{ fontSize: '0.925rem', color: '#0A192F' }}>
                      {item.action}
                    </h6>
                    <span className="badge bg-light text-dark border small fw-normal">
                      <Calendar size={12} className="me-1" /> {item.date} {item.time}
                    </span>
                  </div>
                  <div className="text-muted small mb-2 d-flex align-items-center">
                    <User size={13} className="me-1" /> Performed By: <span className="fw-semibold ms-1 text-dark">{item.performedBy}</span>
                  </div>
                  {item.remarks && (
                    <div className="p-2 bg-light rounded text-secondary small border-start border-3 border-warning">
                      {item.remarks}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-end mt-4 pt-2 border-top">
        <button className="btn btn-secondary px-4 rounded-3" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
};

export default DiamondTimelineModal;
