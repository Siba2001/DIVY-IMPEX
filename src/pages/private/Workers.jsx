import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Modal from '../../components/common/Modal';
import { useDiamonds } from '../../context/DiamondContext';
import { Users, Plus, Eye, Edit, Phone, HardHat, Search } from 'lucide-react';

const Workers = () => {
  const { workers, diamonds, addWorker, updateWorker } = useDiamonds();
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

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFormData({
      employeeId: `EMP-${100 + workers.length + 1}`,
      name: '',
      department: 'Polishing',
      phone: '',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w, e) => {
    e.stopPropagation();
    setEditingWorker(w);
    setFormData({
      employeeId: w.employeeId,
      name: w.name,
      department: w.department,
      phone: w.phone,
      status: w.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.employeeId) return;

    if (editingWorker) {
      await updateWorker(editingWorker.id, formData);
    } else {
      await addWorker(formData);
    }
    setIsModalOpen(false);
  };

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PrivateLayout title="Artisan Worker Roster">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div className="position-relative" style={{ minWidth: '280px' }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Search worker name, ID, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn btn-gold rounded-pill px-4 font-heading fw-bold d-flex align-items-center" onClick={handleOpenAdd}>
          <Plus size={18} className="me-2" /> Register New Artisan Worker
        </button>
      </div>

      <div className="card card-custom p-4 shadow-sm">
        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Artisan Name</th>
                <th>Department</th>
                <th>Mobile Contact</th>
                <th>Total Assigned</th>
                <th>In Progress</th>
                <th>Completed</th>
                <th>Pending</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map((w) => {
                const wDiamonds = diamonds.filter((d) => d.assignedWorkerId === w.id);
                const totalAssigned = wDiamonds.length;
                const inProgress = wDiamonds.filter((d) => d.status === 'IN PROGRESS').length;
                const completed = wDiamonds.filter((d) => d.status === 'COMPLETED' || d.status === 'VERIFIED').length;
                const pending = wDiamonds.filter((d) => ['ASSIGNED', 'IN PROGRESS', 'WORK COMPLETED', 'DEPOSITED'].includes(d.status)).length;

                return (
                  <tr
                    key={w.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/workers/${w.id}`)}
                  >
                    <td>
                      <span className="badge bg-light text-navy border font-mono fw-bold">{w.employeeId}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar bg-navy text-warning rounded-circle me-2 fw-bold d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                          <HardHat size={16} />
                        </div>
                        <span className="fw-bold text-navy" style={{ color: '#0A192F' }}>{w.name}</span>
                      </div>
                    </td>
                    <td className="fw-medium text-dark">{w.department}</td>
                    <td className="small text-muted">{w.phone}</td>
                    <td className="fw-bold text-navy">{totalAssigned}</td>
                    <td>
                      <span className="badge bg-warning bg-opacity-20 text-warning border border-warning px-2 py-1">
                        {inProgress}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-success bg-opacity-20 text-success border border-success px-2 py-1">
                        {completed}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-15 text-dark border px-2 py-1">
                        {pending}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${w.status === 'ACTIVE' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'} px-2 py-1`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="text-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-sm btn-outline-primary me-2 rounded-circle p-2"
                        onClick={() => navigate(`/workers/${w.id}`)}
                        title="View Work History"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary rounded-circle p-2"
                        onClick={(e) => handleOpenEdit(w, e)}
                        title="Edit Worker Info"
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

      {/* Add / Edit Worker Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWorker ? 'Edit Artisan Worker Details' : 'Register New Artisan Worker'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Employee ID *</label>
            <input
              type="text"
              className="form-control font-mono fw-bold"
              placeholder="e.g. EMP-107"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Artisan Worker Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Specialized Department *</label>
            <select
              className="form-select"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              <option value="Cutting">Cutting</option>
              <option value="Polishing">Polishing</option>
              <option value="Girdling">Girdling</option>
              <option value="Laser Sawing">Laser Sawing</option>
              <option value="Quality Assurance">Quality Assurance</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Mobile Phone Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="+91 97120 00000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Work Status</label>
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
            <button type="button" className="btn btn-light border px-4" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-gold px-4 fw-bold">
              {editingWorker ? 'Save Changes' : 'Register Worker'}
            </button>
          </div>
        </form>
      </Modal>
    </PrivateLayout>
  );
};

export default Workers;
