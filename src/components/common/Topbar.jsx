import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDiamonds } from '../../context/DiamondContext';
import { Search, Bell, LogOut, RefreshCw, User, ShieldCheck, Menu } from 'lucide-react';

const Topbar = ({ pageTitle, toggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const { resetAllData } = useDiamonds();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/diamonds?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const notifications = [
    { id: 1, text: 'KGK Batch #101 received (30 diamonds)', time: '10 mins ago', type: 'info' },
    { id: 2, text: 'Diamond RSB012 marked WORK COMPLETED by Dinesh', time: '25 mins ago', type: 'success' },
    { id: 3, text: 'QC Weight verification required for KGK003', time: '1 hour ago', type: 'warning' },
  ];

  return (
    <header className="topbar">
      <div className="d-flex align-items-center">
        <button
          className="btn btn-sm btn-link text-navy p-0 me-2.5 d-lg-none border-0"
          onClick={toggleMobileSidebar}
          title="Open Navigation Menu"
        >
          <Menu size={22} style={{ color: '#0A192F' }} />
        </button>
        <h4 className="font-heading fw-bold text-dark mb-0 me-3 fs-5 text-truncate" style={{ color: '#0A192F', maxWidth: '200px' }}>
          {pageTitle || 'Management System'}
        </h4>
        <span className="badge bg-light text-navy border fw-medium small d-none d-md-inline-block">
          Surat Manufacturing Hub
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="position-relative d-none d-sm-block" style={{ width: '240px' }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control form-control-sm ps-5 bg-light border-0"
            placeholder="Search barcode or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {/* Demo Data Reset Button */}
        <button
          className="btn btn-sm btn-outline-secondary d-flex align-items-center rounded-pill px-2 py-1"
          onClick={resetAllData}
          title="Restore Mock Data to default initial state"
        >
          <RefreshCw size={13} className="me-1" />
          <span className="small d-none d-md-inline">Reset Demo</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="position-relative">
          <button
            className="btn btn-sm btn-light border rounded-circle position-relative p-2"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell size={16} className="text-secondary" />
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
              <span className="visually-hidden">New alerts</span>
            </span>
          </button>

          {showNotifications && (
            <div
              className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border p-3"
              style={{ width: '300px', zIndex: 1050 }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <h6 className="font-heading fw-bold mb-0 text-navy">Notifications</h6>
                <span className="badge bg-primary rounded-pill">3 New</span>
              </div>
              <div className="list-group list-group-flush small">
                {notifications.map((n) => (
                  <div key={n.id} className="list-group-item list-group-item-action px-1 py-2 border-0">
                    <p className="mb-0 text-dark font-body" style={{ fontSize: '0.8rem' }}>{n.text}</p>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>{n.time}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="d-flex align-items-center ps-2 border-start">
          <div className="avatar bg-navy text-warning rounded-circle fw-bold me-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: '#0A192F' }}>
            <User size={16} />
          </div>
          <div className="d-none d-lg-block me-2" style={{ lineHeight: '1.2' }}>
            <span className="d-block fw-semibold text-dark small">{user?.name}</span>
            <span className="d-block text-muted text-uppercase" style={{ fontSize: '0.65rem' }}>{user?.role}</span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn btn-sm btn-outline-danger border-0 p-1"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
