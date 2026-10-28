import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Edit3, AlertCircle, Save, X, Sparkles, Building2, Tag, Scale, Layers } from 'lucide-react';

const SHAPE_OPTIONS = [
  'Emeral',
  'Round',
  'Princess',
  'Oval',
  'Marquise',
  'Pear',
  'Cushion',
  'Radiant',
  'Heart',
  'Asscher'
];

const EditDiamondModal = ({ isOpen, onClose, diamond, onSave, companies = [], allDiamonds = [] }) => {
  const [formData, setFormData] = useState({
    barcode: '',
    roughCutNo: '',
    serialNo: '',
    companyId: '',
    shape: 'Emeral',
    weight: '',
    targetWeight: '',
    actualWeight: '',
    editReason: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (diamond) {
      setFormData({
        barcode: diamond.barcode ?? '',
        roughCutNo: diamond.roughCutNo ?? '',
        serialNo: diamond.serialNo ?? '',
        companyId: diamond.companyId ?? '',
        shape: diamond.shape || diamond.size || 'Emeral',
        weight: diamond.weight !== undefined && diamond.weight !== null ? String(diamond.weight) : '',
        targetWeight: diamond.targetWeight !== undefined && diamond.targetWeight !== null ? String(diamond.targetWeight) : '',
        actualWeight: diamond.actualWeight !== undefined && diamond.actualWeight !== null ? String(diamond.actualWeight) : '',
        editReason: ''
      });
      setErrors({});
    }
  }, [diamond]);

  if (!isOpen || !diamond) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};

    const cleanBarcode = String(formData.barcode || '').trim().toUpperCase();
    if (!cleanBarcode) {
      errs.barcode = 'Barcode number is required';
    } else {
      // Check for duplicate barcode in other diamond records
      const originalBarcode = String(diamond.barcode || '').trim().toUpperCase();
      if (cleanBarcode !== originalBarcode) {
        const duplicate = allDiamonds.some(
          (d) => d.id !== diamond.id && String(d.barcode || '').trim().toUpperCase() === cleanBarcode
        );
        if (duplicate) {
          errs.barcode = `Barcode "${cleanBarcode}" already exists on another diamond!`;
        }
      }
    }

    if (!formData.companyId) {
      errs.companyId = 'Please select a company';
    }

    const roughWt = parseFloat(formData.weight);
    if (!formData.weight || isNaN(roughWt) || roughWt <= 0) {
      errs.weight = 'Valid rough weight (> 0 ct) is required';
    }

    if (formData.targetWeight !== '' && formData.targetWeight !== null) {
      const targetWt = parseFloat(formData.targetWeight);
      if (isNaN(targetWt) || targetWt < 0) {
        errs.targetWeight = 'Target weight must be a positive number';
      }
    }

    if (formData.actualWeight !== '' && formData.actualWeight !== null) {
      const actWt = parseFloat(formData.actualWeight);
      if (isNaN(actWt) || actWt < 0) {
        errs.actualWeight = 'Actual weight must be a positive number';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: diamond.id,
        originalBarcode: diamond.barcode,
        barcode: String(formData.barcode).trim().toUpperCase(),
        roughCutNo: formData.roughCutNo,
        serialNo: formData.serialNo,
        companyId: formData.companyId,
        shape: formData.shape,
        weight: parseFloat(formData.weight),
        targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : null,
        actualWeight: formData.actualWeight ? parseFloat(formData.actualWeight) : null,
        status: diamond.status,
        remarks: diamond.remarks,
        editReason: formData.editReason || 'Typo / specification detail correction'
      });
      onClose();
    } catch (err) {
      console.error('Failed to update diamond:', err);
      setErrors({ form: err.message || 'Failed to save changes. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center shadow-xs"
            style={{ width: '34px', height: '34px', backgroundColor: '#FEF3C7', color: '#92400E' }}
          >
            <Edit3 size={17} />
          </div>
          <div>
            <span className="fw-bold" style={{ color: '#0A192F', fontSize: '1.1rem' }}>Edit Diamond Details</span>
            <span className="text-muted d-block small font-mono fw-normal" style={{ fontSize: '0.78rem' }}>
              Barcode: <span className="fw-semibold text-dark">{formData.barcode || diamond.barcode}</span>
            </span>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        {errors.form && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small rounded-3 mb-3">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>{errors.form}</div>
          </div>
        )}

        <div className="p-3 rounded-3 mb-4 border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
          <div className="row g-2 align-items-center text-muted small">
            <div className="col-12 col-sm-6">
              <span className="text-muted">Received Date:</span>{' '}
              <span className="fw-medium text-dark">{diamond.receivedDate || '-'}</span>
            </div>
            <div className="col-12 col-sm-6">
              <span className="text-muted">Assigned Worker:</span>{' '}
              <span className="fw-medium text-dark">{diamond.assignedWorkerName || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        <div className="row g-3">
          {/* Barcode Number (Editable) */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
              <Tag size={14} className="text-muted" /> Barcode Number <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control font-mono fw-semibold ${errors.barcode ? 'is-invalid' : ''}`}
              value={formData.barcode}
              onChange={(e) => handleChange('barcode', e.target.value)}
              placeholder="e.g. 001, 213, DIA-01"
              style={{ fontSize: '0.88rem' }}
            />
            {errors.barcode ? (
              <div className="invalid-feedback small">{errors.barcode}</div>
            ) : (
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                Leading zeros are strictly preserved (e.g. "01")
              </span>
            )}
          </div>

          {/* Company Selection */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
              <Building2 size={14} className="text-muted" /> Client Company <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.companyId ? 'is-invalid' : ''}`}
              value={formData.companyId}
              onChange={(e) => handleChange('companyId', e.target.value)}
              style={{ fontSize: '0.88rem' }}
            >
              <option value="">Select Company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            {errors.companyId && <div className="invalid-feedback small">{errors.companyId}</div>}
          </div>

          {/* Diamond Shape */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
              <Sparkles size={14} className="text-muted" /> Shape / Cut
            </label>
            <input
              type="text"
              list="modalDiamondShapesList"
              className="form-control"
              value={formData.shape}
              onChange={(e) => handleChange('shape', e.target.value)}
              placeholder="e.g. Emeral, Round, Princess"
              style={{ fontSize: '0.88rem' }}
            />
            <datalist id="modalDiamondShapesList">
              {SHAPE_OPTIONS.map((shape) => (
                <option key={shape} value={shape} />
              ))}
            </datalist>
          </div>

          {/* Rough Cut No */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
              <Tag size={14} className="text-muted" /> Rough.No / Cut.No
            </label>
            <input
              type="text"
              className="form-control font-mono"
              value={formData.roughCutNo}
              onChange={(e) => handleChange('roughCutNo', e.target.value)}
              placeholder="e.g. 01, R-102, C-5"
              style={{ fontSize: '0.88rem' }}
            />
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              Leading zeros will be strictly preserved (e.g. "01")
            </span>
          </div>

          {/* Serial No */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
              <Layers size={14} className="text-muted" /> Serial No / Inward Lot No
            </label>
            <input
              type="text"
              className="form-control font-mono"
              value={formData.serialNo}
              onChange={(e) => handleChange('serialNo', e.target.value)}
              placeholder="e.g. 001, 104"
              style={{ fontSize: '0.88rem' }}
            />
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              Lot serial or sequence identification
            </span>
          </div>

          {/* Rough Weight */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
              <Scale size={14} className="text-muted" /> Rough Weight (ct) <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <input
                type="number"
                step="0.001"
                min="0.001"
                className={`form-control font-mono ${errors.weight ? 'is-invalid' : ''}`}
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="0.000"
                style={{ fontSize: '0.88rem' }}
              />
              <span className="input-group-text small bg-light text-muted">ct</span>
            </div>
            {errors.weight && <div className="text-danger small mt-1">{errors.weight}</div>}
          </div>

          {/* Target / Polished Weight */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
              <Scale size={14} className="text-muted" /> Target Weight (ct)
            </label>
            <div className="input-group">
              <input
                type="number"
                step="0.001"
                min="0"
                className={`form-control font-mono ${errors.targetWeight ? 'is-invalid' : ''}`}
                value={formData.targetWeight}
                onChange={(e) => handleChange('targetWeight', e.target.value)}
                placeholder="0.000 (optional)"
                style={{ fontSize: '0.88rem' }}
              />
              <span className="input-group-text small bg-light text-muted">ct</span>
            </div>
            {errors.targetWeight && <div className="text-danger small mt-1">{errors.targetWeight}</div>}
          </div>

          {/* Actual Weight */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
              <Scale size={14} className="text-muted" /> Actual Polished Wt (ct)
            </label>
            <div className="input-group">
              <input
                type="number"
                step="0.001"
                min="0"
                className={`form-control font-mono ${errors.actualWeight ? 'is-invalid' : ''}`}
                value={formData.actualWeight}
                onChange={(e) => handleChange('actualWeight', e.target.value)}
                placeholder="0.000"
                style={{ fontSize: '0.88rem' }}
              />
              <span className="input-group-text small bg-light text-muted">ct</span>
            </div>
            {errors.actualWeight && <div className="text-danger small mt-1">{errors.actualWeight}</div>}
          </div>

          {/* Reason / Correction Note */}
          <div className="col-12">
            <label className="form-label small fw-semibold text-dark mb-1">
              Reason for Correction <span className="text-muted small fw-normal">(recorded in History)</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.editReason}
              onChange={(e) => handleChange('editReason', e.target.value)}
              placeholder="e.g. Typo in rough cut number, weight correction"
              style={{ fontSize: '0.88rem' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end align-items-center gap-2 pt-3 mt-4 border-top">
          <button
            type="button"
            className="btn btn-light border rounded-pill px-3 py-1.5"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ fontSize: '0.88rem' }}
          >
            <X size={15} className="me-1" /> Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary rounded-pill px-4 py-1.5 fw-semibold d-inline-flex align-items-center shadow-xs"
            disabled={isSubmitting}
            style={{ fontSize: '0.88rem', backgroundColor: '#0A192F', borderColor: '#0A192F' }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving Changes...
              </>
            ) : (
              <>
                <Save size={15} className="me-1.5" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditDiamondModal;
