import React, { useState } from 'react';
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
  History
} from 'lucide-react';

const DepositVerification = () => {
  const { diamonds, verifyDiamond, showToast } = useDiamonds();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [inputBarcode, setInputBarcode] = useState(searchParams.get('barcode') || '');
  const [scannedDiamond, setScannedDiamond] = useState(() => {
    const q = searchParams.get('barcode');
    if (q) {
      return diamonds.find((d) => d.barcode.toLowerCase() === q.toLowerCase()) || null;
    }
    return null;
  });

  const [actualWeight, setActualWeight] = useState('');
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleScanOrSearch = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!inputBarcode.trim()) {
      setError('Please enter or scan a barcode number.');
      return;
    }

    const matched = diamonds.find(
      (d) => d.barcode.toLowerCase() === inputBarcode.trim().toLowerCase()
    );

    if (matched) {
      setScannedDiamond(matched);
      setActualWeight(matched.actualWeight ? String(matched.actualWeight) : String((matched.weight - 0.015).toFixed(3)));
    } else {
      setScannedDiamond(null);
      setError(`No diamond found with barcode: "${inputBarcode}"`);
    }
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
    if (!actualWeight || isNaN(parseFloat(actualWeight))) {
      setError('Please enter valid actual scale carat weight.');
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
          <div className="card card-custom p-4 shadow-sm h-100">
            <div className="d-flex align-items-center mb-4">
              <div className="p-3 bg-navy text-warning rounded-3 me-3" style={{ backgroundColor: '#0A192F' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h5 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                  QC Barcode & Scale Weight Verification
                </h5>
                <small className="text-muted">Scan diamond barcode and compare scale carats against inward specs.</small>
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

            {/* Barcode Search Box */}
            <form onSubmit={handleScanOrSearch} className="mb-4">
              <label className="form-label font-heading fw-bold">1. Enter or Scan Barcode</label>
              <div className="input-group">
                <span className="input-group-text bg-light text-navy fw-bold">
                  <Barcode size={18} className="me-1" /> BARCODE
                </span>
                <input
                  type="text"
                  className="form-control form-control-lg text-uppercase fw-bold text-navy"
                  placeholder="e.g. KGK003 or RSB010..."
                  value={inputBarcode}
                  onChange={(e) => setInputBarcode(e.target.value)}
                />
                <button type="submit" className="btn btn-navy px-4 font-heading fw-bold">
                  <Search size={16} className="me-1" /> Scan & Lookup
                </button>
              </div>
            </form>

            {/* Display Diamond Inspection Card */}
            {scannedDiamond ? (
              <div className="border rounded-3 p-4 bg-light position-relative">
                <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-3">
                  <div>
                    <span className="text-uppercase text-muted small d-block">Found Diamond Spec</span>
                    <h4 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                      {scannedDiamond.barcode}
                    </h4>
                  </div>
                  <Badge status={scannedDiamond.status} />
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <span className="text-muted small d-block">Client Company</span>
                    <span className="fw-bold text-dark">{scannedDiamond.companyName} ({scannedDiamond.companyCode})</span>
                  </div>
                  <div className="col-md-6">
                    <span className="text-muted small d-block">Diamond Cut / Size</span>
                    <span className="fw-semibold text-dark">{scannedDiamond.size}</span>
                  </div>
                  <div className="col-md-6">
                    <span className="text-muted small d-block">Original Received Weight</span>
                    <span className="fw-bold text-primary fs-5">{scannedDiamond.weight} ct</span>
                  </div>
                  <div className="col-md-6">
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
                    <div className="col-md-6">
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

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 text-center border">
                        <span className="text-muted small d-block">Weight Loss Difference</span>
                        <span className={`fw-bold fs-5 ${isMajorWeightMismatch ? 'text-danger' : 'text-success'}`}>
                          {weightDiff} ct ({percentLoss}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Check Indicators */}
                  <div className="d-flex flex-wrap gap-3 mt-3 pt-3 border-top">
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
                <div className="d-flex gap-3">
                  <button
                    type="button"
                    className="btn btn-success flex-fill py-2 font-heading fw-bold shadow-sm"
                    onClick={() => handleConfirmVerification(true)}
                  >
                    <CheckCircle2 size={18} className="me-2" /> Confirm Deposit & Mark COMPLETED
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger flex-fill py-2 font-heading fw-bold"
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
          <div className="card card-custom p-4 shadow-sm h-100">
            <h6 className="font-heading fw-bold text-navy mb-3" style={{ color: '#0A192F' }}>
              Pending QC Verification Queue ({pendingDeposits.length})
            </h6>

            <div className="table-responsive">
              <table className="table table-custom table-hover align-middle">
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
