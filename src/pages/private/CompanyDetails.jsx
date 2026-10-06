import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import DiamondTimelineModal from '../../components/timeline/DiamondTimelineModal';
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
  Filter
} from 'lucide-react';

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companies, diamonds } = useDiamonds();

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

  // Apply Search & Date Filters
  if (searchTerm) {
    companyDiamonds = companyDiamonds.filter((d) =>
      d.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.assignedWorkerName && d.assignedWorkerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  if (fromDate) {
    companyDiamonds = companyDiamonds.filter((d) => d.receivedDate >= fromDate);
  }
  if (toDate) {
    companyDiamonds = companyDiamonds.filter((d) => d.receivedDate <= toDate);
  }

  // Calculate aggregates
  const totalReceived = companyDiamonds.length;
  const inProduction = companyDiamonds.filter((d) => d.status === 'IN PROGRESS').length;
  const pending = companyDiamonds.filter((d) => ['RECEIVED', 'ASSIGNED', 'REWORK'].includes(d.status)).length;
  const completed = companyDiamonds.filter((d) => d.status === 'COMPLETED' || d.status === 'VERIFIED').length;

  // Group date-wise summary
  const dateWiseMap = {};
  companyDiamonds.forEach((d) => {
    const dDate = d.receivedDate || '2026-10-01';
    if (!dateWiseMap[dDate]) {
      dateWiseMap[dDate] = {
        date: dDate,
        received: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0,
        pending: 0
      };
    }
    dateWiseMap[dDate].received += 1;
    if (d.status === 'ASSIGNED') dateWiseMap[dDate].assigned += 1;
    if (d.status === 'IN PROGRESS') dateWiseMap[dDate].inProgress += 1;
    if (d.status === 'COMPLETED' || d.status === 'VERIFIED') dateWiseMap[dDate].completed += 1;
    if (['RECEIVED', 'ASSIGNED', 'IN PROGRESS', 'REWORK'].includes(d.status)) dateWiseMap[dDate].pending += 1;
  });

  const dateWiseSummary = Object.values(dateWiseMap).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleOpenTimeline = (diamond, e) => {
    e.stopPropagation();
    setSelectedDiamond(diamond);
    setIsTimelineOpen(true);
  };

  return (
    <PrivateLayout title={`Company Profile - ${company.name}`}>
      {/* Header Info Banner */}
      <div className="card card-custom p-4 mb-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="d-flex align-items-center">
            <button className="btn btn-light border rounded-circle p-2 me-3" onClick={() => navigate('/companies')}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                  {company.name}
                </h4>
                <span className="badge bg-light text-navy border fw-bold">{company.code}</span>
              </div>
              <p className="text-muted small mb-0">
                Contact: <strong>{company.contactPerson}</strong> | Phone: {company.phone} | Location: {company.address}
              </p>
            </div>
          </div>
          <button
            className="btn btn-navy rounded-pill px-4"
            onClick={() => navigate(`/diamond-receiving?company=${company.id}`)}
          >
            + Receive New Diamond Batch
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <StatCard title="Total Received" value={totalReceived} icon={Gem} colorType="total" />
        </div>
        <div className="col-md-3">
          <StatCard title="Total Completed" value={completed} icon={CheckCircle2} colorType="completed" />
        </div>
        <div className="col-md-3">
          <StatCard title="Total Pending" value={pending} icon={Clock} colorType="pending" />
        </div>
        <div className="col-md-3">
          <StatCard title="In Production" value={inProduction} icon={Activity} colorType="production" />
        </div>
      </div>

      {/* Date Filter & Search Section */}
      <div className="card card-custom p-4 mb-4 shadow-sm">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="col-md-4">
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
      <div className="card card-custom p-4 mb-4 shadow-sm">
        <h6 className="font-heading fw-bold text-navy mb-3 d-flex align-items-center" style={{ color: '#0A192F' }}>
          <Calendar size={18} className="me-2 text-warning" /> Date-Wise Batch Production Summary
        </h6>
        <div className="table-responsive">
          <table className="table table-custom text-center align-middle">
            <thead>
              <tr>
                <th className="text-start">Received Date</th>
                <th>Received</th>
                <th>Assigned</th>
                <th>In Progress</th>
                <th>Completed</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {dateWiseSummary.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-muted py-3">No date summary available for selected filters.</td>
                </tr>
              ) : (
                dateWiseSummary.map((row) => (
                  <tr key={row.date}>
                    <td className="text-start fw-bold text-navy">{row.date}</td>
                    <td className="fw-semibold">{row.received}</td>
                    <td><span className="badge bg-light text-dark border">{row.assigned}</span></td>
                    <td><span className="badge bg-warning bg-opacity-20 text-warning border border-warning">{row.inProgress}</span></td>
                    <td><span className="badge bg-success bg-opacity-20 text-success border border-success">{row.completed}</span></td>
                    <td><span className="badge bg-secondary bg-opacity-15 text-dark border">{row.pending}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Diamond Records Table */}
      <div className="card card-custom p-4 shadow-sm">
        <h6 className="font-heading fw-bold text-navy mb-3 d-flex align-items-center" style={{ color: '#0A192F' }}>
          <Gem size={18} className="me-2 text-warning" /> Individual Diamond Records
        </h6>
        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Size</th>
                <th>Weight (ct)</th>
                <th>Received Date</th>
                <th>Assigned Worker</th>
                <th>Status</th>
                <th>Completed Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companyDiamonds.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">No diamonds found matching current search.</td>
                </tr>
              ) : (
                companyDiamonds.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="font-heading fw-bold text-navy" style={{ color: '#0A192F' }}>{d.barcode}</span>
                    </td>
                    <td className="small">{d.size}</td>
                    <td className="fw-semibold">{d.weight} ct</td>
                    <td className="small text-muted">{d.receivedDate}</td>
                    <td>{d.assignedWorkerName || <span className="text-muted small">Unassigned</span>}</td>
                    <td><Badge status={d.status} /></td>
                    <td className="small text-muted">{d.completedDate || '-'}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        onClick={(e) => handleOpenTimeline(d, e)}
                      >
                        <Eye size={14} className="me-1" /> History
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
    </PrivateLayout>
  );
};

export default CompanyDetails;
