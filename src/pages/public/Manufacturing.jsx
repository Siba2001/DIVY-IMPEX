import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { Package, ShieldCheck, UserCheck, Cpu, Scale, Award } from 'lucide-react';

const Manufacturing = () => {
  const steps = [
    { title: '1. Diamond Inward Received', desc: 'Rough diamonds received physically from client companies with barcode tagging and initial weight logging.', icon: Package },
    { title: '2. 3D Laser Inspection & Planning', desc: 'Advanced Sarine 3D laser scanner maps inclusions, internal tension, and calculates optimal cut yield.', icon: Cpu },
    { title: '3. Worker Assignment', desc: 'Supervisor assigns diamond barcode to specific trained artisan based on department specialization.', icon: UserCheck },
    { title: '4. Laser Sawing & Facet Polishing', desc: 'Artisans execute table polishing, crown/pavilion faceting, and girdling under high-magnification microscopes.', icon: ShieldCheck },
    { title: '5. Barcode & Weight Verification', desc: 'QC Supervisor scans barcode and places diamond on dual-calibrated scale to verify weight loss specs.', icon: Scale },
    { title: '6. Completed Batch Safe Return', desc: 'Verified diamonds marked COMPLETED, logged in digital audit system, and returned to client company.', icon: Award },
  ];

  return (
    <PublicLayout>
      <section className="bg-diamond-pattern text-white py-5">
        <div className="container py-4 text-center">
          <span className="badge bg-warning text-navy px-3 py-2 rounded-pill font-heading fw-bold mb-2">Technical Workflow</span>
          <h1 className="display-4 font-heading fw-bold gold-gradient-text mb-3">Manufacturing & Quality Control</h1>
          <p className="lead text-slate-300 max-w-2xl mx-auto" style={{ color: '#CBD5E1' }}>
            A transparent 6-stage production line engineered for precision cut symmetry, exact weight tracking, and barcode security.
          </p>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="row g-4">
            {steps.map((step, idx) => {
              const IconComp = step.icon;
              return (
                <div key={idx} className="col-md-6 col-lg-4">
                  <div className="card card-custom h-100 p-4 border">
                    <div className="p-3 bg-navy text-warning rounded-3 me-auto mb-3" style={{ backgroundColor: '#0A192F' }}>
                      <IconComp size={24} />
                    </div>
                    <h5 className="font-heading fw-bold text-navy mb-2" style={{ color: '#0A192F' }}>{step.title}</h5>
                    <p className="text-secondary small mb-0">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Manufacturing;
