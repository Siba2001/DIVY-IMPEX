import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Badge from '../../components/common/Badge';
import { useDiamonds } from '../../context/DiamondContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  Barcode,
  History,
  X
} from 'lucide-react';

const DepositVerification = () => {
  const { diamonds, verifyDiamond, showToast } = useDiamonds();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [inputBarcode, setInputBarcode] = useState(searchParams.get('barcode') || '');
  const [scannedDiamond, setScannedDiamond] = useState(() => {
    const q = searchParams.get('barcode');
    if (q) {
      const found = diamonds.find((d) => String(d.barcode || '').toLowerCase() === q.toLowerCase());
      if (
        found &&
        (found.assignedWorkerId || (found.assignedWorkerName && found.assignedWorkerName.toLowerCase() !== 'unassigned')) &&
        found.status !== 'RECEIVED'
      ) {
        return found;
      }
    }
    return null;
  });

  const [actualWeight, setActualWeight] = useState('');
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter ONLY diamonds currently assigned to a worker that are active (NOT returned, NOT unassigned, NOT already verified)
  const cleanQuery = inputBarcode.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (cleanQuery.length < 2) return [];
    return diamonds.filter((d) => {
      // 1. Must be assigned to an artisan worker
      const isAssigned = Boolean(
        d.assignedWorkerId ||
        (d.assignedWorkerName && String(d.assignedWorkerName).trim().toLowerCase() !== 'unassigned')
      );
      if (!isAssigned) return false;

      // 2. Must NOT be RETURNED (already dispatched/returned to client company)
      if (d.status === 'RETURNED') return false;

      // 3. Must NOT be RECEIVED (not yet assigned)
      if (d.status === 'RECEIVED') return false;

      // 4. Must NOT be COMPLETED (already verified in QC)
      if (d.status === 'COMPLETED') return false;

      const bc = String(d.barcode || '').toLowerCase();
      const rough = String(d.roughCutNo || '').toLowerCase();
      return bc.includes(cleanQuery) || rough.includes(cleanQuery);
    });
  }, [diamonds, cleanQuery]);

  const handleSelectSuggestion = (d) => {
    setInputBarcode(d.barcode);
    setShowSuggestions(false);
    setError('');
    setSuccessMsg('');

    if (d.status === 'COMPLETED' || d.status === 'RETURNED') {
      setScannedDiamond(null);
      setError(`Diamond "${d.barcode}" has already been verified (Status: ${d.status}).`);
      return;
    }

    setScannedDiamond(d);
    setActualWeight(d.actualWeight ? String(d.actualWeight) : String((d.weight - 0.015).toFixed(3)));
  };

  const handleScanOrSearch = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!inputBarcode.trim()) {
      setError('Please enter or scan a barcode number.');
      return;
    }

    const matched = diamonds.find(
      (d) => String(d.barcode || '').toLowerCase() === inputBarcode.trim().toLowerCase()
    );

    if (!matched) {
      setScannedDiamond(null);
      setError(`No diamond record found with barcode: "${inputBarcode}"`);
      return;
    }

    // Business Rule Check: Only diamonds assigned to a worker can be verified in QC
    const isWorkerAssigned = Boolean(
      matched.assignedWorkerId ||
      (matched.assignedWorkerName && matched.assignedWorkerName.toLowerCase() !== 'unassigned')
    );

    if (!isWorkerAssigned || matched.status === 'RECEIVED') {
      setScannedDiamond(null);
      setError(
        `Barcode "${matched.barcode}" has NOT been assigned to any artisan worker yet (Status: ${matched.status}). Only diamonds that have been assigned to a worker can be verified in QC.`
      );
      return;
    }

    if (matched.status === 'COMPLETED' || matched.status === 'RETURNED') {
      setScannedDiamond(null);
      setError(`Diamond "${matched.barcode}" has already been verified (Status: ${matched.status}).`);
      return;
    }

    setScannedDiamond(matched);
    setActualWeight(matched.actualWeight ? String(matched.actualWeight) : String((matched.weight - 0.015).toFixed(3)));
  };

  const origW = scannedDiamond ? parseFloat(scannedDiamond.weight) : 0;
  const actW = parseFloat(actualWeight) || 0;
  const weightDiff = (origW - actW).toFixed(3);
  const percentLoss = origW > 0 ? (((origW - actW) / origW) * 100).toFixed(2) : 0;

  // Weight tolerance check (e.g. normal polishing loss is 0.5% - 5%, loss > 15% is flagged)
  const isNormalWeightLoss = actW > 0 && actW <= origW && percentLoss <= 10;
  const isMajorWeightMismatch = actW <= 0 || actW > origW || percentLoss > 10;

  const handleConfirmVerification = async (isApproved) => {
    if (!scannedDiamond) return;
    const weightVal = parseFloat(actualWeight);
    if (!actualWeight || isNaN(weightVal) || weightVal <= 0) {
      setError('Please enter a valid positive carat weight from scale (e.g. 0.485 ct).');
      return;
    }

    try {
      await verifyDiamond({
        barcode: scannedDiamond.barcode,
        actualWeight: parseFloat(actualWeight),
        isApproved,
        verifiedBy: user?.name || 'QC Supervisor',
        remarks: verificationRemarks || (isApproved ? 'Passed dual carat scale verification' : 'Failed weight loss tolerance check')
      });

      setSuccessMsg(
        isApproved
          ? `Diamond ${scannedDiamond.barcode} successfully VERIFIED & COMPLETED!`
          : `Diamond ${scannedDiamond.barcode} flagged & returned for REWORK!`
      );
      setScannedDiamond(null);
      setInputBarcode('');
      setActualWeight('');
      setVerificationRemarks('');
    } catch (err) {
      setError(err.message || 'Verification failed.');
    }
  };

  // Pending deposit queue
  const pendingDeposits = diamonds.filter((d) => d.status === 'DEPOSITED' || d.status === 'WORK COMPLETED');

  return (
    <PrivateLayout title="Diamond Deposit & QC Scale Verification">
      <div className="row g-4">
        {/* Verification Console Form */}
        <div className="col-lg-7">
          <div className="card card-custom p-3 p-sm-4 shadow-sm h-100">
            <div className="d-flex align-items-center mb-4">
              <div className="p-2.5 p-sm-3 bg-navy text-warning rounded-3 me-3 flex-shrink-0" style={{ backgroundColor: '#0A192F' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h5 className="font-heading fw-bold text-navy mb-1 mb-sm-0" style={{ color: '#0A192F' }}>
                  QC Barcode & Scale Weight Verification
                </h5>
                <small className="text-muted d-block d-sm-inline">Scan diamond barcode and compare scale carats against inward specs.</small>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                <AlertTriangle size={18} className="me-2 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success d-flex align-items-center mb-3" role="alert">
                <CheckCircle2 size={18} className="me-2 flex-shrink-0" />
                <div>{successMsg}</div>
              </div>
            )}

            {/* Barcode Search Box with Dynamic Autocomplete */}
            <form onSubmit={handleScanOrSearch} className="mb-4 position-relative" ref={searchWrapperRef}>
              <label className="form-label font-heading fw-bold">1. Enter or Scan Barcode</label>
              <div className="d-flex flex-column flex-sm-row gap-2">
                <div className="position-relative flex-grow-1">
                  <Barcode size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                  <input
                    type="text"
                    className="form-control form-control-lg ps-5 text-uppercase fw-bold text-navy"
                    placeholder="e.g. KGK003 or RSB010..."
                    value={inputBarcode}
                    autoComplete="off"
                    onChange={(e) => {
                      const val = e.target.value;
                      setInputBarcode(val);
                      setShowSuggestions(true);
                      if (!val.trim()) {
                        setScannedDiamond(null);
                        setActualWeight('');
                        setError('');
                        setSuccessMsg('');
                      }
                    }}
                    onFocus={() => {
                      if (inputBarcode.trim().length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }}
                  />
                  {inputBarcode && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link position-absolute top-50 end-0 translate-middle-y me-2 text-muted p-1 text-decoration-none"
                      style={{ zIndex: 5 }}
                      onClick={() => {
                        setInputBarcode('');
                        setScannedDiamond(null);
                        setActualWeight('');
                        setError('');
                        setSuccessMsg('');
                        setShowSuggestions(false);
                      }}
                      title="Clear field"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button type="submit" className="btn btn-navy px-4 font-heading fw-bold text-nowrap w-100 w-sm-auto d-flex align-items-center justify-content-center py-2.5">
                  <Search size={16} className="me-1.5" /> Scan & Lookup
                </button>
              </div>

              {/* Dynamic Suggestions Dropdown for Active Assigned Diamonds */}
              {showSuggestions && cleanQuery.length >= 2 && (
                <div
                  className="position-absolute start-0 bg-white border rounded-3 shadow-lg mt-1 overflow-hidden"
                  style={{
                    top: '100%',
                    zIndex: 1050,
                    width: '100%',
                    minWidth: '320px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    boxShadow: '0 14px 35px rgba(0,0,0,0.12)'
                  }}
                >
                  <div className="p-2.5 bg-light border-bottom d-flex align-items-center justify-content-between px-3">
                    <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                      Active Assigned Diamonds ({suggestions.length})
                    </span>
                    <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
                      Click diamond to inspect & verify
                    </span>
                  </div>

                  {suggestions.length === 0 ? (
                    <div className="p-3 text-center text-muted small">
                      No active assigned diamonds matching "<strong>{inputBarcode}</strong>".
                    </div>
                  ) : (
                    suggestions.map((d) => (
                      <div
                        key={d.id || d.barcode}
                        className="p-3 border-bottom d-flex align-items-center justify-content-between text-start"
                        style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                        onClick={() => handleSelectSuggestion(d)}
                      >
                        <div className="d-flex align-items-center gap-2.5 me-3">
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold font-heading fs-6" style={{ color: '#0A192F' }}>
                                {d.barcode}
                              </span>
                              {d.roughCutNo && (
                                <span className="badge bg-light text-secondary border font-mono fw-normal" style={{ fontSize: '0.72rem' }}>
                                  #{d.roughCutNo}
                                </span>
                              )}
                            </div>
                            <div className="text-muted mt-0.5" style={{ fontSize: '0.8rem' }}>
                              Worker: <span className="text-dark fw-semibold">{d.assignedWorkerName}</span> • <span className="text-primary fw-semibold">{d.companyCode || d.companyName || 'DIVY'}</span> • <span className="fw-semibold text-dark">{d.weight} ct</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge status={d.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </form>

            {/* Display Diamond Inspection Card */}
            {scannedDiamond ? (
              <div className="border rounded-3 p-3 p-sm-4 bg-light position-relative">
                <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-3">
                  <div>
                    <span className="text-uppercase text-muted small d-block">Found Diamond Spec</span>
                    <div className="d-flex align-items-center gap-2">
                      <h4 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                        {scannedDiamond.barcode}
                      </h4>
                      {scannedDiamond.roughCutNo ? (
                        <span
                          className="badge font-mono rounded-pill px-2.5 py-1"
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          Rough: #{scannedDiamond.roughCutNo}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Badge status={scannedDiamond.status} />
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-6">
                    <span className="text-muted small d-block">Client Company</span>
                    <span className="fw-bold text-dark">{scannedDiamond.companyName} ({scannedDiamond.companyCode})</span>
                  </div>
                  <div className="col-6 col-md-6">
                    <span className="text-muted small d-block">Diamond Shape</span>
                    <span className="fw-semibold text-dark">{scannedDiamond.shape || scannedDiamond.size}</span>
                  </div>
                  <div className="col-6 col-md-6">
                    <span className="text-muted small d-block">Original Weight</span>
                    <span className="fw-bold text-primary fs-5">{scannedDiamond.weight} ct</span>
                  </div>
                  <div className="col-6 col-md-6">
                    <span className="text-muted small d-block">Assigned Artisan</span>
                    <span className="fw-semibold text-dark">{scannedDiamond.assignedWorkerName || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Actual Scale Weight Input */}
                <div className="card p-3 border-warning bg-white mb-4">
                  <h6 className="fw-bold text-navy mb-2 d-flex align-items-center">
                    <Scale size={18} className="me-2 text-warning" /> 2. Enter Measured Scale Carat Weight
                  </h6>

                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-md-6">
                      <label className="form-label small text-muted">Actual Scale Weight (Carats) *</label>
                      <input
                        type="number"
                        step="0.001"
                        className="form-control form-control-lg fw-bold text-navy"
                        placeholder="e.g. 1.240"
                        value={actualWeight}
                        onChange={(e) => setActualWeight(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 text-center border">
                        <span className="text-muted small d-block">Weight Loss Difference</span>
                        <span className={`fw-bold fs-5 ${isMajorWeightMismatch ? 'text-danger' : 'text-success'}`}>
                          {weightDiff} ct ({percentLoss}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Check Indicators */}
                  <div className="d-flex flex-wrap gap-2 gap-sm-3 mt-3 pt-3 border-top">
                    <div className="d-flex align-items-center">
                      <CheckCircle2 size={16} className="text-success me-1" />
                      <span className="small fw-semibold">Barcode Match: PASS</span>
                    </div>
                    <div className="d-flex align-items-center">
                      {isMajorWeightMismatch ? (
                        <>
                          <AlertTriangle size={16} className="text-danger me-1" />
                          <span className="small fw-semibold text-danger">Weight Check: FLAGGED (Excess Loss)</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} className="text-success me-1" />
                          <span className="small fw-semibold text-success">Weight Check: VERIFIED (Normal Range)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">QC Inspector Remarks</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter inspection audit remarks..."
                    value={verificationRemarks}
                    onChange={(e) => setVerificationRemarks(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3">
                  <button
                    type="button"
                    className="btn btn-success flex-fill py-2.5 font-heading fw-bold shadow-sm w-100 w-sm-auto"
                    onClick={() => handleConfirmVerification(true)}
                  >
                    <CheckCircle2 size={18} className="me-2" /> Confirm Deposit & Mark COMPLETED
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger flex-fill py-2.5 font-heading fw-bold w-100 w-sm-auto"
                    onClick={() => handleConfirmVerification(false)}
                  >
                    <XCircle size={18} className="me-2" /> Reject & Send for REWORK
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 bg-light rounded-3 border text-muted">
                <Scale size={48} className="text-secondary opacity-50 mb-3" />
                <h6>No diamond selected for inspection.</h6>
                <small>Enter a barcode above or select from the pending queue on the right.</small>
              </div>
            )}
          </div>
        </div>

        {/* Pending Deposit Queue Table */}
        <div className="col-lg-5">
          <div className="card card-custom p-3 p-sm-4 shadow-sm h-100">
            <h6 className="font-heading fw-bold text-navy mb-3" style={{ color: '#0A192F' }}>
              Pending QC Verification Queue ({pendingDeposits.length})
            </h6>

            <div className="table-responsive rounded border">
              <table className="table table-custom table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Barcode</th>
                    <th>Worker</th>
                    <th>Orig Weight</th>
                    <th>Status</th>
                    <th className="text-end">Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeposits.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No pending deposits in queue.
                      </td>
                    </tr>
                  ) : (
                    pendingDeposits.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <span className="font-heading fw-bold text-navy">{d.barcode}</span>
                        </td>
                        <td className="small">{d.assignedWorkerName}</td>
                        <td className="fw-semibold">{d.weight} ct</td>
                        <td>
                          <Badge status={d.status} />
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-gold rounded-pill px-3"
                            onClick={() => {
                              setInputBarcode(d.barcode);
                              setScannedDiamond(d);
                              setActualWeight(String((d.weight - 0.015).toFixed(3)));
                            }}
                          >
                            Verify
                          </button>
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

export default DepositVerification;
