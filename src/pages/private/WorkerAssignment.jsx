import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Badge from '../../components/common/Badge';
import { useDiamonds } from '../../context/DiamondContext';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

const WorkerAssignment = () => {
  const { diamonds, companies, workers, assignWorker } = useDiamonds();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBarcode, setSelectedBarcode] = useState(searchParams.get('barcode') || '');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Unassigned or Rework diamonds
  const assignableDiamonds = diamonds.filter((d) => {
    if (selectedCompanyId && d.companyId !== selectedCompanyId) return false;
    return d.status === 'RECEIVED' || d.status === 'REWORK' || !d.assignedWorkerId;
  });

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedBarcode) {
      setError('Please select a diamond barcode to assign.');
      return;
    }
    if (!selectedWorkerId) {
      setError('Please select a worker for assignment.');
      return;
    }

    try {
      const res = await assignWorker({
        barcode: selectedBarcode,
        workerId: selectedWorkerId,
        assignedBy: user?.name || 'Supervisor Admin'
      });

      setSuccess(`Successfully assigned Diamond ${res.barcode} to ${res.assignedWorkerName}!`);
      setSelectedBarcode('');
      setSelectedWorkerId('');
    } catch (err) {
      setError(err.message || 'Failed to assign diamond.');
    }
  };

  // Currently assigned diamonds list
  const currentlyAssigned = diamonds.filter((d) => ['ASSIGNED', 'IN PROGRESS'].includes(d.status));

  return (
    <PrivateLayout title="Worker Diamond Assignment">
      <div className="row g-4">
        {/* Assignment Form Console */}
        <div className="col-lg-5">
          <div className="card card-custom p-4 shadow-sm h-100">
            <div className="d-flex align-items-center mb-4">
              <div className="p-3 bg-navy text-warning rounded-3 me-3" style={{ backgroundColor: '#0A192F' }}>
                <UserCheck size={24} />
              </div>
              <div>
                <h5 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                  Assign Diamond to Artisan
                </h5>
                <small className="text-muted">Select unassigned diamond barcode and target worker.</small>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                <AlertCircle size={18} className="me-2 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="alert alert-success d-flex align-items-center mb-3" role="alert">
                <CheckCircle2 size={18} className="me-2 flex-shrink-0" />
                <div>{success}</div>
              </div>
            )}

            <form onSubmit={handleAssignSubmit}>
              <div className="mb-3">
                <label className="form-label">1. Filter by Company (Optional)</label>
                <select
                  className="form-select"
                  value={selectedCompanyId}
                  onChange={(e) => {
                    setSelectedCompanyId(e.target.value);
                    setSelectedBarcode('');
                  }}
                >
                  <option value="">All Client Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">2. Select Diamond Barcode *</label>
                <select
                  className="form-select fw-bold text-navy"
                  value={selectedBarcode}
                  onChange={(e) => setSelectedBarcode(e.target.value)}
                  required
                >
                  <option value="">-- Select Unassigned Diamond --</option>
                  {assignableDiamonds.map((d) => (
                    <option key={d.id} value={d.barcode}>
                      {d.barcode} | {d.companyCode} | {d.size} ({d.weight} ct) - Status: {d.status}
                    </option>
                  ))}
                </select>
                <small className="text-muted mt-1 d-block">
                  Showing {assignableDiamonds.length} unassigned / rework diamonds available.
                </small>
              </div>

              <div className="mb-4">
                <label className="form-label">3. Select Target Worker / Artisan *</label>
                <select
                  className="form-select"
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  required
                >
                  <option value="">-- Select Artisan Worker --</option>
                  {workers
                    .filter((w) => w.status === 'ACTIVE')
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.employeeId} - Dept: {w.department})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-light rounded-3 mb-4 border">
                <small className="text-muted d-block mb-1">
                  <ShieldAlert size={14} className="me-1 text-warning" /> <strong>Business Rule Enforced:</strong>
                </small>
                <small className="text-secondary">
                  The system strictly prevents assigning the same barcode to multiple workers simultaneously.
                </small>
              </div>

              <button type="submit" className="btn btn-gold w-100 rounded-pill py-2 font-heading fw-bold shadow-sm">
                <UserCheck size={18} className="me-2" /> Confirm & Assign Diamond
              </button>
            </form>
          </div>
        </div>

        {/* Currently Assigned Diamonds Table */}
        <div className="col-lg-7">
          <div className="card card-custom p-4 shadow-sm h-100">
            <h6 className="font-heading fw-bold text-navy mb-3" style={{ color: '#0A192F' }}>
              Currently Assigned Diamonds ({currentlyAssigned.length})
            </h6>

            <div className="table-responsive">
              <table className="table table-custom table-hover align-middle">
                <thead>
                  <tr>
                    <th>Barcode</th>
                    <th>Company</th>
                    <th>Worker Name</th>
                    <th>Assignment Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentlyAssigned.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No active worker assignments at the moment.
                      </td>
                    </tr>
                  ) : (
                    currentlyAssigned.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <span className="font-heading fw-bold text-navy">{d.barcode}</span>
                        </td>
                        <td>
                          <span className="badge bg-light text-navy border">{d.companyCode}</span>
                        </td>
                        <td className="fw-semibold text-dark">{d.assignedWorkerName}</td>
                        <td className="small text-muted">{d.assignedDate || d.receivedDate}</td>
                        <td>
                          <Badge status={d.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PrivateLayout>
  );
};

export default WorkerAssignment;
