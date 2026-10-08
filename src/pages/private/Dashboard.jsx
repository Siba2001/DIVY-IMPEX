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

const Dashboard = () => {
  const { companies, diamonds, getKpis } = useDiamonds();
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
    if (d.status === 'COMPLETED' || d.status === 'VERIFIED') {
      dateWiseMap[dDate].completed += 1;
    }
    if (['RECEIVED', 'ASSIGNED', 'IN PROGRESS', 'REWORK'].includes(d.status)) {
      dateWiseMap[dDate].pending += 1;
    }
  });

  const chartData = Object.values(dateWiseMap).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Fallback demo chart data if data is sparse
  const dateWiseData = chartData.length >= 3 ? chartData : [
    { date: '01-Oct', received: 15, completed: 12, pending: 3 },
    { date: '02-Oct', received: 25, completed: 18, pending: 7 },
    { date: '03-Oct', received: 30, completed: 22, pending: 8 },
    { date: '04-Oct', received: 20, completed: 15, pending: 5 },
    { date: '05-Oct', received: 35, completed: 28, pending: 7 },
  ];

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
  const companyPieData = Object.keys(companyDataMap).map((code) => ({
    name: code,
    value: companyDataMap[code]
  }));

  // Company summary table calculations
  const companySummaries = companies.map((c) => {
    const compDiamonds = diamonds.filter((d) => d.companyId === c.id);
    const received = compDiamonds.length;
    const inProduction = compDiamonds.filter((d) => d.status === 'IN PROGRESS').length;
    const pending = compDiamonds.filter((d) => ['RECEIVED', 'ASSIGNED', 'REWORK'].includes(d.status)).length;
    const completed = compDiamonds.filter((d) => d.status === 'COMPLETED' || d.status === 'VERIFIED').length;

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
          <div className="card card-custom p-3 p-md-4 h-100">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
              <div>
                <h6 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                  Date-Wise Received & Completed Trends
                </h6>
                <small className="text-muted">Daily inward volume vs QC verified output</small>
              </div>
              <span className="badge bg-light text-dark border align-self-start align-self-sm-center">Daily Trend</span>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dateWiseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0A192F', color: '#fff', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="received" name="Received" fill="#0284C7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 2: Company-wise Diamond Share */}
        <div className="col-lg-4">
          <div className="card card-custom p-3 p-md-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                  Company Share Count
                </h6>
                <small className="text-muted">Diamond breakdown by company</small>
              </div>
            </div>
            <div style={{ width: '100%', height: 280 }} className="d-flex align-items-center justify-content-center">
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
                  <Tooltip contentStyle={{ backgroundColor: '#0A192F', color: '#fff', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Company Summary Table Section */}
      <div className="card card-custom p-3 p-md-4 shadow-sm">
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
              {companySummaries.map((comp) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PrivateLayout>
  );
};

export default Dashboard;
