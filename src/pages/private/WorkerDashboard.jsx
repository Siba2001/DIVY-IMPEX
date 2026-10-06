import React, { useState } from 'react';
import PrivateLayout from '../../layouts/PrivateLayout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import DiamondTimelineModal from '../../components/timeline/DiamondTimelineModal';
import { useDiamonds } from '../../context/DiamondContext';
import { useAuth } from '../../context/AuthContext';
import {
  HardHat,
  Gem,
  Activity,
  CheckCircle2,
  PackageCheck,
  Play,
  Check,
  Send,
  Eye,
  ShieldAlert
} from 'lucide-react';

const WorkerDashboard = () => {
  const { user } = useAuth();
  const { diamonds, startWorkerWork, markWorkCompleted, depositDiamond } = useDiamonds();

  const [selectedDiamond, setSelectedDiamond] = useState(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // Filter diamonds assigned to current logged-in worker (or fallback to worker ID w-1 for demo)
  const currentWorkerId = user?.workerId || 'w-1';
  const workerDiamonds = diamonds.filter(
    (d) => d.assignedWorkerId === currentWorkerId || (user?.name && d.assignedWorkerName === user.name)
  );

  const totalAssigned = workerDiamonds.length;
  const inProgress = workerDiamonds.filter((d) => d.status === 'IN PROGRESS').length;
  const completed = workerDiamonds.filter((d) => d.status === 'COMPLETED' || d.status === 'VERIFIED').length;
  const pendingDeposit = workerDiamonds.filter((d) => d.status === 'WORK COMPLETED').length;

  const handleStartWork = async (barcode) => {
    await startWorkerWork({ barcode, workerId: currentWorkerId });
  };

  const handleMarkCompleted = async (barcode) => {
    await markWorkCompleted({ barcode, workerName: user?.name });
  };

  const handleDeposit = async (barcode) => {
    await depositDiamond({ barcode, workerName: user?.name });
  };

  const handleOpenTimeline = (diamond) => {
    setSelectedDiamond(diamond);
    setIsTimelineOpen(true);
  };

  return (
    <PrivateLayout title={`Artisan Workbench - ${user?.name || 'Worker'}`}>
      {/* Read-Only Protection Notice Banner */}
      <div className="alert alert-info border border-info bg-info bg-opacity-10 d-flex align-items-center mb-4 rounded-3 p-3">
        <ShieldAlert size={20} className="me-2 text-info flex-shrink-0" />
        <div className="small text-dark">
          <strong>Artisan Workbench Mode:</strong> You can view assigned diamonds, start work, mark work completed, and deposit diamonds to QC. Original barcode, company, and carat weight are locked and read-only.
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <StatCard title="My Assigned Diamonds" value={totalAssigned} icon={Gem} colorType="total" />
        </div>
        <div className="col-md-3">
          <StatCard title="In Progress" value={inProgress} icon={Activity} colorType="production" />
        </div>
        <div className="col-md-3">
          <StatCard title="Completed" value={completed} icon={CheckCircle2} colorType="completed" />
        </div>
        <div className="col-md-3">
          <StatCard title="Pending Deposit" value={pendingDeposit} icon={PackageCheck} colorType="pending" />
        </div>
      </div>

      {/* Assigned Diamond List */}
      <div className="card card-custom p-4 shadow-sm">
        <h6 className="font-heading fw-bold text-navy mb-3 d-flex align-items-center" style={{ color: '#0A192F' }}>
          <HardHat size={18} className="me-2 text-warning" /> My Active Diamond Work Items
        </h6>

        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Company</th>
                <th>Size Spec</th>
                <th>Orig Weight (Read-Only)</th>
                <th>Assigned Date</th>
                <th>Status</th>
                <th className="text-end">Workbench Action</th>
              </tr>
            </thead>
            <tbody>
              {workerDiamonds.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No active diamonds currently assigned to your workbench.
                  </td>
                </tr>
              ) : (
                workerDiamonds.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="font-heading fw-bold text-navy fs-6">{d.barcode}</span>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{d.companyName}</span>
                      <span className="badge bg-light text-navy border ms-2">{d.companyCode}</span>
                    </td>
                    <td className="small">{d.size}</td>
                    <td className="fw-semibold text-primary">{d.weight} ct</td>
                    <td className="small text-muted">{d.assignedDate || d.receivedDate}</td>
                    <td>
                      <Badge status={d.status} />
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2"
                          onClick={() => handleOpenTimeline(d)}
                          title="View History Timeline"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Action 1: Start Work */}
                        {d.status === 'ASSIGNED' && (
                          <button
                            className="btn btn-sm btn-warning rounded-pill px-3 font-heading fw-bold text-dark"
                            onClick={() => handleStartWork(d.barcode)}
                          >
                            <Play size={13} className="me-1 fill-dark" /> Start Work
                          </button>
                        )}

                        {/* Action 2: Mark Work Completed */}
                        {d.status === 'IN PROGRESS' && (
                          <button
                            className="btn btn-sm btn-indigo bg-indigo text-white rounded-pill px-3 font-heading fw-bold"
                            style={{ backgroundColor: '#4338CA' }}
                            onClick={() => handleMarkCompleted(d.barcode)}
                          >
                            <Check size={14} className="me-1" /> Mark Work Completed
                          </button>
                        )}

                        {/* Action 3: Deposit Diamond */}
                        {d.status === 'WORK COMPLETED' && (
                          <button
                            className="btn btn-sm btn-purple bg-purple text-white rounded-pill px-3 font-heading fw-bold"
                            style={{ backgroundColor: '#7E22CE' }}
                            onClick={() => handleDeposit(d.barcode)}
                          >
                            <Send size={13} className="me-1" /> Deposit to QC Safe
                          </button>
                        )}

                        {d.status === 'DEPOSITED' && (
                          <span className="badge bg-light text-muted border py-2 px-3 small">
                            Awaiting QC Scale Verification
                          </span>
                        )}

                        {d.status === 'COMPLETED' && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle py-2 px-3 small">
                            QC Approved & Closed
                          </span>
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

      <DiamondTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        diamond={selectedDiamond}
      />
    </PrivateLayout>
  );
};

export default WorkerDashboard;
