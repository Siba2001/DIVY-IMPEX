import React, { useState } from 'react';
import PrivateLayout from '../../layouts/PrivateLayout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import DiamondTimelineModal from '../../components/timeline/DiamondTimelineModal';
import { useDiamonds } from '../../context/DiamondContext';
import { Layers, Search, Filter, Eye, Gem } from 'lucide-react';

const Stock = () => {
  const { diamonds, companies } = useDiamonds();

  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
  const pendingCount = diamonds.filter((d) => ['RECEIVED', 'ASSIGNED', 'IN PROGRESS', 'REWORK'].includes(d.status)).length;
  const reworkCount = diamonds.filter((d) => d.status === 'REWORK').length;

  const filteredDiamonds = diamonds.filter((d) => {
    if (companyFilter && d.companyId !== companyFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    if (dateFilter && d.receivedDate !== dateFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        d.barcode.toLowerCase().includes(q) ||
        d.companyName.toLowerCase().includes(q) ||
        (d.assignedWorkerName && d.assignedWorkerName.toLowerCase().includes(q))
      );
    }
    return true;
  });

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
          <StatCard title="Final Completed" value={completedCount} icon={Layers} colorType="completed" />
        </div>
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="Pending Vault" value={pendingCount} icon={Layers} colorType="pending" />
        </div>
        <div className="col-lg-3 col-md-4 col-6">
          <StatCard title="Flagged Rework" value={reworkCount} icon={Layers} colorType="pending" />
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card card-custom p-4 mb-4 shadow-sm">
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label">Filter Company</label>
            <select className="form-select" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
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

          <div className="col-md-2">
            <label className="form-label">Received Date</label>
            <input
              type="date"
              className="form-control"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stock Inventory Breakdown Table */}
      <div className="card card-custom p-4 shadow-sm">
        <h6 className="font-heading fw-bold text-navy mb-3" style={{ color: '#0A192F' }}>
          Detailed Vault & Stock Breakdown ({filteredDiamonds.length})
        </h6>

        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Company</th>
                <th>Cut Spec</th>
                <th>Orig Weight</th>
                <th>Actual Weight</th>
                <th>Worker</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDiamonds.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No stock records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredDiamonds.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="font-heading fw-bold text-navy">{d.barcode}</span>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{d.companyName}</span>
                      <span className="badge bg-light text-navy border ms-2">{d.companyCode}</span>
                    </td>
                    <td className="small">{d.size}</td>
                    <td className="fw-semibold">{d.weight} ct</td>
                    <td className="small">{d.actualWeight ? `${d.actualWeight} ct` : '-'}</td>
                    <td>{d.assignedWorkerName || <span className="text-muted small">Unassigned</span>}</td>
                    <td>
                      <Badge status={d.status} />
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        onClick={() => handleOpenTimeline(d)}
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

      <DiamondTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        diamond={selectedDiamond}
      />
    </PrivateLayout>
  );
};

export default Stock;
