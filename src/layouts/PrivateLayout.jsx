import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';
import Toast from '../components/common/Toast';

const PrivateLayout = ({ children, title }) => {
  const { isAuthenticated } = useAuth();
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
        <main className={`content-body ${isAnimatedPage ? 'page-animated' : 'page-static'}`}>{children}</main>
      </div>
      <Toast />
    </div>
  );
};

export default PrivateLayout;
