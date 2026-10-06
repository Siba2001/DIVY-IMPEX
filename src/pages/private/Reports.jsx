import React, { useState } from 'react';
import PrivateLayout from '../../layouts/PrivateLayout';
import Badge from '../../components/common/Badge';
import { useDiamonds } from '../../context/DiamondContext';
import { exportToCSV, exportToExcel, triggerPrint } from '../../services/exportService';
import { FileBarChart2, Download, Printer, Filter, Table, FileSpreadsheet } from 'lucide-react';

const Reports = () => {
  const { diamonds, companies, workers } = useDiamonds();

  const [activeReportType, setActiveReportType] = useState('1'); // 1 to 9
  const [companyFilter, setCompanyFilter] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const reportTypes = [
    { id: '1', name: '1. Company-Wise Diamond Report' },
    { id: '2', name: '2. Date-Wise Received Inward Report' },
    { id: '3', name: '3. Date-Wise Completed Report' },
    { id: '4', name: '4. Date-Wise Pending Report' },
    { id: '5', name: '5. Worker-Wise Performance Report' },
    { id: '6', name: '6. Diamond Master Audit Report' },
    { id: '7', name: '7. Inward Parcel Physical Log Report' },
    { id: '8', name: '8. QC Safe Deposit Report' },
    { id: '9', name: '9. Dual Scale Carat Verification Report' },
  ];

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

  const handleExportCSV = () => {
    const exportRows = reportData.map((d) => ({
      Barcode: d.barcode,
      Company: d.companyName,
      CompanyCode: d.companyCode,
      Size: d.size,
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
    const exportRows = reportData.map((d) => ({
      Barcode: d.barcode,
      Company: d.companyName,
      CompanyCode: d.companyCode,
      Size: d.size,
      OriginalWeightCarat: d.weight,
      ActualWeightCarat: d.actualWeight || '',
      ReceivedDate: d.receivedDate,
      AssignedWorker: d.assignedWorkerName || 'Unassigned',
      Status: d.status,
      CompletedDate: d.completedDate || '',
      VerifiedDate: d.verifiedDate || ''
    }));
    const reportTitle = reportTypes.find((r) => r.id === activeReportType)?.name || 'Diamond_Report';
    exportToExcel(reportTitle.replace(/[^a-zA-Z0-9]/g, '_'), exportRows);
  };

  return (
    <PrivateLayout title="Audit & Operational Reports Console">
      {/* Report Selector & Export Header */}
      <div className="card card-custom p-4 mb-4 shadow-sm">
        <div className="row g-3 align-items-center justify-content-between">
          <div className="col-lg-6">
            <label className="form-label font-heading fw-bold">Select Active Audit Report Type</label>
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
                className="btn btn-outline-success font-heading fw-semibold rounded-pill px-3"
                onClick={handleExportExcel}
              >
                <FileSpreadsheet size={16} className="me-2" /> Export Excel (.xls)
              </button>
              <button
                className="btn btn-outline-primary font-heading fw-semibold rounded-pill px-3"
                onClick={handleExportCSV}
              >
                <Download size={16} className="me-2" /> Export CSV
              </button>
              <button
                className="btn btn-navy font-heading fw-semibold rounded-pill px-3"
                onClick={triggerPrint}
              >
                <Printer size={16} className="me-2" /> Print Official Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card card-custom p-4 mb-4 shadow-sm btn-print-hide">
        <h6 className="font-heading fw-bold text-navy mb-3 d-flex align-items-center" style={{ color: '#0A192F' }}>
          <Filter size={18} className="me-2 text-warning" /> Report Filter Parameters
        </h6>

        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">Company</label>
            <select className="form-select" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Assigned Worker</label>
            <select className="form-select" value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}>
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.department})
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Stage Status</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
              <option value="WORK COMPLETED">WORK COMPLETED</option>
              <option value="DEPOSITED">DEPOSITED</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REWORK">REWORK</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Date Range</label>
            <div className="d-flex gap-2">
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <input
                type="date"
                className="form-control form-control-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Data Table */}
      <div className="card card-custom p-4 shadow-sm border">
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <h5 className="font-heading fw-bold text-navy mb-1" style={{ color: '#0A192F' }}>
              DIVY IMPEX - {reportTypes.find((r) => r.id === activeReportType)?.name}
            </h5>
            <span className="text-muted small">
              Generated Date: {new Date().toLocaleDateString('en-GB')} | Total Records: {reportData.length}
            </span>
          </div>
          <div className="text-end">
            <span className="badge bg-navy text-warning p-2">Official Audit Trail</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-custom table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Barcode</th>
                <th>Company</th>
                <th>Size Spec</th>
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
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No matching records found for this report configuration.
                  </td>
                </tr>
              ) : (
                reportData.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="font-heading fw-bold text-navy">{d.barcode}</span>
                    </td>
                    <td>{d.companyName} ({d.companyCode})</td>
                    <td>{d.size}</td>
                    <td className="fw-semibold">{d.weight} ct</td>
                    <td>{d.actualWeight ? `${d.actualWeight} ct` : '-'}</td>
                    <td>{d.receivedDate}</td>
                    <td>{d.assignedWorkerName || 'Unassigned'}</td>
                    <td>
                      <Badge status={d.status} />
                    </td>
                    <td>{d.completedDate || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PrivateLayout>
  );
};

export default Reports;
