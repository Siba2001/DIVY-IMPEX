import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Badge from '../../components/common/Badge';
import { useDiamonds } from '../../context/DiamondContext';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, CheckCircle2, AlertCircle, Search, X } from 'lucide-react';

const WorkerAssignment = () => {
  const { diamonds, companies, workers, assignWorker } = useDiamonds();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBarcode, setSelectedBarcode] = useState(searchParams.get('barcode') || '');
  const [diamondSearch, setDiamondSearch] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Unassigned or Rework diamonds
  const assignableDiamonds = diamonds.filter((d) => {
    if (selectedCompanyId && d.companyId !== selectedCompanyId) return false;
    return d.status === 'RECEIVED' || d.status === 'REWORK' || !d.assignedWorkerId;
  });

  // Filtered diamonds based on instant search (barcode, serial #, rough #, weight, company, shape)
  const filteredAssignableDiamonds = assignableDiamonds.filter((d) => {
    if (!diamondSearch.trim()) return true;
    const q = diamondSearch.trim().toLowerCase();
    const barcode = String(d.barcode || '').toLowerCase();
    const rough = String(d.roughCutNo || '').toLowerCase();
    const serial = String(d.serialNo || '').toLowerCase();
    const shape = String(d.shape || d.size || '').toLowerCase();
    const comp = String(d.companyCode || d.companyName || '').toLowerCase();
    const weight = String(d.weight || '');
    return (
      barcode.includes(q) ||
      rough.includes(q) ||
      serial.includes(q) ||
      shape.includes(q) ||
      comp.includes(q) ||
      weight.includes(q)
    );
  });

  const selectedDiamond = diamonds.find((d) => d.barcode === selectedBarcode);

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
      setDiamondSearch('');
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
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0 fw-semibold">2. Select Diamond Barcode <span className="text-danger">*</span></label>
                  {diamondSearch && (
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small text-muted"
                      onClick={() => setDiamondSearch('')}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Clear Search
                    </button>
                  )}
                </div>

                {/* Instant Diamond Search / Filter Input */}
                <div className="position-relative mb-2">
                  <Search size={15} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                  <input
                    type="text"
                    className="form-control form-control-sm ps-5 pe-4 bg-white font-mono"
                    placeholder="Search barcode, serial #, rough #, weight..."
                    value={diamondSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDiamondSearch(val);
                      // Auto-select if user typed or scanned an exact barcode
                      const exact = assignableDiamonds.find(
                        (d) => String(d.barcode).toLowerCase() === val.trim().toLowerCase()
                      );
                      if (exact) {
                        setSelectedBarcode(exact.barcode);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredAssignableDiamonds.length > 0) {
                          setSelectedBarcode(filteredAssignableDiamonds[0].barcode);
                        }
                      }
                    }}
                  />
                  {diamondSearch && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link position-absolute top-50 end-0 translate-middle-y me-2 text-muted p-0 text-decoration-none"
                      onClick={() => setDiamondSearch('')}
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filtered Dropdown */}
                <select
                  className="form-select fw-bold text-navy"
                  value={selectedBarcode}
                  onChange={(e) => setSelectedBarcode(e.target.value)}
                  required
                >
                  <option value="">
                    {filteredAssignableDiamonds.length === 0
                      ? (diamondSearch ? '-- No matching diamonds found --' : '-- Select Unassigned Diamond --')
                      : '-- Select Unassigned Diamond --'}
                  </option>
                  {filteredAssignableDiamonds.map((d) => (
                    <option key={d.id} value={d.barcode}>
                      {d.barcode}
                      {d.serialNo ? ` [Sr #${d.serialNo}]` : ''}
                      {d.roughCutNo ? ` [Rough #${d.roughCutNo}]` : ''}
                      {` | ${d.companyCode} | ${d.shape || d.size} (${d.weight} ct)`}
                      {d.status === 'REWORK' ? ' [REWORK]' : ''}
                    </option>
                  ))}
                </select>

                <div className="d-flex justify-content-between align-items-center mt-1">
                  <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                    {diamondSearch
                      ? `Showing ${filteredAssignableDiamonds.length} of ${assignableDiamonds.length} available diamonds`
                      : `Showing ${assignableDiamonds.length} unassigned / rework diamonds available`}
                  </small>
                </div>

                {/* Selected Diamond Preview Card */}
                {selectedDiamond && (
                  <div className="mt-2.5 p-2.5 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                    <div>
                      <div className="d-flex align-items-center gap-1.5 flex-wrap">
                        <span className="fw-bold font-mono text-navy">{selectedDiamond.barcode}</span>
                        {selectedDiamond.serialNo && (
                          <span className="badge bg-white text-navy border font-mono small">
                            Sr: #{selectedDiamond.serialNo}
                          </span>
                        )}
                        {selectedDiamond.roughCutNo && (
                          <span className="badge bg-white text-muted border font-mono small">
                            Rough: #{selectedDiamond.roughCutNo}
                          </span>
                        )}
                        <span className="badge bg-gold text-dark font-mono small">
                          {selectedDiamond.weight} ct
                        </span>
                      </div>
                      <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.75rem' }}>
                        Company: <strong>{selectedDiamond.companyName || selectedDiamond.companyCode}</strong> &bull; Shape: {selectedDiamond.shape || 'Standard'} &bull; Status: {selectedDiamond.status}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary border-0 p-1"
                      onClick={() => setSelectedBarcode('')}
                      title="Clear selection"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
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


              <button type="submit" className="btn btn-gold w-100 py-2.5 font-heading fw-semibold">
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
