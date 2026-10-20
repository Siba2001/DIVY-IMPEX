import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Modal from '../../components/common/Modal';
import { useDiamonds } from '../../context/DiamondContext';
import { Building2, Plus, Eye, Edit, Phone, Mail, MapPin, Search, Trash2, AlertCircle } from 'lucide-react';

const Companies = () => {
  const { companies, diamonds, addCompany, updateCompany, deleteCompany } = useDiamonds();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (data) => {
    const errs = {};
    const name = String(data.name || '').trim();
    if (!name) {
      errs.name = 'Company Name is required.';
    } else if (name.length < 2) {
      errs.name = 'Company Name must be at least 2 characters.';
    }

    const code = String(data.code || '').trim().toUpperCase();
    if (!code) {
      errs.code = 'Company Code is required.';
    } else if (!/^[A-Z0-9_-]{2,10}$/.test(code)) {
      errs.code = 'Code must be 2 to 10 characters (letters & numbers only).';
    } else {
      // Check duplicate code
      const duplicate = companies.find(
        (c) => c.code && String(c.code).toUpperCase() === code && c.id !== editingCompany?.id
      );
      if (duplicate) {
        errs.code = `Company Code "${code}" is already in use by "${duplicate.name}".`;
      }
    }

    const phone = String(data.phone || '').trim();
    if (!phone) {
      errs.phone = 'Mobile Phone Number is required.';
    } else if (!/^[0-9]{10}$/.test(phone)) {
      errs.phone = 'Mobile number must be exactly 10 digits (digits only).';
    }

    const email = String(data.email || '').trim();
    if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      errs.email = 'Please enter a valid email address (e.g. name@company.com).';
    }

    return errs;
  };

  const handleOpenAddModal = () => {
    setEditingCompany(null);
    setFormData({ name: '', code: '', contactPerson: '', phone: '', email: '', address: '' });
    setFormErrors({});
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comp, e) => {
    e.stopPropagation();
    setEditingCompany(comp);
    setFormData({
      name: comp.name || '',
      code: comp.code || '',
      contactPerson: comp.contactPerson || '',
      phone: comp.phone ? String(comp.phone) : '',
      email: comp.email || '',
      address: comp.address || ''
    });
    setFormErrors({});
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleDeleteCompany = async (comp, e) => {
    e.stopPropagation();
    const associatedDiamonds = diamonds.filter((d) => d.companyId === comp.id);
    const msg = associatedDiamonds.length > 0
      ? `Company "${comp.name}" (${comp.code}) has ${associatedDiamonds.length} diamonds associated with it. Are you sure you want to delete this company?`
      : `Are you sure you want to delete "${comp.name}" (${comp.code})?`;
    if (window.confirm(msg)) {
      await deleteCompany(comp.id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanData = {
        ...formData,
        name: formData.name.trim(),
        code: String(formData.code).trim().toUpperCase(),
        contactPerson: formData.contactPerson.trim(),
        phone: String(formData.phone).trim(),
        email: formData.email.trim(),
        address: formData.address.trim()
      };

      if (editingCompany) {
        await updateCompany(editingCompany.id, cleanData);
      } else {
        await addCompany(cleanData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save company', err);
      setFormErrors({ submit: err.message || 'Failed to save company.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      String(c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PrivateLayout title="Diamond Client Companies">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div className="position-relative" style={{ minWidth: '280px' }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Search company name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn btn-gold rounded-pill px-4 font-heading fw-bold d-flex align-items-center" onClick={handleOpenAddModal}>
          <Plus size={18} className="me-2" /> Add New Company
        </button>
      </div>

      {/* Companies Grid & Table */}
      <div className="card card-custom p-4 shadow-sm">
        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Code</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Total Received</th>
                <th>Pending</th>
                <th>Completed</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <Building2 size={36} className="mb-2 text-secondary opacity-50 d-block mx-auto" />
                    <p className="mb-1 fw-semibold">No companies registered yet</p>
                    <small className="text-secondary">Click the "+ Add New Company" button above to create your first client company.</small>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => {
                  const compDiamonds = diamonds.filter((d) => d.companyId === c.id);
                  const totalReceived = compDiamonds.length;
                  const completed = compDiamonds.filter((d) => ['COMPLETED', 'VERIFIED'].includes(d.status)).length;
                  const inProduction = compDiamonds.filter((d) => ['IN PROGRESS', 'WORK COMPLETED'].includes(d.status)).length;
                  const pending = compDiamonds.filter((d) => ['RECEIVED', 'ASSIGNED', 'DEPOSITED', 'REWORK'].includes(d.status)).length;

                  return (
                    <tr
                      key={c.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/companies/${c.id}`)}
                    >
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="p-2 rounded bg-light text-navy me-2 fw-bold" style={{ color: '#0A192F' }}>
                            <Building2 size={18} />
                          </div>
                          <div>
                            <span className="fw-bold text-navy d-block" style={{ color: '#0A192F' }}>{c.name}</span>
                            <small className="text-muted">{c.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge font-mono fw-bold px-2.5 py-1.5" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>
                          {c.code}
                        </span>
                      </td>
                      <td className="fw-medium text-dark">{c.contactPerson}</td>
                      <td className="small text-muted">{c.phone}</td>
                      <td className="fw-bold text-navy">{totalReceived}</td>
                      <td>
                        <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                          {pending}
                        </span>
                      </td>
                      <td>
                        <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                          {completed}
                        </span>
                      </td>
                      <td>
                        <span className="badge px-2.5 py-1.5 fw-bold bg-success-subtle text-success border border-success-subtle">
                          {c.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-sm btn-outline-primary me-2 rounded-circle p-2"
                          onClick={() => navigate(`/companies/${c.id}`)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-circle p-2"
                          onClick={(e) => handleOpenEditModal(c, e)}
                          title="Edit Company"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger ms-2 rounded-circle p-2"
                          onClick={(e) => handleDeleteCompany(c, e)}
                          title="Delete Company"
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

      {/* Add / Edit Company Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompany ? 'Edit Client Company' : 'Add New Diamond Client Company'}
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
            <label className="form-label fw-semibold">Company Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. KGK Diamonds"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: null });
              }}
            />
            {formErrors.name && <div className="invalid-feedback d-block">{formErrors.name}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Company Code (Short Tag) <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`form-control text-uppercase font-mono ${formErrors.code ? 'is-invalid' : ''}`}
              placeholder="e.g. KGK or 101"
              maxLength={10}
              value={formData.code}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10);
                setFormData({ ...formData, code: val });
                if (formErrors.code) setFormErrors({ ...formErrors, code: null });
              }}
            />
            {formErrors.code && <div className="invalid-feedback d-block">{formErrors.code}</div>}
            <small className="text-muted d-block mt-1">Short identifier used in barcodes and tracking (letters & numbers only).</small>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Contact Person</label>
            <input
              type="text"
              className="form-control"
              placeholder="Manager or Owner Name"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Mobile Phone Number <span className="text-danger">*</span></label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted font-mono">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className={`form-control font-mono ${formErrors.phone ? 'is-invalid' : ''}`}
                  placeholder="10-digit number"
                  value={formData.phone}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: onlyDigits });
                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                  }}
                />
              </div>
              {formErrors.phone && <div className="invalid-feedback d-block">{formErrors.phone}</div>}
              <small className="text-muted d-block mt-1">Only numbers allowed (strictly 10 digits).</small>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Email Address</label>
              <input
                type="email"
                className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                placeholder="contact@company.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                }}
              />
              {formErrors.email && <div className="invalid-feedback d-block">{formErrors.email}</div>}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Address / Bourse Location</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Tower / GIDC address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            ></textarea>
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
                  {editingCompany ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                editingCompany ? 'Save Changes' : 'Create Company'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </PrivateLayout>
  );
};

export default Companies;
