import React, { useState, useMemo } from 'react';
import PrivateLayout from '../../layouts/PrivateLayout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import DiamondTimelineModal from '../../components/timeline/DiamondTimelineModal';
import { useDiamonds } from '../../context/DiamondContext';
import {
  Layers,
  Search,
  Eye,
  Gem,
  Truck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

const Stock = () => {
  const { diamonds, companies } = useDiamonds();

  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [selectedDiamond, setSelectedDiamond] = useState(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // Status Counts
  const receivedCount = diamonds.filter((d) => d.status === 'RECEIVED').length;
  const assignedCount = diamonds.filter((d) => d.status === 'ASSIGNED').length;
  const inProgressCount = diamonds.filter((d) => d.status === 'IN PROGRESS').length;
  const workCompletedCount = diamonds.filter((d) => d.status === 'WORK COMPLETED').length;
  const depositedCount = diamonds.filter((d) => d.status === 'DEPOSITED').length;
  const verifiedCount = diamonds.filter((d) => d.status === 'VERIFIED').length;
  const completedCount = diamonds.filter((d) => d.status === 'COMPLETED').length;
  const returnedCount = diamonds.filter((d) => d.status === 'RETURNED').length;
  const pendingCount = diamonds.filter((d) => ['RECEIVED', 'ASSIGNED', 'IN PROGRESS', 'REWORK'].includes(d.status)).length;
  const reworkCount = diamonds.filter((d) => d.status === 'REWORK').length;

  const filteredDiamonds = useMemo(() => {
    return diamonds.filter((d) => {
      if (companyFilter && d.companyId !== companyFilter) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      if (dateFilter && d.receivedDate !== dateFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          String(d.barcode || '').toLowerCase().includes(q) ||
          (d.roughCutNo && String(d.roughCutNo).toLowerCase().includes(q)) ||
          String(d.companyName || '').toLowerCase().includes(q) ||
          (d.assignedWorkerName && String(d.assignedWorkerName).toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [diamonds, companyFilter, statusFilter, dateFilter, searchTerm]);

  // Pagination Calculations
  const totalCount = filteredDiamonds.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  const paginatedDiamonds = useMemo(() => {
    return filteredDiamonds.slice(startIndex, endIndex);
  }, [filteredDiamonds, startIndex, endIndex]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCompanyFilter('');
    setStatusFilter('');
    setDateFilter('');
    setCurrentPage(1);
  };

  const handleOpenTimeline = (diamond) => {
    setSelectedDiamond(diamond);
    setIsTimelineOpen(true);
  };

  return (
    <PrivateLayout title="Stock & Vault Inventory Overview">
      {/* 9 Stage KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="Received" value={receivedCount} icon={Gem} colorType="received" />
        </div>
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="Assigned" value={assignedCount} icon={Layers} colorType="total" />
        </div>
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="In Progress" value={inProgressCount} icon={Layers} colorType="production" />
        </div>
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="Work Completed" value={workCompletedCount} icon={Layers} colorType="completed" />
        </div>
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="Deposited in QC" value={depositedCount} icon={Layers} colorType="deposited" />
        </div>
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="Verified" value={verifiedCount} icon={Layers} colorType="verified" />
        </div>
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="Completed Ready" value={completedCount} icon={Layers} colorType="completed" />
        </div>
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="Submitted to Co." value={returnedCount} icon={Truck} colorType="submitted" />
        </div>
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="Pending Vault" value={pendingCount} icon={Layers} colorType="pending" />
        </div>
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="Flagged Rework" value={reworkCount} icon={Layers} colorType="pending" />
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card card-custom card-static p-4 mb-4 shadow-sm">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Search Barcode / Company / Worker</label>
            <div className="position-relative">
              <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label">Filter Company</label>
            <select
              className="form-select"
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Filter Stage Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
              <option value="WORK COMPLETED">WORK COMPLETED</option>
              <option value="DEPOSITED">DEPOSITED</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="COMPLETED">COMPLETED (Ready to Submit)</option>
              <option value="RETURNED">RETURNED / SUBMITTED TO CO.</option>
              <option value="REWORK">REWORK</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label">Received Date</label>
            <input
              type="date"
              className="form-control"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Stock Inventory Breakdown Table */}
      <div className="card card-custom card-static p-4 shadow-sm">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
          <h6 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
            Detailed Vault & Stock Breakdown ({totalCount})
          </h6>
          {(searchTerm || companyFilter || statusFilter || dateFilter) && (
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 text-decoration-none small"
              onClick={handleClearFilters}
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>Barcode</th>
                <th>Company</th>
                <th>Shape</th>
                <th>Orig Weight</th>
                <th>Actual Weight</th>
                <th>Worker</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDiamonds.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No stock records found matching filters.
                  </td>
                </tr>
              ) : (
                paginatedDiamonds.map((d, idx) => (
                  <tr key={d.id}>
                    <td className="text-muted small font-mono fw-semibold">
                      {startIndex + idx + 1}
                    </td>
                    <td>
                      <span className="font-heading fw-bold text-navy">{d.barcode}</span>
                      {d.roughCutNo ? (
                        <div className="mt-0.5">
                          <span
                            className="badge font-mono rounded-pill px-2 py-0.5"
                            style={{
                              backgroundColor: '#F1F5F9',
                              color: '#334155',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.7rem',
                              fontWeight: 600
                            }}
                          >
                            Rough: #{d.roughCutNo}
                          </span>
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
                    <td>{d.assignedWorkerName || <span className="text-muted small">Unassigned</span>}</td>
                    <td>
                      <Badge status={d.status} />
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        className="btn btn-compact-sm btn-outline-primary rounded-pill"
                        onClick={() => handleOpenTimeline(d)}
                      >
                        <Eye size={13} className="me-1" /> History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalCount > 0 && (
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 pt-3 mt-3 border-top">
            {/* Left: Summary and Page Size Selector */}
            <div className="d-flex align-items-center flex-wrap gap-2 text-muted small">
              <span>
                Showing Sr No <strong className="text-dark font-mono">{startIndex + 1}</strong> to{' '}
                <strong className="text-dark font-mono">{endIndex}</strong> of{' '}
                <strong className="text-navy font-mono" style={{ color: '#0A192F' }}>{totalCount}</strong> diamonds
              </span>
              <span className="text-muted d-none d-sm-inline">•</span>
              <div className="d-inline-flex align-items-center gap-1.5">
                <label htmlFor="stockPageSizeSelect" className="text-muted small mb-0 text-nowrap">Show per page:</label>
                <select
                  id="stockPageSizeSelect"
                  className="form-select form-select-sm py-1 px-2 fw-semibold border shadow-none"
                  style={{ width: 'auto', minWidth: '70px', fontSize: '0.8rem' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
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

      <DiamondTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        diamond={selectedDiamond}
      />
    </PrivateLayout>
  );
};

export default Stock;
