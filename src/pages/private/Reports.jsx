import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PrivateLayout from '../../layouts/PrivateLayout';
import Badge from '../../components/common/Badge';
import { useDiamonds } from '../../context/DiamondContext';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, exportToExcel, exportShapeMatrixExcel, triggerPrint } from '../../services/exportService';
import {
  FileBarChart2,
  Download,
  Printer,
  Filter,
  Table,
  FileSpreadsheet,
  Building2,
  Calendar,
  Gem,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';

const Reports = () => {
  const { diamonds, companies, workers } = useDiamonds();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const initialCompany = searchParams.get('company') || '';
  const initialType = searchParams.get('type') || '1';

  const [activeReportType, setActiveReportType] = useState(initialType);
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'itemized'
  const [companyFilter, setCompanyFilter] = useState(initialCompany);
  const [workerFilter, setWorkerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedDates, setExpandedDates] = useState({});

  const reportTypes = [
    { id: '1', name: '1. Monthly Stock & Shape Matrix (Company-Wise)' },
    { id: '2', name: '2. Date-Wise Received Inward Report' },
    { id: '3', name: '3. Date-Wise Completed Report' },
    { id: '4', name: '4. Date-Wise Pending Report' },
    { id: '5', name: '5. Worker-Wise Performance Report' },
    { id: '6', name: '6. Diamond Master Audit Report' },
    { id: '7', name: '7. Inward Parcel Physical Log Report' },
    { id: '8', name: '8. QC Safe Deposit Report' },
    { id: '9', name: '9. Dual Scale Carat Verification Report' },
  ];

  // Quick Date Range Helpers
  const handleSetQuickDate = (preset) => {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    if (preset === 'thisMonth') {
      const firstDay = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
      setFromDate(firstDay);
      setToDate(toStr);
    } else if (preset === 'lastMonth') {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      setFromDate(`${lastMonthDate.getFullYear()}-${pad(lastMonthDate.getMonth() + 1)}-01`);
      setToDate(`${lastMonthEnd.getFullYear()}-${pad(lastMonthEnd.getMonth() + 1)}-${pad(lastMonthEnd.getDate())}`);
    } else if (preset === 'last30Days') {
      const past30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setFromDate(`${past30.getFullYear()}-${pad(past30.getMonth() + 1)}-${pad(past30.getDate())}`);
      setToDate(toStr);
    } else if (preset === 'clear') {
      setFromDate('');
      setToDate('');
    }
  };

  const toggleDateExpanded = (dateKey) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  // Filter diamonds based on selected controls & report type specific logic
  const getFilteredData = () => {
    return diamonds.filter((d) => {
      if (companyFilter && d.companyId !== companyFilter) return false;
      if (workerFilter && d.assignedWorkerId !== workerFilter) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      if (fromDate && d.receivedDate < fromDate) return false;
      if (toDate && d.receivedDate > toDate) return false;

      // Specific report pre-filters
      if (activeReportType === '2' && !d.receivedDate) return false;
      if (activeReportType === '3' && d.status !== 'COMPLETED' && d.status !== 'VERIFIED') return false;
      if (activeReportType === '4' && !['RECEIVED', 'ASSIGNED', 'IN PROGRESS', 'REWORK'].includes(d.status)) return false;
      if (activeReportType === '8' && d.status !== 'DEPOSITED') return false;
      if (activeReportType === '9' && !d.verifiedDate) return false;

      return true;
    });
  };

  const reportData = getFilteredData();

  // Find currently selected company
  const selectedCompany = companies.find((c) => c.id === companyFilter);

  // Group filtered data into Date-by-Date Shape Matrix
  const matrixData = useMemo(() => {
    const shapeSet = new Set();
    const dateMap = {};

    reportData.forEach((d) => {
      let shape = (d.shape || d.size || '').trim();
      const lower = shape.toLowerCase();
      // Normalize 'emerald', legacy carat text (e.g. '1.0 ct', '1.00 ct', '1.0'), or missing values to 'Emeral'
      if (!shape || lower === 'emerald' || lower.includes('ct') || /^\d+(\.\d+)?$/.test(shape)) {
        shape = 'Emeral';
      }
      shapeSet.add(shape);

      const dDate = d.receivedDate || 'Undated';
      if (!dateMap[dDate]) {
        dateMap[dDate] = {
          date: dDate,
          totalPcs: 0,
          totalWeight: 0,
          shapes: {},
          diamonds: []
        };
      }

      dateMap[dDate].totalPcs += 1;
      const w = parseFloat(d.weight) || 0;
      dateMap[dDate].totalWeight += w;

      if (!dateMap[dDate].shapes[shape]) {
        dateMap[dDate].shapes[shape] = { pcs: 0, weight: 0 };
      }
      dateMap[dDate].shapes[shape].pcs += 1;
      dateMap[dDate].shapes[shape].weight += w;
      dateMap[dDate].diamonds.push(d);
    });

    const sortedShapes = Array.from(shapeSet)
      .filter((s) => s && s.trim() !== '-' && s.trim() !== '')
      .sort();
    const sortedDates = Object.keys(dateMap).sort().reverse();
    const rows = sortedDates.map((dKey) => dateMap[dKey]);

    const grandTotal = {
      totalPcs: rows.reduce((sum, r) => sum + r.totalPcs, 0),
      totalWeight: rows.reduce((sum, r) => sum + r.totalWeight, 0),
      shapes: {}
    };

    sortedShapes.forEach((s) => {
      grandTotal.shapes[s] = {
        pcs: rows.reduce((sum, r) => sum + (r.shapes[s]?.pcs || 0), 0),
        weight: rows.reduce((sum, r) => sum + (r.shapes[s]?.weight || 0), 0)
      };
    });

    return {
      shapes: sortedShapes,
      rows,
      grandTotal
    };
  }, [reportData]);

  // Export Handlers
  const handleExportCSV = () => {
    const exportRows = reportData.map((d) => ({
      Barcode: d.barcode,
      RoughCutNo: d.roughCutNo || '',
      Company: d.companyName,
      CompanyCode: d.companyCode,
      Shape: d.shape || d.size || '-',
      OriginalWeightCarat: d.weight,
      ActualWeightCarat: d.actualWeight || '',
      ReceivedDate: d.receivedDate,
      AssignedWorker: d.assignedWorkerName || 'Unassigned',
      Status: d.status,
      CompletedDate: d.completedDate || '',
      VerifiedDate: d.verifiedDate || '',
      Remarks: d.remarks || ''
    }));
    const reportTitle = reportTypes.find((r) => r.id === activeReportType)?.name || 'Diamond_Report';
    exportToCSV(reportTitle.replace(/[^a-zA-Z0-9]/g, '_'), exportRows);
  };

  const handleExportExcel = () => {
    const compName = selectedCompany ? selectedCompany.name : 'All_Companies';

    if (activeReportType === '1' && viewMode === 'matrix') {
      const fileName = `Monthly_Stock_Shape_Matrix_${compName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;
      exportShapeMatrixExcel(fileName, {
        companyName: selectedCompany ? selectedCompany.name : 'All Client Companies',
        companyCode: selectedCompany ? selectedCompany.code : '',
        fromDate: fromDate || 'Start',
        toDate: toDate || 'Present',
        generatedBy: user?.name || user?.username || 'Admin Manager',
        shapes: matrixData.shapes,
        rows: matrixData.rows,
        grandTotal: matrixData.grandTotal
      });
      return;
    }

    const exportRows = reportData.map((d) => ({
      Barcode: d.barcode,
      RoughCutNo: d.roughCutNo || '',
      Company: d.companyName,
      CompanyCode: d.companyCode,
      Shape: d.shape || d.size || '-',
      OriginalWeightCarat: d.weight,
      ActualWeightCarat: d.actualWeight || '',
      ReceivedDate: d.receivedDate,
      AssignedWorker: d.assignedWorkerName || 'Unassigned',
      Status: d.status,
      CompletedDate: d.completedDate || '',
      VerifiedDate: d.verifiedDate || ''
    }));
    const reportTitle = reportTypes.find((r) => r.id === activeReportType)?.name || 'Diamond_Report';
    exportToExcel(reportTitle.replace(/[^a-zA-Z0-9]/g, '_'), exportRows, {
      title: `DIVY IMPEX — ${reportTitle}`,
      generatedBy: user?.name || user?.username || 'Admin Manager',
      scope: `${selectedCompany ? selectedCompany.name : 'All Companies'} | ${fromDate || 'Start'} to ${toDate || 'Present'}`
    });
  };

  return (
    <PrivateLayout title="Audit & Operational Reports Console">
      {/* Report Selector & Export Header */}
      <div className="card card-custom p-3 p-sm-4 mb-4 shadow-sm btn-print-hide">
        <div className="row g-3 align-items-center justify-content-between">
          <div className="col-lg-6">
            <label className="form-label font-heading fw-bold mb-1">Select Active Audit Report Type</label>
            <select
              className="form-select form-select-lg fw-bold text-navy"
              value={activeReportType}
              onChange={(e) => setActiveReportType(e.target.value)}
            >
              {reportTypes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-lg-6 text-lg-end pt-2">
            <div className="d-flex flex-wrap justify-content-lg-end gap-2 btn-print-hide">
              <button
                className="btn btn-outline-success font-heading fw-semibold rounded-pill px-3 shadow-xs"
                onClick={handleExportExcel}
              >
                <FileSpreadsheet size={16} className="me-2" />
                {activeReportType === '1' && viewMode === 'matrix' ? 'Export Matrix Excel (.xlsx)' : 'Export Excel (.xlsx)'}
              </button>
              <button
                className="btn btn-navy font-heading fw-semibold rounded-pill px-3 shadow-xs"
                onClick={triggerPrint}
              >
                <Printer size={16} className="me-2 text-warning" /> Print Official Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card card-custom p-3 p-sm-4 mb-4 shadow-sm btn-print-hide">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h6 className="font-heading fw-bold text-navy mb-0 d-flex align-items-center" style={{ color: '#0A192F' }}>
            <Filter size={18} className="me-2 text-warning" /> Report Filter Parameters
          </h6>
          <div className="d-flex align-items-center gap-2">
            {(companyFilter || workerFilter || statusFilter || fromDate || toDate) && (
              <button
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 font-heading"
                onClick={() => {
                  setCompanyFilter('');
                  setWorkerFilter('');
                  setStatusFilter('');
                  setFromDate('');
                  setToDate('');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4 col-xl-3">
            <label className="form-label font-heading fw-semibold small text-muted mb-1">
              Client Company
            </label>
            <select
              className="form-select form-select-sm fw-semibold"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="">-- All Client Companies --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <label className="form-label font-heading fw-semibold small text-muted mb-1">From Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <label className="form-label font-heading fw-semibold small text-muted mb-1">To Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <label className="form-label font-heading fw-semibold small text-muted mb-1">Stage Status</label>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="RECEIVED">RECEIVED (Inward Stock)</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
              <option value="WORK COMPLETED">WORK COMPLETED</option>
              <option value="DEPOSITED">DEPOSITED</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REWORK">REWORK</option>
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-4 col-xl-3">
            <label className="form-label font-heading fw-semibold small text-muted mb-1">Assigned Worker</label>
            <select
              className="form-select form-select-sm"
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
            >
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top">
          <small className="text-muted fw-semibold me-1">Quick Date Range:</small>
          <button
            type="button"
            className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1"
            onClick={() => handleSetQuickDate('thisMonth')}
          >
            This Month
          </button>
          <button
            type="button"
            className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1"
            onClick={() => handleSetQuickDate('lastMonth')}
          >
            Last Month
          </button>
          <button
            type="button"
            className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1"
            onClick={() => handleSetQuickDate('last30Days')}
          >
            Last 30 Days
          </button>
          {(fromDate || toDate) && (
            <button
              type="button"
              className="btn btn-xs btn-light text-danger rounded-pill px-2.5 py-1 border"
              onClick={() => handleSetQuickDate('clear')}
            >
              Clear Date Filter
            </button>
          )}
        </div>
      </div>

      {/* Report Container */}
      <div className="card card-custom p-3 p-sm-4 shadow-sm border report-print-container">
        {/* ========================================================================= */}
        {/* OFFICIAL PRINT / PDF HEADER BANNER (Visible ONLY during Print / PDF)     */}
        {/* ========================================================================= */}
        <div className="d-none d-print-block print-official-banner mb-3">
          <div className="print-banner-title">
            DIVY IMPEX — {activeReportType === '1'
              ? (viewMode === 'matrix' ? 'MONTHLY STOCK & SHAPE MATRIX LEDGER' : 'DETAILED DIAMOND ITEMIZATION AUDIT REGISTER')
              : (reportTypes.find((r) => r.id === activeReportType)?.name || 'OFFICIAL AUDIT REPORT').toUpperCase()}
          </div>
          <div className="print-banner-meta">
            <span><strong>Generated On:</strong> {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            <span><strong>Generated By:</strong> {user?.name || user?.username || 'Admin Manager'}</span>
            <span><strong>Total Diamonds:</strong> {reportData.length} pcs</span>
            <span><strong>Total Weight:</strong> {matrixData.grandTotal.totalWeight.toFixed(3)} ct</span>
          </div>
          <div className="print-banner-filters">
            <strong>Applied Filters:</strong> Company: {selectedCompany ? `${selectedCompany.name} (${selectedCompany.code})` : 'All Client Companies'} &nbsp;|&nbsp; Date Scope: {fromDate || 'Start'} to {toDate || 'Present'} &nbsp;|&nbsp; Status: All Active Stock
          </div>
        </div>

        {/* Report Header Title & Mode Switcher (Web view only, hidden during print) */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4 pb-3 border-bottom btn-print-hide">
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1.5">
              <div className="p-2 rounded bg-navy text-warning flex-shrink-0" style={{ backgroundColor: '#0A192F' }}>
                <FileSpreadsheet size={18} />
              </div>
              <h5 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F' }}>
                {activeReportType === '1'
                  ? selectedCompany
                    ? `${selectedCompany.name} - Monthly Stock & Shape Matrix`
                    : 'All Companies - Monthly Stock & Shape Matrix'
                  : `DIVY IMPEX - ${reportTypes.find((r) => r.id === activeReportType)?.name}`}
              </h5>
              {selectedCompany && (
                <span className="badge font-mono fw-bold px-2 py-1" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>
                  {selectedCompany.code}
                </span>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap text-muted small">
              <span>
                <Calendar size={13} className="me-1 text-secondary" />
                {fromDate && toDate
                  ? `${fromDate} to ${toDate}`
                  : fromDate
                    ? `From ${fromDate}`
                    : toDate
                      ? `Up to ${toDate}`
                      : 'All Recorded Time'}
              </span>
              <span className="text-muted opacity-50">•</span>
              <span className="badge rounded-pill fw-bold px-2.5 py-1" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>
                {reportData.length} Total Diamonds
              </span>
              <span className="badge rounded-pill fw-bold px-2.5 py-1" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                {matrixData.grandTotal.totalWeight.toFixed(3)} ct Total Weight
              </span>
            </div>
          </div>

          {/* Controls: View Toggle & Direct Download Matrix Button */}
          {activeReportType === '1' && (
            <div className="d-flex flex-wrap align-items-center gap-2 btn-print-hide">
              <div className="btn-group rounded-pill p-1 bg-light border" role="group">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                    viewMode === 'matrix' ? 'btn-gold shadow-xs' : 'btn-light text-secondary border-0'
                  }`}
                  onClick={() => setViewMode('matrix')}
                >
                  <Table size={14} className="me-1.5" /> Shape Matrix Ledger
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                    viewMode === 'itemized' ? 'btn-gold shadow-xs' : 'btn-light text-secondary border-0'
                  }`}
                  onClick={() => setViewMode('itemized')}
                >
                  <ListOrdered size={14} className="me-1.5" /> Itemized Diamonds ({reportData.length})
                </button>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-success rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center shadow-xs"
                onClick={handleExportExcel}
                title="Download formatted professional Excel workbook for this matrix"
              >
                <FileSpreadsheet size={14} className="me-1.5" /> Download Matrix (.xlsx)
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: MONTHLY STOCK & SHAPE MATRIX LEDGER TABLE (User Photo Layout) */}
        {/* ========================================================================= */}
        {activeReportType === '1' && viewMode === 'matrix' ? (
          <div>
            {matrixData.rows.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FileBarChart2 size={42} className="text-secondary opacity-40 mb-2" />
                <h6 className="fw-semibold text-secondary">No stock records found for this date range.</h6>
                <small>Try selecting a different date range or company filter above.</small>
              </div>
            ) : (
              <div className="table-responsive rounded-3 border bg-white shadow-xs">
                <table className="table table-custom table-hover align-middle mb-0">
                  {/* Clean Modern Table Header */}
                  <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <tr>
                      <th className="py-2.5 px-2 text-center text-uppercase fw-bold text-nowrap" style={{ width: '50px', color: '#475569', fontSize: '0.74rem', letterSpacing: '0.04em' }}>
                        Sr No
                      </th>
                      <th className="py-2.5 px-3 text-uppercase fw-bold text-nowrap" style={{ width: '120px', color: '#475569', fontSize: '0.74rem', letterSpacing: '0.04em' }}>
                        Date
                      </th>
                      <th className="text-center py-2.5 px-3 text-uppercase fw-bold text-nowrap" style={{ width: '95px', color: '#475569', fontSize: '0.74rem', letterSpacing: '0.04em' }}>
                        Total Pcs
                      </th>
                      {/* Dynamic Shape Columns from the company's diamonds */}
                      {matrixData.shapes.map((shapeName) => (
                        <th
                          key={shapeName}
                          className="text-center py-2.5 px-3 text-nowrap"
                          style={{ minWidth: '130px' }}
                        >
                          <div className="d-flex align-items-center justify-content-center gap-1.5 mb-0.5">
                            <Gem size={13} style={{ color: '#D4AF37' }} />
                            <span className="fw-bold text-uppercase" style={{ color: '#0A192F', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                              {shapeName}
                            </span>
                          </div>
                          <span className="text-muted" style={{ fontSize: '0.68rem', fontWeight: 500 }}>
                            (pcs / weight)
                          </span>
                        </th>
                      ))}
                      <th className="text-end py-2.5 px-3 text-uppercase fw-bold text-nowrap" style={{ width: '130px', color: '#475569', fontSize: '0.74rem', letterSpacing: '0.04em' }}>
                        Total Weight
                      </th>
                      <th className="text-center py-2.5 px-2 text-uppercase fw-bold text-nowrap btn-print-hide" style={{ width: '60px', color: '#94A3B8', fontSize: '0.72rem' }}>
                        Inspect
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {matrixData.rows.map((rowItem, rIdx) => {
                      const isExpanded = !!expandedDates[rowItem.date];
                      return (
                        <React.Fragment key={rowItem.date}>
                          <tr
                            style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                            onClick={() => toggleDateExpanded(rowItem.date)}
                          >
                            {/* Sr No */}
                            <td className="text-center py-2.5 px-2 text-muted font-mono small">
                              {rIdx + 1}
                            </td>

                            {/* Date */}
                            <td className="py-2.5 px-3 fw-bold font-mono text-nowrap" style={{ color: '#0A192F' }}>
                              {rowItem.date}
                            </td>

                            {/* Total Pcs */}
                            <td className="text-center py-2.5 px-3">
                              <span className="badge rounded-pill fw-bold px-2.5 py-1" style={{ backgroundColor: '#F1F5F9', color: '#0A192F', border: '1px solid #CBD5E1' }}>
                                {rowItem.totalPcs}
                              </span>
                            </td>

                            {/* Shape Cells: Format {pcs} / {carats} */}
                            {matrixData.shapes.map((shapeName) => {
                              const shapeVal = rowItem.shapes[shapeName];
                              return (
                                <td key={shapeName} className="text-center py-2.5 px-3 font-mono">
                                  {shapeVal ? (
                                    <div
                                      className="d-inline-flex align-items-center justify-content-center px-2.5 py-1 rounded-2 bg-light border"
                                      style={{ minWidth: '85px', fontSize: '0.82rem' }}
                                    >
                                      <span className="fw-bold me-1" style={{ color: '#0A192F' }}>{shapeVal.pcs}</span>
                                      <span className="text-muted mx-1">/</span>
                                      <span className="fw-semibold text-dark">{shapeVal.weight.toFixed(2)}</span>
                                      <span className="text-muted small ms-0.5" style={{ fontSize: '0.7rem' }}>ct</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted opacity-25">—</span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Total Weight for this Date */}
                            <td className="text-end py-2.5 px-3 fw-bold font-mono" style={{ color: '#0A192F', fontSize: '0.88rem' }}>
                              {rowItem.totalWeight.toFixed(2)}{' '}
                              <span className="text-muted small fw-normal">ct</span>
                            </td>

                            {/* Row Expand Toggle */}
                            <td className="text-center py-2.5 px-2 btn-print-hide" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="btn btn-sm btn-light border rounded-circle p-1"
                                onClick={() => toggleDateExpanded(rowItem.date)}
                                title={isExpanded ? 'Hide diamond items' : 'View diamond items'}
                                style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                {isExpanded ? <ChevronDown size={14} className="text-navy" /> : <ChevronRight size={14} className="text-secondary" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expandable Sub-Table: Shows exact barcodes for this date */}
                          {isExpanded && (
                            <tr className="bg-light btn-print-hide">
                              <td colSpan={matrixData.shapes.length + 5} className="p-3 bg-light">
                                <div className="card shadow-xs border p-3 bg-white rounded-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="fw-bold text-navy mb-0 small" style={{ color: '#0A192F' }}>
                                      Diamond Barcode Entries for Date: {rowItem.date} ({rowItem.diamonds.length} stones)
                                    </h6>
                                    <span className="badge px-2.5 py-1 fw-bold" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                                      Total: {rowItem.totalWeight.toFixed(3)} ct
                                    </span>
                                  </div>
                                  <div className="table-responsive">
                                    <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                                      <thead className="table-light">
                                        <tr>
                                          <th>#</th>
                                          <th>Barcode</th>
                                          <th>Rough Cut #</th>
                                          <th>Company</th>
                                          <th>Shape</th>
                                          <th>Rough Weight</th>
                                          <th>Target Weight</th>
                                          <th>Worker</th>
                                          <th>Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {rowItem.diamonds.map((dia, dIdx) => (
                                          <tr key={dia.id || dIdx}>
                                            <td>{dIdx + 1}</td>
                                            <td className="fw-bold font-mono" style={{ color: '#0A192F' }}>{dia.barcode}</td>
                                            <td className="font-mono text-muted">{dia.roughCutNo || '-'}</td>
                                            <td>{dia.companyName}</td>
                                            <td>
                                              <span className="badge bg-light text-dark border">
                                                {dia.shape || dia.size || '-'}
                                              </span>
                                            </td>
                                            <td className="fw-semibold">{dia.weight} ct</td>
                                            <td className="text-muted">{dia.targetWeight ? `${dia.targetWeight} ct` : '-'}</td>
                                            <td>{dia.assignedWorkerName || <span className="text-muted italic">Unassigned</span>}</td>
                                            <td><Badge status={dia.status} /></td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>

                  {/* Grand Summary Total Row at Bottom */}
                  <tfoot style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #CBD5E1' }}>
                    <tr>
                      <td colSpan={2} className="py-3 px-3 text-uppercase fw-bold" style={{ color: '#0A192F', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                        GRAND TOTAL SUMMARY
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className="badge rounded-pill font-mono fw-bold px-3 py-1.5" style={{ backgroundColor: '#0A192F', color: '#FFFFFF', fontSize: '0.78rem' }}>
                          {matrixData.grandTotal.totalPcs} pcs
                        </span>
                      </td>

                      {/* Shape Grand Totals */}
                      {matrixData.shapes.map((shapeName) => {
                        const sTot = matrixData.grandTotal.shapes[shapeName];
                        return (
                          <td key={shapeName} className="text-center py-3 px-3 font-mono">
                            <div className="fw-bold" style={{ color: '#0A192F', fontSize: '0.82rem' }}>
                              {sTot.pcs} pcs
                            </div>
                            <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                              {sTot.weight.toFixed(2)} ct
                            </div>
                          </td>
                        );
                      })}

                      {/* Grand Total Weight */}
                      <td className="text-end py-3 px-3 font-mono fw-bold" style={{ color: '#0A192F', fontSize: '0.92rem' }}>
                        {matrixData.grandTotal.totalWeight.toFixed(2)}{' '}
                        <span className="small text-muted fw-normal">ct</span>
                      </td>
                      <td className="btn-print-hide"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: ITEMIZED DIAMONDS AUDIT TABLE (Row-by-Row List) */
          /* ========================================================================= */
          <div className="table-responsive rounded-3 border">
            <table className="table table-custom table-hover table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Barcode</th>
                  <th>Rough Cut #</th>
                  <th>Company</th>
                  <th>Shape</th>
                  <th>Original Weight</th>
                  <th>Actual Weight</th>
                  <th>Received Date</th>
                  <th>Assigned Artisan</th>
                  <th>Work Status</th>
                  <th>Completed Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4 text-muted">
                      No matching records found for this report configuration.
                    </td>
                  </tr>
                ) : (
                  reportData.map((d, idx) => (
                    <tr key={d.id || idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="font-heading fw-bold text-navy">{d.barcode}</span>
                      </td>
                      <td className="font-mono text-muted small">{d.roughCutNo || '-'}</td>
                      <td>
                        {d.companyName} <span className="badge bg-light text-navy border ms-1">{d.companyCode}</span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {d.shape || d.size || '-'}
                        </span>
                      </td>
                      <td className="fw-semibold">{d.weight} ct</td>
                      <td>{d.actualWeight ? `${d.actualWeight} ct` : '-'}</td>
                      <td>{d.receivedDate}</td>
                      <td>{d.assignedWorkerName || <span className="text-muted italic">Unassigned</span>}</td>
                      <td>
                        <Badge status={d.status} />
                      </td>
                      <td>{d.completedDate || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {reportData.length > 0 && (
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td colSpan="5">Total Calculated ({reportData.length} Diamonds)</td>
                    <td className="fw-bold text-navy">
                      {reportData.reduce((sum, d) => sum + (parseFloat(d.weight) || 0), 0).toFixed(3)} ct
                    </td>
                    <td className="fw-bold text-success">
                      {reportData.reduce((sum, d) => sum + (parseFloat(d.actualWeight) || 0), 0).toFixed(3)} ct
                    </td>
                    <td colSpan="4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </PrivateLayout>
  );
};

export default Reports;
