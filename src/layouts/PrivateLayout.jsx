import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';
import Toast from '../components/common/Toast';

const PrivateLayout = ({ children, title }) => {
  const { isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="app-container">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className="main-wrapper">
        <Topbar pageTitle={title} />
        <main className="content-body">{children}</main>
      </div>
      <Toast />
    </div>
  );
};

export default PrivateLayout;
