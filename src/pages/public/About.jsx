import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { Shield, Award, Users, Gem } from 'lucide-react';

const About = () => {
  return (
    <PublicLayout>
      <section className="bg-diamond-pattern text-white py-5">
        <div className="container py-4 text-center">
          <span className="badge bg-warning text-navy px-3 py-2 rounded-pill font-heading fw-bold mb-2">Our Company</span>
          <h1 className="display-4 font-heading fw-bold gold-gradient-text mb-3">About DIVY IMPEX</h1>
          <p className="lead text-slate-300 max-w-2xl mx-auto" style={{ color: '#CBD5E1' }}>
            A premier diamond contract manufacturing enterprise uniting Surat's traditional polishing heritage with cutting-edge laser diamond planning.
          </p>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <h2 className="font-heading fw-bold text-navy mb-3" style={{ color: '#0A192F' }}>
                Mastering the Art & Science of Diamond Manufacturing
              </h2>
              <p className="text-secondary leading-relaxed mb-4">
                Founded in the diamond capital of Surat under the leadership of Owner <strong>Chandrakant Vaghasiya</strong>, <strong>DIVY IMPEX</strong> has grown into a premier high-volume B2B contract manufacturer specializing as an <strong>"All Fancy Cut Manufacturer"</strong>.
              </p>
              <p className="text-secondary leading-relaxed mb-4">
                Operating out of Varachha Road, Surat, our facility encompasses every stage: physical inward parcel receiving, 3D laser tension planning, blocking, girdling, fancy cut polishing, automated weight verification, and secure barcode deposit.
              </p>
              <div className="p-4 bg-light rounded-4 border border-start border-4 border-warning">
                <h6 className="fw-bold text-navy mb-1">Our Core Objective</h6>
                <p className="text-secondary small mb-0">
                  To provide absolute precision for fancy cut diamonds, 100% digital weight transparency, and zero-error barcode tracking for our client companies.
                </p>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="row g-3">
                <div className="col-6">
                  <div className="p-3 p-md-4 bg-light rounded-4 border text-center">
                    <Award size={32} className="text-warning mb-2" />
                    <h3 className="font-heading fw-bold text-navy mb-1">25+</h3>
                    <span className="small text-muted">Years Excellence</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 p-md-4 bg-light rounded-4 border text-center">
                    <Users size={32} className="text-warning mb-2" />
                    <h3 className="font-heading fw-bold text-navy mb-1">120+</h3>
                    <span className="small text-muted">Master Craftsmen</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 p-md-4 bg-light rounded-4 border text-center">
                    <Gem size={32} className="text-warning mb-2" />
                    <h3 className="font-heading fw-bold text-navy mb-1">50K+</h3>
                    <span className="small text-muted">Carats Polished</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 p-md-4 bg-light rounded-4 border text-center">
                    <Shield size={32} className="text-warning mb-2" />
                    <h3 className="font-heading fw-bold text-navy mb-1">100%</h3>
                    <span className="small text-muted">Barcode Accuracy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default About;
