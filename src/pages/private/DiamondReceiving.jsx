import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useDiamonds } from '../../context/DiamondContext';
import {
  PackagePlus,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const DiamondReceiving = () => {
  const { companies, diamonds, receiveBatch, showToast } = useDiamonds();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialCompanyId = searchParams.get('company') || (companies[0]?.id || '');

  // 1. Batch Inward Master Details state
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [serialNo, setSerialNo] = useState('');
  const [batchTotalWeight, setBatchTotalWeight] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState('Admin Supervisor');
  const [batchRemarks, setBatchRemarks] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rowToDeleteIndex, setRowToDeleteIndex] = useState(null);

  // 2. Individual Diamond Records state
  const [diamondsList, setDiamondsList] = useState([
    { roughCutNo: '', barcode: '', weight: '', targetWeight: '', shape: '', remarks: '' },
  ]);
  const [totalItemsInput, setTotalItemsInput] = useState('');

  const updateRowsToCount = (targetCount) => {
    const count = parseInt(targetCount, 10);
    if (isNaN(count) || count < 1) return;

    setDiamondsList((prevList) => {
      if (count === prevList.length) return prevList;
      if (count > prevList.length) {
        const diff = count - prevList.length;
        const newRows = Array.from({ length: diff }, () => ({
          roughCutNo: '',
          barcode: '',
          weight: '',
          targetWeight: '',
          shape: '',
          remarks: ''
        }));
        return [...prevList, ...newRows];
      } else {
        return prevList.slice(0, count);
      }
    });
  };

  const handleAddRow = () => {
    setDiamondsList((prev) => {
      const updated = [
        ...prev,
        { roughCutNo: '', barcode: '', weight: '', targetWeight: '', shape: '', remarks: '' }
      ];
      setTotalItemsInput(updated.length.toString());
      return updated;
    });
  };

  const handleRemoveRow = (index) => {
    if (diamondsList.length === 1) return;
    const item = diamondsList[index];
    if (item.barcode?.trim() || item.weight?.trim() || item.roughCutNo?.trim()) {
      setRowToDeleteIndex(index);
      return;
    }
    setDiamondsList((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      setTotalItemsInput(updated.length.toString());
      return updated;
    });
  };

  const confirmRemoveRow = () => {
    if (rowToDeleteIndex === null) return;
    setDiamondsList((prev) => {
      const updated = prev.filter((_, idx) => idx !== rowToDeleteIndex);
      setTotalItemsInput(updated.length.toString());
      return updated;
    });
    setRowToDeleteIndex(null);
  };

  const handleTotalItemsInputChange = (e) => {
    const rawVal = e.target.value;
    setTotalItemsInput(rawVal);

    if (rawVal.trim() === '') return;
    const val = parseInt(rawVal, 10);
    if (!isNaN(val) && val >= 1 && val <= 5000) {
      updateRowsToCount(val);
    }
  };

  const handleTotalItemsInputBlur = () => {
    if (totalItemsInput.trim() === '') {
      setTotalItemsInput(diamondsList.length.toString());
      return;
    }
    let val = parseInt(totalItemsInput, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 5000) val = 5000;
    setTotalItemsInput(val.toString());
    updateRowsToCount(val);
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...diamondsList];
    if (field === 'barcode') {
      updated[index][field] = value.toUpperCase().replace(/\s+/g, '');
    } else if (field === 'roughCutNo') {
      updated[index][field] = value.trim();
    } else if (field === 'weight' || field === 'targetWeight') {
      // Allow only numbers and a single decimal point
      const sanitized = value.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
      updated[index][field] = formatted;
    } else {
      updated[index][field] = value;
    }
    setDiamondsList(updated);
  };

  // Live Weight Calculations
  const totalBatchWeightNum = diamondsList.reduce((sum, d) => sum + (parseFloat(d.weight) || 0), 0);
  const totalBatchWeight = totalBatchWeightNum.toFixed(3);

  const totalTargetWeight = diamondsList
    .reduce((sum, d) => sum + (parseFloat(d.targetWeight) || 0), 0)
    .toFixed(3);

  const masterWeightNum = parseFloat(batchTotalWeight) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSubmitting) return;

    if (!companyId) {
      setError('Please select a client company.');
      return;
    }

    if (!receivedBy.trim()) {
      setError('Received By supervisor name is required.');
      return;
    }

    // Validation check for individual rows
    const seenBarcodes = new Set();
    for (let i = 0; i < diamondsList.length; i++) {
      const d = diamondsList[i];
      const barcode = String(d.barcode || '').trim().toUpperCase();
      if (!barcode) {
        setError(`Barcode Number is required for diamond #${i + 1}`);
        return;
      }
      if (seenBarcodes.has(barcode)) {
        setError(`Duplicate barcode "${barcode}" entered multiple times in this batch (item #${i + 1}).`);
        return;
      }
      seenBarcodes.add(barcode);

      // Check against existing diamonds
      const existing = diamonds.find(
        (dia) => dia.barcode && String(dia.barcode).toUpperCase() === barcode
      );
      if (existing) {
        setError(`Barcode "${barcode}" (item #${i + 1}) already exists in the database. Barcodes must be unique.`);
        return;
      }

      const weightNum = parseFloat(d.weight);
      if (!d.weight || isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
        setError(`Valid Rough Weight (carat weight) is required for item #${i + 1}`);
        return;
      }

      if (d.targetWeight) {
        const targetNum = parseFloat(d.targetWeight);
        if (isNaN(targetNum) || targetNum <= 0 || targetNum > 500) {
          setError(`Polished Weight (target carat weight) must be a valid number if entered (item #${i + 1})`);
          return;
        }
      }
    }

    // Weight comparison: If Total Weight is entered, verify sum of individual weights matches
    if (masterWeightNum > 0 && Math.abs(masterWeightNum - totalBatchWeightNum) > 0.005) {
      setError(
        `Total diamond weight (${totalBatchWeight} ct) does not match the entered Batch Total Weight (${masterWeightNum.toFixed(3)} ct). Difference: ${(totalBatchWeightNum - masterWeightNum).toFixed(3)} ct.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await receiveBatch({
        companyId,
        serialNo,
        batchTotalWeight,
        receivedDate,
        receivedBy,
        remarks: batchRemarks,
        diamondsList
      });

      navigate('/diamonds-list');
    } catch (err) {
      setError(err.message || 'Failed to process receiving batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PrivateLayout title="Physical Diamond Inward Receiving">
      <div className="card card-custom p-3 p-sm-4 mb-4 shadow-sm">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4 pb-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="p-2.5 p-sm-3 bg-navy text-warning rounded-3 me-3 flex-shrink-0" style={{ backgroundColor: '#0A192F' }}>
              <PackagePlus size={24} />
            </div>
            <div>
              <h5 className="font-heading fw-bold text-navy mb-1" style={{ color: '#0A192F' }}>
                New Diamond Parcel Receiving Entry
              </h5>
              <small className="text-muted d-block">
                Enter batch inward details, parcel serial number, and total carat weight to reconcile against individual stones.
              </small>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <AlertCircle size={18} className="me-2 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 1. Batch Inward Master Details */}
          <div className="bg-light p-3 p-sm-4 rounded-3 border mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-navy mb-0 d-flex align-items-center gap-2" style={{ color: '#0A192F' }}>
                <span>1. Batch Inward Master Details</span>
              </h6>
              {serialNo && (
                <span className="badge bg-white text-navy border font-mono small px-2.5 py-1">
                  Parcel Sr: {serialNo}
                </span>
              )}
            </div>

            <div className="row g-3">
              {/* Client Company */}
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Client Company <span className="text-danger">*</span></label>
                <select
                  className="form-select bg-white"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  required
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Serial No */}
              <div className="col-12 col-sm-6 col-md-2">
                <label className="form-label fw-semibold">Serial No</label>
                <input
                  type="text"
                  className="form-control font-mono fw-bold bg-white text-navy"
                  placeholder="e.g. 15 or SR-01"
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                  title="Inward Serial No for this batch parcel"
                />
              </div>

              {/* Received Date */}
              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label fw-semibold">Received Date <span className="text-danger">*</span></label>
                <input
                  type="date"
                  className="form-control bg-white"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  required
                />
              </div>

              {/* Received By (Supervisor) */}
              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label fw-semibold">Received By (Supervisor)</label>
                <input
                  type="text"
                  className="form-control bg-white"
                  placeholder="Supervisor name"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                />
              </div>

              {/* Total Items (Count) */}
              <div className="col-12 col-sm-6 col-md-2">
                <label className="form-label fw-semibold">Total Items <span className="text-danger">*</span></label>
                <div className="input-group">
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    className="form-control bg-white fw-bold text-navy font-mono"
                    value={totalItemsInput}
                    onChange={handleTotalItemsInputChange}
                    onBlur={handleTotalItemsInputBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTotalItemsInputBlur();
                      }
                    }}
                    placeholder="e.g. 15"
                    title="Enter number of diamonds (e.g. 15, 125) to automatically create rows"
                  />
                  <span className="input-group-text bg-white text-muted px-2 small">pcs</span>
                </div>
              </div>

              {/* Total Weight */}
              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label fw-semibold">Total Weight</label>
                <div className="input-group">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className="form-control bg-white fw-bold text-navy font-mono"
                    value={batchTotalWeight}
                    onChange={(e) => setBatchTotalWeight(e.target.value)}
                    placeholder="e.g. 8.50"
                  />
                  <span className="input-group-text bg-light text-muted px-2 small fw-bold font-mono">ct</span>
                </div>
              </div>

              {/* Batch Inward Remarks */}
              <div className="col-12 col-md-7">
                <label className="form-label fw-semibold">Batch Inward Remarks</label>
                <input
                  type="text"
                  className="form-control bg-white"
                  placeholder="e.g. Received via courier sealed parcel #KGK-B90"
                  value={batchRemarks}
                  onChange={(e) => setBatchRemarks(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 2. Individual Diamond Records Table */}
          <div className="mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h6 className="fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                  2. Individual Diamond Records
                </h6>
                <span className="badge rounded-pill bg-white text-navy border px-2.5 py-1.5 fw-semibold shadow-xs">
                  {diamondsList.length} {diamondsList.length === 1 ? 'Diamond' : 'Diamonds'}
                </span>

                {/* Total Rough Weight Badge */}
                <span
                  className="badge rounded-pill px-2.5 py-1.5 fw-semibold shadow-xs font-mono"
                  style={{
                    backgroundColor: 'rgba(212, 175, 55, 0.15)',
                    color: '#9A7B1C',
                    border: '1px solid rgba(212, 175, 55, 0.35)'
                  }}
                >
                  Total Rough Wt: {totalBatchWeight} ct
                </span>

                {parseFloat(totalTargetWeight) > 0 && (
                  <span className="badge rounded-pill px-2.5 py-1.5 fw-semibold bg-white text-primary border shadow-xs font-mono">
                    Total Polished Wt: {totalTargetWeight} ct
                  </span>
                )}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-gold rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center shadow-xs"
                onClick={handleAddRow}
              >
                <Plus size={15} className="me-1" /> Add Diamond Row
              </button>
            </div>

            {/* Datalist for Diamond Cut Shapes */}
            <datalist id="diamondShapesList">
              <option value="Emeral" />
              <option value="Round" />
              <option value="Princess" />
              <option value="Oval" />
              <option value="Marquise" />
              <option value="Pear" />
              <option value="Cushion" />
              <option value="Radiant" />
              <option value="Heart" />
              <option value="Asscher" />
            </datalist>

            <div className="table-responsive rounded-3 border shadow-xs bg-white">
              <table className="table table-bordered table-hover align-middle mb-0" style={{ minWidth: '980px', borderColor: '#E2E8F0' }}>
                <thead style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                  <tr>
                    <th className="text-center py-2.5 text-uppercase fw-bold text-nowrap" style={{ width: '46px', fontSize: '0.75rem', letterSpacing: '0.04em', color: '#475569', backgroundColor: '#F1F5F9' }}>
                      #
                    </th>
                    <th className="py-2.5 text-uppercase fw-bold text-nowrap" style={{ width: '160px', fontSize: '0.75rem', letterSpacing: '0.04em', color: '#0A192F', backgroundColor: '#F1F5F9' }}>
                      Rough.No / Cut.No
                    </th>
                    <th className="py-2.5 text-uppercase fw-bold text-nowrap" style={{ width: '190px', fontSize: '0.75rem', letterSpacing: '0.04em', color: '#0A192F', backgroundColor: '#F1F5F9' }}>
                      Barcode Number <span className="text-danger">*</span>
                    </th>
                    <th className="py-2.5 text-uppercase fw-bold text-nowrap" style={{ width: '170px', fontSize: '0.75rem', letterSpacing: '0.04em', color: '#0A192F', backgroundColor: '#F1F5F9' }}>
                      Rough Weight <span className="text-danger">*</span>
                    </th>
                    <th className="py-2.5 text-uppercase fw-bold text-nowrap" style={{ width: '160px', fontSize: '0.75rem', letterSpacing: '0.04em', color: '#0A192F', backgroundColor: '#F1F5F9' }}>
                      Polished Weight
                    </th>
                    <th className="py-2.5 text-uppercase fw-bold text-nowrap" style={{ width: '160px', fontSize: '0.75rem', letterSpacing: '0.04em', color: '#0A192F', backgroundColor: '#F1F5F9' }}>
                      Diamond Shape
                    </th>
                    <th className="py-2.5 text-uppercase fw-bold text-nowrap" style={{ minWidth: '180px', fontSize: '0.75rem', letterSpacing: '0.04em', color: '#0A192F', backgroundColor: '#F1F5F9' }}>
                      Individual Remarks
                    </th>
                    <th className="text-center py-2.5 text-uppercase fw-bold text-nowrap" style={{ width: '50px', fontSize: '0.75rem', letterSpacing: '0.04em', color: '#475569', backgroundColor: '#F1F5F9' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {diamondsList.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE' }}>
                      <td className="text-center fw-bold text-muted py-2 bg-light">
                        <span className="badge rounded-circle bg-white text-navy border" style={{ width: '24px', height: '24px', lineHeight: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2">
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono fw-semibold shadow-none"
                          placeholder="e.g. 369265"
                          value={item.roughCutNo || ''}
                          onChange={(e) => handleRowChange(idx, 'roughCutNo', e.target.value)}
                          style={{ height: '36px', borderColor: '#CBD5E1' }}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="text"
                          className="form-control form-control-sm text-uppercase font-mono fw-bold text-navy shadow-none"
                          placeholder="e.g. 45223761"
                          value={item.barcode}
                          onChange={(e) => handleRowChange(idx, 'barcode', e.target.value)}
                          style={{ height: '36px', borderColor: '#CBD5E1' }}
                          required
                        />
                      </td>
                      <td className="py-2">
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            step="0.001"
                            inputMode="decimal"
                            className="form-control form-control-sm fw-bold shadow-none font-mono"
                            placeholder="0.54"
                            value={item.weight}
                            onChange={(e) => handleRowChange(idx, 'weight', e.target.value)}
                            style={{ height: '36px', borderColor: '#CBD5E1' }}
                            required
                          />
                          <span className="input-group-text bg-light text-muted px-2 small fw-medium" style={{ height: '36px', borderColor: '#CBD5E1' }}>
                            ct
                          </span>
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            step="0.001"
                            inputMode="decimal"
                            className="form-control form-control-sm fw-semibold shadow-none font-mono"
                            placeholder="0.32"
                            value={item.targetWeight}
                            onChange={(e) => handleRowChange(idx, 'targetWeight', e.target.value)}
                            style={{ height: '36px', borderColor: '#CBD5E1' }}
                          />
                          <span className="input-group-text bg-light text-muted px-2 small fw-medium" style={{ height: '36px', borderColor: '#CBD5E1' }}>
                            ct
                          </span>
                        </div>
                      </td>
                      <td className="py-2">
                        <input
                          type="text"
                          list="diamondShapesList"
                          className="form-control form-control-sm shadow-none fw-medium"
                          placeholder="e.g. Emeral"
                          value={item.shape || ''}
                          onChange={(e) => handleRowChange(idx, 'shape', e.target.value)}
                          style={{ height: '36px', borderColor: '#CBD5E1' }}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="text"
                          className="form-control form-control-sm shadow-none"
                          placeholder="Marks / notes..."
                          value={item.remarks}
                          onChange={(e) => handleRowChange(idx, 'remarks', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && idx === diamondsList.length - 1) {
                              e.preventDefault();
                              handleAddRow();
                            }
                          }}
                          style={{ height: '36px', borderColor: '#CBD5E1' }}
                        />
                      </td>
                      <td className="text-center py-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-1.5 transition-all"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={diamondsList.length === 1}
                          title={diamondsList.length === 1 ? 'At least one diamond row is required' : 'Remove row'}
                          style={{ opacity: diamondsList.length === 1 ? 0.35 : 1 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Table Summary Footer */}
                <tfoot style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #CBD5E1' }}>
                  <tr className="fw-bold font-mono">
                    <td className="text-center py-2.5 text-muted small bg-light">TOTAL</td>
                    <td className="py-2.5 text-navy small">{diamondsList.length} Items</td>
                    <td className="py-2.5 text-muted small">
                      {diamondsList.filter((d) => d.barcode?.trim()).length} / {diamondsList.length} Barcodes
                    </td>
                    <td className="py-2.5">
                      <span className="text-navy" style={{ fontSize: '0.88rem' }}>{totalBatchWeight} ct</span>
                    </td>
                    <td className="py-2.5 text-primary small">
                      {parseFloat(totalTargetWeight) > 0 ? `${totalTargetWeight} ct` : '—'}
                    </td>
                    <td colSpan="3" className="py-2.5 text-muted small text-end pe-3">
                      {masterWeightNum > 0 && (
                        <span>Batch Total Weight: <strong className="text-navy">{masterWeightNum.toFixed(3)} ct</strong></span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 gap-sm-3 pt-3 border-top">
            <button
              type="button"
              className="btn btn-light border px-4 rounded-pill w-100 w-sm-auto mb-1 mb-sm-0"
              onClick={() => navigate('/diamonds-list')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-gold px-4 px-sm-5 rounded-pill font-heading fw-bold shadow-sm w-100 w-sm-auto d-inline-flex align-items-center justify-content-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing Batch...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} className="me-2" /> Save & Register Diamond Batch
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Discard Diamond Row Confirmation Modal */}
      {rowToDeleteIndex !== null && (
        <ConfirmModal
          isOpen={rowToDeleteIndex !== null}
          onClose={() => setRowToDeleteIndex(null)}
          onConfirm={confirmRemoveRow}
          title="Remove Diamond Entry"
          message={`Are you sure you want to discard row #${rowToDeleteIndex + 1}${diamondsList[rowToDeleteIndex]?.barcode ? ` (Barcode: ${diamondsList[rowToDeleteIndex].barcode})` : ''
            }? All details entered for this row will be cleared.`}
          confirmText="Remove Row"
          cancelText="Keep Row"
          confirmVariant="danger"
          icon="delete"
        />
      )}


    </PrivateLayout>
  );
};

export default DiamondReceiving;
