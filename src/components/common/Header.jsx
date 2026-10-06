import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import DivyLogo from './DivyLogo';

const Header = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/diamonds', label: 'Diamonds' },
    { path: '/manufacturing', label: 'Manufacturing' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="navbar navbar-expand-lg public-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand text-decoration-none me-4" to="/">
          <DivyLogo iconSize={38} />
        </Link>

        <button
          className="navbar-toggler border-secondary text-white"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#publicNav"
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        <div className="collapse navbar-collapse" id="publicNav">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            {navLinks.map((link) => (
              <li className="nav-item" key={link.path}>
                <Link
                  className={`nav-link px-3 ${location.pathname === link.path ? 'active border-bottom border-warning' : ''}`}
                  to={link.path}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center">
            <Link to="/login" className="btn btn-gold rounded-pill px-4 py-2 d-flex align-items-center shadow-sm">
              <LogIn size={16} className="me-2" /> Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
