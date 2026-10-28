// Helper service for CSV, Native Styled Excel (.xlsx), and Print Export
import XLSX from 'xlsx-js-style';

/**
 * Common Corporate Theme Palette & Style Definitions
 * Matching DIVY IMPEX branding and the reference corporate spreadsheet layout:
 * - Header Banner: Deep Navy (#0A192F) with bold white text
 * - Subtitle Banner: Dark Navy/Slate (#1E293B) with bold white text
 * - Metadata Strip: Slate Light Gray (#F1F5F9) with bold slate text
 * - Filter Strip: Off-white (#F8FAFC) with subtle slate text
 * - Table Column Headers: Deep Royal Blue (#1E40AF) with white bold text
 * - Total / Summary Footers: Light Gray (#F1F5F9) with bold navy text & top/double borders
 * - Data Rows: Clean borders with numbers right-aligned and codes centered
 */
const STYLES = {
  // Level 1: Main Title Banner (Navy fill, White text, Centered)
  titleBanner: {
    fill: { fgColor: { rgb: '0A192F' } },
    font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },
  // Level 2: Subtitle Banner (Secondary Navy fill)
  subtitleBanner: {
    fill: { fgColor: { rgb: '1E293B' } },
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },
  // Level 3: Metadata Row (Light background, Bold slate text)
  metadataStrip: {
    fill: { fgColor: { rgb: 'F1F5F9' } },
    font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '334155' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  },
  // Level 4: Applied Filter Row
  filterStrip: {
    fill: { fgColor: { rgb: 'F8FAFC' } },
    font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '475569' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  },
  // Level 5: Table Header Cells (Royal Blue fill, White bold text, bordered)
  tableHeader: {
    fill: { fgColor: { rgb: '1E40AF' } },
    font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'medium', color: { rgb: '0F172A' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }
  },
  // Data Cell Styles
  dataCellLeft: {
    font: { name: 'Calibri', sz: 10, color: { rgb: '0F172A' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } }
    }
  },
  dataCellCenter: {
    font: { name: 'Calibri', sz: 10, color: { rgb: '0F172A' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } }
    }
  },
  dataCellRight: {
    font: { name: 'Calibri', sz: 10, color: { rgb: '0F172A' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } }
    }
  },
  // Grand Total Summary Row
  summaryTotal: {
    fill: { fgColor: { rgb: 'F1F5F9' } },
    font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '0A192F' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'medium', color: { rgb: '0A192F' } },
      bottom: { style: 'double', color: { rgb: '0A192F' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }
  },
  summaryTotalLeft: {
    fill: { fgColor: { rgb: 'F1F5F9' } },
    font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '0A192F' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'medium', color: { rgb: '0A192F' } },
      bottom: { style: 'double', color: { rgb: '0A192F' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }
  },
  summaryTotalRight: {
    fill: { fgColor: { rgb: 'F1F5F9' } },
    font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '0A192F' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'medium', color: { rgb: '0A192F' } },
      bottom: { style: 'double', color: { rgb: '0A192F' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }
  }
};

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
 * Standard Native Excel (.xlsx) Export with Professional Executive Styling,
 * Automatic Grand Total Row (Total Diamonds, Original Weight, Actual Weight, Yield %), and A4 Layout.
 * Used across generic reports (Reports 2 - 9).
 */
