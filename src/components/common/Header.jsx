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
        <Link className="navbar-brand text-decoration-none me-4" to="/" onClick={closeNav}>
          <DivyLogo iconSize={38} />
        </Link>

        <button
          className="navbar-toggler border-secondary text-white p-2"
          type="button"
          onClick={toggleNav}
          aria-label="Toggle navigation"
        >
          {isNavOpen ? <X size={22} className="text-warning" /> : <Menu size={22} className="text-warning" />}
        </button>

        <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="publicNav">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            {navLinks.map((link) => (
              <li className="nav-item" key={link.path}>
                <Link
                  className={`nav-link px-3 ${location.pathname === link.path ? 'active border-bottom border-warning' : ''}`}
                  to={link.path}
                  onClick={closeNav}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center mt-3 mt-lg-0">
            <Link to="/login" className="btn btn-gold rounded-pill px-4 py-2 d-flex align-items-center shadow-sm w-100 w-lg-auto justify-content-center" onClick={closeNav}>
              <LogIn size={16} className="me-2" /> Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
