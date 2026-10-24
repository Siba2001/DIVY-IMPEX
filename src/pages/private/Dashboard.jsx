import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import StatCard from '../../components/common/StatCard';
import { useDiamonds } from '../../context/DiamondContext';
import {
  Building2,
  Gem,
  Calendar,
  Clock,
  Activity,
  CheckCircle2,
  PackageCheck,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Custom Tooltip for Pie Chart (guarantees clear visible white text on all slices, including dark navy)
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const item = data.payload || {};
    const sliceColor = item.fill || data.fill || '#D4AF37';

    return (
      <div
        className="px-3 py-2 rounded-3 shadow-lg"
        style={{
          backgroundColor: '#0A192F',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#FFFFFF',
          fontSize: '0.82rem',
          minWidth: '130px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="d-flex align-items-center gap-2 mb-1">
          <span
            className="rounded-circle d-inline-block flex-shrink-0"
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: sliceColor,
              border: '1px solid rgba(255, 255, 255, 0.7)'
            }}
          />
          <span className="fw-bold text-white text-truncate" style={{ color: '#FFFFFF' }}>
            {item.companyName || `Company ${data.name}`}
          </span>
        </div>
        <div className="d-flex justify-content-between align-items-center gap-2 pt-1 border-top border-secondary border-opacity-25">
          <span className="small" style={{ color: '#94A3B8' }}>Diamonds:</span>
          <span className="fw-bold fs-6" style={{ color: '#D4AF37' }}>
            {data.value}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Date Trends Bar Chart
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-3 shadow-lg"
        style={{
          backgroundColor: '#0A192F',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#FFFFFF',
          fontSize: '0.82rem',
          minWidth: '140px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="fw-bold text-white mb-1 pb-1 border-bottom border-secondary border-opacity-25" style={{ color: '#FFFFFF' }}>
          Date: {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`bar-tt-${index}`} className="d-flex align-items-center justify-content-between gap-3 py-0.5">
            <span className="d-flex align-items-center gap-1.5" style={{ color: entry.color }}>
              <span className="rounded-circle d-inline-block" style={{ width: '8px', height: '8px', backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="fw-bold text-white" style={{ color: '#FFFFFF' }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { companies, diamonds, getKpis, loading } = useDiamonds();
  const navigate = useNavigate();
  const kpis = getKpis();

  // Prepare Date-wise data for charts from actual diamonds data
  const dateWiseMap = {};
  diamonds.forEach((d) => {
    const dDate = d.receivedDate || '2026-10-01';
    if (!dateWiseMap[dDate]) {
      dateWiseMap[dDate] = { date: dDate, received: 0, completed: 0, pending: 0 };
    }
    dateWiseMap[dDate].received += 1;
    if (['COMPLETED', 'VERIFIED', 'DEPOSITED'].includes(d.status)) {
      dateWiseMap[dDate].completed += 1;
    } else {
      dateWiseMap[dDate].pending += 1;
    }
  });

  const chartData = Object.values(dateWiseMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  const dateWiseData = chartData;

  // Company-wise distribution data
  const companyDataMap = {};
  diamonds.forEach((d) => {
    const code = d.companyCode || 'COMP';
    if (!companyDataMap[code]) {
      companyDataMap[code] = 0;
    }
    companyDataMap[code] += 1;
  });

  const pieColors = ['#0A192F', '#D4AF37', '#0284C7', '#10B981', '#8B5CF6', '#F59E0B'];
  const companyPieData = Object.keys(companyDataMap).map((code, idx) => {
    const matchedComp = companies.find((c) => String(c.code) === String(code));
    return {
      name: code,
      companyName: matchedComp ? `${matchedComp.name} (${code})` : `Company ${code}`,
      value: companyDataMap[code],
      fill: pieColors[idx % pieColors.length]
    };
  });

  // Company summary table calculations
  const companySummaries = companies.map((c) => {
    const compDiamonds = diamonds.filter((d) => d.companyId === c.id);
    const received = compDiamonds.length;
    const completed = compDiamonds.filter((d) => ['COMPLETED', 'VERIFIED'].includes(d.status)).length;
    const inProduction = compDiamonds.filter((d) => ['IN PROGRESS', 'WORK COMPLETED'].includes(d.status)).length;
    const pending = compDiamonds.filter((d) => ['RECEIVED', 'ASSIGNED', 'DEPOSITED', 'REWORK'].includes(d.status)).length;

    return {
      id: c.id,
      name: c.name,
      code: c.code,
      received,
      inProduction,
      pending,
      completed
    };
  });

  return (
    <PrivateLayout title="Executive Diamond Dashboard">
      {loading && diamonds.length === 0 && (
        <div className="alert alert-info border-0 d-flex align-items-center gap-2 mb-3 py-2 px-3 rounded-3 shadow-sm" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#38BDF8' }}>
          <div className="spinner-border spinner-border-sm text-info flex-shrink-0" role="status" />
          <span className="small fw-semibold">Connecting to Google Sheets and synchronizing diamond inventory...</span>
        </div>
      )}
      {/* Top KPI Cards Grid */}
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-6 col-xl-3">
          <StatCard
            title="Total Companies"
            value={kpis.totalCompanies}
            icon={Building2}
            colorType="total"
            subtitle="Registered Client Partners"
          />
        </div>
        <div className="col-6 col-md-6 col-xl-3">
          <StatCard
            title="Total Diamonds"
            value={kpis.totalDiamonds}
            icon={Gem}
            colorType="diamonds"
            subtitle="Master Recorded Count"
          />
        </div>
        <div className="col-6 col-md-6 col-xl-3">
          <StatCard
            title="Today's Received"
            value={kpis.todaysReceived}
            icon={Calendar}
            colorType="received"
            subtitle="New Physical Inward"
          />
        </div>
        <div className="col-6 col-md-6 col-xl-3">
          <StatCard
            title="Pending Diamonds"
            value={kpis.pending}
            icon={Clock}
            colorType="pending"
            subtitle="Awaiting Polishing / QC"
          />
        </div>

        <div className="col-6 col-md-6 col-xl-3">
          <StatCard
            title="In Production"
            value={kpis.inProduction}
            icon={Activity}
            colorType="production"
            subtitle="Active on Sockets"
          />
        </div>
        <div className="col-6 col-md-6 col-xl-3">
          <StatCard
            title="Work Completed"
            value={kpis.workCompleted}
            icon={CheckCircle2}
            colorType="completed"
            subtitle="Worker Polishing Done"
          />
        </div>
        <div className="col-6 col-md-6 col-xl-3">
          <StatCard
            title="Deposited in QC"
            value={kpis.deposited}
            icon={PackageCheck}
            colorType="deposited"
            subtitle="Ready for Carat Verification"
          />
        </div>
        <div className="col-6 col-md-6 col-xl-3">
          <StatCard
            title="Verified & Completed"
            value={kpis.verified}
            icon={ShieldCheck}
            colorType="verified"
            subtitle="Final Approved & Handed Over"
          />
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="row g-4 mb-4">
        {/* Chart 1: Date-wise Received vs Completed */}
        <div className="col-lg-8">
          <div className="card card-custom card-static p-3 p-md-4 h-100">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
              <div>
                <h6 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                  Date-Wise Received & Completed Trends
                </h6>
                <small className="text-muted">Daily inward volume vs QC verified output</small>
              </div>
              <span className="badge bg-light text-dark border align-self-start align-self-sm-center">Daily Trend</span>
            </div>
            <div style={{ width: '100%', height: 280 }} className="d-flex align-items-center justify-content-center">
              {dateWiseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dateWiseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend />
                    <Bar dataKey="received" name="Received" fill="#0284C7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <Activity size={32} className="mb-2 text-secondary opacity-50" />
                  <p className="mb-0 small fw-semibold">No inward trends yet</p>
                  <small className="text-secondary">Charts will update once diamonds are received</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart 2: Company-wise Diamond Share */}
        <div className="col-lg-4">
          <div className="card card-custom card-static p-3 p-md-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                  Company Share Count
                </h6>
                <small className="text-muted">Diamond breakdown by company</small>
              </div>
            </div>
            <div style={{ width: '100%', height: 280 }} className="d-flex align-items-center justify-content-center">
              {companyPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={companyPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {companyPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <Building2 size={32} className="mb-2 text-secondary opacity-50" />
                  <p className="mb-0 small fw-semibold">No company share data yet</p>
                  <small className="text-secondary">Register companies and receive parcels</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Company Summary Table Section */}
      <div className="card card-custom card-static p-3 p-md-4 shadow-sm">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
          <div>
            <h6 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
              Company Production Summary
            </h6>
            <small className="text-muted">Click any company row to view complete date-wise & diamond breakdown</small>
          </div>
          <button
            className="btn btn-sm btn-outline-primary rounded-pill px-3"
            onClick={() => navigate('/companies')}
          >
            View All Companies
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle">
            <thead>
              <tr>
                <th className="text-nowrap">Company Name</th>
                <th className="text-nowrap">Company Code</th>
                <th className="text-nowrap">Total Received</th>
                <th className="text-nowrap">In Production</th>
                <th className="text-nowrap">Pending</th>
                <th className="text-nowrap">Completed</th>
                <th className="text-end text-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {companySummaries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No client companies found. Click "View All Companies" to register your first partner.
                  </td>
                </tr>
              ) : (
                companySummaries.map((comp) => (
                <tr
                  key={comp.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/companies/${comp.id}`)}
                >
                  <td className="fw-bold text-nowrap" style={{ color: '#0A192F' }}>
                    {comp.name}
                  </td>
                  <td>
                    <span className="badge font-mono fw-bold px-2.5 py-1.5" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>
                      {comp.code}
                    </span>
                  </td>
                  <td className="fw-semibold text-dark text-nowrap">{comp.received}</td>
                  <td>
                    <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                      {comp.inProduction}
                    </span>
                  </td>
                  <td>
                    <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>
                      {comp.pending}
                    </span>
                  </td>
                  <td>
                    <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                      {comp.completed}
                    </span>
                  </td>
                  <td className="text-end text-nowrap">
                    <span className="btn btn-sm btn-light border rounded-pill px-3 py-1 font-body text-nowrap">
                      View Details <ArrowUpRight size={14} className="ms-1" />
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </PrivateLayout>
  );
};

export default Dashboard;
