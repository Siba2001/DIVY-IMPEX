import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import DivyLogo from './DivyLogo';

const Footer = () => {
  return (
    <footer className="bg-diamond-pattern text-light pt-5 pb-4" style={{ backgroundColor: '#071224', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
      <div className="container">
        <div className="row g-4 mb-4">
          <div className="col-lg-4">
            <div className="mb-3">
              <DivyLogo iconSize={36} />
            </div>
            <p className="text-secondary small me-lg-4">
              All fancy cut manufacturer. Pioneering excellence in rough and polished diamond contract manufacturing under the leadership of Owner <strong>Chandrakant Vaghasiya</strong>.
            </p>
            <div className="d-flex flex-wrap gap-2 text-gold">
              <span className="badge bg-navy border border-warning text-warning p-2">All Fancy Cut Manufacturer</span>
            </div>
          </div>

          <div className="col-lg-2 col-md-4">
            <h6 className="font-heading text-white fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled text-secondary small">
              <li className="mb-2"><Link to="/" className="text-secondary text-decoration-none hover-white">Home</Link></li>
              <li className="mb-2"><Link to="/about" className="text-secondary text-decoration-none hover-white">About Us</Link></li>
              <li className="mb-2"><Link to="/diamonds" className="text-secondary text-decoration-none hover-white">Diamond Portfolio</Link></li>
              <li className="mb-2"><Link to="/manufacturing" className="text-secondary text-decoration-none hover-white">Manufacturing</Link></li>
              <li className="mb-2"><Link to="/contact" className="text-secondary text-decoration-none hover-white">Contact Us</Link></li>
            </ul>
          </div>

          <div className="col-lg-4 col-md-4">
            <h6 className="font-heading text-white fw-bold mb-3">Manufacturing Hub Contact</h6>
            <p className="text-secondary small mb-2 d-flex align-items-start">
              <MapPin size={16} className="me-2 text-warning flex-shrink-0 mt-1" />
              FP - 75, 3rd Floor, Room No.-8, G. K. Chambers, Kohinoor Society, Varachha Road, Surat - 395006, Gujarat, India
            </p>
            <p className="text-secondary small mb-2 d-flex align-items-center">
              <Phone size={16} className="me-2 text-warning flex-shrink-0" />
              +91 98794 52045
            </p>
            <p className="text-secondary small mb-0 d-flex align-items-center">
              <Mail size={16} className="me-2 text-warning flex-shrink-0" />
              sanjucvaghasiya@gmail.com
            </p>
          </div>

          <div className="col-lg-2 col-md-4">
            <h6 className="font-heading text-white fw-bold mb-3">System Access</h6>
            <p className="text-secondary small mb-3">
              Internal management portal for diamond tracking.
            </p>
            <Link to="/login" className="btn btn-outline-warning btn-sm rounded-pill px-3">
              Portal Sign In
            </Link>
          </div>
        </div>

        <hr className="border-secondary opacity-25" />

        <div className="text-center text-secondary small">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} DIVY IMPEX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
