import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Modal from '../../components/common/Modal';
import { useDiamonds } from '../../context/DiamondContext';
import { Building2, Plus, Eye, Edit, Phone, Mail, MapPin, Search, Trash2, AlertCircle, LayoutGrid, Table as TableIcon, User } from 'lucide-react';

const Companies = () => {
  const { companies, diamonds, addCompany, updateCompany, deleteCompany } = useDiamonds();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('auto'); // 'auto' | 'table' | 'cards'
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

    // 1. Company Name Validation & Duplicate Check
    const name = String(data.name || '').trim();
    if (!name) {
      errs.name = 'Company Name is required.';
    } else if (name.length < 2) {
      errs.name = 'Company Name must be at least 2 characters.';
    } else if (name.length > 60) {
      errs.name = 'Company Name cannot exceed 60 characters.';
    } else {
      const duplicateName = companies.find(
        (c) => c.name && c.name.trim().toLowerCase() === name.toLowerCase() && c.id !== editingCompany?.id
      );
      if (duplicateName) {
        errs.name = `Company name "${name}" is already registered (${duplicateName.code}). Duplicate company names are not allowed.`;
      }
    }

    // 2. Company Code Validation & Duplicate Check
    const code = String(data.code || '').trim().toUpperCase();
    if (!code) {
      errs.code = 'Company Code is required.';
    } else if (!/^[A-Z0-9_-]{2,10}$/.test(code)) {
      errs.code = 'Code must be 2 to 10 letters/numbers only (e.g. KGK or 101).';
    } else {
      const duplicateCode = companies.find(
        (c) => c.code && String(c.code).toUpperCase() === code && c.id !== editingCompany?.id
      );
      if (duplicateCode) {
        errs.code = `Company Code "${code}" is already in use by "${duplicateCode.name}".`;
      }
    }

    // 3. Contact Person Validation
    const contactPerson = String(data.contactPerson || '').trim();
    if (!contactPerson) {
      errs.contactPerson = 'Contact Person name is required.';
    } else if (contactPerson.length < 2) {
      errs.contactPerson = 'Contact Person name must be at least 2 characters.';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(contactPerson)) {
      errs.contactPerson = 'Contact Person name can only contain letters and spaces.';
    }

    // 4. Mobile Phone Validation & Duplicate Check
    const phone = String(data.phone || '').trim().replace(/\D/g, '');
    if (!phone) {
      errs.phone = 'Mobile Phone Number is required.';
    } else if (phone.length !== 10) {
      errs.phone = `Mobile number must be exactly 10 digits (currently ${phone.length} digits).`;
    } else if (/^(\d)\1{9}$/.test(phone)) {
      errs.phone = 'Please enter a valid mobile number (repeated digits like 1111111111 are not allowed).';
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      errs.phone = 'Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9.';
    } else {
      const duplicatePhone = companies.find(
        (c) => c.phone && String(c.phone).replace(/\D/g, '') === phone && c.id !== editingCompany?.id
      );
      if (duplicatePhone) {
        errs.phone = `Phone number "${phone}" is already registered for company "${duplicatePhone.name}" (${duplicatePhone.code}).`;
      }
    }

    // 5. Email Address Validation & Duplicate Check
    const email = String(data.email || '').trim();
    if (email) {
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errs.email = 'Please enter a valid email address (e.g. name@company.com).';
      } else {
        const duplicateEmail = companies.find(
          (c) => c.email && c.email.trim().toLowerCase() === email.toLowerCase() && c.id !== editingCompany?.id
        );
        if (duplicateEmail) {
          errs.email = `Email "${email}" is already used by "${duplicateEmail.name}".`;
        }
      }
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
        phone: String(formData.phone).trim().replace(/\D/g, '').slice(0, 10),
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
      {/* Responsive Header Bar */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-3 mb-4">
        <div className="position-relative flex-grow-1" style={{ maxWidth: '420px' }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Search company name, code, contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap flex-sm-nowrap">
          {/* View Toggle */}
          <div className="btn-group border rounded-pill p-1 bg-white shadow-xs me-1">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 ${
                viewMode === 'table' ? 'btn-navy text-white' : 'btn-light text-muted'
              }`}
              onClick={() => setViewMode(viewMode === 'table' ? 'auto' : 'table')}
              title="Table View (forced)"
            >
              <TableIcon size={14} />
              <span className="d-none d-sm-inline small">Table</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 ${
                viewMode === 'cards' ? 'btn-navy text-white' : 'btn-light text-muted'
              }`}
              onClick={() => setViewMode(viewMode === 'cards' ? 'auto' : 'cards')}
              title="Cards View (forced)"
            >
              <LayoutGrid size={14} />
              <span className="d-none d-sm-inline small">Cards</span>
            </button>
          </div>

          <button
            className="btn btn-gold rounded-pill px-4 py-2 font-heading fw-bold d-flex align-items-center justify-content-center flex-grow-1 flex-sm-grow-0 text-nowrap shadow-sm"
            onClick={handleOpenAddModal}
          >
            <Plus size={18} className="me-1.5" /> Add New Company
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredCompanies.length === 0 ? (
        <div className="card card-custom p-5 shadow-sm text-center">
          <Building2 size={44} className="mb-2 text-secondary opacity-50 d-block mx-auto" />
          <h5 className="mb-1 fw-bold text-navy" style={{ color: '#0A192F' }}>No companies found</h5>
          <p className="text-secondary small mb-3">
            {searchTerm ? `No client company matches "${searchTerm}".` : 'Click the "+ Add New Company" button to register your first client company.'}
          </p>
          {!searchTerm && (
            <div>
              <button className="btn btn-gold rounded-pill px-4 py-2 fw-bold" onClick={handleOpenAddModal}>
                <Plus size={16} className="me-1.5" /> Add New Company
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* MOBILE CARDS VIEW: Automatically visible on small screens (< 768px) OR when user selects 'cards' */}
          <div className={`${viewMode === 'table' ? 'd-none' : viewMode === 'cards' ? 'd-block' : 'd-block d-md-none'} mb-4`}>
            <div className="row g-3">
              {filteredCompanies.map((c) => {
                const compDiamonds = diamonds.filter((d) => d.companyId === c.id);
                const totalReceived = compDiamonds.length;
                const completed = compDiamonds.filter((d) => ['COMPLETED', 'VERIFIED'].includes(d.status)).length;
                const pending = compDiamonds.filter((d) => ['RECEIVED', 'ASSIGNED', 'DEPOSITED', 'REWORK'].includes(d.status)).length;

                return (
                  <div key={c.id} className="col-12 col-sm-6">
                    <div
                      className="card card-custom h-100 p-3 shadow-sm border"
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => navigate(`/companies/${c.id}`)}
                    >
                      {/* Card Header: Icon, Name, Code & Status */}
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2 min-w-0">
                          <div className="p-2 rounded bg-light text-navy flex-shrink-0" style={{ color: '#0A192F' }}>
                            <Building2 size={20} />
                          </div>
                          <div className="min-w-0">
                            <h6 className="fw-bold text-navy mb-0 text-truncate" style={{ color: '#0A192F' }}>
                              {c.name}
                            </h6>
                            <small className="text-muted text-truncate d-block">{c.email || 'No email'}</small>
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                          <span className="badge font-mono fw-bold px-2 py-1" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>
                            {c.code}
                          </span>
                          <span className="badge px-2 py-0.5 fw-semibold bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.68rem' }}>
                            {c.status || 'ACTIVE'}
                          </span>
                        </div>
                      </div>

                      {/* Contact & Phone */}
                      <div className="bg-light rounded p-2.5 mb-2.5 small">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Contact:</span>
                          <span className="fw-semibold text-dark text-truncate ms-2">{c.contactPerson || '-'}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Phone:</span>
                          {c.phone ? (
                            <a
                              href={`tel:${c.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="fw-bold text-primary text-decoration-none"
                            >
                              📞 {c.phone}
                            </a>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </div>
                      </div>

                      {/* Mini Stats Summary */}
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-3 pt-1 border-top">
                        <div className="text-center flex-grow-1 p-1 bg-primary-subtle rounded">
                          <div className="text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600 }}>Received</div>
                          <div className="fw-bold text-primary" style={{ fontSize: '0.95rem' }}>{totalReceived}</div>
                        </div>
                        <div className="text-center flex-grow-1 p-1 bg-warning-subtle rounded">
                          <div className="text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600 }}>Pending</div>
                          <div className="fw-bold text-warning-emphasis" style={{ fontSize: '0.95rem' }}>{pending}</div>
                        </div>
                        <div className="text-center flex-grow-1 p-1 bg-success-subtle rounded">
                          <div className="text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div>
                          <div className="fw-bold text-success" style={{ fontSize: '0.95rem' }}>{completed}</div>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="d-flex align-items-center justify-content-between gap-2 pt-2 border-top mt-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-sm btn-navy rounded-pill px-3 py-1.5 flex-grow-1 d-inline-flex align-items-center justify-content-center"
                          onClick={() => navigate(`/companies/${c.id}`)}
                        >
                          <Eye size={14} className="me-1.5" /> View Profile
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-circle p-2 flex-shrink-0"
                          onClick={(e) => handleOpenEditModal(c, e)}
                          title="Edit Company"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-circle p-2 flex-shrink-0"
                          onClick={(e) => handleDeleteCompany(c, e)}
                          title="Delete Company"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLE VIEW: Automatically visible on Tablets & Desktops (>= 768px) OR when user selects 'table' */}
          <div className={`${viewMode === 'cards' ? 'd-none' : viewMode === 'table' ? 'd-block' : 'd-none d-md-block'}`}>
            <div className="card card-custom p-3 shadow-sm">
              <div className="table-responsive">
                <table className="table table-custom table-sticky-first table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th className="text-nowrap">Company Name</th>
                      <th className="text-nowrap text-center">Code</th>
                      <th className="text-nowrap">Contact Person</th>
                      <th className="text-nowrap">Phone</th>
                      <th className="text-nowrap text-center">Received</th>
                      <th className="text-nowrap text-center">Pending</th>
                      <th className="text-nowrap text-center">Completed</th>
                      <th className="text-nowrap text-center">Status</th>
                      <th className="text-nowrap text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map((c) => {
                      const compDiamonds = diamonds.filter((d) => d.companyId === c.id);
                      const totalReceived = compDiamonds.length;
                      const completed = compDiamonds.filter((d) => ['COMPLETED', 'VERIFIED'].includes(d.status)).length;
                      const pending = compDiamonds.filter((d) => ['RECEIVED', 'ASSIGNED', 'DEPOSITED', 'REWORK'].includes(d.status)).length;

                      return (
                        <tr
                          key={c.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/companies/${c.id}`)}
                        >
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="p-2 rounded bg-light text-navy me-2 fw-bold flex-shrink-0" style={{ color: '#0A192F' }}>
                                <Building2 size={18} />
                              </div>
                              <div className="text-truncate">
                                <div className="d-flex align-items-center gap-1.5">
                                  <span className="fw-bold text-navy text-truncate" style={{ color: '#0A192F' }}>{c.name}</span>
                                  <span className="badge font-mono fw-bold px-1.5 py-0.5" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1', fontSize: '0.72rem' }}>
                                    {c.code}
                                  </span>
                                </div>
                                <small className="text-muted d-block text-truncate">{c.email || 'No email'}</small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="badge font-mono fw-bold px-2 py-1" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>
                              {c.code}
                            </span>
                          </td>
                          <td className="fw-medium text-dark text-nowrap">{c.contactPerson || '-'}</td>
                          <td className="small text-muted text-nowrap">
                            {c.phone ? (
                              <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="text-decoration-none text-muted">
                                {c.phone}
                              </a>
                            ) : '-'}
                          </td>
                          <td className="fw-bold text-navy text-center">{totalReceived}</td>
                          <td className="text-center">
                            <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                              {pending}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                              {completed}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge px-2.5 py-1.5 fw-bold bg-success-subtle text-success border border-success-subtle">
                              {c.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="text-end text-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn btn-sm btn-outline-primary me-1 rounded-circle"
                              onClick={() => navigate(`/companies/${c.id}`)}
                              title="View Details"
                              style={{ width: '30px', height: '30px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary rounded-circle"
                              onClick={(e) => handleOpenEditModal(c, e)}
                              title="Edit Company"
                              style={{ width: '30px', height: '30px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger ms-1 rounded-circle"
                              onClick={(e) => handleDeleteCompany(c, e)}
                              title="Delete Company"
                              style={{ width: '30px', height: '30px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

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
            <label className="form-label fw-semibold">
              Contact Person (Manager / Owner) <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${formErrors.contactPerson ? 'is-invalid' : ''}`}
              placeholder="Full name of contact person"
              value={formData.contactPerson}
              onChange={(e) => {
                setFormData({ ...formData, contactPerson: e.target.value });
                if (formErrors.contactPerson) setFormErrors({ ...formErrors, contactPerson: null });
              }}
            />
            {formErrors.contactPerson && <div className="invalid-feedback d-block">{formErrors.contactPerson}</div>}
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Mobile Phone Number <span className="text-danger">*</span></label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted font-mono fw-semibold">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className={`form-control font-mono ${formErrors.phone ? 'is-invalid' : ''}`}
                  placeholder="10-digit mobile (e.g. 9879452045)"
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
                <small className="text-muted d-block mt-1">10-digit number starting with 6, 7, 8, or 9 (unique).</small>
              )}
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
              <small className="text-muted d-block mt-1">Corporate email address (optional).</small>
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
