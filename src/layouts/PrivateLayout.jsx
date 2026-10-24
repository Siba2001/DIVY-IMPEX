import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDiamonds } from '../context/DiamondContext';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';
import Toast from '../components/common/Toast';
import { AlertTriangle } from 'lucide-react';

const PrivateLayout = ({ children, title }) => {
  const { isAuthenticated } = useAuth();
  const { syncError, loadData } = useDiamonds();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Moving animations strictly enabled ONLY for Dashboard and Stock Overview pages
  const isAnimatedPage = location.pathname === '/dashboard' || location.pathname === '/stock';

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className={`app-container position-relative ${isAnimatedPage ? 'page-animated' : 'page-static'}`}>
      {/* Backdrop overlay for mobile drawer */}
      <div
        className={`sidebar-backdrop ${isMobileOpen ? 'show' : ''}`}
        onClick={closeMobileSidebar}
      />

      <Sidebar
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        isMobileOpen={isMobileOpen}
        closeMobileSidebar={closeMobileSidebar}
      />
      <div className="main-wrapper">
        <Topbar pageTitle={title} toggleMobileSidebar={toggleMobileSidebar} />
        <main className={`content-body ${isAnimatedPage ? 'page-animated' : 'page-static'}`}>
          {syncError && (
            <div className="alert alert-danger border-danger d-flex align-items-center justify-content-between mb-4 p-3 rounded-3 shadow-sm" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className="d-flex align-items-start small">
                <AlertTriangle size={18} className="text-danger me-2 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-danger d-block mb-0.5">Database Connection Notice:</strong>
                  <span className="font-monospace text-light opacity-75" style={{ fontSize: '0.8rem' }}>{syncError}</span>
                </div>
              </div>
              <button
                className="btn btn-sm btn-outline-danger ms-3 text-nowrap fw-semibold px-3 py-1"
                onClick={() => loadData(true)}
              >
                Retry Sync
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
};

export default PrivateLayout;
