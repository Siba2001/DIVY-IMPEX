import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import DiamondTimelineModal from '../../components/timeline/DiamondTimelineModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useDiamonds } from '../../context/DiamondContext';
import {
  ArrowLeft,
  HardHat,
  Gem,
  CheckCircle2,
  Clock,
  Activity,
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

const WorkerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workers, diamonds, deleteWorker } = useDiamonds();

  const [selectedDiamond, setSelectedDiamond] = useState(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination & Filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const worker = workers.find((w) => w.id === id);

  if (!worker) {
    return (
      <PrivateLayout title="Worker Not Found">
        <div className="text-center py-5">
          <h5>Worker record not found.</h5>
          <button className="btn btn-navy mt-3" onClick={() => navigate('/workers')}>
            Back to Workers Roster
          </button>
        </div>
      </PrivateLayout>
    );
  }

  const workerDiamonds = useMemo(() => {
    return diamonds.filter((d) => d.assignedWorkerId === worker.id);
  }, [diamonds, worker.id]);

  const totalAssigned = workerDiamonds.length;
  const inProgress = workerDiamonds.filter((d) => ['IN PROGRESS', 'WORK COMPLETED'].includes(d.status)).length;
  const completed = workerDiamonds.filter((d) => ['COMPLETED', 'VERIFIED', 'DEPOSITED'].includes(d.status)).length;
  const pending = workerDiamonds.filter((d) => ['ASSIGNED', 'REWORK'].includes(d.status)).length;

  // Filter diamonds based on search and status
  const filteredDiamonds = useMemo(() => {
    return workerDiamonds.filter((d) => {
      if (statusFilter && d.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchBarcode = String(d.barcode || '').toLowerCase().includes(q);
        const matchComp = String(d.companyName || '').toLowerCase().includes(q);
        const matchCode = String(d.companyCode || '').toLowerCase().includes(q);
        const matchShape = String(d.shape || d.size || '').toLowerCase().includes(q);
        if (!matchBarcode && !matchComp && !matchCode && !matchShape) return false;
      }
      return true;
    });
  }, [workerDiamonds, searchTerm, statusFilter]);

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

  const confirmDeleteWorker = async () => {
    setIsDeleting(true);
    try {
      await deleteWorker(worker.id);
      setShowDeleteModal(false);
      navigate('/workers');
    } catch (err) {
      console.error('Failed to delete worker', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PrivateLayout title={`Artisan Profile - ${worker.name}`}>
      {/* Header Info */}
      <div className="card card-custom p-4 mb-4 shadow-sm">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
          <div className="d-flex align-items-center">
            <button className="btn btn-light border rounded-circle p-2 me-3" onClick={() => navigate('/workers')}>
              <ArrowLeft size={18} />
            </button>
            <div className="avatar bg-navy text-warning rounded-circle me-3 fw-bold fs-4 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#0A192F' }}>
              <HardHat size={24} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                  {worker.name}
                </h4>
                <span className="badge bg-light text-navy border font-mono">{worker.employeeId}</span>
                <span className="badge bg-success-subtle text-success border border-success-subtle ms-1">{worker.status}</span>
              </div>
              <p className="text-muted small mb-0 mt-1">
                Department: <strong>{worker.department}</strong> | Phone: {worker.phone}
              </p>
            </div>
          </div>
          <button
            className="btn btn-outline-danger rounded-pill px-3 py-1.5 font-heading fw-semibold text-nowrap d-inline-flex align-items-center align-self-start align-self-sm-center"
            onClick={() => setShowDeleteModal(true)}
            title="Delete Worker"
          >
            <Trash2 size={15} className="me-1.5" /> Delete Artisan
          </button>
        </div>
      </div>

      {/* Stats KPI */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <StatCard title="Total Assigned" value={totalAssigned} icon={Gem} colorType="total" />
        </div>
        <div className="col-md-3">
          <StatCard title="In Progress" value={inProgress} icon={Activity} colorType="production" />
        </div>
        <div className="col-md-3">
          <StatCard title="Completed" value={completed} icon={CheckCircle2} colorType="completed" />
        </div>
        <div className="col-md-3">
          <StatCard title="Pending Deposit" value={pending} icon={Clock} colorType="pending" />
        </div>
      </div>

      {/* Assigned Diamond History Table */}
      <div className="card card-custom p-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <h6 className="font-heading fw-bold text-navy mb-0 d-flex align-items-center" style={{ color: '#0A192F' }}>
              <Gem size={18} className="me-2 text-warning" /> Diamond Work Assignment History
            </h6>
            <span className="badge font-mono fw-bold px-2.5 py-1" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>
              {workerDiamonds.length} Total
            </span>
          </div>

          {/* Quick Search & Status Filter */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="position-relative" style={{ minWidth: '180px' }}>
              <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted" />
              <input
                type="text"
                className="form-control form-control-sm ps-4 pe-2"
                placeholder="Search barcode or company..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <select
              className="form-select form-select-sm fw-medium"
              style={{ width: 'auto', minWidth: '130px', fontSize: '0.825rem' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
              <option value="WORK COMPLETED">WORK COMPLETED</option>
              <option value="DEPOSITED">DEPOSITED</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="RETURNED">RETURNED</option>
              <option value="REWORK">REWORK</option>
            </select>

            {(searchTerm || statusFilter) && (
              <button
                className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1"
                style={{ fontSize: '0.78rem' }}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Company</th>
                <th>Shape</th>
                <th>Weight</th>
                <th>Assigned Date</th>
                <th>Completed Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workerDiamonds.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No diamond assignments recorded for this worker.
                  </td>
                </tr>
              ) : filteredDiamonds.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No diamonds found matching your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedDiamonds.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="font-heading fw-bold text-navy">{d.barcode}</span>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{d.companyName}</span>
                      <span className="badge bg-light text-navy border ms-2">{d.companyCode}</span>
                    </td>
                    <td className="small">{d.shape || d.size || '-'}</td>
                    <td className="fw-semibold">{d.weight} ct</td>
                    <td className="small text-muted">{d.assignedDate || d.receivedDate}</td>
                    <td className="small text-muted">{d.completedDate || '-'}</td>
                    <td>
                      <Badge status={d.status} />
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        onClick={() => handleOpenTimeline(d)}
                      >
                        <Eye size={14} className="me-1" /> View Timeline
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
                Showing <strong className="text-dark font-mono">{startIndex + 1}</strong> to{' '}
                <strong className="text-dark font-mono">{endIndex}</strong> of{' '}
                <strong className="text-navy font-mono" style={{ color: '#0A192F' }}>{totalCount}</strong> assignments
              </span>
              <span className="text-muted d-none d-sm-inline">•</span>
              <div className="d-inline-flex align-items-center gap-1.5">
                <label htmlFor="workerPageSizeSelect" className="text-muted small mb-0 text-nowrap">Show per page:</label>
                <select
                  id="workerPageSizeSelect"
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
                      className={`btn btn-sm rounded-pill fw-bold font-mono px-2.5 py-1 ${p === safeCurrentPage
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={confirmDeleteWorker}
        isLoading={isDeleting}
        title="Delete Artisan Worker"
        message={`Are you sure you want to permanently delete artisan "${worker.name}" (${worker.employeeId || 'ID Pending'})?${totalAssigned > 0
            ? ` WARNING: This artisan has ${totalAssigned} diamond records in their assignment history.`
            : ''
          } This action cannot be undone.`}
        confirmText="Delete Worker"
        cancelText="Keep Worker"
        confirmVariant="danger"
        icon="delete"
      />
    </PrivateLayout>
  );
};

export default WorkerDetails;
