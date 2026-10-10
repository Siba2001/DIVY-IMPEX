import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import DiamondTimelineModal from '../../components/timeline/DiamondTimelineModal';
import { useDiamonds } from '../../context/DiamondContext';
import { ArrowLeft, HardHat, Gem, CheckCircle2, Clock, Activity, Eye } from 'lucide-react';

const WorkerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workers, diamonds } = useDiamonds();

  const [selectedDiamond, setSelectedDiamond] = useState(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

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

  const workerDiamonds = diamonds.filter((d) => d.assignedWorkerId === worker.id);
  const totalAssigned = workerDiamonds.length;
  const inProgress = workerDiamonds.filter((d) => ['IN PROGRESS', 'WORK COMPLETED'].includes(d.status)).length;
  const completed = workerDiamonds.filter((d) => ['COMPLETED', 'VERIFIED', 'DEPOSITED'].includes(d.status)).length;
  const pending = workerDiamonds.filter((d) => ['ASSIGNED', 'REWORK'].includes(d.status)).length;

  const handleOpenTimeline = (diamond) => {
    setSelectedDiamond(diamond);
    setIsTimelineOpen(true);
  };

  return (
    <PrivateLayout title={`Artisan Profile - ${worker.name}`}>
      {/* Header Info */}
      <div className="card card-custom p-4 mb-4 shadow-sm">
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
        <h6 className="font-heading fw-bold text-navy mb-3 d-flex align-items-center" style={{ color: '#0A192F' }}>
          <Gem size={18} className="me-2 text-warning" /> Diamond Work Assignment History
        </h6>
        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Company</th>
                <th>Size</th>
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
              ) : (
                workerDiamonds.map((d) => (
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
      </div>

      <DiamondTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        diamond={selectedDiamond}
      />
    </PrivateLayout>
  );
};

export default WorkerDetails;
