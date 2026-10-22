import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Modal from '../../components/common/Modal';
import { useDiamonds } from '../../context/DiamondContext';
import { Users, Plus, Eye, Edit, Phone, HardHat, Search, Trash2, AlertCircle } from 'lucide-react';

const Workers = () => {
  const { workers, diamonds, addWorker, updateWorker, deleteWorker } = useDiamonds();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    department: 'Polishing',
    phone: '',
    status: 'ACTIVE'
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateWorker = (data) => {
    const errs = {};
    const empId = String(data.employeeId || '').trim().toUpperCase();
    if (!empId) {
      errs.employeeId = 'Employee ID is required.';
    } else if (!/^[A-Z0-9_-]{2,12}$/.test(empId)) {
      errs.employeeId = 'Employee ID must be 2-12 letters/numbers (e.g. EMP-101).';
    } else {
      const duplicate = workers.find(
        (w) => w.employeeId && String(w.employeeId).toUpperCase() === empId && w.id !== editingWorker?.id
      );
      if (duplicate) {
        errs.employeeId = `Employee ID "${empId}" is already assigned to "${duplicate.name}".`;
      }
    }

    const name = String(data.name || '').trim();
    if (!name) {
      errs.name = 'Worker Name is required.';
    } else if (name.length < 2) {
      errs.name = 'Worker Name must be at least 2 characters.';
    }

    if (!data.department) {
      errs.department = 'Please select a department.';
    }

    const phone = String(data.phone || '').trim().replace(/\D/g, '');
    if (!phone) {
      errs.phone = 'Mobile Phone Number is required.';
    } else if (phone.length !== 10) {
      errs.phone = `Mobile number must be exactly 10 digits (currently ${phone.length} digits).`;
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      errs.phone = 'Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9.';
    } else {
      // Check duplicate mobile number
      const duplicatePhone = workers.find(
        (w) => w.phone && String(w.phone).replace(/\D/g, '') === phone && w.id !== editingWorker?.id
      );
      if (duplicatePhone) {
        errs.phone = `Mobile number "${phone}" is already registered for "${duplicatePhone.name}" (${duplicatePhone.employeeId}).`;
      }
    }

    return errs;
  };

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFormData({
      employeeId: `EMP-${100 + workers.length + 1}`,
      name: '',
      department: 'Polishing',
      phone: '',
      status: 'ACTIVE'
    });
    setFormErrors({});
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w, e) => {
    e.stopPropagation();
    setEditingWorker(w);
    setFormData({
      employeeId: w.employeeId || '',
      name: w.name || '',
      department: w.department || 'Polishing',
      phone: w.phone ? String(w.phone) : '',
      status: w.status || 'ACTIVE'
    });
    setFormErrors({});
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleDeleteWorker = async (w, e) => {
    e.stopPropagation();
    const assignedDiamonds = diamonds.filter((d) => d.assignedWorkerId === w.id);
    const msg = assignedDiamonds.length > 0
      ? `Artisan "${w.name}" (${w.employeeId}) currently has ${assignedDiamonds.length} diamonds assigned. Are you sure you want to delete this artisan?`
      : `Are you sure you want to delete artisan worker "${w.name}" (${w.employeeId})?`;
    if (window.confirm(msg)) {
      await deleteWorker(w.id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateWorker(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanData = {
        ...formData,
        employeeId: String(formData.employeeId).trim().toUpperCase(),
        name: formData.name.trim(),
        department: formData.department,
        phone: String(formData.phone).trim().replace(/\D/g, '').slice(0, 10),
        status: formData.status
      };

      if (editingWorker) {
        await updateWorker(editingWorker.id, cleanData);
      } else {
        await addWorker(cleanData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save worker', err);
      setFormErrors({ submit: err.message || 'Failed to save artisan worker.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWorkers = workers.filter(
    (w) =>
      String(w.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(w.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(w.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PrivateLayout title="Artisan Worker Roster">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-3 mb-4">
        <div className="position-relative flex-grow-1" style={{ maxWidth: '400px' }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Search worker name, ID, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn btn-gold rounded-pill px-4 py-2 font-heading fw-bold d-flex align-items-center justify-content-center flex-shrink-0 text-nowrap" onClick={handleOpenAdd}>
          <Plus size={18} className="me-2" /> Register New Artisan Worker
        </button>
      </div>

      <div className="card card-custom p-3 shadow-sm">
        <div className="table-responsive">
          <table className="table table-custom table-sticky-first table-hover align-middle mb-0">
            <thead>
              <tr>
                <th className="text-nowrap text-center">Emp ID</th>
                <th className="text-nowrap">Artisan Name</th>
                <th className="text-nowrap">Department</th>
                <th className="text-nowrap">Mobile</th>
                <th className="text-nowrap text-center">Assigned</th>
                <th className="text-nowrap text-center">In Progress</th>
                <th className="text-nowrap text-center">Completed</th>
                <th className="text-nowrap text-center">Pending</th>
                <th className="text-nowrap text-center">Status</th>
                <th className="text-end text-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-5 text-muted">
                    <Users size={36} className="mb-2 text-secondary opacity-50 d-block mx-auto" />
                    <p className="mb-1 fw-semibold">No artisans or workers enrolled yet</p>
                    <small className="text-secondary">Click the "+ Add New Worker" button above to register your first artisan.</small>
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((w) => {
                  const wDiamonds = diamonds.filter((d) => d.assignedWorkerId === w.id);
                  const totalAssigned = wDiamonds.length;
                  const inProgress = wDiamonds.filter((d) => ['IN PROGRESS', 'WORK COMPLETED'].includes(d.status)).length;
                  const completed = wDiamonds.filter((d) => ['COMPLETED', 'VERIFIED', 'DEPOSITED'].includes(d.status)).length;
                  const pending = wDiamonds.filter((d) => ['ASSIGNED', 'REWORK'].includes(d.status)).length;

                  return (
                    <tr
                      key={w.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/workers/${w.id}`)}
                    >
                      <td className="text-center">
                        <span className="badge font-mono fw-bold px-2 py-1" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>
                          {w.employeeId}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center text-nowrap">
                          <div className="avatar text-warning rounded-circle me-2 fw-bold d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '30px', height: '30px', backgroundColor: '#0A192F' }}>
                            <HardHat size={15} />
                          </div>
                          <span className="fw-bold" style={{ color: '#0A192F' }}>{w.name}</span>
                        </div>
                      </td>
                      <td className="fw-medium text-dark text-nowrap">{w.department}</td>
                      <td className="small text-muted text-nowrap">{w.phone}</td>
                      <td className="fw-bold text-center text-nowrap" style={{ color: '#0A192F' }}>{totalAssigned}</td>
                      <td className="text-center">
                        <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                          {inProgress}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                          {completed}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>
                          {pending}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge px-2.5 py-1.5 fw-bold ${w.status === 'ACTIVE' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="text-end text-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-sm btn-outline-primary me-1 rounded-circle"
                          onClick={() => navigate(`/workers/${w.id}`)}
                          title="View Work History"
                          style={{ width: '30px', height: '30px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-circle"
                          onClick={(e) => handleOpenEdit(w, e)}
                          title="Edit Worker Info"
                          style={{ width: '30px', height: '30px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger ms-1 rounded-circle"
                          onClick={(e) => handleDeleteWorker(w, e)}
                          title="Delete Worker"
                          style={{ width: '30px', height: '30px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Worker Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWorker ? 'Edit Artisan Worker Details' : 'Register New Artisan Worker'}
        size="md"
      >
        <form onSubmit={handleSubmit} noValidate>
          {formErrors.submit && (
            <div className="alert alert-danger py-2 px-3 mb-3 small d-flex align-items-center">
              <AlertCircle size={16} className="me-2 flex-shrink-0" />
              <span>{formErrors.submit}</span>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold">Employee ID <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`form-control font-mono fw-bold text-uppercase ${formErrors.employeeId ? 'is-invalid' : ''}`}
              placeholder="e.g. EMP-107"
              maxLength={12}
              value={formData.employeeId}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12);
                setFormData({ ...formData, employeeId: val });
                if (formErrors.employeeId) setFormErrors({ ...formErrors, employeeId: null });
              }}
            />
            {formErrors.employeeId && <div className="invalid-feedback d-block">{formErrors.employeeId}</div>}
            <small className="text-muted d-block mt-1">Unique company artisan identifier (e.g. EMP-101).</small>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Artisan Worker Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: null });
              }}
            />
            {formErrors.name && <div className="invalid-feedback d-block">{formErrors.name}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Specialized Department <span className="text-danger">*</span></label>
            <select
              className={`form-select ${formErrors.department ? 'is-invalid' : ''}`}
              value={formData.department}
              onChange={(e) => {
                setFormData({ ...formData, department: e.target.value });
                if (formErrors.department) setFormErrors({ ...formErrors, department: null });
              }}
            >
              <option value="Cutting">Cutting</option>
              <option value="Polishing">Polishing</option>
              <option value="Girdling">Girdling</option>
              <option value="Laser Sawing">Laser Sawing</option>
              <option value="Quality Assurance">Quality Assurance</option>
            </select>
            {formErrors.department && <div className="invalid-feedback d-block">{formErrors.department}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Mobile Phone Number <span className="text-danger">*</span></label>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted font-mono fw-semibold">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className={`form-control font-mono ${formErrors.phone ? 'is-invalid' : ''}`}
                placeholder="10-digit mobile number (e.g. 9879452045)"
                value={formData.phone}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: onlyDigits });
                  if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                }}
              />
            </div>
            {formErrors.phone ? (
              <div className="invalid-feedback d-block">{formErrors.phone}</div>
            ) : (
              <small className="text-muted d-block mt-1">10-digit mobile number starting with 6, 7, 8, or 9 (unique per artisan).</small>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Work Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_LEAVE">ON LEAVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-light border px-4"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-gold px-4 fw-bold d-inline-flex align-items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {editingWorker ? 'Saving...' : 'Registering...'}
                </>
              ) : (
                editingWorker ? 'Save Changes' : 'Register Worker'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </PrivateLayout>
  );
};

export default Workers;