export const exportToExcel = (filename, rows, options = {}) => {
  if (!rows || !rows.length) return;
  const wb = XLSX.utils.book_new();

  const keys = Object.keys(rows[0]);
  const totalCols = Math.max(keys.length - 1, 1);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const titleText = (options.title || filename.replace(/_/g, ' ')).toUpperCase();
  const metadataText = `Generated On: ${dateFormatted} ${timeFormatted}   |   Generated By: ${options.generatedBy || 'Admin Manager'}   |   Total Records: ${rows.length}`;
  const filterText = `Applied Filters: Scope: ${options.scope || 'All Active Records'}   |   Status: Production Audit`;

  const aoa = [
    [titleText],
    [metadataText],
    [filterText],
    [], // Blank Row
    keys // Table Header Row (Row index 4)
  ];

  // Detect numeric weight columns for calculation
  const origWeightColIdx = keys.findIndex((k) =>
    /orig.*weight|original.*weight/i.test(k)
  );
  const actWeightColIdx = keys.findIndex((k) =>
    /act.*weight|actual.*weight|finished.*weight|polished.*weight/i.test(k)
  );

  let sumOrigWeight = 0;
  let sumActWeight = 0;

  rows.forEach((r) => {
    aoa.push(
      keys.map((k, colIdx) => {
        const val = r[k] === null || r[k] === undefined ? '' : r[k];
        if (colIdx === origWeightColIdx) {
          sumOrigWeight += parseFloat(val) || 0;
        } else if (colIdx === actWeightColIdx) {
          sumActWeight += parseFloat(val) || 0;
        }
        return val;
      })
    );
  });

  // Append Grand Total Row at the end
  const totalRowIdx = aoa.length;
  const totalRow = keys.map((k, colIdx) => {
    if (colIdx === 0) return 'TOTAL';
    if (colIdx === 1) return `GRAND TOTAL (${rows.length} Diamonds)`;
    if (colIdx === origWeightColIdx) return parseFloat(sumOrigWeight.toFixed(3));
    if (colIdx === actWeightColIdx) return parseFloat(sumActWeight.toFixed(3));
    return '';
  });
  aoa.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merges for Header Rows
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols } }
  ];

  // Apply Styles to Cells
  // Row 0: Title Banner
  for (let c = 0; c <= totalCols; c++) {
    const ref = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = STYLES.titleBanner;
  }
  // Row 1: Metadata Strip
  for (let c = 0; c <= totalCols; c++) {
    const ref = XLSX.utils.encode_cell({ r: 1, c });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = STYLES.metadataStrip;
  }
  // Row 2: Filter Strip
  for (let c = 0; c <= totalCols; c++) {
    const ref = XLSX.utils.encode_cell({ r: 2, c });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = STYLES.filterStrip;
  }
  // Row 4: Table Headers
  for (let c = 0; c < keys.length; c++) {
    const ref = XLSX.utils.encode_cell({ r: 4, c });
    if (ws[ref]) {
      ws[ref].s = STYLES.tableHeader;
    }
  }

  // Row 5 to (totalRowIdx - 1): Data Rows
  for (let r = 5; r < totalRowIdx; r++) {
    for (let c = 0; c < keys.length; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (ws[ref]) {
        const val = ws[ref].v;
        const isNum = typeof val === 'number';
        ws[ref].s = isNum ? STYLES.dataCellRight : STYLES.dataCellLeft;
      }
    }
  }

  // Grand Total Row (Row totalRowIdx)
  for (let c = 0; c < keys.length; c++) {
    const ref = XLSX.utils.encode_cell({ r: totalRowIdx, c });
    if (ws[ref]) {
      if (c === origWeightColIdx || c === actWeightColIdx) {
        ws[ref].s = STYLES.summaryTotalRight;
      } else if (c === 1) {
        ws[ref].s = STYLES.summaryTotalLeft;
      } else {
        ws[ref].s = STYLES.summaryTotal;
      }
    }
  }

  // Column Widths
  ws['!cols'] = keys.map((key) => {
    const maxLen = rows.reduce((max, r) => {
      const val = r[key] !== null && r[key] !== undefined ? String(r[key]) : '';
      return Math.max(max, val.length);
    }, key.length);
    return { wch: Math.max(maxLen + 3, 14) };
  });

  // A4 Page Setup
  ws['!pageSetup'] = {
    paperSize: 9, // 9 = A4
    orientation: 'landscape',
    fitToWidth: 1,
    fitToHeight: 0
  };
  ws['!margins'] = {
    left: 0.4,
    right: 0.4,
    top: 0.5,
    bottom: 0.5,
    header: 0.3,
    footer: 0.3
  };

  XLSX.utils.book_append_sheet(wb, ws, 'Report_Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Generates a native multi-sheet Excel (.xlsx) workbook for Company Shape-Wise Monthly Stock Matrix.
 * Sheet 1: "Stock_Shape_Matrix" - Date-by-date matrix showing pieces and carats for each diamond shape
 * Sheet 2: "Diamond_Itemization" - Full individual diamond records matching the matrix with
 *                                  Grand Total Summary Row (Total Diamonds, Original Weight, Polished/Actual Weight, Weight Diff)
 * Formatted with executive colors and A4 landscape printing dimensions.
 */
export const exportShapeMatrixExcel = (
  filename,
  {
    companyName = 'All Companies',
    companyCode = '',
    fromDate = '',
    toDate = '',
    generatedBy = 'Admin Manager',
    shapes = [],
    rows = [],
    grandTotal = {}
  }
) => {
  if (!rows || !rows.length) return;

  const wb = XLSX.utils.book_new();

  // Filter out any dash or invalid shape names so columns are clean and valid
  const validShapes = (shapes || []).filter(
    (s) => s && String(s).trim() !== '-' && String(s).trim() !== ''
  );

  const totalColsIdx = Math.max(3 + validShapes.length, 5);

  // 1. SHEET 1: MONTHLY STOCK SHAPE MATRIX (Executive Corporate Design)
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const filterSummary = `Company: ${companyName}${companyCode ? ` (${companyCode})` : ''}   |   Date Scope: ${fromDate || 'Start'} to ${toDate || 'Present'}   |   Status: All Active Stock`;

  const matrixAoa = [
    // Row 0: Executive Corporate Banner
    ['DIVY IMPEX — MONTHLY STOCK & SHAPE MATRIX LEDGER'],
    // Row 1: Audit & Generation Metadata
    [
      `Generated On: ${dateFormatted} ${timeFormatted}   |   Generated By: ${generatedBy}   |   Total Diamonds: ${grandTotal.totalPcs || 0} pcs   |   Total Weight: ${(grandTotal.totalWeight || 0).toFixed(3)} ct`
    ],
    // Row 2: Applied Filter Parameters
    [
      `Applied Filters: ${filterSummary}`
    ],
    // Row 3: Blank spacing row
    [],
    // Row 4: Table Column Headers
    [
      'Sr No',
      'Date',
      'Total Pcs',
      ...validShapes.map((s) => `${s.toUpperCase()} (Pcs / Carats)`),
      'Total Weight (ct)'
    ]
  ];

  rows.forEach((r, idx) => {
    matrixAoa.push([
      idx + 1,
      r.date,
      r.totalPcs,
      ...validShapes.map((s) => {
        const shapeData = r.shapes ? r.shapes[s] : null;
        return shapeData && shapeData.pcs > 0
          ? `${shapeData.pcs} pcs / ${shapeData.weight.toFixed(3)} ct`
          : '—';
      }),
      parseFloat(r.totalWeight.toFixed(3))
    ]);
  });

  // Grand Total Summary Row
  const grandTotalRowIdx = matrixAoa.length;
  matrixAoa.push([
    'TOTAL',
    'GRAND TOTAL SUMMARY',
    grandTotal.totalPcs || 0,
    ...validShapes.map((s) => {
      const sTot = grandTotal.shapes ? grandTotal.shapes[s] : null;
      return sTot && sTot.pcs > 0 ? `${sTot.pcs} pcs / ${sTot.weight.toFixed(3)} ct` : '—';
    }),
    parseFloat((grandTotal.totalWeight || 0).toFixed(3))
  ]);

  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixAoa);

  // Merged top header banners
  wsMatrix['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalColsIdx } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalColsIdx } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: totalColsIdx } }
  ];

  // Apply Styles to Sheet 1 Cells
  // Row 0: Title Banner
  for (let c = 0; c <= totalColsIdx; c++) {
    const ref = XLSX.utils.encode_cell({ r: 0, c });
    if (!wsMatrix[ref]) wsMatrix[ref] = { t: 's', v: '' };
    wsMatrix[ref].s = STYLES.titleBanner;
  }
  // Row 1: Metadata Strip
  for (let c = 0; c <= totalColsIdx; c++) {
    const ref = XLSX.utils.encode_cell({ r: 1, c });
    if (!wsMatrix[ref]) wsMatrix[ref] = { t: 's', v: '' };
    wsMatrix[ref].s = STYLES.metadataStrip;
  }
  // Row 2: Filter Strip
  for (let c = 0; c <= totalColsIdx; c++) {
    const ref = XLSX.utils.encode_cell({ r: 2, c });
    if (!wsMatrix[ref]) wsMatrix[ref] = { t: 's', v: '' };
    wsMatrix[ref].s = STYLES.filterStrip;
  }
  // Row 4: Column Headers
  for (let c = 0; c <= totalColsIdx; c++) {
    const ref = XLSX.utils.encode_cell({ r: 4, c });
    if (wsMatrix[ref]) {
      wsMatrix[ref].s = STYLES.tableHeader;
    }
  }

  // Row 5 to (grandTotalRowIdx - 1): Data Rows
  for (let r = 5; r < grandTotalRowIdx; r++) {
    for (let c = 0; c <= totalColsIdx; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (wsMatrix[ref]) {
        if (c === 0 || c === 2) {
          wsMatrix[ref].s = STYLES.dataCellCenter;
        } else if (c === totalColsIdx) {
          wsMatrix[ref].s = STYLES.dataCellRight;
        } else {
          wsMatrix[ref].s = STYLES.dataCellLeft;
        }
      }
    }
  }

  // Grand Total Row
  for (let c = 0; c <= totalColsIdx; c++) {
    const ref = XLSX.utils.encode_cell({ r: grandTotalRowIdx, c });
    if (wsMatrix[ref]) {
      wsMatrix[ref].s = c === totalColsIdx ? STYLES.summaryTotalRight : STYLES.summaryTotal;
    }
  }

  // Professional column widths
  wsMatrix['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 16 }, // Date
    { wch: 14 }, // Total Pcs
    ...validShapes.map(() => ({ wch: 26 })), // Shape columns
    { wch: 20 }  // Total Weight
  ];

  // A4 Paper Size Setup (paperSize: 9 is standard A4, orientation: 'landscape')
  wsMatrix['!pageSetup'] = {
    paperSize: 9, // 9 = A4 (210 mm x 297 mm)
    orientation: 'landscape',
    fitToWidth: 1,
    fitToHeight: 0
  };

  wsMatrix['!margins'] = {
    left: 0.4,
    right: 0.4,
    top: 0.5,
    bottom: 0.5,
    header: 0.3,
    footer: 0.3
  };

  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Stock_Shape_Matrix');

  // 2. SHEET 2: ITEMIZED DIAMOND RECORDS (Matching Reference Layout + Comprehensive Totals)
  const itemAoa = [
    ['DIVY IMPEX — DETAILED DIAMOND ITEMIZATION AUDIT REGISTER'],
    [
      `Generated On: ${dateFormatted} ${timeFormatted}   |   Generated By: ${generatedBy}   |   Total Diamonds: ${grandTotal.totalPcs || 0} pcs`
    ],
    [
      `Applied Filters: ${filterSummary}`
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
  let totalRoughWeight = 0;
  let totalPolishedWeight = 0;

  rows.forEach((r) => {
    (r.diamonds || []).forEach((d) => {
      let shapeClean = (d.shape || d.size || '').trim();
      const lower = shapeClean.toLowerCase();
      if (!shapeClean || lower === 'emerald' || lower === '-' || lower.includes('ct') || /^\d+(\.\d+)?$/.test(shapeClean)) {
        shapeClean = 'Emeral';
      }

      const roughW = parseFloat((parseFloat(d.weight) || 0).toFixed(3));
      const polW = d.targetWeight ? parseFloat((parseFloat(d.targetWeight) || 0).toFixed(3)) : null;

      totalRoughWeight += roughW;
      if (polW !== null) totalPolishedWeight += polW;

      itemAoa.push([
        itemIdx++,
        r.date,
        String(d.barcode || ''),
        d.roughCutNo || '—',
        d.companyName || companyName,
        shapeClean,
        roughW,
        polW !== null ? polW : '—',
        d.assignedWorkerName || 'Unassigned',
        d.status || 'RECEIVED'
      ]);
    });
  });

  // Calculate Grand Total Row for Itemized Diamonds Sheet
  const totalItemsCount = itemIdx - 1;
  const itemTotalRowIdx = itemAoa.length;
  itemAoa.push([
    'TOTAL',
    'GRAND TOTAL SUMMARY',
    `${totalItemsCount} Diamonds`,
    '',
    `${companyName}`,
    'ALL SHAPES',
    parseFloat(totalRoughWeight.toFixed(3)),
    totalPolishedWeight > 0 ? parseFloat(totalPolishedWeight.toFixed(3)) : '—',
    'OFFICIAL REGISTER',
    'AUDITED'
  ]);

  const wsItems = XLSX.utils.aoa_to_sheet(itemAoa);
  wsItems['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }
  ];

  // Apply Styles to Sheet 2 Cells
  for (let c = 0; c <= 9; c++) {
    const ref0 = XLSX.utils.encode_cell({ r: 0, c });
    if (!wsItems[ref0]) wsItems[ref0] = { t: 's', v: '' };
    wsItems[ref0].s = STYLES.titleBanner;

    const ref1 = XLSX.utils.encode_cell({ r: 1, c });
    if (!wsItems[ref1]) wsItems[ref1] = { t: 's', v: '' };
    wsItems[ref1].s = STYLES.metadataStrip;

    const ref2 = XLSX.utils.encode_cell({ r: 2, c });
    if (!wsItems[ref2]) wsItems[ref2] = { t: 's', v: '' };
    wsItems[ref2].s = STYLES.filterStrip;

    const refH = XLSX.utils.encode_cell({ r: 4, c });
    if (wsItems[refH]) {
      wsItems[refH].s = STYLES.tableHeader;
    }
  }

  // Sheet 2 Data Rows
  for (let r = 5; r < itemTotalRowIdx; r++) {
    for (let c = 0; c <= 9; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (wsItems[ref]) {
        if (c === 0 || c === 2 || c === 9) {
          wsItems[ref].s = STYLES.dataCellCenter;
        } else if (c === 6 || c === 7) {
          wsItems[ref].s = STYLES.dataCellRight;
        } else {
          wsItems[ref].s = STYLES.dataCellLeft;
        }
      }
    }
  }

  // Sheet 2 Grand Total Row
  for (let c = 0; c <= 9; c++) {
    const ref = XLSX.utils.encode_cell({ r: itemTotalRowIdx, c });
    if (wsItems[ref]) {
      if (c === 6 || c === 7) {
        wsItems[ref].s = STYLES.summaryTotalRight;
      } else if (c === 1) {
        wsItems[ref].s = STYLES.summaryTotalLeft;
      } else {
        wsItems[ref].s = STYLES.summaryTotal;
      }
    }
  }

  wsItems['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 15 }, // Received Date
    { wch: 20 }, // Barcode
    { wch: 16 }, // Rough Cut No
    { wch: 24 }, // Company
    { wch: 16 }, // Shape
    { wch: 18 }, // Rough Weight
    { wch: 20 }, // Polished Weight
    { wch: 22 }, // Artisan
    { wch: 18 }  // Status
  ];

  // A4 Paper Size Setup for Itemized Sheet
  wsItems['!pageSetup'] = {
    paperSize: 9, // A4
    orientation: 'landscape',
    fitToWidth: 1,
    fitToHeight: 0
  };
  wsItems['!margins'] = {
    left: 0.4,
    right: 0.4,
    top: 0.5,
    bottom: 0.5,
    header: 0.3,
    footer: 0.3
  };

  XLSX.utils.book_append_sheet(wb, wsItems, 'Diamond_Itemization');

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Generates a clean, simple, and professional native Excel (.xlsx) workbook for Company Deliveries.
 * Includes cleanly separated sheets:
 * Sheet 1: "Delivery_Dispatches" - Chronological delivery register with corporate header and auto-fitted columns
 * Sheet 2: "Company_Summary" - Delivery totals grouped by each client company
 * Sheet 3: "Executive_Totals" - Grand delivery statistics & yield metrics
 * Sheet 4: "Diamond_Itemization" - Full item-by-item barcode breakdown with summary totals
 */
export const exportDispatchHistoryExcel = (
  filename,
  { dispatches = [], companySummary = [], overallTotals = {}, filters = {} }
) => {
  if (!dispatches || !dispatches.length) return;

  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // 1. SHEET 1: DATE-BY-DATE DISPATCH REGISTER (Main Sheet)
  const dispatchAoa = [
    ['DIVY IMPEX — DIAMOND MANAGEMENT SYSTEM'],
    ['FINISHED GOODS DELIVERY & DISPATCH REGISTER'],
    [
      `Generated: ${dateFormatted} ${timeFormatted}   |   Scope: ${filters.scope || 'All Active Delivery Logs'}   |   Batches: ${dispatches.length} Challans`
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

  const totalRowIdx = dispatchAoa.length;
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

  // Styles for Sheet 1
  for (let c = 0; c <= 12; c++) {
    const ref0 = XLSX.utils.encode_cell({ r: 0, c });
    if (!wsDispatches[ref0]) wsDispatches[ref0] = { t: 's', v: '' };
    wsDispatches[ref0].s = STYLES.titleBanner;

    const ref1 = XLSX.utils.encode_cell({ r: 1, c });
    if (!wsDispatches[ref1]) wsDispatches[ref1] = { t: 's', v: '' };
    wsDispatches[ref1].s = STYLES.subtitleBanner;

    const ref2 = XLSX.utils.encode_cell({ r: 2, c });
    if (!wsDispatches[ref2]) wsDispatches[ref2] = { t: 's', v: '' };
    wsDispatches[ref2].s = STYLES.metadataStrip;

    const refH = XLSX.utils.encode_cell({ r: 4, c });
    if (wsDispatches[refH]) {
      wsDispatches[refH].s = STYLES.tableHeader;
    }
  }

  // Data Rows Sheet 1
  for (let r = 5; r < totalRowIdx; r++) {
    for (let c = 0; c <= 12; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (wsDispatches[ref]) {
        if (c === 0 || c === 1 || c === 2 || c === 4) {
          wsDispatches[ref].s = STYLES.dataCellCenter;
        } else if (c >= 7 && c <= 10) {
          wsDispatches[ref].s = STYLES.dataCellRight;
        } else {
          wsDispatches[ref].s = STYLES.dataCellLeft;
        }
      }
    }
  }

  // Grand Total Row
  for (let c = 0; c <= 12; c++) {
    const ref = XLSX.utils.encode_cell({ r: totalRowIdx, c });
    if (wsDispatches[ref]) {
      wsDispatches[ref].s = (c >= 7 && c <= 10) ? STYLES.summaryTotalRight : STYLES.summaryTotal;
    }
  }

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

  wsDispatches['!pageSetup'] = {
    paperSize: 9, // A4
    orientation: 'landscape',
    fitToWidth: 1,
    fitToHeight: 0
  };
  wsDispatches['!margins'] = {
    left: 0.4,
    right: 0.4,
    top: 0.5,
    bottom: 0.5,
    header: 0.3,
    footer: 0.3
  };

  XLSX.utils.book_append_sheet(wb, wsDispatches, 'Delivery_Dispatches');

  // 2. SHEET 2: EVERY COMPANY DELIVERY SUMMARY
  const compHeaders = [
    'Sr No',
    'Company Name',
    'Company Code',
    'Total Challans',
    'Total Diamonds (pcs)',
    'Total Orig Weight (ct)',
    'Handed Weight (ct)',
    'Net Weight Loss (ct)',
    'Yield (%)',
    'Status'
  ];

  const compAoa = [
    ['DIVY IMPEX — CLIENT COMPANY DELIVERY SUMMARY'],
    [`Generated: ${dateFormatted} ${timeFormatted}   |   Scope: ${filters.scope || 'All Active Delivery Logs'}`],
    [],
    compHeaders
  ];

  companySummary.forEach((c, idx) => {
    compAoa.push([
      idx + 1,
      c.name,
      c.code,
      c.challansCount,
      c.diamondsCount,
      parseFloat(c.totalOrigWeight.toFixed(3)),
      parseFloat(c.totalActualWeight.toFixed(3)),
      parseFloat(c.loss.toFixed(3)),
      `${c.yieldPercentage}%`,
      'DELIVERED'
    ]);
  });

  const compTotalRowIdx = compAoa.length;
  compAoa.push([
    'TOTAL',
    `${companySummary.length} Companies`,
    '',
    overallTotals.totalChallans || dispatches.length,
    overallTotals.totalPieces || 0,
    parseFloat((overallTotals.totalOriginalWeight || 0).toFixed(3)),
    parseFloat((overallTotals.totalActualWeight || 0).toFixed(3)),
    parseFloat((overallTotals.totalLoss || 0).toFixed(3)),
    `${overallTotals.yieldPercentage || '100.00'}%`,
    'COMPLETED'
  ]);

  const wsCompany = XLSX.utils.aoa_to_sheet(compAoa);
  wsCompany['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }
  ];

  // Styles for Sheet 2
  for (let c = 0; c <= 9; c++) {
    const ref0 = XLSX.utils.encode_cell({ r: 0, c });
    if (!wsCompany[ref0]) wsCompany[ref0] = { t: 's', v: '' };
    wsCompany[ref0].s = STYLES.titleBanner;

    const ref1 = XLSX.utils.encode_cell({ r: 1, c });
    if (!wsCompany[ref1]) wsCompany[ref1] = { t: 's', v: '' };
    wsCompany[ref1].s = STYLES.metadataStrip;

    const refH = XLSX.utils.encode_cell({ r: 3, c });
    if (wsCompany[refH]) {
      wsCompany[refH].s = STYLES.tableHeader;
    }
  }

  for (let r = 4; r < compTotalRowIdx; r++) {
    for (let c = 0; c <= 9; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (wsCompany[ref]) {
        if (c === 0 || c === 2 || c === 9) {
          wsCompany[ref].s = STYLES.dataCellCenter;
        } else if (c >= 3 && c <= 8) {
          wsCompany[ref].s = STYLES.dataCellRight;
        } else {
          wsCompany[ref].s = STYLES.dataCellLeft;
        }
      }
    }
  }

  for (let c = 0; c <= 9; c++) {
    const ref = XLSX.utils.encode_cell({ r: compTotalRowIdx, c });
    if (wsCompany[ref]) {
      wsCompany[ref].s = (c >= 3 && c <= 8) ? STYLES.summaryTotalRight : STYLES.summaryTotal;
    }
  }

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

  wsCompany['!pageSetup'] = {
    paperSize: 9,
    orientation: 'landscape',
    fitToWidth: 1,
    fitToHeight: 0
  };

  XLSX.utils.book_append_sheet(wb, wsCompany, 'Company_Summary');

  // 3. SHEET 3: EXECUTIVE OVERALL TOTALS
  const summaryAoa = [
    ['DIVY IMPEX — EXECUTIVE DELIVERY & YIELD METRICS'],
    [`Generated: ${dateFormatted} ${timeFormatted}`],
    [],
    ['Operational KPI Metric', 'Audit Value & Scope'],
    ['Report Title', 'FINISHED GOODS DELIVERY & DISPATCH AUDIT REPORT'],
    ['Generated On', `${dateFormatted} ${timeFormatted}`],
    ['Filter Scope', filters.scope || 'All Active Delivery Logs'],
    ['Total Dispatch Challans Executed', `${overallTotals.totalChallans || dispatches.length} Batches`],
    ['Total Finished Diamonds Handed Over', `${overallTotals.totalPieces || 0} pcs`],
    ['Total Original / Assigned Weight', `${(overallTotals.totalOriginalWeight || 0).toFixed(3)} ct`],
    ['Total Polished Weight Handed Over', `${(overallTotals.totalActualWeight || 0).toFixed(3)} ct`],
    ['Total Weight Difference / Loss', `${(overallTotals.totalLoss || 0).toFixed(3)} ct`],
    ['Overall Polishing Yield Rate', `${overallTotals.yieldPercentage || '100.00'}%`],
    ['Distinct Client Companies Served', `${companySummary.length} Companies`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }
  ];

  for (let c = 0; c <= 1; c++) {
    const ref0 = XLSX.utils.encode_cell({ r: 0, c });
    if (!wsSummary[ref0]) wsSummary[ref0] = { t: 's', v: '' };
    wsSummary[ref0].s = STYLES.titleBanner;

    const ref1 = XLSX.utils.encode_cell({ r: 1, c });
    if (!wsSummary[ref1]) wsSummary[ref1] = { t: 's', v: '' };
    wsSummary[ref1].s = STYLES.metadataStrip;

    const refH = XLSX.utils.encode_cell({ r: 3, c });
    if (wsSummary[refH]) {
      wsSummary[refH].s = STYLES.tableHeader;
    }
  }

  for (let r = 4; r < summaryAoa.length; r++) {
    const refK = XLSX.utils.encode_cell({ r, c: 0 });
    const refV = XLSX.utils.encode_cell({ r, c: 1 });
    if (wsSummary[refK]) {
      wsSummary[refK].s = {
        ...STYLES.dataCellLeft,
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E293B' } }
      };
    }
    if (wsSummary[refV]) {
      wsSummary[refV].s = STYLES.dataCellLeft;
    }
  }

  wsSummary['!cols'] = [
    { wch: 38 },
    { wch: 55 }
  ];

  wsSummary['!pageSetup'] = {
    paperSize: 9,
    orientation: 'portrait',
    fitToWidth: 1,
    fitToHeight: 0
  };

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Totals');

  // 4. SHEET 4: ITEM-BY-ITEM INDIVIDUAL DIAMOND DETAILS + TOTAL ROW
  const itemHeaders = [
    '#',
    'Dispatch Date',
    'Challan No',
    'Diamond Barcode',
    'Client Company',
    'Shape',
    'Orig Weight (ct)',
    'Finished Weight (ct)',
    'Loss (ct)',
    'Artisan Worker',
    'Receiver Person'
  ];

  const itemAoa = [
    ['DIVY IMPEX — DISPATCHED DIAMONDS ITEMIZATION BREAKDOWN'],
    [`Generated: ${dateFormatted} ${timeFormatted}   |   Scope: ${filters.scope || 'All Active Delivery Logs'}`],
    [],
    itemHeaders
  ];

  let itemIdx = 1;
  let dispatchTotalOrigW = 0;
  let dispatchTotalActW = 0;
  let dispatchTotalLossW = 0;

  dispatches.forEach((dp) => {
    (dp.diamonds || []).forEach((d) => {
      const orig = parseFloat(d.weight || 0);
      const act = parseFloat(d.actualWeight || 0);
      const loss = act - orig;

      dispatchTotalOrigW += orig;
      dispatchTotalActW += act;
      dispatchTotalLossW += loss;

      itemAoa.push([
        itemIdx++,
        dp.dispatchDate,
        dp.challanNo,
        d.barcode,
        `${dp.companyName} (${dp.companyCode})`,
        d.shape || d.size || '-',
        parseFloat(orig.toFixed(3)),
        parseFloat(act.toFixed(3)),
        parseFloat(loss.toFixed(3)),
        d.workerName || '-',
        dp.receiverName || '-'
      ]);
    });
  });

  const dispatchItemTotalRowIdx = itemAoa.length;
  itemAoa.push([
    'TOTAL',
    'GRAND TOTAL SUMMARY',
    `${dispatches.length} Challans`,
    `${itemIdx - 1} Diamonds`,
    'ALL CLIENTS',
    'ALL SHAPES',
    parseFloat(dispatchTotalOrigW.toFixed(3)),
    parseFloat(dispatchTotalActW.toFixed(3)),
    parseFloat(dispatchTotalLossW.toFixed(3)),
    'DISPATCH REGISTER',
    'AUDITED'
  ]);

  if (itemAoa.length > 5) {
    const wsItems = XLSX.utils.aoa_to_sheet(itemAoa);
    wsItems['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }
    ];

    for (let c = 0; c <= 10; c++) {
      const ref0 = XLSX.utils.encode_cell({ r: 0, c });
      if (!wsItems[ref0]) wsItems[ref0] = { t: 's', v: '' };
      wsItems[ref0].s = STYLES.titleBanner;

      const ref1 = XLSX.utils.encode_cell({ r: 1, c });
      if (!wsItems[ref1]) wsItems[ref1] = { t: 's', v: '' };
      wsItems[ref1].s = STYLES.metadataStrip;

      const refH = XLSX.utils.encode_cell({ r: 3, c });
      if (wsItems[refH]) {
        wsItems[refH].s = STYLES.tableHeader;
      }
    }

    for (let r = 4; r < dispatchItemTotalRowIdx; r++) {
      for (let c = 0; c <= 10; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (wsItems[ref]) {
          if (c === 0 || c === 1 || c === 3) {
            wsItems[ref].s = STYLES.dataCellCenter;
          } else if (c >= 6 && c <= 8) {
            wsItems[ref].s = STYLES.dataCellRight;
          } else {
            wsItems[ref].s = STYLES.dataCellLeft;
          }
        }
      }
    }

    // Grand Total Row
    for (let c = 0; c <= 10; c++) {
      const ref = XLSX.utils.encode_cell({ r: dispatchItemTotalRowIdx, c });
      if (wsItems[ref]) {
        if (c >= 6 && c <= 8) {
          wsItems[ref].s = STYLES.summaryTotalRight;
        } else if (c === 1) {
          wsItems[ref].s = STYLES.summaryTotalLeft;
        } else {
          wsItems[ref].s = STYLES.summaryTotal;
        }
      }
    }

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

    wsItems['!pageSetup'] = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToWidth: 1,
      fitToHeight: 0
    };

    XLSX.utils.book_append_sheet(wb, wsItems, 'Diamond_Itemization');
  }

  // Write actual native .xlsx file with embedded styling
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const triggerPrint = () => {
  window.print();
};
