import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Badge from '../../components/common/Badge';
import DiamondTimelineModal from '../../components/timeline/DiamondTimelineModal';
import { useDiamonds } from '../../context/DiamondContext';
import { Gem, Search, Filter, Eye, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

const DiamondList = () => {
  const { diamonds, companies, workers } = useDiamonds();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedDiamond, setSelectedDiamond] = useState(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  useEffect(() => {
    const qSearch = searchParams.get('search');
    if (qSearch) {
      setBarcodeSearch(qSearch);
    }
  }, [searchParams]);

  // Apply all filters
  const filteredDiamonds = diamonds.filter((d) => {
    if (companyFilter && d.companyId !== companyFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    if (workerFilter && d.assignedWorkerId !== workerFilter) return false;
    if (barcodeSearch) {
      const q = barcodeSearch.toLowerCase();
      const matchBarcode = d.barcode.toLowerCase().includes(q);
      const matchComp = d.companyName.toLowerCase().includes(q);
      const matchWorker = d.assignedWorkerName && d.assignedWorkerName.toLowerCase().includes(q);
      if (!matchBarcode && !matchComp && !matchWorker) return false;
    }
    if (fromDate && d.receivedDate < fromDate) return false;
    if (toDate && d.receivedDate > toDate) return false;
    return true;
  });

  const handleOpenTimeline = (diamond) => {
    setSelectedDiamond(diamond);
    setIsTimelineOpen(true);
  };

  const clearFilters = () => {
    setCompanyFilter('');
    setStatusFilter('');
    setWorkerFilter('');
    setBarcodeSearch('');
    setFromDate('');
    setToDate('');
  };

  return (
    <PrivateLayout title="Master Diamond Inventory">
      {/* Filters Toolbar */}
      <div className="card card-custom p-4 mb-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="font-heading fw-bold text-navy mb-0 d-flex align-items-center" style={{ color: '#0A192F' }}>
            <Filter size={18} className="me-2 text-warning" /> Filter Diamonds Inventory
          </h6>
          <button className="btn btn-sm btn-link text-secondary p-0 border-0" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>

        <div className="row g-3">
          <div className="col-lg-3 col-md-4">
            <label className="form-label">Search Barcode / Worker</label>
            <div className="position-relative">
              <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="KGK001..."
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-lg-2 col-md-4">
            <label className="form-label">Company</label>
            <select className="form-select" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-lg-2 col-md-4">
            <label className="form-label">Work Status</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
              <option value="WORK COMPLETED">WORK COMPLETED</option>
              <option value="DEPOSITED">DEPOSITED</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REWORK">REWORK</option>
            </select>
          </div>

          <div className="col-lg-2 col-md-4">
            <label className="form-label">Assigned Worker</label>
            <select className="form-select" value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}>
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.department})
                </option>
              ))}
            </select>
          </div>

          <div className="col-lg-3 col-md-4">
            <label className="form-label">Received Date Range</label>
            <div className="d-flex gap-2">
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <input
                type="date"
                className="form-control form-control-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Master Inventory Table */}
      <div className="card card-custom p-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
              Diamond Records List ({filteredDiamonds.length})
            </h6>
            <small className="text-muted">Showing all matched diamonds across stages</small>
          </div>
          <button
            className="btn btn-navy rounded-pill px-4"
            onClick={() => navigate('/diamond-receiving')}
          >
            + Receive New Diamonds
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Company</th>
                <th>Size</th>
                <th>Orig Weight</th>
                <th>Actual Weight</th>
                <th>Received Date</th>
                <th>Assigned Worker</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDiamonds.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No diamond records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDiamonds.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="font-heading fw-bold text-navy fs-6" style={{ color: '#0A192F' }}>
                        {d.barcode}
                      </span>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{d.companyName}</span>
                      <span className="badge bg-light text-navy border ms-2">{d.companyCode}</span>
                    </td>
                    <td className="small">{d.size}</td>
                    <td className="fw-semibold">{d.weight} ct</td>
                    <td className="small">{d.actualWeight ? `${d.actualWeight} ct` : '-'}</td>
                    <td className="small text-muted">{d.receivedDate}</td>
                    <td>
                      {d.assignedWorkerName ? (
                        <span className="fw-medium text-dark">{d.assignedWorkerName}</span>
                      ) : (
                        <span className="text-muted small italic">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <Badge status={d.status} />
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-pill px-3"
                          onClick={() => handleOpenTimeline(d)}
                        >
                          <Eye size={14} className="me-1" /> History
                        </button>

                        {/* Quick action button dependent on status */}
                        {d.status === 'RECEIVED' && (
                          <button
                            className="btn btn-sm btn-gold rounded-pill px-3"
                            onClick={() => navigate(`/assignment?barcode=${d.barcode}`)}
                          >
                            Assign Worker
                          </button>
                        )}
                        {d.status === 'DEPOSITED' && (
                          <button
                            className="btn btn-sm btn-success rounded-pill px-3"
                            onClick={() => navigate(`/deposit?barcode=${d.barcode}`)}
                          >
                            Verify Deposit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline Modal */}
      <DiamondTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        diamond={selectedDiamond}
      />
    </PrivateLayout>
  );
};

export default DiamondList;
