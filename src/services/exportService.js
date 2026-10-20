// Helper service for CSV, Native Excel (.xlsx), and Print Export
import * as XLSX from 'xlsx';

/**
 * Standard CSV Export
 */
export const exportToCSV = (filename, rows) => {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {}
    }, 1500);
  }
};

/**
 * Standard Native Excel (.xlsx) Export
 */
export const exportToExcel = (filename, rows) => {
  if (!rows || !rows.length) return;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Generates a native multi-sheet Excel (.xlsx) workbook for Company Shape-Wise Monthly Stock Matrix.
 * Sheet 1: "Monthly_Stock_Matrix" - Date-by-date matrix showing pieces and carats for each diamond shape
 * Sheet 2: "Itemized_Diamonds" - Full individual diamond records matching the matrix
 */
export const exportShapeMatrixExcel = (
  filename,
  { companyName = 'All Companies', fromDate = '', toDate = '', shapes = [], rows = [], grandTotal = {} }
) => {
  if (!rows || !rows.length) return;

  const wb = XLSX.utils.book_new();

  // 1. SHEET 1: MONTHLY STOCK SHAPE MATRIX
  const matrixRows = rows.map((r, idx) => {
    const rowObj = {
      'Sr No': idx + 1,
      'Date': r.date,
      'Total Pcs': r.totalPcs,
    };
    shapes.forEach((s) => {
      const shapeData = r.shapes[s];
      rowObj[`${s} (Pcs / Wt)`] = shapeData ? `${shapeData.pcs} / ${shapeData.weight.toFixed(3)} ct` : '-';
    });
    rowObj['Total Weight (ct)'] = parseFloat(r.totalWeight.toFixed(3));
    return rowObj;
  });

  // Grand Total Row
  const totalRow = {
    'Sr No': 'TOTAL',
    'Date': 'GRAND TOTAL',
    'Total Pcs': grandTotal.totalPcs || 0,
  };
  shapes.forEach((s) => {
    const sTot = grandTotal.shapes ? grandTotal.shapes[s] : null;
    totalRow[`${s} (Pcs / Wt)`] = sTot ? `${sTot.pcs} / ${sTot.weight.toFixed(3)} ct` : '-';
  });
  totalRow['Total Weight (ct)'] = parseFloat((grandTotal.totalWeight || 0).toFixed(3));
  matrixRows.push(totalRow);

  const wsMatrix = XLSX.utils.json_to_sheet(matrixRows);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Monthly_Stock_Matrix');

  // 2. SHEET 2: ITEMIZED DIAMOND RECORDS
  const itemRows = [];
  rows.forEach((r) => {
    (r.diamonds || []).forEach((d, dIdx) => {
      itemRows.push({
        'Date': r.date,
        'Barcode': d.barcode,
        'Rough Cut No': d.roughCutNo || '-',
        'Company': d.companyName,
        'Shape': d.shape || d.size || '-',
        'Weight (ct)': parseFloat((parseFloat(d.weight) || 0).toFixed(3)),
        'Polished Wt (ct)': d.targetWeight ? parseFloat((parseFloat(d.targetWeight) || 0).toFixed(3)) : '-',
        'Worker': d.assignedWorkerName || 'Unassigned',
        'Status': d.status || '-'
      });
    });
  });

  if (itemRows.length > 0) {
    const wsItems = XLSX.utils.json_to_sheet(itemRows);
    XLSX.utils.book_append_sheet(wb, wsItems, 'Itemized_Diamonds');
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Generates a clean, simple, and professional native Excel (.xlsx) workbook for Company Deliveries.
 * Includes cleanly separated sheets:
 * Sheet 1: "Delivery_Dispatches" - Chronological delivery register with auto-fitted columns
 * Sheet 2: "Company_Summary" - Delivery totals grouped by each client company
 * Sheet 3: "Executive_Totals" - Grand delivery statistics & yield metrics
 * Sheet 4: "Diamond_Itemization" - Full item-by-item barcode breakdown
 */
export const exportDispatchHistoryExcel = (
  filename,
  { dispatches = [], companySummary = [], overallTotals = {}, filters = {} }
) => {
  if (!dispatches || !dispatches.length) return;

  const wb = XLSX.utils.book_new();

  // 1. SHEET 1: DATE-BY-DATE DISPATCH REGISTER (Main Sheet)
  const dispatchRows = dispatches.map((dp, idx) => {
    const origW = parseFloat(dp.totalOriginalWeight) || 0;
    const actW = parseFloat(dp.totalActualWeight) || 0;
    const lossW = actW - origW;
    return {
      'Sr No': idx + 1,
      'Dispatch Date': dp.dispatchDate,
      'Challan No': dp.challanNo,
      'Company Name': dp.companyName,
      'Company Code': dp.companyCode,
      'Receiver Representative': dp.receiverName || '-',
      'Dispatched By': dp.dispatchedBy || '-',
      'Diamonds (pcs)': parseInt(dp.diamondsCount, 10) || 0,
      'Orig Weight (ct)': parseFloat(origW.toFixed(3)),
      'Handed Weight (ct)': parseFloat(actW.toFixed(3)),
      'Weight Loss (ct)': parseFloat(lossW.toFixed(3)),
      'Remarks / Seal': dp.remarks || '-',
      'Barcodes': (dp.barcodes || []).join(', ')
    };
  });

  // Add Summary Total Row to Sheet 1
  dispatchRows.push({
    'Sr No': 'TOTAL',
    'Dispatch Date': '',
    'Challan No': `${dispatches.length} Batches`,
    'Company Name': '',
    'Company Code': '',
    'Receiver Representative': '',
    'Dispatched By': '',
    'Diamonds (pcs)': overallTotals.totalPieces || 0,
    'Orig Weight (ct)': parseFloat((overallTotals.totalOriginalWeight || 0).toFixed(3)),
    'Handed Weight (ct)': parseFloat((overallTotals.totalActualWeight || 0).toFixed(3)),
    'Weight Loss (ct)': parseFloat((overallTotals.totalLoss || 0).toFixed(3)),
    'Remarks / Seal': '',
    'Barcodes': ''
  });

  const wsDispatches = XLSX.utils.json_to_sheet(dispatchRows);

  // Auto-fit column widths for Sheet 1
  wsDispatches['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 14 }, // Dispatch Date
    { wch: 22 }, // Challan No
    { wch: 22 }, // Company Name
    { wch: 14 }, // Company Code
    { wch: 24 }, // Receiver
    { wch: 20 }, // Dispatched By
    { wch: 16 }, // Diamonds (pcs)
    { wch: 18 }, // Orig Weight (ct)
    { wch: 18 }, // Handed Weight (ct)
    { wch: 16 }, // Weight Loss (ct)
    { wch: 25 }, // Remarks
    { wch: 35 }  // Barcodes
  ];

  XLSX.utils.book_append_sheet(wb, wsDispatches, 'Delivery_Dispatches');

  // 2. SHEET 2: EVERY COMPANY DELIVERY SUMMARY
  const companyRows = companySummary.map((c, idx) => ({
    'Sr No': idx + 1,
    'Company Name': c.name,
    'Company Code': c.code,
    'Total Challans': c.challansCount,
    'Total Diamonds (pcs)': c.diamondsCount,
    'Total Orig Weight (ct)': parseFloat(c.totalOrigWeight.toFixed(3)),
    'Handed Weight (ct)': parseFloat(c.totalActualWeight.toFixed(3)),
    'Net Weight Loss (ct)': parseFloat(c.loss.toFixed(3)),
    'Yield (%)': `${c.yieldPercentage}%`,
    'Status': 'DELIVERED'
  }));

  // Company totals row
  companyRows.push({
    'Sr No': 'TOTAL',
    'Company Name': `${companySummary.length} Companies`,
    'Company Code': '',
    'Total Challans': overallTotals.totalChallans || dispatches.length,
    'Total Diamonds (pcs)': overallTotals.totalPieces || 0,
    'Total Orig Weight (ct)': parseFloat((overallTotals.totalOriginalWeight || 0).toFixed(3)),
    'Handed Weight (ct)': parseFloat((overallTotals.totalActualWeight || 0).toFixed(3)),
    'Net Weight Loss (ct)': parseFloat((overallTotals.totalLoss || 0).toFixed(3)),
    'Yield (%)': `${overallTotals.yieldPercentage || '100.00'}%`,
    'Status': 'COMPLETED'
  });

  const wsCompany = XLSX.utils.json_to_sheet(companyRows);
  wsCompany['!cols'] = [
    { wch: 8 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsCompany, 'Company_Summary');

  // 3. SHEET 3: EXECUTIVE OVERALL TOTALS
  const summaryRows = [
    { 'Metric': 'Report Title', 'Value': 'DIVY IMPEX - FINISHED GOODS DELIVERY & DISPATCH AUDIT REPORT' },
    { 'Metric': 'Generated On', 'Value': new Date().toLocaleString('en-GB') },
    { 'Metric': 'Filter Scope', 'Value': filters.scope || 'All Active Delivery Logs' },
    { 'Metric': '', 'Value': '' },
    { 'Metric': 'Total Dispatch Challans Executed', 'Value': overallTotals.totalChallans || dispatches.length },
    { 'Metric': 'Total Finished Diamonds Handed Over', 'Value': `${overallTotals.totalPieces || 0} pcs` },
    { 'Metric': 'Total Original / Assigned Weight', 'Value': `${(overallTotals.totalOriginalWeight || 0).toFixed(3)} ct` },
    { 'Metric': 'Total Polished Weight Handed Over', 'Value': `${(overallTotals.totalActualWeight || 0).toFixed(3)} ct` },
    { 'Metric': 'Total Weight Difference / Loss', 'Value': `${(overallTotals.totalLoss || 0).toFixed(3)} ct` },
    { 'Metric': 'Overall Polishing Yield Rate', 'Value': `${overallTotals.yieldPercentage || '100.00'}%` },
    { 'Metric': 'Distinct Client Companies Served', 'Value': companySummary.length }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 38 },
    { wch: 45 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Totals');

  // 4. SHEET 4: ITEM-BY-ITEM INDIVIDUAL DIAMOND DETAILS
  const itemRows = [];
  let itemIdx = 1;
  dispatches.forEach((dp) => {
    (dp.diamonds || []).forEach((d) => {
      const orig = parseFloat(d.weight || 0);
      const act = parseFloat(d.actualWeight || 0);
      const loss = act - orig;
      itemRows.push({
        '#': itemIdx++,
        'Dispatch Date': dp.dispatchDate,
        'Challan No': dp.challanNo,
        'Diamond Barcode': d.barcode,
        'Client Company': `${dp.companyName} (${dp.companyCode})`,
        'Shape': d.shape || d.size || '-',
        'Orig Weight (ct)': parseFloat(orig.toFixed(3)),
        'Finished Weight (ct)': parseFloat(act.toFixed(3)),
        'Loss (ct)': parseFloat(loss.toFixed(3)),
        'Artisan Worker': d.workerName || '-',
        'Receiver Person': dp.receiverName || '-'
      });
    });
  });

  if (itemRows.length > 0) {
    const wsItems = XLSX.utils.json_to_sheet(itemRows);
    wsItems['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 22 },
      { wch: 16 },
      { wch: 24 },
      { wch: 10 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsItems, 'Diamond_Itemization');
  }

  // Write actual native .xlsx file (safely handled by SheetJS browser export)
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const triggerPrint = () => {
  window.print();
};
