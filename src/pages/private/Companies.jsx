import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Modal from '../../components/common/Modal';
import { useDiamonds } from '../../context/DiamondContext';
import { Building2, Plus, Eye, Edit, Phone, Mail, MapPin, Search } from 'lucide-react';

const Companies = () => {
  const { companies, diamonds, addCompany, updateCompany } = useDiamonds();
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

  const handleOpenAddModal = () => {
    setEditingCompany(null);
    setFormData({ name: '', code: '', contactPerson: '', phone: '', email: '', address: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comp, e) => {
    e.stopPropagation();
    setEditingCompany(comp);
    setFormData({
      name: comp.name,
      code: comp.code,
      contactPerson: comp.contactPerson,
      phone: comp.phone,
      email: comp.email,
      address: comp.address || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (editingCompany) {
      await updateCompany(editingCompany.id, formData);
    } else {
      await addCompany(formData);
    }
    setIsModalOpen(false);
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
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
              {filteredCompanies.map((c) => {
                const compDiamonds = diamonds.filter((d) => d.companyId === c.id);
                const totalReceived = compDiamonds.length;
                const pending = compDiamonds.filter((d) => ['RECEIVED', 'ASSIGNED', 'IN PROGRESS', 'REWORK'].includes(d.status)).length;
                const completed = compDiamonds.filter((d) => d.status === 'COMPLETED' || d.status === 'VERIFIED').length;

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
                    </td>
                  </tr>
                );
              })}
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
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Company Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. KGK Diamonds"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Company Code (Short Tag) *</label>
            <input
              type="text"
              className="form-control text-uppercase"
              placeholder="e.g. KGK"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Contact Person</label>
            <input
              type="text"
              className="form-control"
              placeholder="Manager Name"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 98250 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="contact@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Address / Bourse Location</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Tower / GIDC address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light border px-4" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-gold px-4 fw-bold">
              {editingCompany ? 'Save Changes' : 'Create Company'}
            </button>
          </div>
        </form>
      </Modal>
    </PrivateLayout>
  );
};

export default Companies;
