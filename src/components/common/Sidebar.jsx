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
  Truck,
  X
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const Sidebar = ({ isCollapsed, toggleSidebar, isMobileOpen, closeMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (closeMobileSidebar) closeMobileSidebar();
  };

  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  const adminNavGroups = [
    {
      title: 'CORE',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/companies', label: 'Companies', icon: Building2 },
        { path: '/workers', label: 'Workers', icon: Users },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { path: '/diamond-receiving', label: 'Diamond Receiving', icon: PackagePlus },
        { path: '/diamonds-list', label: 'Diamonds List', icon: Gem },
        { path: '/assignment', label: 'Worker Assignment', icon: UserCheck },
        { path: '/deposit', label: 'Deposit & QC Verify', icon: ShieldCheck },
        { path: '/company-dispatch', label: 'Company Submission', icon: Truck },
      ]
    },
    {
      title: 'INVENTORY',
      items: [
        { path: '/stock', label: 'Stock Overview', icon: Layers },
        { path: '/reports', label: 'Reports & Analytics', icon: FileBarChart2 },
      ]
    }
  ];

  const workerNavGroups = [
    {
      title: 'CORE',
      items: [
        { path: '/worker-dashboard', label: 'My Assigned Work', icon: HardHat },
        { path: '/diamonds-list', label: 'Search Diamonds', icon: Gem },
      ]
    }
  ];

  const navGroups = isAdminOrSupervisor ? adminNavGroups : workerNavGroups;

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className={`p-3 d-flex align-items-center ${isCollapsed ? 'justify-content-center px-1' : 'justify-content-between'} border-bottom border-secondary border-opacity-25 position-relative`}>
        {isCollapsed ? (
          <button
            className="btn p-0 border-0 d-flex align-items-center justify-content-center text-decoration-none w-100 position-relative"
            onClick={toggleSidebar}
            title="Expand Navigation Menu"
            style={{ cursor: 'pointer' }}
          >
            <DivyLogoIcon size={34} />
            <span
              className="position-absolute top-50 start-100 translate-middle badge bg-warning text-navy rounded-circle p-0 shadow-sm d-none d-lg-flex align-items-center justify-content-center"
              style={{ width: '18px', height: '18px', marginLeft: '-14px', zIndex: 10 }}
            >
              <ChevronRight size={12} style={{ color: '#0A192F' }} />
            </span>
          </button>
        ) : (
          <>
            <div className="d-flex align-items-center me-1">
              <DivyLogo iconSize={36} textClassName="fs-6" />
            </div>
            <div className="d-flex align-items-center flex-shrink-0">
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
                title="Collapse Sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="py-2 flex-grow-1 overflow-y-auto">
        <nav className="nav flex-column">
          {navGroups.map((group, gIdx) => (
            <div key={group.title || gIdx} className="mb-2">
              {(!isCollapsed || isMobileOpen) ? (
                <div className="sidebar-section-title">
                  {group.title}
                </div>
              ) : (
                gIdx > 0 && <div className="sidebar-section-divider" />
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileSidebar}
                    className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {(!isCollapsed || isMobileOpen) && <span className="text-truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
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
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
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
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </aside>
  );
};

export default Sidebar;
