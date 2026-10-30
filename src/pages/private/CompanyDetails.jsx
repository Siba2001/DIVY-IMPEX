import React, { useState } from 'react';
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
  Scale
} from 'lucide-react';

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { companies, diamonds, deleteCompany } = useDiamonds();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiamond, setSelectedDiamond] = useState(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

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
  let companyDiamonds = diamonds.filter((d) => d.companyId === company.id);

  if (searchTerm) {
    companyDiamonds = companyDiamonds.filter((d) =>
      String(d.barcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.assignedWorkerName && String(d.assignedWorkerName).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  if (fromDate) {
    companyDiamonds = companyDiamonds.filter((d) => d.receivedDate >= fromDate);
  }
  if (toDate) {
    companyDiamonds = companyDiamonds.filter((d) => d.receivedDate <= toDate);
  }

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
          <div className="col-12 col-sm-6 col-lg-4">
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="col-12 col-lg-4">
            <label className="form-label">Search Diamond / Worker</label>
            <div className="position-relative">
              <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Barcode or worker name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
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
        <h6 className="font-heading fw-bold text-navy mb-3 d-flex align-items-center" style={{ color: '#0A192F' }}>
          <Gem size={18} className="me-2 text-warning" /> Individual Diamond Records
        </h6>
        <div className="table-responsive">
          <table className="table table-custom table-sticky-first table-hover align-middle mb-0">
            <thead>
              <tr>
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
                  <td colSpan="9" className="text-center py-4 text-muted">No diamonds found matching current search.</td>
                </tr>
              ) : (
                companyDiamonds.map((d) => (
                  <tr key={d.id}>
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
