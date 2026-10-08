import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, Menu, X } from 'lucide-react';
import DivyLogo from './DivyLogo';

const Header = () => {
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/diamonds', label: 'Diamonds' },
    { path: '/manufacturing', label: 'Manufacturing' },
    { path: '/contact', label: 'Contact' },
  ];

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const closeNav = () => {
    setIsNavOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-lg public-navbar sticky-top">
      <div className="container">
        <div className="d-flex align-items-center justify-content-between w-100 w-lg-auto me-lg-4">
          <Link className="navbar-brand text-decoration-none py-1 me-0 me-lg-3" to="/" onClick={closeNav}>
            <DivyLogo iconSize={32} textClassName="fs-5" />
          </Link>

          <button
            className="navbar-toggler border-secondary text-white p-2 border-0"
            type="button"
            onClick={toggleNav}
            aria-label="Toggle navigation"
          >
            {isNavOpen ? <X size={24} className="text-warning" /> : <Menu size={24} className="text-warning" />}
          </button>
        </div>

        <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="publicNav">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 py-2 py-lg-0 align-items-lg-center">
            {navLinks.map((link) => (
              <li className="nav-item" key={link.path}>
                <Link
                  className={`nav-link px-2 px-xl-3 text-nowrap position-relative ${location.pathname === link.path ? 'active text-white fw-semibold' : ''}`}
                  to={link.path}
                  onClick={closeNav}
                >
                  {link.label}
                  {location.pathname === link.path && (
                    <span
                      className="position-absolute start-50 translate-middle-x bg-warning rounded-pill"
                      style={{ bottom: '2px', width: '24px', height: '2px' }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center mt-3 mt-lg-0 pb-2 pb-lg-0 flex-shrink-0">
            <Link
              to="/login"
              className="btn btn-gold rounded-pill px-3 px-xl-4 py-2 d-inline-flex align-items-center text-nowrap shadow-sm w-100 w-lg-auto justify-content-center"
              style={{ whiteSpace: 'nowrap' }}
              onClick={closeNav}
            >
              <LogIn size={16} className="me-2 flex-shrink-0" /> <span className="text-nowrap">Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
