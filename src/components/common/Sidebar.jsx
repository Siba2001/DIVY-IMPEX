import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DivyLogo, { DivyLogoIcon } from './DivyLogo';
import {
  LayoutDashboard,
  Building2,
  PackagePlus,
  Gem,
  UserCheck,
  Users,
  ShieldCheck,
  Layers,
  FileBarChart2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HardHat,
  X
} from 'lucide-react';

const Sidebar = ({ isCollapsed, toggleSidebar, isMobileOpen, closeMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (closeMobileSidebar) closeMobileSidebar();
  };

  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/companies', label: 'Companies', icon: Building2 },
    { path: '/diamond-receiving', label: 'Diamond Receiving', icon: PackagePlus },
    { path: '/diamonds', label: 'Diamonds List', icon: Gem },
    { path: '/assignment', label: 'Worker Assignment', icon: UserCheck },
    { path: '/workers', label: 'Workers', icon: Users },
    { path: '/deposit', label: 'Deposit & QC Verify', icon: ShieldCheck },
    { path: '/stock', label: 'Stock Overview', icon: Layers },
    { path: '/reports', label: 'Reports & Analytics', icon: FileBarChart2 },
  ];

  const workerNavItems = [
    { path: '/worker-dashboard', label: 'My Assigned Work', icon: HardHat },
    { path: '/diamonds', label: 'Search Diamonds', icon: Gem },
  ];

  const navItems = isAdminOrSupervisor ? adminNavItems : workerNavItems;

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="p-3 d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25">
        <div className="d-flex align-items-center overflow-hidden">
          {isCollapsed ? (
            <DivyLogoIcon size={32} />
          ) : (
            <DivyLogo iconSize={36} textClassName="fs-6" />
          )}
        </div>
        <div className="d-flex align-items-center">
          {/* Mobile Close Button */}
          <button
            className="btn btn-sm btn-link text-secondary p-0 me-2 d-lg-none border-0"
            onClick={closeMobileSidebar}
            title="Close Drawer"
          >
            <X size={20} />
          </button>
          {/* Desktop Toggle Button */}
          <button
            className="btn btn-sm btn-link text-secondary p-0 ms-1 d-none d-lg-inline-block border-0"
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="py-3 flex-grow-1 overflow-y-auto">
        <nav className="nav flex-column">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileSidebar}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-top border-secondary border-opacity-25 bg-navy-dark">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center overflow-hidden">
            <div className="avatar bg-warning text-navy rounded-circle fw-bold d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '36px', height: '36px', color: '#0A192F' }}>
              {user?.avatar || user?.name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="ms-2 overflow-hidden">
                <div className="text-white fw-semibold small text-truncate">{user?.name}</div>
                <div className="text-warning text-uppercase small" style={{ fontSize: '0.65rem' }}>
                  {user?.role}
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              className="btn btn-sm btn-outline-light border-0 p-1 text-secondary hover-danger ms-1"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
