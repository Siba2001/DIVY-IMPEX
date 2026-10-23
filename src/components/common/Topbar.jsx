import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, LogOut, User, Menu } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const Topbar = ({ pageTitle, toggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/diamonds-list?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleConfirmedLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar px-2 px-sm-3">
      <div className="d-flex align-items-center me-2 overflow-hidden" style={{ minWidth: 0 }}>
        <button
          className="btn btn-sm btn-link text-navy p-0 me-2 d-lg-none border-0 flex-shrink-0"
          onClick={toggleMobileSidebar}
          title="Open Navigation Menu"
        >
          <Menu size={22} style={{ color: '#0A192F' }} />
        </button>
        <h4 className="font-heading fw-bold text-dark mb-0 fs-6 fs-sm-5 text-truncate" style={{ color: '#0A192F', maxWidth: '340px' }}>
          {pageTitle || 'Management System'}
        </h4>
      </div>

      <div className="d-flex align-items-center gap-2 gap-sm-3 flex-shrink-0">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="position-relative d-none d-md-block" style={{ width: '200px' }}>
          <Search size={15} className="position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted" />
          <input
            type="text"
            className="form-control form-control-sm ps-5 bg-light border-0"
            placeholder="Search barcode or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {/* User Badge */}
        <div className="d-flex align-items-center ps-1.5 ps-sm-2 border-start">
          <div className="avatar bg-navy text-warning rounded-circle fw-bold me-1 me-sm-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px', backgroundColor: '#0A192F' }}>
            <User size={16} />
          </div>
          <div className="d-none d-lg-block me-2" style={{ lineHeight: '1.2' }}>
            <span className="d-block fw-semibold text-dark small">{user?.name}</span>
            <span className="d-block text-muted text-uppercase" style={{ fontSize: '0.65rem' }}>{user?.role}</span>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="btn btn-sm btn-outline-danger border-0 p-1"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Permission Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out Confirmation"
        message={`Are you sure you want to sign out, ${user?.name || 'User'}? You will need to sign in again to access the portal.`}
        confirmText="Sign Out"
        confirmVariant="navy"
        iconType="logout"
        onConfirm={handleConfirmedLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
};

export default Topbar;
