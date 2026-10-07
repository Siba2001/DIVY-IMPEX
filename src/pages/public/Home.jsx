import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import Diamond360Viewer from '../../components/common/Diamond360Viewer';
import {
  Gem,
  CheckCircle,
  ArrowRight,
  Shield,
  Layers,
  Award,
  Leaf,
  Calendar,
  Sparkles,
  Zap,
  Activity,
  UserCheck
} from 'lucide-react';

const Home = () => {
  const processSteps = [
    { num: '01', title: 'Diamond Received', desc: 'Rough diamonds received securely from client diamond companies with parcel verification.', icon: PackageIcon },
    { num: '02', title: 'Inspection & Planning', desc: '3D Laser scanning and tension mapping to determine optimal cut yield and clarity.', icon: Shield },
    { num: '03', title: 'Worker Assignment', desc: 'Assigned to specialized Indian master artisans based on diamond cut geometry.', icon: UserCheck },
    { num: '04', title: 'Manufacturing', desc: 'Laser sawing, blocking, girdling, and high-precision table/brilliant facet polishing.', icon: Activity },
    { num: '05', title: 'Quality Verification', desc: 'Strict barcode scanning and dual digital carat weight verification against initial specs.', icon: CheckCircle },
    { num: '06', title: 'Completed Batch', desc: 'Final certified diamond batch packaged for offline dispatch return to client.', icon: Award }
  ];

  function PackageIcon(props) {
    return <Layers {...props} />;
  }

  const sampleDiamonds = [
    { title: 'Round Brilliant Ideal Cut', carat: '1.20 - 3.50 ct', clarity: 'VVS1 - IF', color: 'D - F', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80' },
    { title: 'Emerald Cut Master Spec', carat: '1.50 - 5.00 ct', clarity: 'VVS2 - VVS1', color: 'E - G', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80' },
    { title: 'Princess & Cushion Polish', carat: '0.90 - 4.20 ct', clarity: 'VS1 - VVS1', color: 'D - E', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80' }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section
        className="py-5 py-lg-6 position-relative overflow-hidden"
        style={{
          minHeight: '88vh',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#051429'
        }}
      >
        {/* Low-opacity gold dot pattern background matching reference image */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(212, 175, 55, 0.22) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.25
          }}
        />

        <div className="container py-3 py-md-5 position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center justify-content-between g-4 g-lg-5">
            {/* Left Hero Column (58% width on desktop) */}
            <div className="col-12 col-lg-7 col-xl-7">
              {/* 1. Outlined Gold Badge */}
              <span
                className="badge px-3.5 py-2 rounded-pill font-heading fw-bold mb-3.5 d-inline-flex align-items-center shadow-sm"
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.45)',
                  color: '#FDE68A',
                  backdropFilter: 'blur(8px)',
                  letterSpacing: '0.08em',
                  fontSize: '0.78rem'
                }}
              >
                <Sparkles size={14} className="me-2 text-warning flex-shrink-0" /> WORLD-CLASS CONTRACT MANUFACTURING
              </span>

              {/* 2. Large Editorial Gold Headline in 2 lines */}
              <h1
                className="display-3 font-heading fw-extrabold mb-3.5 lh-tight"
                style={{
                  color: '#D4AF37',
                  textShadow: '0 0 30px rgba(212, 175, 55, 0.15)',
                  letterSpacing: '-0.02em'
                }}
              >
                Crafting Excellence, One<br className="d-none d-sm-inline" /> Diamond at a Time
              </h1>

              {/* 3. Supporting Paragraph */}
              <p
                className="fs-5 fs-md-4 mb-4 mb-md-5 leading-relaxed"
                style={{
                  color: '#E2E8F0',
                  maxWidth: '680px',
                  fontWeight: 400,
                  opacity: 0.95
                }}
              >
                Precision, master craftsmanship and next-generation laser technology come together to transform every rough diamond parcel into a masterpiece of brilliance.
              </p>

              {/* 4. Two CTA Buttons */}
              <div className="d-flex flex-column flex-sm-row gap-3 mb-4 mb-md-5">
                <Link
                  to="/diamonds"
                  className="btn btn-gold btn-lg rounded-pill px-4 px-md-5 py-3 font-heading fw-bold d-inline-flex align-items-center justify-content-center"
                  style={{
                    boxShadow: '0 10px 25px -5px rgba(212, 175, 55, 0.4)'
                  }}
                >
                  Explore Our Diamonds <ArrowRight size={18} className="ms-2" />
                </Link>
                <Link
                  to="/manufacturing"
                  className="btn btn-lg rounded-pill px-4 px-md-5 py-3 font-heading fw-semibold text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(212, 175, 55, 0.45)',
                    color: '#F8FAFC',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Discover Our Process
                </Link>
              </div>

              {/* 5. Thin Horizontal Divider & 6. Statistics Feature Blocks */}
              <div
                className="pt-4 border-top border-secondary border-opacity-25"
                style={{ maxWidth: '680px' }}
              >
                <div className="row g-3">
                  <div className="col-4">
                    <div className="pe-2">
                      <h3 className="fs-2 font-heading fw-extrabold mb-1" style={{ color: '#D4AF37' }}>
                        50,000+
                      </h3>
                      <small className="d-block text-truncate fw-medium" style={{ color: '#CBD5E1', fontSize: '0.85rem' }}>
                        Diamonds Processed
                      </small>
                    </div>
                  </div>
                  <div className="col-4 border-start border-secondary border-opacity-25 ps-3">
                    <div className="pe-2">
                      <h3 className="fs-2 font-heading fw-extrabold mb-1" style={{ color: '#D4AF37' }}>
                        99.9%
                      </h3>
                      <small className="d-block text-truncate fw-medium" style={{ color: '#CBD5E1', fontSize: '0.85rem' }}>
                        Weight Precision
                      </small>
                    </div>
                  </div>
                  <div className="col-4 border-start border-secondary border-opacity-25 ps-3">
                    <div>
                      <h3 className="fs-2 font-heading fw-extrabold mb-1" style={{ color: '#D4AF37' }}>
                        25+ Yrs
                      </h3>
                      <small className="d-block text-truncate fw-medium" style={{ color: '#CBD5E1', fontSize: '0.85rem' }}>
                        Industry Legacy
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Column (42% width on desktop) - Frameless 360 Real Diamond Visual with Hover & Drag Rotation */}
            <div className="col-12 col-lg-5 col-xl-5 d-flex justify-content-center justify-content-lg-end align-items-center">
              <Diamond360Viewer size={410} />
            </div>
          </div>
        </div>
      </section>

      {/* Craftsmanship Banner Showcase Section */}
      <section className="py-0 bg-navy overflow-hidden">
        <div className="container-fluid p-0">
          <div className="position-relative">
            <img
              src="/images/diamond_craftsman_banner.jpg"
              alt="Heartful Diamonds - The Heart of Every Diamond"
              className="w-100 object-fit-cover"
              style={{ maxHeight: '480px', minHeight: '260px', objectPosition: 'center' }}
            />
            <div className="position-absolute bottom-0 start-0 w-100 p-3 p-md-4" style={{ background: 'linear-gradient(to top, rgba(10, 25, 47, 0.95) 0%, rgba(10, 25, 47, 0.65) 65%, transparent 100%)' }}>
              <div className="container">
                <span className="badge bg-navy border border-warning text-warning px-3 py-1.5 rounded-pill font-heading fw-semibold mb-2 small" style={{ backgroundColor: 'rgba(10, 25, 47, 0.9)' }}>
                  Master Craftsmanship
                </span>
                <h3 className="fs-4 fs-md-3 font-heading fw-bold gold-gradient-text mb-1">
                  Heartful Diamonds: The Heart of Every Diamond
                </h3>
                <p className="small mb-0 text-slate-300" style={{ color: '#E2E8F0' }}>
                  DIVY IMPEX • All Fancy Cut Manufacturer • Surat Facility
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-4 py-md-5 bg-white">
        <div className="container py-2 py-md-4">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-12 col-lg-6">
              <span className="text-uppercase tracking-wider font-heading fw-bold text-warning small d-block mb-2">About Our Craft</span>
              <h2 className="display-6 font-heading fw-bold text-navy mb-3 mb-md-4" style={{ color: '#0A192F' }}>
                Precision in Every Cut. Brilliance in Every Diamond.
              </h2>
              <p className="text-secondary mb-3 mb-md-4 leading-relaxed">
                DIVY IMPEX stands as a cornerstone of diamond contract manufacturing in India. We combine generations of diamond expertise with advanced manufacturing technology to deliver exceptional quality, consistency, and precision for global B2B diamond partners.
              </p>
              <p className="text-secondary mb-4 leading-relaxed d-none d-sm-block">
                Our facility is equipped with 5-axis laser planning systems, Syntek auto-blocking tables, and custom digital weight verification scale consoles.
              </p>

              <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6">
                  <div className="d-flex align-items-center p-3 rounded-3 bg-light border h-100">
                    <Shield className="text-warning me-3 flex-shrink-0" size={24} />
                    <div>
                      <h6 className="fw-bold mb-0 text-navy">100% Barcode Verified</h6>
                      <small className="text-muted">Zero mismatch tolerance</small>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="d-flex align-items-center p-3 rounded-3 bg-light border h-100">
                    <Zap className="text-warning me-3 flex-shrink-0" size={24} />
                    <div>
                      <h6 className="fw-bold mb-0 text-navy">Rapid Turnaround</h6>
                      <small className="text-muted">Streamlined worker workflow</small>
                    </div>
                  </div>
                </div>
              </div>

              <Link to="/about" className="btn btn-navy rounded-pill px-4 py-2 font-heading">
                Learn More About Us
              </Link>
            </div>

            <div className="col-12 col-lg-6 mt-4 mt-lg-0">
              <div className="row g-2 g-md-3">
                <div className="col-6">
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-2 mb-md-3">
                    <img src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=600&q=80" alt="Diamond Artisan" className="img-fluid w-100" />
                  </div>
                  <div className="card bg-navy text-white p-3 p-md-4 rounded-4">
                    <h4 className="font-heading fw-bold text-warning mb-1">100+</h4>
                    <span className="small text-slate-300">Master Polishers & Technicians</span>
                  </div>
                </div>
                <div className="col-6 pt-3 pt-md-4">
                  <div className="card bg-light border p-3 p-md-4 rounded-4 mb-2 mb-md-3">
                    <h4 className="font-heading fw-bold text-navy mb-1">0.001 ct</h4>
                    <span className="small text-muted">Carat Scale Precision</span>
                  </div>
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=600&q=80" alt="Diamond Polishing" className="img-fluid w-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manufacturing Process Section */}
      <section className="py-4 py-md-5 bg-light border-top border-bottom">
        <div className="container py-2 py-md-4">
          <div className="text-center max-w-2xl mx-auto mb-4 mb-md-5">
            <span className="text-uppercase tracking-wider font-heading fw-bold text-warning small d-block mb-2">Our Workflow</span>
            <h2 className="display-6 font-heading fw-bold text-navy" style={{ color: '#0A192F' }}>
              6-Step Manufacturing Process
            </h2>
            <p className="text-secondary small fs-md-6 mb-0">
              Every diamond entrusted to DIVY IMPEX undergoes strict digital tracking from physical inward receipt to final deposit verification.
            </p>
          </div>

          <div className="row g-3 g-md-4">
            {processSteps.map((step) => {
              const IconComp = step.icon;
              return (
                <div key={step.num} className="col-12 col-sm-6 col-lg-4">
                  <div className="card card-custom h-100 p-4 border-0 shadow-sm hover-translate position-relative">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="p-3 rounded-3 bg-navy text-warning" style={{ backgroundColor: '#0A192F' }}>
                        <IconComp size={24} />
                      </div>
                      <span className="font-heading fw-bold display-6 text-muted opacity-25">{step.num}</span>
                    </div>
                    <h5 className="font-heading fw-bold text-navy mb-2" style={{ color: '#0A192F' }}>{step.title}</h5>
                    <p className="text-secondary small mb-0">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-4 mt-md-5">
            <Link to="/manufacturing" className="btn btn-gold rounded-pill px-4 px-md-5 py-2.5 py-md-3 font-heading fw-bold shadow-sm">
              Explore Full Technical Process
            </Link>
          </div>
        </div>
      </section>

      {/* Diamonds Section */}
      <section className="py-4 py-md-5 bg-white">
        <div className="container py-2 py-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 mb-md-5">
            <div>
              <span className="text-uppercase tracking-wider font-heading fw-bold text-warning small d-block mb-2">Diamond Portfolio</span>
              <h2 className="display-6 font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                Masterpieces of Precision Cut
              </h2>
            </div>
            <Link to="/diamonds" className="btn btn-outline-navy rounded-pill px-4 mt-3 mt-md-0 font-heading align-self-start align-self-md-auto">
              View All Showcase Cuts <ArrowRight size={16} className="ms-1" />
            </Link>
          </div>

          <div className="row g-3 g-md-4">
            {sampleDiamonds.map((d, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-4">
                <div className="card card-custom h-100 overflow-hidden border">
                  <div className="position-relative" style={{ height: '220px', overflow: 'hidden' }}>
                    <img src={d.img} alt={d.title} className="w-100 h-100 object-fit-cover" />
                    <span className="badge bg-navy text-warning position-absolute top-0 end-0 m-3 px-3 py-2 rounded-pill font-heading">
                      Premium Cut
                    </span>
                  </div>
                  <div className="card-body p-3 p-md-4">
                    <h5 className="font-heading fw-bold text-navy mb-3" style={{ color: '#0A192F' }}>{d.title}</h5>
                    <div className="row g-2 small text-muted border-top pt-3">
                      <div className="col-6"><strong>Carat Weight:</strong> {d.carat}</div>
                      <div className="col-6"><strong>Clarity Range:</strong> {d.clarity}</div>
                      <div className="col-6"><strong>Color Grade:</strong> {d.color}</div>
                      <div className="col-6"><strong>Symmetry:</strong> Excellent</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Preview Section */}
      <section className="py-4 py-md-5 bg-white border-top">
        <div className="container py-2 py-md-4">
          <div className="row g-4 align-items-center">
            <div className="col-12 col-lg-5">
              <span className="text-uppercase tracking-wider font-heading fw-bold text-warning small d-block mb-2">Connect With Us</span>
              <h2 className="display-6 font-heading fw-bold text-navy mb-3 mb-md-4" style={{ color: '#0A192F' }}>
                Contract Manufacturing Inquiries
              </h2>
              <p className="text-secondary mb-4 fs-6">
                We accept offline B2B contract polishing orders from established diamond merchants and rough importers. Contact our Surat headquarters directly for corporate onboarding.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <a href="tel:+919879452045" className="btn btn-gold btn-lg rounded-pill px-4 py-3 font-heading fw-bold d-inline-flex align-items-center shadow-sm">
                  Call +91 98794 52045
                </a>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="card border-0 p-4 p-md-5 shadow-lg rounded-4 position-relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0A192F 0%, #112240 100%)', border: '1px solid rgba(212, 175, 55, 0.35)' }}>
                <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary border-opacity-25">
                  <div>
                    <span className="badge bg-warning text-navy font-heading fw-bold px-3 py-1.5 rounded-pill mb-1">Surat Headquarters</span>
                    <h4 className="font-heading fw-bold gold-gradient-text mb-0">DIVY IMPEX - All Fancy Cut Manufacturer</h4>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <small className="text-warning font-heading fw-bold d-block text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Company Owner</small>
                      <h5 className="fw-bold mb-1" style={{ color: '#F5D466' }}>Chandrakant Vaghasiya</h5>
                      <span className="small" style={{ color: '#CBD5E1' }}>Proprietor & Production Head</span>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <small className="text-warning font-heading fw-bold d-block text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Direct Phone & Support</small>
                      <h5 className="fw-bold mb-1"><a href="tel:+919879452045" className="text-warning text-decoration-none fw-bold">+91 98794 52045</a></h5>
                      <span className="small" style={{ color: '#CBD5E1' }}>Mon - Sat: 09:00 AM - 07:00 PM</span>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <small className="text-warning font-heading fw-bold d-block text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Works Address</small>
                      <p className="mb-0 small leading-relaxed" style={{ color: '#E2E8F0' }}>
                        FP - 75, 3rd Floor, Room No.-8, G. K. Chambers, Kohinoor Society, Varachha Road, Surat - 395006, Gujarat, India
                      </p>
                    </div>
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

export default Home;
