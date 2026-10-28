import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Badge from '../../components/common/Badge';
import DiamondTimelineModal from '../../components/timeline/DiamondTimelineModal';
import EditDiamondModal from '../../components/modals/EditDiamondModal';
import { useDiamonds } from '../../context/DiamondContext';
import { Gem, Search, Filter, Eye, ArrowRight, RefreshCw, CheckCircle2, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Building2, Send, Edit } from 'lucide-react';

const DiamondList = () => {
  const { diamonds, companies, workers, updateDiamond } = useDiamonds();
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
  const [editingDiamond, setEditingDiamond] = useState(null);

  // Section Tabs: 'factory' (On Stock Factory) vs 'returned' (Returned to Company)
  const [activeTab, setActiveTab] = useState('factory');

  // Pagination state (default: 20 diamonds per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const qSearch = searchParams.get('search');
    if (qSearch) {
      setBarcodeSearch(qSearch);
    }
  }, [searchParams]);

  // Overall counts for tabs (unfiltered)
  const factoryStockCount = diamonds.filter((d) => d.status !== 'RETURNED').length;
  const returnedToCompanyCount = diamonds.filter((d) => d.status === 'RETURNED').length;

  // Reset to first page whenever tab, search, or filter criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, companyFilter, statusFilter, workerFilter, barcodeSearch, fromDate, toDate, pageSize]);

  // Apply section separation and filters
  const filteredDiamonds = diamonds.filter((d) => {
    // 1. Two Sections: 'factory' shows all on-stock factory diamonds, 'returned' shows ONLY returned to company
    if (activeTab === 'factory' && d.status === 'RETURNED') return false;
    if (activeTab === 'returned' && d.status !== 'RETURNED') return false;

    if (companyFilter && d.companyId !== companyFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    if (workerFilter && d.assignedWorkerId !== workerFilter) return false;
    if (barcodeSearch) {
      const q = barcodeSearch.toLowerCase();
      const matchBarcode = String(d.barcode || '').toLowerCase().includes(q);
      const matchRough = d.roughCutNo && String(d.roughCutNo).toLowerCase().includes(q);
      const matchSerial = d.serialNo && String(d.serialNo).toLowerCase().includes(q);
      const matchComp = String(d.companyName || '').toLowerCase().includes(q);
      const matchWorker = d.assignedWorkerName && String(d.assignedWorkerName).toLowerCase().includes(q);
      if (!matchBarcode && !matchRough && !matchSerial && !matchComp && !matchWorker) return false;
    }
    if (fromDate && d.receivedDate < fromDate) return false;
    if (toDate && d.receivedDate > toDate) return false;
    return true;
  });

  // Calculate pagination boundaries
  const totalCount = filteredDiamonds.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedDiamonds = filteredDiamonds.slice(startIndex, endIndex);

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
    setCurrentPage(1);
  };

  return (
    <PrivateLayout title="Master Diamond Inventory">
      {/* Filters Toolbar */}
      <div className="card card-custom p-3 p-md-4 mb-4 shadow-sm">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <h6 className="font-heading fw-bold text-navy mb-0 d-flex align-items-center" style={{ color: '#0A192F' }}>
              <Filter size={18} className="me-2 text-warning" /> Filter Diamonds Inventory
            </h6>
            <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' }}>
              Live Match: {filteredDiamonds.length}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-gold rounded-pill px-3 py-1 font-heading fw-bold d-inline-flex align-items-center text-nowrap shadow-sm"
              onClick={() => {}}
              title="Apply Live Search Filters"
            >
              <Search size={14} className="me-1.5" /> Search
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-semibold text-nowrap"
              onClick={clearFilters}
              title="Reset All Filters"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        <div className="row g-2.5 g-md-3">
          <div className="col-xl-3 col-lg-4 col-md-6">
            <label className="form-label small fw-semibold text-muted mb-1">Search Barcode / Worker</label>
            <div className="position-relative">
              <Search size={15} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="KGK001..."
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-xl-2 col-lg-4 col-md-6">
            <label className="form-label small fw-semibold text-muted mb-1">Company</label>
            <select className="form-select form-select-sm" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-xl-2 col-lg-4 col-md-6">
            <label className="form-label small fw-semibold text-muted mb-1">Work Status</label>
            <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {activeTab === 'returned' ? (
                <option value="RETURNED">RETURNED</option>
              ) : (
                <>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN PROGRESS">IN PROGRESS</option>
                  <option value="WORK COMPLETED">WORK COMPLETED</option>
                  <option value="DEPOSITED">DEPOSITED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REWORK">REWORK</option>
                </>
              )}
            </select>
          </div>

          <div className="col-xl-2 col-lg-4 col-md-6">
            <label className="form-label small fw-semibold text-muted mb-1">Assigned Worker</label>
            <select className="form-select form-select-sm" value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}>
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.department})
                </option>
              ))}
            </select>
          </div>

          <div className="col-xl-3 col-lg-8 col-md-12">
            <label className="form-label small fw-semibold text-muted mb-1">Received Date Range</label>
            <div className="row g-2">
              <div className="col-6">
                <input
                  type="date"
                  className="form-control form-control-sm px-2"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  title="From Date"
                />
              </div>
              <div className="col-6">
                <input
                  type="date"
                  className="form-control form-control-sm px-2"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  title="To Date"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Master Inventory Table */}
      <div className="card card-custom p-3 p-sm-4 shadow-sm">
        {/* Two Section Tabs Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 pb-3 border-bottom">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <button
              type="button"
              className={`btn rounded-pill px-3.5 py-2 font-heading fw-bold d-inline-flex align-items-center transition-all ${
                activeTab === 'factory'
                  ? 'btn-navy text-white shadow-sm'
                  : 'btn-outline-secondary border text-secondary bg-white'
              }`}
              style={{
                backgroundColor: activeTab === 'factory' ? '#0A192F' : '#FFFFFF',
                borderColor: activeTab === 'factory' ? '#0A192F' : '#E2E8F0',
                fontSize: '0.85rem'
              }}
              onClick={() => {
                setActiveTab('factory');
                if (statusFilter === 'RETURNED') setStatusFilter('');
              }}
            >
              <Building2 size={16} className={`me-2 ${activeTab === 'factory' ? 'text-warning' : 'text-muted'}`} />
              <span>On Stock Factory</span>
              <span
                className={`badge rounded-pill ms-2 font-mono ${
                  activeTab === 'factory'
                    ? 'bg-warning text-dark'
                    : 'bg-light text-secondary border'
                }`}
                style={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                {factoryStockCount}
              </span>
            </button>

            <button
              type="button"
              className={`btn rounded-pill px-3.5 py-2 font-heading fw-bold d-inline-flex align-items-center transition-all ${
                activeTab === 'returned'
                  ? 'btn-navy text-white shadow-sm'
                  : 'btn-outline-secondary border text-secondary bg-white'
              }`}
              style={{
                backgroundColor: activeTab === 'returned' ? '#0A192F' : '#FFFFFF',
                borderColor: activeTab === 'returned' ? '#0A192F' : '#E2E8F0',
                fontSize: '0.85rem'
              }}
              onClick={() => {
                setActiveTab('returned');
                if (statusFilter && statusFilter !== 'RETURNED') setStatusFilter('');
              }}
            >
              <Send size={15} className={`me-2 ${activeTab === 'returned' ? 'text-warning' : 'text-muted'}`} />
              <span>Return to Company</span>
              <span
                className={`badge rounded-pill ms-2 font-mono ${
                  activeTab === 'returned'
                    ? 'bg-warning text-dark'
                    : 'bg-light text-secondary border'
                }`}
                style={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                {returnedToCompanyCount}
              </span>
            </button>
          </div>

          <button
            className="btn btn-navy-gold rounded-pill px-3 py-1.5 font-heading text-nowrap d-inline-flex align-items-center self-start"
            style={{ fontSize: '0.8rem', gap: '6px' }}
            onClick={() => navigate('/diamond-receiving')}
            title="Receive New Diamonds"
          >
            <Plus size={14} strokeWidth={2.5} style={{ color: '#D4AF37' }} />
            <span>Receive New Diamonds</span>
          </button>
        </div>

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
          <div>
            <h6 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
              {activeTab === 'factory' ? 'Factory Active Stock Inventory' : 'Returned Diamonds Archive'} ({totalCount})
            </h6>
            <small className="text-muted" style={{ fontSize: '0.8rem' }}>
              {totalCount > 0
                ? `Showing ${startIndex + 1}–${endIndex} of ${totalCount} diamonds (Page ${safeCurrentPage} of ${totalPages})`
                : activeTab === 'factory'
                ? 'No active stock diamonds matching current criteria'
                : 'No returned diamonds matching current criteria'}
            </small>
          </div>
        </div>

        <div className="table-responsive rounded border">
          <table className="table table-custom table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Company</th>
                <th>Shape</th>
                <th>Orig Weight</th>
                <th>Actual Weight</th>
                <th>Received Date</th>
                <th>Assigned Worker</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {totalCount === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No diamond records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedDiamonds.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="font-heading fw-bold text-navy fs-6" style={{ color: '#0A192F' }}>
                        {d.barcode}
                      </span>
                      {(d.roughCutNo || d.serialNo) ? (
                        <div className="mt-1 d-flex flex-wrap gap-1">
                          {d.roughCutNo && (
                            <span
                              className="badge font-mono rounded-pill px-2.5 py-1"
                              style={{
                                backgroundColor: '#F1F5F9',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.72rem',
                                fontWeight: 600
                              }}
                            >
                              Rough: #{d.roughCutNo}
                            </span>
                          )}
                          {d.serialNo && (
                            <span
                              className="badge font-mono rounded-pill px-2 py-0.5"
                              style={{
                                backgroundColor: '#FEF3C7',
                                color: '#92400E',
                                border: '1px solid #FDE68A',
                                fontSize: '0.70rem',
                                fontWeight: 600
                              }}
                            >
                              Sr: #{d.serialNo}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{d.companyName}</span>
                      <span className="badge bg-light text-navy border ms-2">{d.companyCode}</span>
                    </td>
                    <td className="small">{d.shape || d.size || '-'}</td>
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
                    <td className="text-nowrap">
                      <Badge status={d.status} />
                    </td>
                    <td className="text-end text-nowrap">
                      <div className="d-flex justify-content-end align-items-center gap-2">
                        {/* Edit Details Action (Only for diamonds not returned to company) */}
                        {d.status !== 'RETURNED' && (
                          <button
                            type="button"
                            className="btn btn-compact-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center"
                            onClick={() => setEditingDiamond(d)}
                            title="Edit Diamond Details"
                            style={{
                              borderColor: '#CBD5E1',
                              color: '#334155',
                              backgroundColor: '#FFFFFF',
                              transition: 'all 0.15s ease-in-out'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F1F5F9';
                              e.currentTarget.style.borderColor = '#94A3B8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#FFFFFF';
                              e.currentTarget.style.borderColor = '#CBD5E1';
                            }}
                          >
                            <Edit size={13} className="me-1 text-primary" /> Edit
                          </button>
                        )}

                        <button
                          className="btn btn-compact-sm btn-outline-primary rounded-pill d-inline-flex align-items-center"
                          onClick={() => handleOpenTimeline(d)}
                        >
                          <Eye size={13} className="me-1" /> History
                        </button>

                        {/* Quick action button dependent on status */}
                        {d.status === 'RECEIVED' && (
                          <button
                            className="btn btn-compact-sm btn-gold rounded-pill ms-1"
                            onClick={() => navigate(`/assignment?barcode=${d.barcode}`)}
                          >
                            Assign Worker
                          </button>
                        )}
                        {d.status === 'DEPOSITED' && (
                          <button
                            className="btn btn-compact-sm btn-success rounded-pill ms-1"
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

        {/* Enhanced Pagination Controls */}
        {totalCount > 0 && (
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 pt-3 mt-3 border-top">
            {/* Left: Summary and Page Size Selector */}
            <div className="d-flex align-items-center flex-wrap gap-2 text-muted small">
              <span>
                Showing <strong className="text-dark font-mono">{startIndex + 1}</strong> to{' '}
                <strong className="text-dark font-mono">{endIndex}</strong> of{' '}
                <strong className="text-navy font-mono" style={{ color: '#0A192F' }}>{totalCount}</strong> diamonds
              </span>
              <span className="text-muted d-none d-sm-inline">•</span>
              <div className="d-inline-flex align-items-center gap-1.5">
                <label htmlFor="pageSizeSelect" className="text-muted small mb-0 text-nowrap">Show per page:</label>
                <select
                  id="pageSizeSelect"
                  className="form-select form-select-sm py-1 px-2 fw-semibold border shadow-none"
                  style={{ width: 'auto', minWidth: '70px', fontSize: '0.8rem' }}
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Right: Page Navigation Buttons */}
            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1 d-flex align-items-center justify-content-center shadow-none"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                title="First Page"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1 d-flex align-items-center justify-content-center shadow-none"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Numbered Page Buttons */}
              <div className="d-flex align-items-center gap-1 mx-1">
                {(() => {
                  const pages = [];
                  const maxButtons = 5;
                  let start = Math.max(1, safeCurrentPage - 2);
                  let end = Math.min(totalPages, start + maxButtons - 1);
                  if (end - start + 1 < maxButtons) {
                    start = Math.max(1, end - maxButtons + 1);
                  }
                  for (let p = start; p <= end; p++) {
                    pages.push(p);
                  }
                  return pages.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`btn btn-sm rounded-pill fw-bold font-mono px-2.5 py-1 ${
                        p === safeCurrentPage
                          ? 'btn-navy text-white shadow-xs'
                          : 'btn-outline-secondary border-0 text-dark'
                      }`}
                      style={{
                        minWidth: '32px',
                        height: '32px',
                        backgroundColor: p === safeCurrentPage ? '#0A192F' : 'transparent',
                        borderColor: p === safeCurrentPage ? '#0A192F' : 'transparent',
                        fontSize: '0.825rem'
                      }}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ));
                })()}
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1 d-flex align-items-center justify-content-center shadow-none"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1 d-flex align-items-center justify-content-center shadow-none"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                title="Last Page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Modal */}
      <DiamondTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        diamond={selectedDiamond}
      />

      {/* Edit Diamond Modal */}
      <EditDiamondModal
        isOpen={Boolean(editingDiamond)}
        onClose={() => setEditingDiamond(null)}
        diamond={editingDiamond}
        onSave={updateDiamond}
        companies={companies}
        allDiamonds={diamonds}
      />
    </PrivateLayout>
  );
};

export default DiamondList;
