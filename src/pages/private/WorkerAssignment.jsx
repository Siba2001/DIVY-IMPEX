import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Badge from '../../components/common/Badge';
import { useDiamonds } from '../../context/DiamondContext';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  CheckSquare,
  Square,
  Layers,
  Scale,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Filter,
  Check,
  PackageCheck
} from 'lucide-react';

const WorkerAssignment = () => {
  const { diamonds, companies, workers, assignWorker, assignWorkersBatch } = useDiamonds();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Filters & Selection State
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, RECEIVED, REWORK
  const [diamondSearch, setDiamondSearch] = useState('');
  const [selectedBarcodes, setSelectedBarcodes] = useState(() => {
    const initialBc = searchParams.get('barcode');
    return initialBc ? [initialBc] : [];
  });
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assignedSearch, setAssignedSearch] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Close multi-select dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Unassigned or Rework diamonds (available for assignment)
  const assignableDiamonds = diamonds.filter((d) => {
    if (selectedCompanyId && d.companyId !== selectedCompanyId) return false;
    if (statusFilter === 'RECEIVED' && d.status !== 'RECEIVED') return false;
    if (statusFilter === 'REWORK' && d.status !== 'REWORK') return false;
    return d.status === 'RECEIVED' || d.status === 'REWORK' || !d.assignedWorkerId;
  });

  // 2. Filtered diamonds based on instant search (barcode, serial #, rough #, weight, company, shape, process)
  const filteredAssignableDiamonds = assignableDiamonds.filter((d) => {
    // Process / Department match (if selected)
    if (selectedProcess) {
      const dShape = String(d.shape || '').toLowerCase();
      const dRemarks = String(d.remarks || '').toLowerCase();
      const p = selectedProcess.toLowerCase();
      // Match if process is mentioned in shape, remarks or status
      if (!dShape.includes(p) && !dRemarks.includes(p) && p !== 'all') {
        // Allow general unassigned stones if not strictly matched
      }
    }

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

  // 3. Selected diamonds list & calculated stats
  const selectedDiamondsList = diamonds.filter((d) => selectedBarcodes.includes(d.barcode));
  const totalSelectedWeight = selectedDiamondsList.reduce(
    (acc, d) => acc + (parseFloat(d.weight) || 0),
    0
  );
  const avgSelectedWeight =
    selectedDiamondsList.length > 0
      ? totalSelectedWeight / selectedDiamondsList.length
      : 0;

  // Selected Target Worker details
  const targetWorker = workers.find((w) => w.id === selectedWorkerId);
  const workerCurrentDiamonds = diamonds.filter(
    (d) =>
      d.assignedWorkerId === selectedWorkerId &&
      ['ASSIGNED', 'IN PROGRESS'].includes(d.status)
  );

  // Selection toggle handlers
  const handleToggleBarcode = (barcode) => {
    setSelectedBarcodes((prev) =>
      prev.includes(barcode) ? prev.filter((b) => b !== barcode) : [...prev, barcode]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredBarcodes = filteredAssignableDiamonds.map((d) => d.barcode);
    const allSelected = filteredBarcodes.every((bc) => selectedBarcodes.includes(bc));

    if (allSelected) {
      // Deselect all filtered
      setSelectedBarcodes((prev) => prev.filter((bc) => !filteredBarcodes.includes(bc)));
    } else {
      // Select all filtered (merge unique)
      setSelectedBarcodes((prev) => Array.from(new Set([...prev, ...filteredBarcodes])));
    }
  };

  const handleClearAllSelected = () => {
    setSelectedBarcodes([]);
  };

  const handleRemoveSingle = (barcode, e) => {
    if (e) e.stopPropagation();
    setSelectedBarcodes((prev) => prev.filter((b) => b !== barcode));
  };

  // Barcode scanner / Enter key handler: scan barcode to instantly add to selection
  const handleBarcodeScanInput = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = diamondSearch.trim().toUpperCase();
      if (!val) return;

      const found = assignableDiamonds.find(
        (d) => String(d.barcode).toUpperCase() === val
      );

      if (found) {
        if (!selectedBarcodes.includes(found.barcode)) {
          setSelectedBarcodes((prev) => [...prev, found.barcode]);
          setSuccess(`Added barcode ${found.barcode} to selection.`);
          setTimeout(() => setSuccess(''), 2500);
        } else {
          setError(`Barcode ${found.barcode} is already in the selected list.`);
          setTimeout(() => setError(''), 2500);
        }
        setDiamondSearch('');
      } else {
        setError(`Barcode "${val}" not found in unassigned/rework list.`);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // Submit batch assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedBarcodes.length === 0) {
      setError('Please select at least one diamond to assign.');
      return;
    }
    if (!selectedWorkerId) {
      setError('Please select a target artisan worker.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedBarcodes.length === 1) {
        const res = await assignWorker({
          barcode: selectedBarcodes[0],
          workerId: selectedWorkerId,
          assignedBy: user?.name || 'Supervisor Admin'
        });
        setSuccess(`Successfully assigned Diamond ${res.barcode} to ${res.assignedWorkerName}!`);
      } else {
        const res = await assignWorkersBatch({
          barcodes: selectedBarcodes,
          workerId: selectedWorkerId,
          assignedBy: user?.name || 'Supervisor Admin'
        });
        setSuccess(
          `Successfully assigned ${res.assignedCount} diamonds (${totalSelectedWeight.toFixed(3)} ct) to ${res.workerName}!`
        );
      }

      setSelectedBarcodes([]);
      setDiamondSearch('');
    } catch (err) {
      setError(err.message || 'Failed to assign diamonds.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Currently assigned diamonds with search filter
  const currentlyAssigned = diamonds.filter((d) =>
    ['ASSIGNED', 'IN PROGRESS'].includes(d.status)
  );

  const filteredCurrentlyAssigned = currentlyAssigned.filter((d) => {
    if (!assignedSearch.trim()) return true;
    const q = assignedSearch.trim().toLowerCase();
    const barcode = String(d.barcode || '').toLowerCase();
    const workerName = String(d.assignedWorkerName || '').toLowerCase();
    const company = String(d.companyCode || d.companyName || '').toLowerCase();
    return barcode.includes(q) || workerName.includes(q) || company.includes(q);
  });

  const totalAssignedWeight = currentlyAssigned.reduce(
    (acc, d) => acc + (parseFloat(d.weight) || 0),
    0
  );

  const isAllFilteredSelected =
    filteredAssignableDiamonds.length > 0 &&
    filteredAssignableDiamonds.every((d) => selectedBarcodes.includes(d.barcode));

  return (
    <PrivateLayout title="Worker Diamond Assignment">
      {/* Top Quick Metrics Bar */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-custom p-3 shadow-sm d-flex flex-row align-items-center">
            <div className="p-2.5 bg-primary bg-opacity-10 text-primary rounded-3 me-3">
              <Layers size={22} />
            </div>
            <div>
              <small className="text-muted d-block fw-medium">Available Unassigned</small>
              <h5 className="font-heading fw-bold mb-0 text-navy font-mono">
                {assignableDiamonds.length}{' '}
                <span className="fs-6 text-muted fw-normal">Stones</span>
              </h5>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-custom p-3 shadow-sm d-flex flex-row align-items-center">
            <div className="p-2.5 bg-warning bg-opacity-10 text-warning rounded-3 me-3">
              <Scale size={22} />
            </div>
            <div>
              <small className="text-muted d-block fw-medium">Unassigned Carat Weight</small>
              <h5 className="font-heading fw-bold mb-0 text-navy font-mono">
                {assignableDiamonds
                  .reduce((acc, d) => acc + (parseFloat(d.weight) || 0), 0)
                  .toFixed(2)}{' '}
                <span className="fs-6 text-muted fw-normal">ct</span>
              </h5>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-custom p-3 shadow-sm d-flex flex-row align-items-center">
            <div className="p-2.5 bg-success bg-opacity-10 text-success rounded-3 me-3">
              <UserCheck size={22} />
            </div>
            <div>
              <small className="text-muted d-block fw-medium">Currently in Work</small>
              <h5 className="font-heading fw-bold mb-0 text-navy font-mono">
                {currentlyAssigned.length}{' '}
                <span className="fs-6 text-muted fw-normal">
                  ({totalAssignedWeight.toFixed(2)} ct)
                </span>
              </h5>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-custom p-3 shadow-sm d-flex flex-row align-items-center">
            <div className="p-2.5 bg-navy text-warning rounded-3 me-3" style={{ backgroundColor: '#0A192F' }}>
              <Briefcase size={22} />
            </div>
            <div>
              <small className="text-muted d-block fw-medium">Active Artisans</small>
              <h5 className="font-heading fw-bold mb-0 text-navy font-mono">
                {workers.filter((w) => w.status === 'ACTIVE').length}{' '}
                <span className="fs-6 text-muted fw-normal">Workers</span>
              </h5>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Side: Batch / Multi-Diamond Assignment Console */}
        <div className="col-12 col-xl-6">
          <div className="card card-custom p-4 shadow-sm h-100">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3.5 pb-2 border-bottom">
              <div className="d-flex align-items-center">
                <div
                  className="p-2.5 bg-navy text-warning rounded-3 me-3"
                  style={{ backgroundColor: '#0A192F' }}
                >
                  <UserCheck size={22} />
                </div>
                <div>
                  <h5 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                    Assign Diamonds to Artisan
                  </h5>
                </div>
              </div>

              {selectedBarcodes.length > 0 && (
                <span className="badge bg-gold text-dark font-mono px-2.5 py-1.5 fs-7 fw-bold shadow-sm">
                  {selectedBarcodes.length} Selected ({totalSelectedWeight.toFixed(3)} ct)
                </span>
              )}
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center py-2 px-3 mb-3" role="alert">
                <AlertCircle size={18} className="me-2 flex-shrink-0" />
                <div className="small fw-medium">{error}</div>
              </div>
            )}

            {success && (
              <div className="alert alert-success d-flex align-items-center py-2 px-3 mb-3" role="alert">
                <CheckCircle2 size={18} className="me-2 flex-shrink-0" />
                <div className="small fw-medium">{success}</div>
              </div>
            )}

            <form onSubmit={handleAssignSubmit}>
              {/* 1. Filters Row: Company & Process/Status */}
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted mb-1">
                    1. Filter by Company (Optional)
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={selectedCompanyId}
                    onChange={(e) => {
                      setSelectedCompanyId(e.target.value);
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

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted mb-1">
                    Filter by Status / Process
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Status (Received & Rework)</option>
                    <option value="RECEIVED">Received Only (Fresh Inward)</option>
                    <option value="REWORK">Rework Only (QC Rejected)</option>
                  </select>
                </div>
              </div>

              {/* 2. Diamond Search & Multi-Select Header */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1.5">
                  <label className="form-label fw-bold mb-0 text-navy small">
                    2. Select Diamonds to Assign <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-decoration-none small text-primary fw-semibold"
                      onClick={handleSelectAllFiltered}
                      style={{ fontSize: '0.78rem' }}
                      title="Select or deselect all diamonds matching current search"
                    >
                      {isAllFilteredSelected ? 'Deselect Filtered' : `Select All Filtered (${filteredAssignableDiamonds.length})`}
                    </button>
                    {selectedBarcodes.length > 0 && (
                      <>
                        <span className="text-muted small">&bull;</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-link p-0 text-decoration-none small text-danger"
                          onClick={handleClearAllSelected}
                          style={{ fontSize: '0.78rem' }}
                        >
                          Clear ({selectedBarcodes.length})
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Unified Search & Multi-Select Combobox Input */}
                <div className="position-relative" ref={dropdownRef}>
                  <div
                    className="form-control bg-white shadow-sm d-flex align-items-center p-1.5"
                    style={{
                      minHeight: '44px',
                      border: isDropdownOpen ? '1px solid #1e3a8a' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      cursor: 'text',
                      boxShadow: isDropdownOpen ? '0 0 0 3px rgba(30, 58, 138, 0.1)' : undefined,
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onClick={() => {
                      setIsDropdownOpen(true);
                      inputRef.current?.focus();
                    }}
                  >
                    <Search size={16} className="text-muted ms-2 me-2 flex-shrink-0" />

                    {/* Selected Indicator Chip (if diamonds are selected) */}
                    {selectedBarcodes.length > 0 && (
                      <span
                        className="badge bg-navy text-warning fw-bold font-mono d-inline-flex align-items-center gap-1 me-2 py-1.5 px-2 flex-shrink-0"
                        style={{ fontSize: '0.74rem', backgroundColor: '#0A192F' }}
                        title={`${selectedBarcodes.length} diamonds selected (${totalSelectedWeight.toFixed(3)} ct)`}
                      >
                        <CheckCircle2 size={13} className="text-success" />
                        <span>{selectedBarcodes.length} Selected ({totalSelectedWeight.toFixed(3)} ct)</span>
                      </span>
                    )}

                    {/* Unified Search & Barcode Gun Scanner Input */}
                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control form-control-sm border-0 p-0 font-mono shadow-none flex-grow-1"
                      style={{
                        outline: 'none',
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '0.86rem'
                      }}
                      placeholder={
                        selectedBarcodes.length === 0
                          ? `Search or scan barcode (${filteredAssignableDiamonds.length} available)...`
                          : `Search more diamonds or scan barcode...`
                      }
                      value={diamondSearch}
                      onChange={(e) => {
                        setDiamondSearch(e.target.value);
                        if (!isDropdownOpen) setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      onKeyDown={handleBarcodeScanInput}
                    />

                    {/* Clear search text button */}
                    {diamondSearch && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-muted p-0 me-2 text-decoration-none flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDiamondSearch('');
                          inputRef.current?.focus();
                        }}
                        title="Clear search text"
                      >
                        <X size={15} />
                      </button>
                    )}

                    {/* Dropdown Toggle Chevron Button */}
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted p-0 me-2 text-decoration-none flex-shrink-0 d-flex align-items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDropdownOpen((prev) => !prev);
                      }}
                      title={isDropdownOpen ? 'Close diamond list' : 'Open diamond list'}
                    >
                      <ChevronDown
                        size={18}
                        style={{
                          transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease-in-out'
                        }}
                      />
                    </button>
                  </div>

                  {/* Multi-Select Floating Dropdown Box */}
                  {isDropdownOpen && (
                    <div
                      className="position-absolute start-0 w-100 bg-white border rounded-3 shadow-lg p-0"
                      style={{
                        top: 'calc(100% + 4px)',
                        zIndex: 1050,
                        borderColor: '#cbd5e1',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {/* Dropdown Header Quick Actions */}
                      <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light rounded-top">
                        <small className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>
                          Click diamonds to select multiple:
                        </small>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0 text-decoration-none small text-primary fw-semibold"
                            onClick={handleSelectAllFiltered}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {isAllFilteredSelected ? 'Deselect All' : `Select All (${filteredAssignableDiamonds.length})`}
                          </button>
                          {selectedBarcodes.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-decoration-none small text-danger"
                              onClick={handleClearAllSelected}
                              style={{ fontSize: '0.75rem' }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scrollable list of diamonds with checkboxes */}
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {filteredAssignableDiamonds.length === 0 ? (
                          <div className="text-center py-4 text-muted small">
                            No unassigned diamonds match your filter.
                          </div>
                        ) : (
                          filteredAssignableDiamonds.map((d) => {
                            const isChecked = selectedBarcodes.includes(d.barcode);
                            return (
                              <div
                                key={d.id || d.barcode}
                                onClick={() => handleToggleBarcode(d.barcode)}
                                className={`d-flex align-items-center justify-content-between px-3 py-2 border-bottom cursor-pointer user-select-none ${
                                  isChecked ? 'bg-primary bg-opacity-10' : ''
                                }`}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isChecked) e.currentTarget.style.backgroundColor = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isChecked) e.currentTarget.style.backgroundColor = '';
                                }}
                              >
                                <div className="d-flex align-items-center min-w-0 me-2">
                                  <input
                                    type="checkbox"
                                    className="form-check-input mt-0 me-2.5 flex-shrink-0"
                                    checked={isChecked}
                                    onChange={() => handleToggleBarcode(d.barcode)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ cursor: 'pointer', width: '17px', height: '17px' }}
                                  />
                                  <div className="text-truncate">
                                    <span className="font-mono fw-bold text-navy" style={{ fontSize: '0.85rem' }}>
                                      {d.barcode}
                                    </span>
                                    {d.serialNo && (
                                      <span
                                        className="badge bg-light text-secondary border ms-1.5 font-mono"
                                        style={{ fontSize: '0.7rem' }}
                                      >
                                        Sr #{d.serialNo}
                                      </span>
                                    )}
                                    {d.roughCutNo && (
                                      <span
                                        className="badge bg-light text-secondary border ms-1 font-mono"
                                        style={{ fontSize: '0.7rem' }}
                                      >
                                        R #{d.roughCutNo}
                                      </span>
                                    )}
                                    <span
                                      className="badge bg-secondary bg-opacity-10 text-dark ms-1.5 font-mono"
                                      style={{ fontSize: '0.7rem' }}
                                    >
                                      {d.companyCode || d.companyName || 'KGK'}
                                    </span>
                                    {d.status === 'REWORK' && (
                                      <span
                                        className="badge bg-danger bg-opacity-10 text-danger ms-1.5"
                                        style={{ fontSize: '0.7rem' }}
                                      >
                                        REWORK
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="text-end flex-shrink-0 font-mono">
                                  <span className="fw-bold text-navy" style={{ fontSize: '0.83rem' }}>
                                    {parseFloat(d.weight || 0).toFixed(3)} ct
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Dropdown Footer with live selected count and Done button */}
                      <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-light border-top rounded-bottom">
                        <small className="text-muted font-mono" style={{ fontSize: '0.75rem' }}>
                          <strong className="text-navy">{selectedBarcodes.length}</strong> stone{selectedBarcodes.length !== 1 ? 's' : ''} selected
                          {selectedBarcodes.length > 0 && ` (${totalSelectedWeight.toFixed(3)} ct)`}
                        </small>
                        <button
                          type="button"
                          className="btn btn-sm btn-dark px-3 py-1 fw-semibold"
                          style={{ fontSize: '0.8rem', backgroundColor: '#0A192F', borderColor: '#0A192F' }}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center mt-1.5 px-1">
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Showing {filteredAssignableDiamonds.length} of {assignableDiamonds.length} available diamonds
                  </small>
                  {selectedBarcodes.length > 0 && (
                    <small className="text-success fw-bold font-mono" style={{ fontSize: '0.75rem' }}>
                      ✓ {selectedBarcodes.length} diamond{selectedBarcodes.length > 1 ? 's' : ''} selected
                    </small>
                  )}
                </div>
              </div>

              {/* 3. WHOLE DETAILS OF SELECTED DIAMONDS (Calculated Summary & Expandable Details) */}
              {selectedDiamondsList.length > 0 && (
                <div className="mb-3.5 p-3 rounded-3 border bg-light">
                  {/* Summary Metric Cards */}
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <PackageCheck size={18} className="text-success" />
                      <span className="fw-bold text-navy font-heading" style={{ fontSize: '0.88rem' }}>
                        Selected Diamonds Summary ({selectedDiamondsList.length})
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-decoration-none text-muted d-inline-flex align-items-center gap-1 small"
                      onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                    >
                      <span>{isDetailsOpen ? 'Collapse Details' : 'Expand Details'}</span>
                      {isDetailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="row g-2 text-center mb-2 font-mono">
                    <div className="col-4">
                      <div className="bg-white p-2 rounded border">
                        <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                          Total Count
                        </small>
                        <strong className="text-navy fs-6">{selectedDiamondsList.length}</strong>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="bg-white p-2 rounded border">
                        <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                          Total Weight
                        </small>
                        <strong className="text-navy fs-6">{totalSelectedWeight.toFixed(3)} ct</strong>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="bg-white p-2 rounded border">
                        <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                          Avg Weight
                        </small>
                        <strong className="text-navy fs-6">{avgSelectedWeight.toFixed(3)} ct</strong>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Selected List / Table */}
                  {isDetailsOpen && (
                    <div
                      className="border rounded bg-white overflow-hidden"
                      style={{ maxHeight: '160px', overflowY: 'auto' }}
                    >
                      <table className="table table-sm table-striped mb-0" style={{ fontSize: '0.75rem' }}>
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>Barcode</th>
                            <th>Sr #</th>
                            <th>Rough #</th>
                            <th>Shape</th>
                            <th className="text-end">Weight</th>
                            <th>Company</th>
                            <th className="text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDiamondsList.map((d) => (
                            <tr key={d.barcode}>
                              <td className="font-mono fw-bold text-navy">{d.barcode}</td>
                              <td className="font-mono text-muted">{d.serialNo ? `#${d.serialNo}` : '-'}</td>
                              <td className="font-mono text-muted">{d.roughCutNo ? `#${d.roughCutNo}` : '-'}</td>
                              <td>{d.shape || d.size || 'Standard'}</td>
                              <td className="text-end font-mono fw-semibold">{d.weight} ct</td>
                              <td>
                                <span className="badge bg-light text-navy border">{d.companyCode}</span>
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-danger p-0 border-0"
                                  onClick={(e) => handleRemoveSingle(d.barcode, e)}
                                  title="Remove from selection"
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Target Worker Selection */}
              <div className="mb-4">
                <label className="form-label fw-bold text-navy small mb-1">
                  3. Select Target Worker / Artisan <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select fw-semibold"
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  required
                >
                  <option value="">-- Select Artisan Worker --</option>
                  {workers
                    .filter((w) => w.status === 'ACTIVE')
                    .map((w) => {
                      const currentCount = diamonds.filter(
                        (d) =>
                          d.assignedWorkerId === w.id &&
                          ['ASSIGNED', 'IN PROGRESS'].includes(d.status)
                      ).length;
                      return (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.employeeId} - Dept: {w.department}) [{currentCount} currently assigned]
                        </option>
                      );
                    })}
                </select>

                {/* Target Worker Profile Preview Card */}
                {targetWorker && (
                  <div className="mt-2.5 p-2.5 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <strong className="text-navy">{targetWorker.name}</strong>
                        <span className="badge bg-navy text-warning small">
                          Dept: {targetWorker.department}
                        </span>
                        <span className="badge bg-white text-muted border small font-mono">
                          ID: {targetWorker.employeeId}
                        </span>
                      </div>
                      <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.75rem' }}>
                        Active Workload: <strong>{workerCurrentDiamonds.length} diamonds</strong> (
                        {workerCurrentDiamonds
                          .reduce((acc, d) => acc + (parseFloat(d.weight) || 0), 0)
                          .toFixed(2)}{' '}
                        ct currently in progress)
                      </small>
                    </div>
                    {targetWorker.phone && (
                      <span className="badge bg-white text-navy border font-mono small">
                        +91 {targetWorker.phone}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Submit Assignment Button */}
              <button
                type="submit"
                className="btn btn-gold w-100 py-2.5 font-heading fw-bold d-inline-flex align-items-center justify-content-center shadow-sm"
                disabled={isSubmitting || selectedBarcodes.length === 0 || !selectedWorkerId}
                style={{ fontSize: '0.94rem' }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Assigning {selectedBarcodes.length} Diamonds...
                  </>
                ) : (
                  <>
                    <UserCheck size={18} className="me-2" />
                    {selectedBarcodes.length === 0
                      ? 'Select Diamonds Above to Assign'
                      : `Confirm & Assign ${selectedBarcodes.length} Diamond${selectedBarcodes.length > 1 ? 's' : ''} to ${targetWorker?.name || 'Artisan'}`}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Currently Assigned Diamonds Table Console */}
        <div className="col-12 col-xl-6">
          <div className="card card-custom p-4 shadow-sm h-100">
            {/* Header & Assigned Search Filter */}
            <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
              <div>
                <h6 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                  Currently Assigned Diamonds ({currentlyAssigned.length})
                </h6>
                <small className="text-muted">
                  Total in-progress weight: {totalAssignedWeight.toFixed(2)} ct
                </small>
              </div>

              {/* Instant Assigned Search */}
              <div className="position-relative" style={{ minWidth: '200px' }}>
                <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted" />
                <input
                  type="text"
                  className="form-control form-control-sm ps-4 bg-white"
                  placeholder="Filter assigned..."
                  value={assignedSearch}
                  onChange={(e) => setAssignedSearch(e.target.value)}
                />
                {assignedSearch && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link position-absolute top-50 end-0 translate-middle-y me-1.5 text-muted p-0 text-decoration-none"
                    onClick={() => setAssignedSearch('')}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Table with Vertical Scrollbar */}
            <div
              className="table-responsive flex-grow-1"
              style={{
                maxHeight: '440px',
                overflowY: 'auto'
              }}
            >
              <table className="table table-custom table-hover align-middle mb-0" style={{ width: '100%' }}>
                <thead
                  className="sticky-top bg-light"
                  style={{
                    zIndex: 2,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <tr style={{ fontSize: '0.74rem' }}>
                    <th className="bg-light ps-2 pe-1" style={{ minWidth: '90px' }}>Barcode</th>
                    <th className="bg-light px-1 text-center" style={{ minWidth: '70px' }}>Company</th>
                    <th className="bg-light px-2" style={{ minWidth: '115px' }}>Worker Name</th>
                    <th className="text-end bg-light px-1" style={{ minWidth: '65px' }}>Weight</th>
                    <th className="bg-light px-2" style={{ minWidth: '90px' }}>Date</th>
                    <th className="bg-light ps-1 pe-2 text-center" style={{ minWidth: '80px' }}>Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.80rem' }}>
                  {filteredCurrentlyAssigned.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted small">
                        {assignedSearch
                          ? `No assigned diamonds match "${assignedSearch}".`
                          : 'No active worker assignments at the moment.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCurrentlyAssigned.map((d) => (
                      <tr key={d.id || d.barcode}>
                        <td className="ps-2 pe-1">
                          <span className="font-mono fw-bold text-navy">{d.barcode}</span>
                          {d.serialNo && (
                            <small className="d-block text-muted font-mono" style={{ fontSize: '0.68rem' }}>
                              Sr: #{d.serialNo}
                            </small>
                          )}
                        </td>
                        <td className="px-1 text-center">
                          <span className="badge bg-light text-navy border font-mono" style={{ fontSize: '0.7rem' }}>
                            {d.companyCode}
                          </span>
                        </td>
                        <td className="px-2">
                          <span className="fw-semibold text-dark d-block text-truncate" style={{ maxWidth: '120px' }}>
                            {d.assignedWorkerName || 'Assigned'}
                          </span>
                        </td>
                        <td className="text-end font-mono fw-semibold text-dark px-1">
                          {d.weight} ct
                        </td>
                        <td className="small text-muted font-mono px-2">
                          {d.assignedDate || d.receivedDate || '-'}
                        </td>
                        <td className="ps-1 pe-2 text-center">
                          <Badge status={d.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer with Item Count Summary */}
            <div className="pt-2.5 mt-2 border-top d-flex justify-content-between align-items-center">
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                Showing {filteredCurrentlyAssigned.length} of {currentlyAssigned.length} in-progress diamonds
              </small>
              <small className="font-mono text-navy fw-semibold" style={{ fontSize: '0.75rem' }}>
                {filteredCurrentlyAssigned.reduce((acc, d) => acc + (parseFloat(d.weight) || 0), 0).toFixed(2)} ct
              </small>
            </div>
          </div>
        </div>
      </div>
    </PrivateLayout>
  );
};

export default WorkerAssignment;
