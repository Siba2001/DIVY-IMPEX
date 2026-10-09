import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import { useDiamonds } from '../../context/DiamondContext';
import { PackagePlus, Plus, Trash2, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

const DiamondReceiving = () => {
  const { companies, receiveBatch, showToast } = useDiamonds();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialCompanyId = searchParams.get('company') || (companies[0]?.id || '');

  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState('Admin Supervisor');
  const [batchRemarks, setBatchRemarks] = useState('');
  const [error, setError] = useState('');

  const [diamondsList, setDiamondsList] = useState([
    { barcode: '', size: '1.20 ct', weight: '', remarks: '' },
    { barcode: '', size: '0.85 ct', weight: '', remarks: '' },
  ]);

  const handleAddRow = () => {
    setDiamondsList([...diamondsList, { barcode: '', size: '1.00 ct', weight: '', remarks: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (diamondsList.length === 1) return;
    setDiamondsList(diamondsList.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...diamondsList];
    updated[index][field] = value;
    setDiamondsList(updated);
  };

  // Quick Auto Generator for Bulk Barcodes
  const handleAutoGenerateBarcodes = () => {
    const company = companies.find((c) => c.id === companyId);
    if (!company) {
      setError('Please select a company first!');
      return;
    }

    const prefix = company.code;
    const randomStart = Math.floor(100 + Math.random() * 800);

    const generated = diamondsList.map((item, idx) => ({
      ...item,
      barcode: `${prefix}${randomStart + idx}`,
      weight: item.weight || (0.75 + Math.random() * 1.5).toFixed(3)
    }));

    setDiamondsList(generated);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyId) {
      setError('Please select a client company.');
      return;
    }

    // Validation check for individual rows
    for (let i = 0; i < diamondsList.length; i++) {
      const d = diamondsList[i];
      if (!d.barcode.trim()) {
        setError(`Barcode is required for item #${i + 1}`);
        return;
      }
      if (!d.size.trim()) {
        setError(`Size is required for item #${i + 1}`);
        return;
      }
      if (!d.weight || isNaN(parseFloat(d.weight)) || parseFloat(d.weight) <= 0) {
        setError(`Valid weight in carats is required for item #${i + 1}`);
        return;
      }
    }

    try {
      await receiveBatch({
        companyId,
        receivedDate,
        receivedBy,
        remarks: batchRemarks,
        diamondsList
      });

      navigate('/diamonds-list');
    } catch (err) {
      setError(err.message || 'Failed to process receiving batch');
    }
  };

  return (
    <PrivateLayout title="Physical Diamond Inward Receiving">
      <div className="card card-custom p-4 mb-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <div className="p-3 bg-navy text-warning rounded-3 me-3" style={{ backgroundColor: '#0A192F' }}>
              <PackagePlus size={24} />
            </div>
            <div>
              <h5 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                New Diamond Parcel Receiving Entry
              </h5>
              <small className="text-muted">Enter batch inward details and list individual diamonds with barcode and weight.</small>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline-warning text-dark font-heading fw-semibold d-flex align-items-center"
            onClick={handleAutoGenerateBarcodes}
          >
            <Sparkles size={16} className="me-2 text-warning" /> Auto-Fill Test Barcodes
          </button>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <AlertCircle size={18} className="me-2 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Batch Master Info Header */}
          <div className="bg-light p-3 rounded-3 border mb-4">
            <h6 className="fw-bold text-navy mb-3">1. Batch Inward Master Details</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Client Company *</label>
                <select
                  className="form-select"
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

              <div className="col-md-3">
                <label className="form-label">Received Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Received By (Supervisor)</label>
                <input
                  type="text"
                  className="form-control"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">Total Items</label>
                <input
                  type="text"
                  className="form-control bg-white fw-bold text-navy"
                  value={`${diamondsList.length} Diamonds`}
                  readOnly
                />
              </div>

              <div className="col-12">
                <label className="form-label">Batch Inward Remarks</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Received via courier sealed parcel #KGK-B90"
                  value={batchRemarks}
                  onChange={(e) => setBatchRemarks(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Individual Diamonds Table */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-navy mb-0">2. Individual Diamond Records</h6>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-3"
                onClick={handleAddRow}
              >
                <Plus size={14} className="me-1" /> Add Diamond Row
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-custom align-middle">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th>Diamond Barcode *</th>
                    <th>Size (Geometry) *</th>
                    <th>Weight (Carats) *</th>
                    <th>Individual Remarks</th>
                    <th className="text-end" style={{ width: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {diamondsList.map((item, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold text-muted">{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm text-uppercase fw-bold text-navy"
                          placeholder="e.g. KGK009"
                          value={item.barcode}
                          onChange={(e) => handleRowChange(idx, 'barcode', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 1.25 ct Ideal"
                          value={item.size}
                          onChange={(e) => handleRowChange(idx, 'size', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.001"
                          className="form-control form-control-sm fw-semibold"
                          placeholder="Weight in Carats"
                          value={item.weight}
                          onChange={(e) => handleRowChange(idx, 'weight', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Optional notes"
                          value={item.remarks}
                          onChange={(e) => handleRowChange(idx, 'remarks', e.target.value)}
                        />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-1"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={diamondsList.length === 1}
                          title="Remove Row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="d-flex justify-content-end gap-3 pt-3 border-top">
            <button
              type="button"
              className="btn btn-light border px-4 rounded-pill"
              onClick={() => navigate('/diamonds-list')}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-gold px-5 rounded-pill font-heading fw-bold shadow-sm">
              <CheckCircle2 size={18} className="me-2" /> Save & Register Diamond Batch
            </button>
          </div>
        </form>
      </div>
    </PrivateLayout>
  );
};

export default DiamondReceiving;
