import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Contact = () => {
  return (
    <PublicLayout>
      <section className="bg-diamond-pattern text-white py-5">
        <div className="container py-4 text-center">
          <span className="badge bg-warning text-navy px-3 py-2 rounded-pill font-heading fw-bold mb-2">Get In Touch</span>
          <h1 className="display-4 font-heading fw-bold gold-gradient-text mb-3">Contact Us</h1>
          <p className="lead text-slate-300 max-w-2xl mx-auto" style={{ color: '#CBD5E1' }}>
            Reach our corporate manufacturing offices in Surat & Mumbai for B2B contract polishing orders.
          </p>
        </div>
      </section>

      {/* Craftsmanship Banner */}
      <section className="py-4 bg-navy overflow-hidden">
        <div className="container">
          <div className="position-relative rounded-4 overflow-hidden shadow-lg border">
            <img
              src="/images/diamond_craftsman_banner.jpg"
              alt="Heartful Diamonds - The Heart of Every Diamond"
              className="w-100 object-fit-cover"
              style={{ maxHeight: '340px', objectPosition: 'center' }}
            />
            <div className="position-absolute bottom-0 start-0 w-100 p-3 p-md-4" style={{ background: 'linear-gradient(to top, rgba(10, 25, 47, 0.95) 0%, rgba(10, 25, 47, 0.65) 65%, transparent 100%)' }}>
              <span className="badge bg-navy border border-warning text-warning px-3 py-1.5 rounded-pill font-heading fw-semibold mb-2 small" style={{ backgroundColor: 'rgba(10, 25, 47, 0.9)' }}>
                Master Craftsmanship
              </span>
              <h4 className="font-heading fw-bold text-white mb-1">
                Heartful Diamonds: The Heart of Every Diamond
              </h4>
              <p className="small mb-0 text-slate-300" style={{ color: '#E2E8F0' }}>
                DIVY IMPEX • All Fancy Cut Manufacturer • Surat Facility
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="row g-4 justify-content-center">
            <div className="col-12 col-lg-5">
              <h3 className="font-heading fw-bold text-navy mb-4" style={{ color: '#0A192F' }}>
                Manufacturing Facilities
              </h3>

              <div className="d-flex mb-4 p-3 bg-light rounded-4 border">
                <div className="p-3 bg-navy text-warning rounded-3 me-3 flex-shrink-0" style={{ backgroundColor: '#0A192F' }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h6 className="fw-bold mb-1 text-navy">Head Office & Works</h6>
                  <p className="text-secondary small mb-0">FP - 75, 3rd Floor, Room No.-8, G. K. Chambers, Kohinoor Society, Varachha Road, Surat - 395006, Gujarat, India</p>
                </div>
              </div>

              <div className="d-flex mb-4 p-3 bg-light rounded-4 border">
                <div className="p-3 bg-navy text-warning rounded-3 me-3 flex-shrink-0" style={{ backgroundColor: '#0A192F' }}>
                  <Phone size={24} />
                </div>
                <div>
                  <h6 className="fw-bold mb-1 text-navy">Owner & Mobile Support</h6>
                  <p className="text-secondary small mb-0">
                    <strong>Chandrakant Vaghasiya</strong> (Owner): <a href="tel:+919879452045" className="text-navy text-decoration-none fw-semibold">+91 98794 52045</a>
                  </p>
                </div>
              </div>

              <div className="d-flex mb-4 p-3 bg-light rounded-4 border">
                <div className="p-3 bg-navy text-warning rounded-3 me-3 flex-shrink-0" style={{ backgroundColor: '#0A192F' }}>
                  <Mail size={24} />
                </div>
                <div>
                  <h6 className="fw-bold mb-1 text-navy">Email Address</h6>
                  <p className="text-secondary small mb-0"><a href="mailto:sanjucvaghasiya@gmail.com" className="text-navy text-decoration-none">sanjucvaghasiya@gmail.com</a></p>
                </div>
              </div>

              <div className="d-flex p-3 bg-light rounded-4 border">
                <div className="p-3 bg-navy text-warning rounded-3 me-3 flex-shrink-0" style={{ backgroundColor: '#0A192F' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h6 className="fw-bold mb-1 text-navy">Working Hours</h6>
                  <p className="text-secondary small mb-0">Monday - Saturday: 09:00 AM - 07:00 PM (IST)</p>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="card border-0 p-4 p-md-5 shadow-2xl rounded-4 position-relative overflow-hidden h-100" style={{ background: 'linear-gradient(145deg, #0A192F 0%, #112240 100%)', border: '1px solid rgba(212, 175, 55, 0.35)' }}>
                <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary border-opacity-25">
                  <div>
                    <span className="badge bg-warning text-navy font-heading fw-bold px-3 py-1.5 rounded-pill mb-1">Corporate Headquarters</span>
                    <h4 className="font-heading fw-bold text-white mb-0">DIVY IMPEX - All Fancy Cut Manufacturer</h4>
                  </div>
                </div>

                <div className="row g-4 text-white">
                  <div className="col-12 col-md-6">
                    <div className="p-3.5 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <small className="text-warning font-heading fw-bold d-block text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Company Owner</small>
                      <h5 className="fw-bold mb-1">Chandrakant Vaghasiya</h5>
                      <span className="text-slate-300 small" style={{ color: '#CBD5E1' }}>Proprietor & Production Head</span>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3.5 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <small className="text-warning font-heading fw-bold d-block text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Direct Phone Support</small>
                      <h5 className="fw-bold mb-1"><a href="tel:+919879452045" className="text-white text-decoration-none">+91 98794 52045</a></h5>
                      <span className="text-slate-300 small" style={{ color: '#CBD5E1' }}>Mon - Sat: 09:00 AM - 07:00 PM</span>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="p-3.5 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <small className="text-warning font-heading fw-bold d-block text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Manufacturing Location</small>
                      <p className="text-white mb-0 small leading-relaxed">
                        FP - 75, 3rd Floor, Room No.-8, G. K. Chambers, Kohinoor Society, Varachha Road, Surat - 395006, Gujarat, India
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex flex-wrap gap-3">
                  <a href="tel:+919879452045" className="btn btn-gold btn-lg rounded-pill px-4 py-2.5 font-heading fw-bold shadow-sm">
                    Call +91 98794 52045
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Contact;
