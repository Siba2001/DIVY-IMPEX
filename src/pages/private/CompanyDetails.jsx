import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import DiamondTimelineModal from '../../components/timeline/DiamondTimelineModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useDiamonds } from '../../context/DiamondContext';
import {
  Building2,
  Gem,
  CheckCircle2,
  Clock,
  Activity,
  ArrowLeft,
  Search,
  Calendar,
  Eye,
  Filter,
  Trash2,
  FileBarChart2,
  Truck,
  Scale,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { companies, diamonds, deleteCompany } = useDiamonds();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiamond, setSelectedDiamond] = useState(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // Pagination for Individual Diamond Records
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const company = companies.find((c) => c.id === id);

  if (!company) {
    return (
      <PrivateLayout title="Company Not Found">
        <div className="text-center py-5">
          <h5>Company record not found.</h5>
          <button className="btn btn-navy mt-3" onClick={() => navigate('/companies')}>
            Back to Companies List
          </button>
        </div>
      </PrivateLayout>
    );
  }

  // Filter diamonds belonging to this company
  const companyDiamonds = useMemo(() => {
    return diamonds.filter((d) => {
      if (d.companyId !== company.id) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      if (fromDate && d.receivedDate < fromDate) return false;
      if (toDate && d.receivedDate > toDate) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchBarcode = String(d.barcode || '').toLowerCase().includes(q);
        const matchRough = d.roughCutNo && String(d.roughCutNo).toLowerCase().includes(q);
        const matchWorker = d.assignedWorkerName && String(d.assignedWorkerName).toLowerCase().includes(q);
        const matchShape = String(d.shape || d.size || '').toLowerCase().includes(q);
        if (!matchBarcode && !matchRough && !matchWorker && !matchShape) return false;
      }
      return true;
    });
  }, [diamonds, company.id, statusFilter, fromDate, toDate, searchTerm]);

  // Calculate pagination boundaries for Individual Diamond Records
  const totalCount = companyDiamonds.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedDiamonds = companyDiamonds.slice(startIndex, endIndex);

  // Helper for safe weight extraction
  const getWeight = (d) => parseFloat(d?.weight) || 0;
  const getActualOrOrigWeight = (d) => parseFloat(d?.actualWeight || d?.weight) || 0;

  // Calculate aggregates (Pieces & Carat Weights) with 100% mathematical integrity
  const totalReceived = companyDiamonds.length;
  const totalReceivedWeight = companyDiamonds.reduce((sum, d) => sum + getWeight(d), 0);

  const submittedDiamonds = companyDiamonds.filter((d) => d.status === 'RETURNED');
  const submitted = submittedDiamonds.length;
  const submittedWeight = submittedDiamonds.reduce((sum, d) => sum + getActualOrOrigWeight(d), 0);

  const inFactoryDiamonds = companyDiamonds.filter((d) => d.status !== 'RETURNED');
  const inFactoryBalance = inFactoryDiamonds.length;
  const inFactoryWeight = inFactoryDiamonds.reduce((sum, d) => sum + getActualOrOrigWeight(d), 0);

  const completedDiamonds = companyDiamonds.filter((d) => ['COMPLETED', 'VERIFIED'].includes(d.status));
  const completed = completedDiamonds.length;
  const completedWeight = completedDiamonds.reduce((sum, d) => sum + getActualOrOrigWeight(d), 0);

  const inProductionDiamonds = companyDiamonds.filter((d) => ['IN PROGRESS', 'WORK COMPLETED'].includes(d.status));
  const inProduction = inProductionDiamonds.length;
  const inProductionWeight = inProductionDiamonds.reduce((sum, d) => sum + getActualOrOrigWeight(d), 0);

  const pendingDiamonds = companyDiamonds.filter((d) => ['RECEIVED', 'ASSIGNED', 'DEPOSITED', 'REWORK'].includes(d.status));
  const pending = pendingDiamonds.length;
  const pendingWeight = pendingDiamonds.reduce((sum, d) => sum + getWeight(d), 0);

  // Group date-wise summary with 100% mathematical integrity (received = submitted + inFactory)
  const dateWiseMap = {};
  companyDiamonds.forEach((d) => {
    const dDate = d.receivedDate || '2026-10-01';
    if (!dateWiseMap[dDate]) {
      dateWiseMap[dDate] = {
        date: dDate,
        received: 0,
        receivedWeight: 0,
        inFactory: 0,
        inFactoryWeight: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0,
        completedWeight: 0,
        submitted: 0,
        submittedWeight: 0,
        pending: 0,
        pendingWeight: 0
      };
    }
    const origW = getWeight(d);
    const effW = getActualOrOrigWeight(d);

    dateWiseMap[dDate].received += 1;
    dateWiseMap[dDate].receivedWeight += origW;

    if (d.status === 'RETURNED') {
      dateWiseMap[dDate].submitted += 1;
      dateWiseMap[dDate].submittedWeight += effW;
    } else {
      dateWiseMap[dDate].inFactory += 1;
      dateWiseMap[dDate].inFactoryWeight += effW;
      if (d.status === 'ASSIGNED') {
        dateWiseMap[dDate].assigned += 1;
      } else if (['IN PROGRESS', 'WORK COMPLETED'].includes(d.status)) {
        dateWiseMap[dDate].inProgress += 1;
      } else if (['COMPLETED', 'VERIFIED', 'DEPOSITED'].includes(d.status)) {
        dateWiseMap[dDate].completed += 1;
        dateWiseMap[dDate].completedWeight += effW;
      } else {
        // RECEIVED, REWORK, and any other initial pending status
        dateWiseMap[dDate].pending += 1;
        dateWiseMap[dDate].pendingWeight += origW;
      }
    }
  });

  const dateWiseSummary = Object.values(dateWiseMap).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleOpenTimeline = (diamond, e) => {
    e.stopPropagation();
    setSelectedDiamond(diamond);
    setIsTimelineOpen(true);
  };

  const confirmDeleteCompany = async () => {
    setIsDeleting(true);
    try {
      await deleteCompany(company.id);
      setShowDeleteModal(false);
      navigate('/companies');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PrivateLayout title={`Company Profile - ${company.name}`}>
      {/* Header Info Banner */}
      <div className="card card-custom p-3 p-md-4 mb-3 shadow-sm">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
          <div className="d-flex align-items-start align-items-sm-center">
            <button className="btn btn-light border rounded-circle p-2 me-3 flex-shrink-0" onClick={() => navigate('/companies')}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                  {company.name}
                </h4>
                <span className="badge font-mono fw-bold px-2.5 py-1.5" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>{company.code}</span>
              </div>
              <p className="text-muted small mb-0">
                Contact: <strong>{company.contactPerson || '-'}</strong> {company.phone && <>| Phone: <a href={`tel:${company.phone}`} className="text-decoration-none">{company.phone}</a></>} {company.address && `| Location: ${company.address}`}
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap w-100 w-lg-auto">
            <button
              className="btn btn-outline-dark rounded-pill px-3 py-2 font-heading fw-semibold text-nowrap d-inline-flex align-items-center justify-content-center shadow-sm flex-grow-1 flex-lg-grow-0"
              onClick={() => navigate(`/reports?company=${company.id}&type=1`)}
              title="View Monthly Stock & Shape Matrix Report"
            >
              <FileBarChart2 size={16} className="me-1.5 text-primary" /> Monthly Stock Report
            </button>
            <button
              className="btn btn-navy rounded-pill px-3 py-2 font-heading fw-semibold text-nowrap d-inline-flex align-items-center justify-content-center flex-grow-1 flex-lg-grow-0"
              onClick={() => navigate(`/diamond-receiving?company=${company.id}`)}
            >
              + Receive Batch
            </button>
            <button
              className="btn btn-outline-danger rounded-pill px-3 py-2 font-heading fw-semibold text-nowrap d-inline-flex align-items-center justify-content-center flex-grow-1 flex-lg-grow-0"
              onClick={() => setShowDeleteModal(true)}
              title="Delete Company"
            >
              <Trash2 size={15} className="me-1.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (Detailed Breakdown) */}
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="Total Received"
            value={totalReceived}
            unit="pcs"
            weight={totalReceivedWeight}
            weightLabel="Inward Wt"
            icon={Gem}
            colorType="diamonds"
            subtitle="All-time Inward"
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="In-Factory Stock"
            value={inFactoryBalance}
            unit="pcs"
            weight={inFactoryWeight}
            weightLabel="Stock Wt"
            icon={CheckCircle2}
            colorType="balance"
            subtitle="Active Balance"
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="Submitted to Co."
            value={submitted}
            unit="pcs"
            weight={submittedWeight}
            weightLabel="Return Wt"
            icon={Truck}
            colorType="submitted"
            subtitle="Returned to Client"
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="In Production"
            value={inProduction}
            unit="pcs"
            weight={inProductionWeight}
            weightLabel="Active Wt"
            icon={Activity}
            colorType="production"
            subtitle="Active on Sockets"
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="Total Pending"
            value={pending}
            unit="pcs"
            weight={pendingWeight}
            weightLabel="Pending Wt"
            icon={Clock}
            colorType="pending"
            subtitle="Awaiting Work/QC"
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="Completed Ready"
            value={completed}
            unit="pcs"
            weight={completedWeight}
            weightLabel="Ready Wt"
            icon={CheckCircle2}
            colorType="completed"
            subtitle="Ready for Dispatch"
          />
        </div>
      </div>

      {/* Date Filter & Search Section */}
      <div className="card card-custom p-3 p-md-4 mb-4 shadow-sm">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label">Stage Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="RECEIVED">RECEIVED (Inward)</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
              <option value="WORK COMPLETED">WORK COMPLETED</option>
              <option value="DEPOSITED">DEPOSITED</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="RETURNED">RETURNED</option>
              <option value="REWORK">REWORK</option>
            </select>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label">Search Diamond / Worker</label>
            <div className="position-relative">
              <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Barcode or worker name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {(fromDate || toDate || statusFilter || searchTerm) && (
          <div className="mt-3 pt-2 border-top d-flex justify-content-end">
            <button
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1"
              style={{ fontSize: '0.8rem' }}
              onClick={() => {
                setFromDate('');
                setToDate('');
                setStatusFilter('');
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Date-Wise Summary Table */}
      <div className="card card-custom p-3 p-md-4 mb-4 shadow-sm">
        <h6 className="font-heading fw-bold text-navy mb-3 d-flex align-items-center" style={{ color: '#0A192F' }}>
          <Calendar size={18} className="me-2 text-warning" /> Date-Wise Batch Production Summary
        </h6>
        <div className="table-responsive">
          <table className="table table-custom table-sticky-first text-center align-middle mb-0">
            <thead>
              <tr>
                <th className="text-start text-nowrap">RECEIVED DATE</th>
                <th className="text-nowrap text-center">RECEIVED</th>
                <th className="text-nowrap text-center">IN-FACTORY</th>
                <th className="text-nowrap text-center">ASSIGNED</th>
                <th className="text-nowrap text-center">IN PROGRESS</th>
                <th className="text-nowrap text-center">COMPLETED</th>
                <th className="text-nowrap text-center">SUBMITTED</th>
                <th className="text-nowrap text-center">PENDING</th>
              </tr>
            </thead>
            <tbody>
              {dateWiseSummary.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-muted py-3">No date summary available for selected filters.</td>
                </tr>
              ) : (
                dateWiseSummary.map((row) => (
                  <tr key={row.date}>
                    <td className="text-start fw-bold text-navy text-nowrap" style={{ color: '#0A192F' }}>{row.date}</td>
                    <td className="fw-semibold text-center">{row.received}</td>
                    <td className="text-center"><span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>{row.inFactory}</span></td>
                    <td className="text-center"><span className="badge font-mono fw-bold px-2.5 py-1.5" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>{row.assigned}</span></td>
                    <td className="text-center"><span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>{row.inProgress}</span></td>
                    <td className="text-center"><span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>{row.completed}</span></td>
                    <td className="text-center"><span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>{row.submitted}</span></td>
                    <td className="text-center"><span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>{row.pending}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Diamond Records Table */}
      <div className="card card-custom p-3 p-md-4 shadow-sm">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <h6 className="font-heading fw-bold text-navy mb-0 d-flex align-items-center" style={{ color: '#0A192F' }}>
              <Gem size={18} className="me-2 text-warning" /> Individual Diamond Records
            </h6>
            <span className="badge font-mono fw-bold px-2.5 py-1" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>
              {companyDiamonds.length} Total
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-custom table-sticky-first table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: '45px' }} className="text-nowrap">#</th>
                <th className="text-nowrap">Barcode</th>
                <th className="text-nowrap">Shape</th>
                <th className="text-nowrap">Rough Wt (ct)</th>
                <th className="text-nowrap">Actual Wt (ct)</th>
                <th className="text-nowrap">Received Date</th>
                <th className="text-nowrap">Assigned Worker</th>
                <th className="text-nowrap">Status</th>
                <th className="text-nowrap">Completed Date</th>
                <th className="text-end text-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companyDiamonds.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-muted">No diamonds found matching current search.</td>
                </tr>
              ) : (
                paginatedDiamonds.map((d, idx) => (
                  <tr key={d.id}>
                    <td className="text-muted small font-mono fw-semibold">
                      {startIndex + idx + 1}
                    </td>
                    <td>
                      <span className="font-heading fw-bold text-navy" style={{ color: '#0A192F' }}>{d.barcode}</span>
                    </td>
                    <td className="small">{d.shape || d.size || '-'}</td>
                    <td className="fw-semibold font-mono">{d.weight} ct</td>
                    <td className="small font-mono text-muted">{d.actualWeight ? `${d.actualWeight} ct` : '—'}</td>
                    <td className="small text-muted">{d.receivedDate}</td>
                    <td>{d.assignedWorkerName || <span className="text-muted small">Unassigned</span>}</td>
                    <td><Badge status={d.status} /></td>
                    <td className="small text-muted">{d.completedDate || '-'}</td>
                    <td className="text-end text-nowrap">
                      <button
                        className="btn btn-compact-sm btn-outline-primary rounded-pill"
                        onClick={(e) => handleOpenTimeline(d, e)}
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
                <label htmlFor="companyPageSizeSelect" className="text-muted small mb-0 text-nowrap">Show per page:</label>
                <select
                  id="companyPageSizeSelect"
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

      {/* Diamond History Timeline Modal */}
      <DiamondTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        diamond={selectedDiamond}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={confirmDeleteCompany}
        isLoading={isDeleting}
        title="Delete Client Company"
        message={`Are you sure you want to permanently delete "${company.name}" (${company.code})?${companyDiamonds.length > 0 ? ` WARNING: This company currently has ${companyDiamonds.length} associated diamond records in the system.` : ''} This action cannot be undone.`}
        confirmText="Delete Company"
        cancelText="Keep Company"
        confirmVariant="danger"
        icon="delete"
      />
    </PrivateLayout>
  );
};

export default CompanyDetails;
