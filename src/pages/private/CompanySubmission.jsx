import React, { useState, useMemo } from 'react';
import PrivateLayout from '../../layouts/PrivateLayout';
import { useDiamonds } from '../../context/DiamondContext';
import { exportToCSV, exportDispatchHistoryExcel } from '../../services/exportService';
import Badge from '../../components/common/Badge';
import {
  Truck,
  PackageCheck,
  Building2,
  Calendar,
  Search,
  CheckCircle2,
  Printer,
  Download,
  FileSpreadsheet,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Clock,
  Sparkles,
  Layers,
  X,
  AlertCircle
} from 'lucide-react';

const CompanySubmission = () => {
  const { diamonds, companies, dispatches, submitDiamondsToCompany } = useDiamonds();

  // Active Tab: 'ready' (Pending Submission) vs 'history' (Date-by-Date Dispatch History)
  const [activeTab, setActiveTab] = useState('ready');

  // Filters for Ready Tab
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarcodes, setSelectedBarcodes] = useState([]);

  // Filters for History Tab
  const [historyCompanyFilter, setHistoryCompanyFilter] = useState('');
  const [historyFromDate, setHistoryFromDate] = useState('');
  const [historyToDate, setHistoryToDate] = useState('');
  const [expandedDispatchId, setExpandedDispatchId] = useState(null);

  // Submission Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [challanNo, setChallanNo] = useState('');
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiverName, setReceiverName] = useState('');
  const [packagingRemarks, setPackagingRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Printable Challan Modal State
  const [printableDispatch, setPrintableDispatch] = useState(null);

  // 1. Diamonds that are COMPLETED (work finished & QC verified) and ready to be returned to company
  const completedDiamonds = useMemo(() => {
    return diamonds.filter((d) => d.status === 'COMPLETED');
  }, [diamonds]);

  // 2. Filtered list for "Ready for Submission" tab
  const filteredReadyDiamonds = useMemo(() => {
    return completedDiamonds.filter((d) => {
      const matchCompany = !selectedCompanyFilter || d.companyId === selectedCompanyFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        (d.barcode && d.barcode.toLowerCase().includes(term)) ||
        (d.assignedWorkerName && d.assignedWorkerName.toLowerCase().includes(term)) ||
        (d.companyName && d.companyName.toLowerCase().includes(term));
      return matchCompany && matchSearch;
    });
  }, [completedDiamonds, selectedCompanyFilter, searchTerm]);

  // Calculations for Filtered Ready Diamonds List
  const readyCalculations = useMemo(() => {
    const list = filteredReadyDiamonds;
    const count = list.length;
    let origWeight = 0;
    let actualWeight = 0;

    list.forEach((d) => {
      origWeight += parseFloat(d.weight) || 0;
      actualWeight += parseFloat(d.actualWeight || d.weight) || 0;
    });

    const diffWeight = actualWeight - origWeight;
    const yieldPercentage = origWeight > 0 ? ((actualWeight / origWeight) * 100).toFixed(1) : '100.0';

    return {
      count,
      origWeight: parseFloat(origWeight.toFixed(3)),
      actualWeight: parseFloat(actualWeight.toFixed(3)),
      diffWeight: parseFloat(diffWeight.toFixed(3)),
      yieldPercentage
    };
  }, [filteredReadyDiamonds]);

  // Calculations for Selected Diamonds (Checkboxes)
  const selectedCalculations = useMemo(() => {
    const selectedSet = new Set(selectedBarcodes);
    const selectedList = filteredReadyDiamonds.filter((d) => selectedSet.has(d.barcode));
    const count = selectedList.length;
    let origWeight = 0;
    let actualWeight = 0;

    selectedList.forEach((d) => {
      origWeight += parseFloat(d.weight) || 0;
      actualWeight += parseFloat(d.actualWeight || d.weight) || 0;
    });

    const diffWeight = actualWeight - origWeight;
    const yieldPercentage = origWeight > 0 ? ((actualWeight / origWeight) * 100).toFixed(1) : '100.0';

    return {
      count,
      origWeight: parseFloat(origWeight.toFixed(3)),
      actualWeight: parseFloat(actualWeight.toFixed(3)),
      diffWeight: parseFloat(diffWeight.toFixed(3)),
      yieldPercentage,
      selectedList
    };
  }, [selectedBarcodes, filteredReadyDiamonds]);

  // Overall KPIs
  const overallMetrics = useMemo(() => {
    const returnedDiamonds = diamonds.filter((d) => d.status === 'RETURNED');
    let returnedOrigWeight = 0;
    let returnedActualWeight = 0;
    returnedDiamonds.forEach((d) => {
      returnedOrigWeight += parseFloat(d.weight) || 0;
      returnedActualWeight += parseFloat(d.actualWeight || d.weight) || 0;
    });

    const distinctCompaniesPending = new Set(completedDiamonds.map((d) => d.companyId)).size;

    return {
      readyCount: completedDiamonds.length,
      readyWeight: readyCalculations.origWeight,
      returnedCount: returnedDiamonds.length,
      returnedOrigWeight: parseFloat(returnedOrigWeight.toFixed(3)),
      returnedWeight: parseFloat(returnedActualWeight.toFixed(3)),
      distinctCompaniesPending,
      totalDispatches: dispatches.length
    };
  }, [diamonds, completedDiamonds, readyCalculations, dispatches]);

  // 3. Filtered Date-by-Date History
  const filteredDispatches = useMemo(() => {
    return dispatches
      .filter((dp) => {
        const matchCompany = !historyCompanyFilter || dp.companyId === historyCompanyFilter;
        let matchDate = true;
        if (historyFromDate && dp.dispatchDate < historyFromDate) matchDate = false;
        if (historyToDate && dp.dispatchDate > historyToDate) matchDate = false;
        return matchCompany && matchDate;
      })
      .sort((a, b) => new Date(b.dispatchDate) - new Date(a.dispatchDate));
  }, [dispatches, historyCompanyFilter, historyFromDate, historyToDate]);

  // Calculations for Filtered History
  const historyCalculations = useMemo(() => {
    let totalPieces = 0;
    let totalActualWeight = 0;
    filteredDispatches.forEach((dp) => {
      totalPieces += dp.diamondsCount || 0;
      totalActualWeight += parseFloat(dp.totalActualWeight) || 0;
    });

    return {
      dispatchesCount: filteredDispatches.length,
      totalPieces,
      totalActualWeight: parseFloat(totalActualWeight.toFixed(3))
    };
  }, [filteredDispatches]);

  // Selection Handlers
  const handleToggleSelectBarcode = (barcode) => {
    setSelectedBarcodes((prev) =>
      prev.includes(barcode) ? prev.filter((b) => b !== barcode) : [...prev, barcode]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedBarcodes.length === filteredReadyDiamonds.length) {
      setSelectedBarcodes([]);
    } else {
      setSelectedBarcodes(filteredReadyDiamonds.map((d) => d.barcode));
    }
  };

  // Open Submission Modal
  const handleOpenSubmissionModal = () => {
    if (selectedBarcodes.length === 0) return;

    // Pick first company of selected diamonds
    const firstSelected = filteredReadyDiamonds.find((d) => selectedBarcodes.includes(d.barcode));
    const compCode = firstSelected?.companyCode || 'DIVY';
    const dateFormatted = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);

    setChallanNo(`DC-${compCode}-${dateFormatted}-${randomSuffix}`);
    setSubmissionDate(new Date().toISOString().split('T')[0]);
    setReceiverName(firstSelected?.companyName ? `${firstSelected.companyName} Representative` : '');
    setPackagingRemarks('');
    setIsSubmitModalOpen(true);
  };

  // Confirm Submission
  const handleConfirmSubmission = async (e) => {
    e.preventDefault();
    if (selectedBarcodes.length === 0) return;

    setIsSubmitting(true);
    try {
      const firstSelected = filteredReadyDiamonds.find((d) => selectedBarcodes.includes(d.barcode));
      await submitDiamondsToCompany({
        companyId: firstSelected?.companyId,
        barcodes: selectedBarcodes,
        challanNo,
        dispatchDate: submissionDate,
        receiverName,
        remarks: packagingRemarks,
        dispatchedBy: 'Factory Manager'
      });

      setSelectedBarcodes([]);
      setIsSubmitModalOpen(false);
      setActiveTab('history'); // Navigate to history tab to view newly logged dispatch!
    } catch (err) {
      alert(`Submission failed: ${err.message || 'Error processing request'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export History CSV
  const handleExportHistoryCSV = () => {
    if (!filteredDispatches.length) return;
    const rows = filteredDispatches.map((dp) => ({
      'Challan No': dp.challanNo,
      'Dispatch Date': dp.dispatchDate,
      'Company Name': dp.companyName,
      'Company Code': dp.companyCode,
      'Diamonds Count': dp.diamondsCount,
      'Total Carat Weight': dp.totalActualWeight,
      'Receiver Name': dp.receiverName,
      'Dispatched By': dp.dispatchedBy,
      'Remarks': dp.remarks,
      'Barcodes': (dp.barcodes || []).join(', ')
    }));
    exportToCSV(`Company_Dispatch_History_${new Date().toISOString().split('T')[0]}`, rows);
  };

  // Comprehensive Excel Report Export (Overall Totals + Every Company + Date-by-date + Itemization)
  const handleExportHistoryExcel = () => {
    if (!filteredDispatches.length) return;

    // 1. Group by Company for Every Company Breakdown
    const companyMap = {};
    filteredDispatches.forEach((dp) => {
      const cKey = dp.companyId || dp.companyCode || dp.companyName;
      if (!companyMap[cKey]) {
        companyMap[cKey] = {
          name: dp.companyName,
          code: dp.companyCode,
          challansCount: 0,
          diamondsCount: 0,
          totalOrigWeight: 0,
          totalActualWeight: 0,
          loss: 0,
          yieldPercentage: '100.00'
        };
      }
      companyMap[cKey].challansCount += 1;
      companyMap[cKey].diamondsCount += parseInt(dp.diamondsCount, 10) || 0;
      companyMap[cKey].totalOrigWeight += parseFloat(dp.totalOriginalWeight) || 0;
      companyMap[cKey].totalActualWeight += parseFloat(dp.totalActualWeight) || 0;
    });

    const companySummary = Object.values(companyMap).map((c) => {
      const loss = c.totalActualWeight - c.totalOrigWeight;
      const yieldPct = c.totalOrigWeight > 0 ? ((c.totalActualWeight / c.totalOrigWeight) * 100).toFixed(2) : '100.00';
      return {
        ...c,
        loss,
        yieldPercentage: yieldPct
      };
    });

    // 2. Overall Delivery Totals
    const totPieces = filteredDispatches.reduce((acc, dp) => acc + (parseInt(dp.diamondsCount, 10) || 0), 0);
    const totOrigW = filteredDispatches.reduce((acc, dp) => acc + (parseFloat(dp.totalOriginalWeight) || 0), 0);
    const totActW = filteredDispatches.reduce((acc, dp) => acc + (parseFloat(dp.totalActualWeight) || 0), 0);
    const totLoss = totActW - totOrigW;
    const totYield = totOrigW > 0 ? ((totActW / totOrigW) * 100).toFixed(2) : '100.00';

    const overallTotals = {
      totalChallans: filteredDispatches.length,
      totalPieces: totPieces,
      totalOriginalWeight: totOrigW,
      totalActualWeight: totActW,
      totalLoss: totLoss,
      yieldPercentage: totYield
    };

    const filterScopeText = [
      historyCompanyFilter
        ? `Company: ${companies.find((c) => String(c.id) === String(historyCompanyFilter))?.name || historyCompanyFilter}`
        : 'All Companies',
      historyFromDate ? `From: ${historyFromDate}` : '',
      historyToDate ? `To: ${historyToDate}` : ''
    ].filter(Boolean).join(' | ');

    exportDispatchHistoryExcel(
      `DIVY_IMPEX_Delivery_Report_${new Date().toISOString().split('T')[0]}`,
      {
        dispatches: filteredDispatches,
        companySummary,
        overallTotals,
        filters: { scope: filterScopeText }
      }
    );
  };

  // Export Ready List CSV
  const handleExportReadyCSV = () => {
    if (!filteredReadyDiamonds.length) return;
    const rows = filteredReadyDiamonds.map((d) => ({
      'Barcode': d.barcode,
      'Company': d.companyName,
      'Code': d.companyCode,
      'Shape': d.shape || d.size || '-',
      'Orig Weight (ct)': d.weight,
      'Actual Weight (ct)': d.actualWeight,
      'Worker': d.assignedWorkerName,
      'Verified Date': d.verifiedDate,
      'Status': d.status
    }));
    exportToCSV(`Ready_For_Company_Submission_${new Date().toISOString().split('T')[0]}`, rows);
  };

  // Print Challan
  const triggerPrintChallan = () => {
    window.print();
  };

  // Human-readable date formatter (e.g. "18 Oct 2026")
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const parts = String(dateStr).split('T')[0].split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const [y, m, d] = parts;
        const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        return date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <PrivateLayout title="Company Diamond Submission & Return">
      {/* Top Header Card */}
      <div className="card card-custom p-3 p-md-4 mb-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-navy text-white px-2.5 py-1 rounded">Outward Module</span>
              <span className="text-muted small">|</span>
              <span className="text-secondary small fw-medium">Finished Goods Delivery Challan Console</span>
            </div>
            <h4 className="font-heading fw-bold text-navy mb-1" style={{ color: '#0A192F' }}>
              Company Diamond Submission & Return
            </h4>
            <p className="text-muted small mb-0">
              Submit finished & QC-verified diamonds back to client companies, generate outward delivery challans, and maintain date-by-date dispatch logs.
            </p>
          </div>

          {/* Module Tab Switcher */}
          <div
            className="d-flex p-1 rounded-3 border flex-shrink-0 align-self-start align-self-md-auto"
            style={{ backgroundColor: '#F1F5F9' }}
          >
            <button
              type="button"
              className={`btn btn-sm px-3.5 py-2 fw-semibold transition-all ${
                activeTab === 'ready'
                  ? 'btn-navy text-white shadow-sm'
                  : 'text-secondary border-0 bg-transparent'
              }`}
              style={{
                borderRadius: '6px',
                border: activeTab === 'ready' ? '1px solid #D4AF37' : '1px solid transparent'
              }}
              onClick={() => setActiveTab('ready')}
            >
              <PackageCheck size={16} className={activeTab === 'ready' ? 'text-warning me-1.5' : 'text-muted me-1.5'} />
              <span>Ready for Submission</span>
              <span
                className="badge rounded-pill ms-2 px-2 py-0.5 font-monospace"
                style={{
                  backgroundColor: activeTab === 'ready' ? '#D4AF37' : '#E2E8F0',
                  color: activeTab === 'ready' ? '#0A192F' : '#475569',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                {completedDiamonds.length}
              </span>
            </button>
            <button
              type="button"
              className={`btn btn-sm px-3.5 py-2 fw-semibold transition-all ${
                activeTab === 'history'
                  ? 'btn-navy text-white shadow-sm'
                  : 'text-secondary border-0 bg-transparent'
              }`}
              style={{
                borderRadius: '6px',
                border: activeTab === 'history' ? '1px solid #D4AF37' : '1px solid transparent'
              }}
              onClick={() => setActiveTab('history')}
            >
              <Calendar size={16} className={activeTab === 'history' ? 'text-warning me-1.5' : 'text-muted me-1.5'} />
              <span>Date-by-Date History</span>
              <span
                className="badge rounded-pill ms-2 px-2 py-0.5 font-monospace"
                style={{
                  backgroundColor: activeTab === 'history' ? '#D4AF37' : '#E2E8F0',
                  color: activeTab === 'history' ? '#0A192F' : '#475569',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                {dispatches.length}
              </span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="row g-2.5 g-md-3 mt-3 pt-3 border-top">
          <div className="col-6 col-lg-3">
            <div className="p-3 rounded-3 bg-white border shadow-xs h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                  Ready to Return
                </span>
                <div className="p-1.5 rounded-2 bg-primary bg-opacity-10 text-primary">
                  <PackageCheck size={18} />
                </div>
              </div>
              <div>
                <h4 className="font-heading fw-bold text-navy mb-0">
                  {overallMetrics.readyCount} <span className="small fs-6 fw-normal text-muted">pcs</span>
                </h4>
                <div className="text-secondary small mt-1" style={{ fontSize: '0.78rem' }}>
                  Est. Weight: <strong className="text-dark">{readyCalculations.actualWeight} ct</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="p-3 rounded-3 bg-white border shadow-xs h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                  Returned to Companies
                </span>
                <div className="p-1.5 rounded-2 bg-success bg-opacity-10 text-success">
                  <Truck size={18} />
                </div>
              </div>
              <div>
                <h4 className="font-heading fw-bold text-success mb-0">
                  {overallMetrics.returnedCount} <span className="small fs-6 fw-normal text-muted">pcs</span>
                </h4>
                <div className="text-secondary small mt-1" style={{ fontSize: '0.78rem' }}>
                  Rough Inward: <strong className="text-dark">{overallMetrics.returnedOrigWeight} ct</strong>
                </div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Handed (Polished): <strong className="text-success">{overallMetrics.returnedWeight} ct</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="p-3 rounded-3 bg-white border shadow-xs h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                  Pending Clients
                </span>
                <div className="p-1.5 rounded-2 bg-warning bg-opacity-10 text-warning">
                  <Building2 size={18} />
                </div>
              </div>
              <div>
                <h4 className="font-heading fw-bold text-navy mb-0">
                  {overallMetrics.distinctCompaniesPending} <span className="small fs-6 fw-normal text-muted">Clients</span>
                </h4>
                <div className="text-secondary small mt-1" style={{ fontSize: '0.78rem' }}>
                  Awaiting batch return
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="p-3 rounded-3 bg-white border shadow-xs h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                  Dispatch Challans
                </span>
                <div className="p-1.5 rounded-2" style={{ backgroundColor: '#FEF9C3', color: '#B45309' }}>
                  <FileText size={18} />
                </div>
              </div>
              <div>
                <h4 className="font-heading fw-bold text-navy mb-0">
                  {overallMetrics.totalDispatches} <span className="small fs-6 fw-normal text-muted">Challans</span>
                </h4>
                <div className="text-secondary small mt-1" style={{ fontSize: '0.78rem' }}>
                  Logged date-by-date
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: READY FOR SUBMISSION (FINISHED GOODS AWAITING COMPANY RETURN)      */}
      {/* ========================================================================= */}
      {activeTab === 'ready' && (
        <div className="card card-custom p-3 p-md-4 shadow-sm mb-4">
          {/* Filter Toolbar */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 pb-3 border-bottom">
            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Company Filter Dropdown */}
              <div style={{ minWidth: '220px' }}>
                <select
                  className="form-select form-select-sm"
                  value={selectedCompanyFilter}
                  onChange={(e) => {
                    setSelectedCompanyFilter(e.target.value);
                    setSelectedBarcodes([]); // Reset selection when changing company filter
                  }}
                >
                  <option value="">-- All Client Companies --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Barcode / Worker Search */}
              <div className="position-relative" style={{ minWidth: '200px' }}>
                <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted" />
                <input
                  type="text"
                  className="form-control form-control-sm ps-5"
                  placeholder="Search barcode / artisan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Quick Select All Button */}
              {filteredReadyDiamonds.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleSelectAllFiltered}
                >
                  {selectedBarcodes.length === filteredReadyDiamonds.length ? 'Deselect All' : `Select All (${filteredReadyDiamonds.length})`}
                </button>
              )}
            </div>

            {/* Right Action: Export CSV & Submit Action */}
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleExportReadyCSV}
                disabled={filteredReadyDiamonds.length === 0}
                title="Export this list to CSV"
              >
                <Download size={14} className="me-1" /> Export CSV
              </button>

              <button
                type="button"
                className="btn btn-gold px-3.5 py-1.5 fw-semibold shadow-sm"
                onClick={handleOpenSubmissionModal}
                disabled={selectedBarcodes.length === 0}
              >
                <Truck size={16} className="me-1.5" />
                <span>Submit to Company ({selectedBarcodes.length})</span>
              </button>
            </div>
          </div>

          {/* Diamonds Table */}
          <div className="table-responsive rounded border mb-3">
            <table className="table table-custom table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '40px' }} className="text-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={filteredReadyDiamonds.length > 0 && selectedBarcodes.length === filteredReadyDiamonds.length}
                      onChange={handleSelectAllFiltered}
                      title="Select / Deselect All"
                    />
                  </th>
                  <th>Barcode</th>
                  <th>Client Company</th>
                  <th>Shape</th>
                  <th>Received Wt (ct)</th>
                  <th>Polished Wt (ct)</th>
                  <th>Loss / Yield</th>
                  <th>Artisan Worker</th>
                  <th>Verified Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReadyDiamonds.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5 text-muted">
                      <PackageCheck size={40} className="text-secondary opacity-40 mb-2" />
                      <h6 className="fw-semibold text-secondary">No completed diamonds pending company return.</h6>
                      <small>
                        {selectedCompanyFilter
                          ? 'No finished diamonds found for this specific company.'
                          : 'When diamonds pass QC verification in "Deposit & QC Verify", they will automatically appear here.'}
                      </small>
                    </td>
                  </tr>
                ) : (
                  filteredReadyDiamonds.map((d) => {
                    const isSelected = selectedBarcodes.includes(d.barcode);
                    const origW = parseFloat(d.weight) || 0;
                    const actW = parseFloat(d.actualWeight || d.weight) || 0;
                    const diffW = actW - origW;

                    return (
                      <tr
                        key={d.id}
                        className={isSelected ? 'table-warning bg-opacity-25' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleToggleSelectBarcode(d.barcode)}
                      >
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isSelected}
                            onChange={() => handleToggleSelectBarcode(d.barcode)}
                          />
                        </td>
                        <td>
                          <span className="font-heading fw-bold text-navy fs-6">{d.barcode}</span>
                          {d.roughCutNo ? (
                            <div className="mt-0.5">
                              <span
                                className="badge font-mono rounded-pill px-2 py-0.5"
                                style={{
                                  backgroundColor: '#F1F5F9',
                                  color: '#334155',
                                  border: '1px solid #CBD5E1',
                                  fontSize: '0.7rem'
                                }}
                              >
                                Rough: #{d.roughCutNo}
                              </span>
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <span className="fw-semibold text-dark">{d.companyName}</span>
                          <span className="badge bg-light text-navy border ms-2">{d.companyCode}</span>
                        </td>
                        <td className="small">{d.shape || d.size || '-'}</td>
                        <td className="small text-muted">{origW.toFixed(3)} ct</td>
                        <td className="fw-bold text-navy">{actW.toFixed(3)} ct</td>
                        <td className="small">
                          <span className={diffW <= 0 ? 'text-danger' : 'text-success'}>
                            {diffW > 0 ? `+${diffW.toFixed(3)}` : diffW.toFixed(3)} ct
                          </span>
                        </td>
                        <td className="small fw-medium text-dark">{d.assignedWorkerName || '-'}</td>
                        <td className="small text-muted">{formatDisplayDate(d.verifiedDate || d.completedDate)}</td>
                        <td>
                          <Badge status={d.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* CRITICAL USER REQUIREMENT: Total Calculation of Completed Diamonds in Last List */}
              {filteredReadyDiamonds.length > 0 && (
                <tfoot style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #CBD5E1' }}>
                  <tr className="fw-bold text-navy">
                    <td colSpan="2" className="py-2.5 text-uppercase small text-muted">
                      Total In List ({readyCalculations.count} Diamonds)
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td className="text-muted">{readyCalculations.origWeight.toFixed(3)} ct</td>
                    <td className="text-navy fs-6">{readyCalculations.actualWeight.toFixed(3)} ct</td>
                    <td className={readyCalculations.diffWeight <= 0 ? 'text-danger' : 'text-success'}>
                      {readyCalculations.diffWeight > 0 ? `+${readyCalculations.diffWeight.toFixed(3)}` : readyCalculations.diffWeight.toFixed(3)} ct ({readyCalculations.yieldPercentage}%)
                    </td>
                    <td colSpan="3" className="text-end text-muted small pe-3">
                      Total Calculation of Completed Diamonds
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* CRITICAL BOTTOM SUMMARY & SELECTION CALCULATION BAR */}
          {filteredReadyDiamonds.length > 0 && (
            <div className="p-3 bg-light rounded-3 border d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div className="d-flex flex-wrap align-items-center gap-3">
                <div>
                  <span className="small text-muted d-block" style={{ fontSize: '0.72rem' }}>Selected Diamonds</span>
                  <strong className="font-heading text-navy fs-6">{selectedCalculations.count} Diamonds</strong>
                </div>
                <div className="vr d-none d-sm-block my-1" />
                <div>
                  <span className="small text-muted d-block" style={{ fontSize: '0.72rem' }}>Original Weight</span>
                  <strong className="text-muted">{selectedCalculations.origWeight.toFixed(3)} ct</strong>
                </div>
                <div className="vr d-none d-sm-block my-1" />
                <div>
                  <span className="small text-muted d-block" style={{ fontSize: '0.72rem' }}>Final Polished Weight</span>
                  <strong className="text-navy">{selectedCalculations.actualWeight.toFixed(3)} ct</strong>
                </div>
                <div className="vr d-none d-sm-block my-1" />
                <div>
                  <span className="small text-muted d-block" style={{ fontSize: '0.72rem' }}>Weight Difference</span>
                  <strong className={selectedCalculations.diffWeight <= 0 ? 'text-danger' : 'text-success'}>
                    {selectedCalculations.diffWeight > 0 ? `+${selectedCalculations.diffWeight.toFixed(3)}` : selectedCalculations.diffWeight.toFixed(3)} ct
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-gold px-4 py-2 font-heading fw-semibold shadow-sm text-nowrap"
                onClick={handleOpenSubmissionModal}
                disabled={selectedBarcodes.length === 0}
              >
                <Truck size={17} className="me-2" />
                <span>Confirm & Submit {selectedBarcodes.length} Diamonds to Company</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DATE-BY-DATE SUBMISSION & OUTWARD HISTORY (USER'S KEY EMPHASIS)    */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="card card-custom p-3 p-md-4 shadow-sm mb-4">
          {/* History Filters Toolbar */}
          <div className="row g-2.5 mb-3 pb-3 border-bottom align-items-end">
            <div className="col-12 col-md-4 col-lg-3">
              <label className="form-label small fw-semibold text-muted mb-1">Filter by Company</label>
              <select
                className="form-select form-select-sm"
                value={historyCompanyFilter}
                onChange={(e) => setHistoryCompanyFilter(e.target.value)}
              >
                <option value="">-- All Companies --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={historyFromDate}
                onChange={(e) => setHistoryFromDate(e.target.value)}
              />
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <label className="form-label small fw-semibold text-muted mb-1">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={historyToDate}
                onChange={(e) => setHistoryToDate(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-2 col-lg-5 text-md-end mt-2 mt-md-0">
              <div className="d-flex flex-wrap justify-content-md-end gap-2">
                {(historyCompanyFilter || historyFromDate || historyToDate) && (
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setHistoryCompanyFilter('');
                      setHistoryFromDate('');
                      setHistoryToDate('');
                    }}
                  >
                    Reset Filters
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success fw-semibold px-3 py-1.5 shadow-xs d-inline-flex align-items-center"
                  onClick={handleExportHistoryExcel}
                  disabled={filteredDispatches.length === 0}
                  title="Download Comprehensive Excel Report (Total delivery data, every company and date)"
                >
                  <FileSpreadsheet size={15} className="me-1.5 text-success" />
                  <span>Download Delivery Excel</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-2.5 py-1.5 d-inline-flex align-items-center"
                  onClick={handleExportHistoryCSV}
                  disabled={filteredDispatches.length === 0}
                  title="Export Raw CSV File"
                >
                  <Download size={14} className="me-1" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* History Calculation Summary Row */}
          <div className="p-3 rounded-3 border mb-3 bg-white shadow-xs d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 me-3"
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: '#0A192F',
                  color: '#D4AF37',
                  boxShadow: '0 2px 6px rgba(10, 25, 47, 0.2)'
                }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <h6 className="fw-bold text-navy mb-0 font-heading">
                  Date-by-Date Dispatch Record Log
                </h6>
                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                  Chronological delivery log of verified finished goods handed over to client companies
                </span>
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="d-flex align-items-center gap-2 px-3 py-1.5 bg-light rounded-2 border">
                <span className="text-muted small">Total Returned:</span>
                <strong className="text-navy font-heading">{historyCalculations.totalPieces} pcs</strong>
              </div>
              <div className="d-flex align-items-center gap-2 px-3 py-1.5 bg-light rounded-2 border">
                <span className="text-muted small">Handed Weight:</span>
                <strong className="text-navy font-heading">{historyCalculations.totalActualWeight.toFixed(3)} ct</strong>
              </div>
              <span className="badge bg-navy text-white px-2.5 py-2 font-monospace" style={{ fontSize: '0.75rem' }}>
                {historyCalculations.dispatchesCount} Batches Found
              </span>
            </div>
          </div>

          {/* Date-by-Date Dispatches Accordion / Cards */}
          {filteredDispatches.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-3 border text-muted shadow-xs">
              <Truck size={42} className="text-secondary opacity-40 mb-2" />
              <h6 className="fw-semibold text-secondary">No submission history found.</h6>
              <small>When diamonds are submitted in Tab 1, full date-by-date delivery history will be archived here.</small>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredDispatches.map((dp) => {
                const isExpanded = expandedDispatchId === dp.id;

                return (
                  <div
                    key={dp.id}
                    className="card rounded-3 overflow-hidden shadow-xs border transition-all"
                    style={{
                      borderColor: isExpanded ? '#0A192F' : '#E2E8F0',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    {/* Header bar for dispatch batch */}
                    <div
                      className="p-3 bg-white d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedDispatchId(isExpanded ? null : dp.id)}
                    >
                      {/* Left: Icon, Challan ID, Company, Status, Subtitle */}
                      <div className="d-flex align-items-center gap-3">
                        {/* Luxury Icon Tile */}
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: '44px',
                            height: '44px',
                            background: 'linear-gradient(135deg, #0A192F 0%, #172A45 100%)',
                            color: '#D4AF37',
                            boxShadow: '0 2px 6px rgba(10, 25, 47, 0.2)'
                          }}
                        >
                          <FileText size={20} />
                        </div>

                        {/* Text Group */}
                        <div className="d-flex flex-column gap-1">
                          {/* Top row: Challan No, Company Badge, Status Badge */}
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="font-heading fw-bold text-navy fs-6 tracking-wide font-monospace">
                              {dp.challanNo}
                            </span>
                            <span
                              className="badge rounded-2 px-2.5 py-1"
                              style={{
                                backgroundColor: '#F1F5F9',
                                color: '#0A192F',
                                border: '1px solid #CBD5E1',
                                fontWeight: 600,
                                fontSize: '0.78rem'
                              }}
                            >
                              <Building2 size={12} className="me-1 opacity-75 inline" />
                              {dp.companyName}
                              <span className="text-muted ms-1">({dp.companyCode})</span>
                            </span>
                            <span
                              className="badge rounded-2 px-2.5 py-1 bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                              style={{ fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              <CheckCircle2 size={12} className="me-1 inline" /> Delivered to Client
                            </span>
                          </div>

                          {/* Subtitle row: Formatted Date, Receiver, Dispatched By */}
                          <div className="d-flex flex-wrap align-items-center gap-2 text-secondary small" style={{ fontSize: '0.78rem' }}>
                            <span className="d-inline-flex align-items-center gap-1 fw-medium text-dark">
                              <Calendar size={13} className="text-navy" />
                              {formatDisplayDate(dp.dispatchDate)}
                            </span>
                            <span className="text-muted opacity-50">•</span>
                            <span className="d-inline-flex align-items-center gap-1 text-muted">
                              <UserCheck size={13} className="text-secondary" />
                              Receiver: <strong className="text-navy fw-semibold">{dp.receiverName || 'Client Representative'}</strong>
                            </span>
                            {dp.dispatchedBy && (
                              <>
                                <span className="text-muted opacity-50">•</span>
                                <span className="text-muted">
                                  By: <span className="text-dark">{dp.dispatchedBy}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Metrics & Actions */}
                      <div
                        className="d-flex align-items-center justify-content-between justify-content-lg-end gap-2 gap-sm-3 flex-shrink-0 pt-2 pt-lg-0 border-top border-lg-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Metrics Chip */}
                        <div
                          className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-3 border"
                          style={{ backgroundColor: '#F8FAFC' }}
                        >
                          <div className="text-end">
                            <span className="text-uppercase text-muted d-block fw-semibold" style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}>
                              Returned Weight
                            </span>
                            <span className="font-heading fw-bold text-navy" style={{ fontSize: '0.95rem' }}>
                              {parseFloat(dp.totalActualWeight || 0).toFixed(3)}{' '}
                              <span className="small text-muted fw-normal" style={{ fontSize: '0.72rem' }}>ct</span>
                            </span>
                          </div>
                          <span
                            className="badge rounded-pill px-2 py-1 font-monospace"
                            style={{ backgroundColor: '#0A192F', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 600 }}
                          >
                            {dp.diamondsCount} pcs
                          </span>
                        </div>

                        {/* Print Slip Button */}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-navy px-3 py-1.5 fw-semibold d-inline-flex align-items-center"
                          onClick={() => setPrintableDispatch(dp)}
                          title="Print Official Delivery Challan"
                        >
                          <Printer size={14} className="me-1.5 text-navy" />
                          <span>Print Slip</span>
                        </button>

                        {/* Accordion Toggle */}
                        <button
                          type="button"
                          className={`btn btn-sm px-2.5 py-1.5 fw-semibold d-inline-flex align-items-center ${
                            isExpanded ? 'btn-navy text-white shadow-xs' : 'btn-light border text-secondary'
                          }`}
                          onClick={() => setExpandedDispatchId(isExpanded ? null : dp.id)}
                          title={isExpanded ? 'Collapse Diamond List' : 'View Dispatched Diamonds'}
                        >
                          <span className="small me-1">{isExpanded ? 'Close' : 'View Diamonds'}</span>
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Barcodes Table */}
                    {isExpanded && (
                      <div className="p-3 bg-light bg-opacity-50 border-top">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2.5">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-navy text-white px-2 py-0.5 rounded font-monospace" style={{ fontSize: '0.72rem' }}>
                              BATCH DETAILS
                            </span>
                            <span className="small fw-semibold text-secondary">
                              Dispatched Diamond Barcodes & Spec Details:
                            </span>
                          </div>
                          <span className="small text-muted">
                            Receiver: <strong>{dp.receiverName}</strong> | Dispatched by: {dp.dispatchedBy}
                          </span>
                        </div>

                        <div className="table-responsive rounded border bg-white">
                          <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                            <thead className="table-light">
                              <tr>
                                <th>#</th>
                                <th>Barcode</th>
                                <th>Shape</th>
                                <th>Orig Wt (ct)</th>
                                <th>Finished Wt (ct)</th>
                                <th>Loss (ct)</th>
                                <th>Finished Artisan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(dp.diamonds || []).map((dSnap, idx) => (
                                <tr key={dSnap.id || idx}>
                                  <td>{idx + 1}</td>
                                  <td>
                                    <span className="font-heading fw-bold text-navy font-monospace">{dSnap.barcode}</span>
                                  </td>
                                  <td>{dSnap.shape || dSnap.size || '-'}</td>
                                  <td className="text-muted">{parseFloat(dSnap.weight || 0).toFixed(3)} ct</td>
                                  <td className="fw-bold text-navy">{parseFloat(dSnap.actualWeight || 0).toFixed(3)} ct</td>
                                  <td className="text-danger">
                                    {(parseFloat(dSnap.actualWeight || 0) - parseFloat(dSnap.weight || 0)).toFixed(3)} ct
                                  </td>
                                  <td>{dSnap.workerName || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="table-light fw-bold">
                              <tr>
                                <td colSpan="3" className="text-uppercase small text-muted">
                                  Batch Total ({dp.diamondsCount} Diamonds)
                                </td>
                                <td className="text-muted">{dp.totalOriginalWeight} ct</td>
                                <td className="text-navy">{dp.totalActualWeight} ct</td>
                                <td className="text-danger">
                                  {(dp.totalActualWeight - dp.totalOriginalWeight).toFixed(3)} ct
                                </td>
                                <td>-</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {dp.remarks && (
                          <div className="mt-2.5 p-2.5 bg-white rounded-2 border d-flex align-items-center gap-2 text-muted small">
                            <FileText size={15} className="text-warning flex-shrink-0" />
                            <span><strong>Packaging / Seal Remarks:</strong> {dp.remarks}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM SUBMISSION & GENERATE OUTWARD CHALLAN                       */}
      {/* ========================================================================= */}
      {isSubmitModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(7, 18, 36, 0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-navy text-white py-3">
                <div className="d-flex align-items-center gap-2">
                  <Truck size={20} className="text-warning" />
                  <h5 className="modal-title font-heading fw-bold mb-0">
                    Confirm Diamond Submission & Return
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsSubmitModalOpen(false)}
                  disabled={isSubmitting}
                />
              </div>

              <form onSubmit={handleConfirmSubmission}>
                <div className="modal-body p-4">
                  {/* Summary Card */}
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="row g-2">
                      <div className="col-sm-6">
                        <small className="text-muted d-block">Selected Diamonds to Return:</small>
                        <strong className="font-heading text-navy fs-5">
                          {selectedCalculations.count} Diamonds
                        </strong>
                      </div>
                      <div className="col-sm-6">
                        <small className="text-muted d-block">Total Polished Carat Weight:</small>
                        <strong className="font-heading text-navy fs-5">
                          {selectedCalculations.actualWeight.toFixed(3)} ct
                        </strong>
                        <span className="small text-muted ms-2">
                          (Orig: {selectedCalculations.origWeight.toFixed(3)} ct)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">
                        Delivery Challan / Slip No *
                      </label>
                      <input
                        type="text"
                        className="form-control font-monospace fw-bold"
                        value={challanNo}
                        onChange={(e) => setChallanNo(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">
                        Submission / Dispatch Date *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={submissionDate}
                        onChange={(e) => setSubmissionDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-navy">
                        Handed Over To / Company Representative *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Mr. Rajesh Mehta (Company Courier / Manager)"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-navy">
                        Security Seal / Packaging Notes (Optional)
                      </label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Enter seal box barcode, tamper-proof pouch number, or notes..."
                        value={packagingRemarks}
                        onChange={(e) => setPackagingRemarks(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Selected Barcodes List Chips */}
                  <div className="mt-3">
                    <small className="text-muted fw-semibold d-block mb-1">
                      Included Barcodes ({selectedBarcodes.length}):
                    </small>
                    <div className="d-flex flex-wrap gap-1.5 p-2 bg-white rounded border" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                      {selectedBarcodes.map((b) => (
                        <span key={b} className="badge bg-light text-navy border font-monospace">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2.5">
                  <button
                    type="button"
                    className="btn btn-light border px-4"
                    onClick={() => setIsSubmitModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-gold px-4 fw-semibold shadow-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Generating Challan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} className="me-2" /> Confirm & Submit to Company
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE OFFICIAL DELIVERY CHALLAN SLIP                           */}
      {/* ========================================================================= */}
      {printableDispatch && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(7, 18, 36, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-navy text-white py-2.5 d-print-none">
                <h6 className="modal-title font-heading fw-bold mb-0">Official Delivery Challan Print Preview</h6>
                <div className="d-flex align-items-center gap-2">
                  <button type="button" className="btn btn-sm btn-gold" onClick={triggerPrintChallan}>
                    <Printer size={15} className="me-1" /> Print Official Slip
                  </button>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setPrintableDispatch(null)} />
                </div>
              </div>

              {/* Printable Document Body */}
              <div className="modal-body p-4 p-sm-5 bg-white text-dark printable-challan-content">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
                  <div>
                    <h3 className="font-heading fw-bold text-navy mb-0" style={{ color: '#0A192F', letterSpacing: '-0.02em' }}>
                      DIVY IMPEX
                    </h3>
                    <p className="text-secondary small mb-0">Diamond Manufacturing & Precision Polishing</p>
                    <small className="text-muted">Surat Special Economic Zone, Gujarat, India</small>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-navy text-white px-3 py-1 mb-1 font-heading text-uppercase">
                      Delivery Challan
                    </span>
                    <h5 className="font-heading fw-bold text-navy mb-0">{printableDispatch.challanNo}</h5>
                    <small className="text-muted">Date: {formatDisplayDate(printableDispatch.dispatchDate)}</small>
                  </div>
                </div>

                {/* Company & Handover Info */}
                <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">
                  <div className="col-6">
                    <small className="text-muted d-block">Submitted To Client Company:</small>
                    <strong className="fs-6 text-navy">{printableDispatch.companyName}</strong>
                    <span className="badge bg-white text-navy border ms-2">{printableDispatch.companyCode}</span>
                  </div>
                  <div className="col-6 text-end">
                    <small className="text-muted d-block">Handed Over To / Representative:</small>
                    <strong className="fs-6 text-navy">{printableDispatch.receiverName}</strong>
                    <small className="d-block text-muted">Authorized Dispatcher: {printableDispatch.dispatchedBy}</small>
                  </div>
                </div>

                {/* Diamonds List Table */}
                <table className="table table-bordered table-sm align-middle mb-4" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Barcode</th>
                      <th>Shape</th>
                      <th>Original Wt</th>
                      <th>Polished Wt</th>
                      <th>Weight Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(printableDispatch.diamonds || []).map((dSnap, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className="font-monospace fw-bold">{dSnap.barcode}</td>
                        <td>{dSnap.shape || dSnap.size || '-'}</td>
                        <td>{parseFloat(dSnap.weight || 0).toFixed(3)} ct</td>
                        <td className="fw-bold">{parseFloat(dSnap.actualWeight || 0).toFixed(3)} ct</td>
                        <td>{(parseFloat(dSnap.actualWeight || 0) - parseFloat(dSnap.weight || 0)).toFixed(3)} ct</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light fw-bold">
                    <tr>
                      <td colSpan="3" className="text-uppercase">Total Returned ({printableDispatch.diamondsCount} Pcs)</td>
                      <td>{printableDispatch.totalOriginalWeight} ct</td>
                      <td className="text-navy">{printableDispatch.totalActualWeight} ct</td>
                      <td className="text-danger">
                        {(printableDispatch.totalActualWeight - printableDispatch.totalOriginalWeight).toFixed(3)} ct
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures */}
                <div className="row mt-5 pt-4 text-center">
                  <div className="col-6">
                    <div className="border-top pt-2 mx-auto" style={{ maxWidth: '200px' }}>
                      <small className="fw-bold d-block">Dispatched By</small>
                      <small className="text-muted">(DIVY IMPEX Authority)</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border-top pt-2 mx-auto" style={{ maxWidth: '200px' }}>
                      <small className="fw-bold d-block">Received By</small>
                      <small className="text-muted">({printableDispatch.companyName} Rep)</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light py-2.5 d-print-none">
                <button type="button" className="btn btn-light border px-4" onClick={() => setPrintableDispatch(null)}>
                  Close
                </button>
                <button type="button" className="btn btn-gold px-4 fw-semibold" onClick={triggerPrintChallan}>
                  <Printer size={15} className="me-1.5" /> Print Delivery Challan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PrivateLayout>
  );
};

export default CompanySubmission;
