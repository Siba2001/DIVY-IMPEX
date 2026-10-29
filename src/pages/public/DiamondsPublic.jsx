import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { Sparkles } from 'lucide-react';

const DiamondsPublic = () => {
  const cuts = [
    { title: 'Round Brilliant Cut', desc: '57-58 precise facets engineered for maximum light return and fire.', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80', carat: '1.20 - 3.50 ct', clarity: 'VVS1 - IF' },
    { title: 'Emerald Cut', desc: 'Step-cut rectangular elegance showcasing high clarity and clean geometric lines.', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80', carat: '1.50 - 5.00 ct', clarity: 'VVS2 - VVS1' },
    { title: 'Princess Cut', desc: 'Pyramidal square cut delivering intense sparkle and sharp modern corners.', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80', carat: '0.90 - 4.20 ct', clarity: 'VS1 - VVS1' },
    { title: 'Cushion Cut', desc: 'Soft pillow rounded corners with deep pavilions for romantic brilliance.', img: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=600&q=80', carat: '1.00 - 4.50 ct', clarity: 'VS2 - VVS1' },
    { title: 'Oval Cut', desc: 'Elongated silhouette that maximizes carat weight appearance.', img: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=600&q=80', carat: '1.10 - 3.80 ct', clarity: 'VVS1 - IF' },
    { title: 'Pear & Marquise Cut', desc: 'Teardrop fancy cut polished with precise symmetry.', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80', carat: '0.80 - 3.20 ct', clarity: 'VS1 - VVS2' },
  ];

  return (
    <PublicLayout>
      <section className="bg-diamond-pattern text-white py-5">
        <div className="container py-4 text-center">
          <span className="badge bg-warning text-navy px-3 py-2 rounded-pill font-heading fw-bold mb-2">Showcase</span>
          <h1 className="display-4 font-heading fw-bold gold-gradient-text mb-3">Our Diamond Cut Portfolio</h1>
          <p className="lead text-slate-300 max-w-2xl mx-auto" style={{ color: '#CBD5E1' }}>
            Showcasing our master polishing capabilities across all major diamond shapes, proportions, and fancy cut geometries.
          </p>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container py-4">
          <div className="row g-4">
            {cuts.map((cut, idx) => (
              <div key={idx} className="col-lg-4 col-md-6">
                <div className="diamond-showcase-card h-100 card-hover-box">
                  {/* Image area with shimmer light sweep and zoom */}
                  <div className="position-relative shimmer-glow-wrap" style={{ height: '230px' }}>
                    <img src={cut.img} alt={cut.title} className="w-100 h-100 object-fit-cover zoom-img" />
                    <span className="badge premium-cut-badge position-absolute top-0 end-0 m-3 px-3 py-2 rounded-pill font-heading">
                      <Sparkles size={12} className="me-1 text-warning d-inline-block" /> Premium Cut
                    </span>
                  </div>
                  <div className="p-4">
                    <h5 className="font-heading fw-bold text-navy card-title-link mb-2" style={{ color: '#0A192F' }}>
                      {cut.title}
                    </h5>
                    <p className="text-secondary small mb-3">{cut.desc}</p>
                    <div className="d-flex justify-content-between align-items-center small text-muted border-top pt-3">
                      <span className="spec-chip"><strong>Carat:</strong> {cut.carat}</span>
                      <span className="spec-chip"><strong>Clarity:</strong> {cut.clarity}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default DiamondsPublic;
