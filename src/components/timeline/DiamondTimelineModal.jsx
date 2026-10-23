import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { apiService } from '../../services/apiService';
import { Clock, User, Calendar, Tag, Weight, CheckCircle2, History } from 'lucide-react';

// Format date and recover accurate time, filtering out spreadsheet epoch 1899-12-30
const formatTimelineTimestamp = (dateStr, timeStr, itemId) => {
  // 1. Recover Date
  let displayDate = dateStr || '';
  if (dateStr) {
    try {
      const parts = String(dateStr).split('T')[0].split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const [y, m, d] = parts;
        const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        displayDate = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch (e) {}
  }

  // 2. Recover Time (Filter out Google Sheets 1899-12-30 epoch)
  let displayTime = '';
  const isCorruptedEpoch = !timeStr || String(timeStr).includes('1899') || String(timeStr).includes('1900');

  if (!isCorruptedEpoch && timeStr) {
    displayTime = String(timeStr);
  } else if (itemId) {
    // Extract timestamp from history item ID (e.g. hist-1792324796866)
    const match = String(itemId).match(/\d{12,13}/);
    if (match) {
      try {
        const dt = new Date(parseInt(match[0], 10));
        if (!isNaN(dt.getTime())) {
          displayTime = dt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          if (!displayDate) {
            displayDate = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          }
        }
      } catch (e) {}
    }
  }

  return { displayDate, displayTime };
};

const DiamondTimelineModal = ({ isOpen, onClose, diamond }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (isOpen && diamond) {
      // 1. Instantly load available local or synthesized milestone history in 0ms!
      const initialHistory = apiService.getLocalHistory(diamond.barcode || diamond.id, diamond);
      if (initialHistory && initialHistory.length > 0) {
        setHistory(initialHistory);
        setLoading(false);
      } else {
        setLoading(true);
      }

      // 2. Background check with timeout protection (never hangs)
      apiService
        .getDiamondHistory(diamond.barcode || diamond.id, diamond)
        .then((res) => {
          if (isMounted && res && res.length > 0) {
            setHistory(res);
          }
        })
        .catch((err) => {
          console.warn('[Timeline] Remote history check notice:', err);
          if (isMounted && (!initialHistory || initialHistory.length === 0)) {
            setHistory(apiService.generateSynthesizedHistory(diamond));
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    } else {
      setHistory([]);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, diamond]);

  if (!diamond) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Individual Diamond History - ${diamond.barcode}`} size="lg">
      <div className="bg-light p-3 rounded-3 mb-4 border">
        <div className="row g-3 align-items-center">
          <div className="col-md-3">
            <span className="text-muted d-block small">Barcode Number</span>
            <span className="font-heading fw-bold fs-5 text-dark">{diamond.barcode}</span>
            <div className="d-flex flex-wrap gap-1 mt-1">
              {diamond.roughCutNo && (
                <span className="badge bg-light text-secondary border">
                  Rough #{diamond.roughCutNo}
                </span>
              )}
              {diamond.serialNo && (
                <span className="badge font-mono" style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                  Sr: #{diamond.serialNo}
                </span>
              )}
            </div>
          </div>
          <div className="col-md-3">
            <span className="text-muted d-block small">Company</span>
            <span className="fw-semibold text-dark">{diamond.companyName} ({diamond.companyCode})</span>
          </div>
          <div className="col-md-2">
            <span className="text-muted d-block small">Shape / Weight</span>
            <span className="fw-semibold text-dark">{diamond.shape || diamond.size} ({diamond.weight} ct)</span>
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
          {history.map((item, idx) => {
            const { displayDate, displayTime } = formatTimelineTimestamp(item.date, item.time, item.id);

            return (
              <div key={item.id || idx} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="card border shadow-sm rounded-3">
                  <div className="card-body p-3">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-1.5">
                      <h6 className="fw-bold text-navy mb-0" style={{ fontSize: '0.925rem', color: '#0A192F' }}>
                        {item.action}
                      </h6>
                      <div className="d-flex align-items-center gap-1.5 flex-wrap">
                        {displayDate && (
                          <span className="badge bg-light text-navy border px-2 py-1 font-monospace" style={{ fontSize: '0.75rem' }}>
                            <Calendar size={12} className="me-1 text-primary inline" />
                            {displayDate}
                          </span>
                        )}
                        {displayTime && (
                          <span className="badge bg-navy text-white px-2 py-1 font-monospace" style={{ fontSize: '0.75rem' }}>
                            <Clock size={12} className="me-1 text-warning inline" />
                            {displayTime}
                          </span>
                        )}
                      </div>
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
            );
          })}
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
