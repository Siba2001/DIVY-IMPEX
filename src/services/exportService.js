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

  // Auto-fit column widths so data is never squashed in Google Sheets / Excel
  const keys = Object.keys(rows[0]);
  ws['!cols'] = keys.map((key) => {
    const maxLen = rows.reduce((max, r) => {
      const val = r[key] !== null && r[key] !== undefined ? String(r[key]) : '';
      return Math.max(max, val.length);
    }, key.length);
    return { wch: Math.max(maxLen + 3, 12) };
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Report_Data');
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
  const matrixAoa = [
    ['DIVY IMPEX — DIAMOND MANAGEMENT SYSTEM'],
    ['MONTHLY STOCK & SHAPE MATRIX LEDGER'],
    [
      `Client Company: ${companyName}   |   Date Scope: ${fromDate || 'All Time'} to ${toDate || 'Present'}   |   Generated: ${new Date().toLocaleDateString('en-GB')}`
    ],
    [], // Blank visual separator
    [
      'Sr No',
      'Date',
      'Total Pcs',
      ...shapes.map((s) => `${s.toUpperCase()} (Pcs / Carats)`),
      'Total Weight (ct)'
    ]
  ];

  rows.forEach((r, idx) => {
    matrixAoa.push([
      idx + 1,
      r.date,
      r.totalPcs,
      ...shapes.map((s) => {
        const shapeData = r.shapes[s];
        return shapeData ? `${shapeData.pcs} pcs / ${shapeData.weight.toFixed(3)} ct` : '—';
      }),
      parseFloat(r.totalWeight.toFixed(3))
    ]);
  });

  // Grand Total Summary Row
  matrixAoa.push([
    'TOTAL',
    'GRAND TOTAL SUMMARY',
    grandTotal.totalPcs || 0,
    ...shapes.map((s) => {
      const sTot = grandTotal.shapes ? grandTotal.shapes[s] : null;
      return sTot ? `${sTot.pcs} pcs / ${sTot.weight.toFixed(3)} ct` : '—';
    }),
    parseFloat((grandTotal.totalWeight || 0).toFixed(3))
  ]);

  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixAoa);
  const totalCols = 3 + shapes.length;
  wsMatrix['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols } }
  ];
  wsMatrix['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 16 }, // Date
    { wch: 14 }, // Total Pcs
    ...shapes.map(() => ({ wch: 25 })), // Shape columns
    { wch: 20 }  // Total Weight
  ];
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Monthly_Stock_Matrix');

  // 2. SHEET 2: ITEMIZED DIAMOND RECORDS
  const itemAoa = [
    ['DIVY IMPEX — DIAMOND MANAGEMENT SYSTEM'],
    ['DETAILED DIAMOND ITEMIZATION AUDIT REGISTER'],
    [
      `Company: ${companyName}   |   Total Diamonds: ${grandTotal.totalPcs || 0} pcs   |   Generated: ${new Date().toLocaleDateString('en-GB')}`
    ],
    [],
    [
      'Sr No',
      'Received Date',
      'Barcode Number',
      'Rough Cut No',
      'Client Company',
      'Diamond Shape',
      'Rough Weight (ct)',
      'Polished Weight (ct)',
      'Assigned Artisan',
      'Current Status'
    ]
  ];

  let itemIdx = 1;
  rows.forEach((r) => {
    (r.diamonds || []).forEach((d) => {
      itemAoa.push([
        itemIdx++,
        r.date,
        d.barcode,
        d.roughCutNo || '—',
        d.companyName,
        d.shape || d.size || 'Emeral',
        parseFloat((parseFloat(d.weight) || 0).toFixed(3)),
        d.targetWeight ? parseFloat((parseFloat(d.targetWeight) || 0).toFixed(3)) : '—',
        d.assignedWorkerName || 'Unassigned',
        d.status || 'Received'
      ]);
    });
  });

  const wsItems = XLSX.utils.aoa_to_sheet(itemAoa);
  wsItems['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }
  ];
  wsItems['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsItems, 'Itemized_Diamonds');

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Generates a clean, simple, and professional native Excel (.xlsx) workbook for Company Deliveries.
 * Includes cleanly separated sheets:
 * Sheet 1: "Delivery_Dispatches" - Chronological delivery register with corporate header and auto-fitted columns
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
  const dispatchAoa = [
    ['DIVY IMPEX — DIAMOND MANAGEMENT SYSTEM'],
    ['FINISHED GOODS DELIVERY & DISPATCH REGISTER'],
    [
      `Generated: ${new Date().toLocaleString('en-GB')}   |   Scope: ${filters.scope || 'All Active Delivery Logs'}   |   Batches: ${dispatches.length} Challans`
    ],
    [], // Blank separator
    [
      'Sr No',
      'Dispatch Date',
      'Challan No',
      'Company Name',
      'Company Code',
      'Receiver Representative',
      'Dispatched By',
      'Diamonds (pcs)',
      'Orig Weight (ct)',
      'Handed Weight (ct)',
      'Weight Loss (ct)',
      'Remarks / Seal',
      'Barcodes'
    ]
  ];

  dispatches.forEach((dp, idx) => {
    let origW = parseFloat(dp.totalOriginalWeight) || 0;
    const actW = parseFloat(dp.totalActualWeight) || 0;
    // Fallback if orig weight was unrecorded on legacy dispatches
    if (origW === 0 && actW > 0) origW = actW;
    const lossW = actW - origW;

    dispatchAoa.push([
      idx + 1,
      dp.dispatchDate,
      dp.challanNo,
      dp.companyName,
      dp.companyCode,
      dp.receiverName || '—',
      dp.dispatchedBy || '—',
      parseInt(dp.diamondsCount, 10) || 0,
      parseFloat(origW.toFixed(3)),
      parseFloat(actW.toFixed(3)),
      parseFloat(lossW.toFixed(3)),
      dp.remarks || '—',
      (dp.barcodes || []).join(', ')
    ]);
  });

  // Summary Totals Row
  const totOrig = parseFloat((overallTotals.totalOriginalWeight || 0).toFixed(3));
  const totAct = parseFloat((overallTotals.totalActualWeight || 0).toFixed(3));
  const totLoss = parseFloat((overallTotals.totalLoss || 0).toFixed(3));

  dispatchAoa.push([
    'TOTAL',
    'GRAND TOTAL',
    `${dispatches.length} Batches`,
    '',
    '',
    '',
    '',
    overallTotals.totalPieces || 0,
    totOrig > 0 ? totOrig : totAct,
    totAct,
    totLoss,
    'OFFICIAL DISPATCH REGISTER',
    ''
  ]);

  const wsDispatches = XLSX.utils.aoa_to_sheet(dispatchAoa);
  wsDispatches['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } }
  ];
  wsDispatches['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 16 }, // Dispatch Date
    { wch: 25 }, // Challan No
    { wch: 24 }, // Company Name
    { wch: 16 }, // Company Code
    { wch: 28 }, // Receiver Representative
    { wch: 22 }, // Dispatched By
    { wch: 16 }, // Diamonds (pcs)
    { wch: 18 }, // Orig Weight (ct)
    { wch: 20 }, // Handed Weight (ct)
    { wch: 18 }, // Weight Loss (ct)
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
