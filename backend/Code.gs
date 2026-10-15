/**
 * DIVY IMPEX - Diamond Manufacturing Management System
 * Google Apps Script Backend (Web App) + Google Sheets Database
 *
 * HOW TO DEPLOY:
 * 1. Open Google Sheets (create a new blank spreadsheet, e.g. "DIVY IMPEX Database").
 * 2. Click Extensions > Apps Script.
 * 3. Replace all code in Code.gs with this entire file.
 * 4. From the function dropdown, select "setupDatabase" and click "Run".
 *    (Authorize permissions when prompted).
 * 5. Click "Deploy" > "New deployment".
 * 6. Select type: "Web app".
 * 7. Set:
 *    - Description: "DIVY IMPEX Production API"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone" (allows your frontend to call the API)
 * 8. Click "Deploy" and COPY the Web App URL (ends with /exec).
 * 9. Paste the URL into your project's .env file as VITE_GOOGLE_SCRIPT_URL.
 */

// =========================================================================
// OPTIONAL GOOGLE SPREADSHEET URL OR ID:
// - If this script was opened from inside Google Sheets (Extensions > Apps Script),
//   leave this blank ('').
// - If this script is standalone (created directly at script.google.com), paste your
//   Google Sheet URL or ID below:
//   Example: var SPREADSHEET_URL_OR_ID = 'https://docs.google.com/spreadsheets/d/1abc.../edit';
// =========================================================================
var SPREADSHEET_URL_OR_ID = '';

function getSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;

  if (typeof SPREADSHEET_URL_OR_ID !== 'undefined' && SPREADSHEET_URL_OR_ID.trim() !== '') {
    var raw = SPREADSHEET_URL_OR_ID.trim();
    if (raw.indexOf('http') === 0) {
      return SpreadsheetApp.openByUrl(raw);
    } else {
      return SpreadsheetApp.openById(raw);
    }
  }

  throw new Error(
    "No linked Google Spreadsheet found!\n\n" +
    "HOW TO FIX:\n" +
    "1. Open your Google Sheet, click Extensions > Apps Script, and paste this code.\n" +
    "OR\n" +
    "2. Copy your Google Sheet URL and paste it into SPREADSHEET_URL_OR_ID at line 28 of this script."
  );
}

// SHEET NAMES
var SHEETS = {
  COMPANIES: 'Companies',
  WORKERS: 'Workers',
  DIAMONDS: 'Diamonds',
  HISTORIES: 'Histories'
};

// COLUMN HEADERS DEFINITIONS
var HEADERS = {
  Companies: ['id', 'name', 'code', 'contactPerson', 'phone', 'email', 'status', 'address'],
  Workers: ['id', 'employeeId', 'name', 'department', 'phone', 'status'],
  Diamonds: [
    'id', 'barcode', 'companyId', 'companyCode', 'companyName',
    'size', 'weight', 'actualWeight', 'receivedDate', 'receivedBy',
    'assignedWorkerId', 'assignedWorkerName', 'assignedDate',
    'status', 'completedDate', 'completedBy', 'depositedDate',
    'verifiedDate', 'verifiedBy', 'remarks'
  ],
  Histories: ['id', 'diamondId', 'barcode', 'action', 'performedBy', 'date', 'time', 'remarks']
};

/**
 * Run this function once from Apps Script editor to setup sheets and headers.
 */
function setupDatabase() {
  var ss = getSpreadsheet();

  Object.keys(HEADERS).forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Check if headers already exist
    var headers = HEADERS[sheetName];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#0A192F');
      headerRange.setFontColor('#D4AF37');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });

  // Remove default 'Sheet1' if exists and other sheets are present
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  Logger.log('DIVY IMPEX database sheets initialized successfully!');
}

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getInitialData';
    var response;

    switch (action) {
      case 'getInitialData':
        var cache = CacheService.getScriptCache();
        var cached = cache.get('divy_initial_data_v1');
        if (cached) {
          response = JSON.parse(cached);
          break;
        }
        var ss = getSpreadsheet();
        response = {
          companies: getTableData(SHEETS.COMPANIES, ss),
          workers: getTableData(SHEETS.WORKERS, ss),
          diamonds: getTableData(SHEETS.DIAMONDS, ss),
          histories: getTableData(SHEETS.HISTORIES, ss)
        };
        try {
          cache.put('divy_initial_data_v1', JSON.stringify(response), 300);
        } catch (ce) {}
        break;

      case 'getCompanies':
        response = getTableData(SHEETS.COMPANIES);
        break;

      case 'getWorkers':
        response = getTableData(SHEETS.WORKERS);
        break;

      case 'getDiamonds':
        response = getTableData(SHEETS.DIAMONDS);
        break;

      case 'getHistory':
        var query = e.parameter.diamondIdOrBarcode || '';
        response = getDiamondHistory(query);
        break;

      default:
        response = { error: 'Unknown GET action: ' + action };
    }

    return createJsonResponse({ success: true, data: response });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 20 seconds for other operations to finish
  var hasLock = lock.tryLock(20000);

  if (!hasLock) {
    return createJsonResponse({ success: false, error: 'Database is busy, please try again.' });
  }

  try {
    // Invalidate initial data cache on any mutation
    try {
      CacheService.getScriptCache().remove('divy_initial_data_v1');
    } catch (ce) {}

    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    var action = body.action;
    var data = body.data || body;
    var result;

    switch (action) {
      case 'addCompany':
        result = addCompany(data);
        break;

      case 'updateCompany':
        result = updateCompany(data.id, data);
        break;

      case 'deleteCompany':
        result = deleteCompany(data.id || data);
        break;

      case 'addWorker':
        result = addWorker(data);
        break;

      case 'updateWorker':
        result = updateWorker(data.id, data);
        break;

      case 'deleteWorker':
        result = deleteWorker(data.id || data);
        break;

      case 'receiveDiamondsBatch':
        result = receiveDiamondsBatch(data);
        break;

      case 'assignDiamond':
        result = assignDiamond(data);
        break;

      case 'startWork':
        result = startWork(data);
        break;

      case 'markWorkCompleted':
        result = markWorkCompleted(data);
        break;

      case 'depositDiamond':
        result = depositDiamond(data);
        break;

      case 'verifyDiamond':
        result = verifyDiamond(data);
        break;

      case 'seedInitialData':
        result = seedInitialData(data);
        break;

      default:
        throw new Error('Unsupported POST action: ' + action);
    }

    return createJsonResponse({ success: true, data: result });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// DATABASE HELPER FUNCTIONS
// ==========================================

function getTableData(sheetName, ss) {
  if (!ss) ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) return [];

  var headers = values[0];
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var cellVal = values[i][j];
      // Normalize dates or null values
      if (cellVal instanceof Date) {
        cellVal = Utilities.formatDate(cellVal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      rowObj[header] = (cellVal === '' || cellVal === undefined) ? null : cellVal;
    }
    rows.push(rowObj);
  }

  return rows;
}

function appendRowToSheet(sheetName, obj) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' not found');

  var headers = HEADERS[sheetName] || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowValues = [];

  for (var i = 0; i < headers.length; i++) {
    var val = obj[headers[i]];
    rowValues.push(val !== undefined && val !== null ? val : '');
  }

  sheet.appendRow(rowValues);
}

function updateRowInSheet(sheetName, idField, idValue, updateObj) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' not found');

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) throw new Error('No records to update');

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var idColIdx = headers.indexOf(idField);

  if (idColIdx === -1) throw new Error('Column ' + idField + ' not found');

  var targetRowIdx = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idColIdx]) === String(idValue)) {
      targetRowIdx = i + 1; // 1-indexed for Sheets API
      break;
    }
  }

  if (targetRowIdx === -1) throw new Error('Record with ' + idField + '=' + idValue + ' not found');

  for (var j = 0; j < headers.length; j++) {
    var key = headers[j];
    if (updateObj[key] !== undefined) {
      sheet.getRange(targetRowIdx, j + 1).setValue(updateObj[key]);
    }
  }

  return true;
}

function deleteRowFromSheet(sheetName, idField, idValue) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' not found');

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return false;

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var idColIdx = headers.indexOf(idField);

  if (idColIdx === -1) throw new Error('Column ' + idField + ' not found');

  var targetRowIdx = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idColIdx]) === String(idValue)) {
      targetRowIdx = i + 1;
      break;
    }
  }

  if (targetRowIdx === -1) return false;

  sheet.deleteRow(targetRowIdx);
  return true;
}

function getFormattedTime() {
  var now = new Date();
  var tz = Session.getScriptTimeZone();
  var dateStr = Utilities.formatDate(now, tz, 'dd MMM yyyy');
  var timeStr = Utilities.formatDate(now, tz, 'hh:mm a');
  var isoDate = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  return { dateStr: dateStr, timeStr: timeStr, isoDate: isoDate };
}

// ==========================================
// BUSINESS LOGIC CONTROLLERS
// ==========================================

function addCompany(data) {
  var code = (data.code || '').trim().toUpperCase();
  var name = (data.name || '').trim();

  // Deduplication check: return existing company if code or name matches
  if (code) {
    var existingCompanies = getTableData(SHEETS.COMPANIES);
    for (var i = 0; i < existingCompanies.length; i++) {
      var c = existingCompanies[i];
      if ((c.code && c.code.toUpperCase() === code) || (c.name && c.name.toLowerCase() === name.toLowerCase())) {
        Logger.log('Company already exists: ' + code + '. Skipping duplicate insertion.');
        return c;
      }
    }
  }

  var newCompany = {
    id: data.id || ('comp-' + Date.now()),
    name: name,
    code: code,
    contactPerson: data.contactPerson || '',
    phone: data.phone || '',
    email: data.email || '',
    status: data.status || 'ACTIVE',
    address: data.address || ''
  };

  appendRowToSheet(SHEETS.COMPANIES, newCompany);
  return newCompany;
}

function updateCompany(id, data) {
  updateRowInSheet(SHEETS.COMPANIES, 'id', id, data);
  return data;
}

function deleteCompany(id) {
  var deleted = deleteRowFromSheet(SHEETS.COMPANIES, 'id', id);
  return { id: id, deleted: deleted };
}

function addWorker(data) {
  var employeeId = (data.employeeId || '').trim();
  var name = (data.name || '').trim();
  var phone = (data.phone || '').trim();

  // Deduplication check: return existing worker if employeeId or (phone + name) matches
  var existingWorkers = getTableData(SHEETS.WORKERS);
  for (var i = 0; i < existingWorkers.length; i++) {
    var w = existingWorkers[i];
    if (
      (employeeId && w.employeeId && w.employeeId.toUpperCase() === employeeId.toUpperCase()) ||
      (phone && w.phone && w.phone === phone && w.name.toLowerCase() === name.toLowerCase())
    ) {
      Logger.log('Worker already exists: ' + employeeId + '. Skipping duplicate insertion.');
      return w;
    }
  }

  var newWorker = {
    id: data.id || ('w-' + Date.now()),
    employeeId: employeeId || ('EMP-' + Date.now().toString().slice(-3)),
    name: name,
    department: data.department || 'General',
    phone: phone,
    status: data.status || 'ACTIVE'
  };

  appendRowToSheet(SHEETS.WORKERS, newWorker);
  return newWorker;
}

function updateWorker(id, data) {
  updateRowInSheet(SHEETS.WORKERS, 'id', id, data);
  return data;
}

function deleteWorker(id) {
  var deleted = deleteRowFromSheet(SHEETS.WORKERS, 'id', id);
  return { id: id, deleted: deleted };
}

function receiveDiamondsBatch(data) {
  var companyId = data.companyId;
  var diamondsList = data.diamondsList || [];
  var receivedBy = data.receivedBy || 'Supervisor';
  var remarks = data.remarks || 'Received in batch';

  var companies = getTableData(SHEETS.COMPANIES);
  var company = null;
  for (var i = 0; i < companies.length; i++) {
    if (companies[i].id === companyId) {
      company = companies[i];
      break;
    }
  }

  if (!company) throw new Error('Invalid Company ID: ' + companyId);

  var existingDiamonds = getTableData(SHEETS.DIAMONDS);
  var existingBarcodes = {};
  for (var b = 0; b < existingDiamonds.length; b++) {
    existingBarcodes[String(existingDiamonds[b].barcode).toUpperCase()] = true;
  }

  var created = [];
  var timeInfo = getFormattedTime();

  for (var k = 0; k < diamondsList.length; k++) {
    var item = diamondsList[k];
    var barcode = String(item.barcode).trim().toUpperCase();

    if (existingBarcodes[barcode]) {
      throw new Error('Barcode ' + barcode + ' already exists!');
    }

    var newDiamond = {
      id: 'dia-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      barcode: barcode,
      companyId: company.id,
      companyCode: company.code,
      companyName: company.name,
      size: item.size || '1.0 ct',
      weight: parseFloat(item.weight) || 0,
      actualWeight: '',
      receivedDate: data.receivedDate || timeInfo.isoDate,
      receivedBy: receivedBy,
      assignedWorkerId: '',
      assignedWorkerName: '',
      assignedDate: '',
      status: 'RECEIVED',
      completedDate: '',
      completedBy: '',
      depositedDate: '',
      verifiedDate: '',
      verifiedBy: '',
      remarks: item.remarks || remarks
    };

    appendRowToSheet(SHEETS.DIAMONDS, newDiamond);
    created.push(newDiamond);
    existingBarcodes[barcode] = true;

    // Log History
    appendRowToSheet(SHEETS.HISTORIES, {
      id: 'hist-' + Date.now() + '-' + k,
      diamondId: newDiamond.id,
      barcode: newDiamond.barcode,
      action: 'Diamond Received',
      performedBy: receivedBy,
      date: timeInfo.dateStr,
      time: timeInfo.timeStr,
      remarks: 'Received from ' + company.name + '. Weight: ' + newDiamond.weight + ' ct'
    });
  }

  return created;
}

function assignDiamond(data) {
  var barcode = String(data.barcode).trim().toUpperCase();
  var workerId = data.workerId;
  var assignedBy = data.assignedBy || 'Supervisor';

  var workers = getTableData(SHEETS.WORKERS);
  var worker = null;
  for (var i = 0; i < workers.length; i++) {
    if (workers[i].id === workerId) {
      worker = workers[i];
      break;
    }
  }

  if (!worker) throw new Error('Worker not found');

  var timeInfo = getFormattedTime();
  var updateData = {
    assignedWorkerId: worker.id,
    assignedWorkerName: worker.name,
    assignedDate: timeInfo.isoDate,
    status: 'ASSIGNED'
  };

  updateRowInSheet(SHEETS.DIAMONDS, 'barcode', barcode, updateData);

  appendRowToSheet(SHEETS.HISTORIES, {
    id: 'hist-' + Date.now(),
    diamondId: '',
    barcode: barcode,
    action: 'Assigned to ' + worker.name,
    performedBy: assignedBy,
    date: timeInfo.dateStr,
    time: timeInfo.timeStr,
    remarks: 'Assigned for ' + worker.department + ' work'
  });

  return updateData;
}

function startWork(data) {
  var barcode = String(data.barcode).trim().toUpperCase();
  var timeInfo = getFormattedTime();

  var updateData = { status: 'IN PROGRESS' };
  updateRowInSheet(SHEETS.DIAMONDS, 'barcode', barcode, updateData);

  appendRowToSheet(SHEETS.HISTORIES, {
    id: 'hist-' + Date.now(),
    diamondId: '',
    barcode: barcode,
    action: 'Work Started',
    performedBy: data.workerName || 'Worker',
    date: timeInfo.dateStr,
    time: timeInfo.timeStr,
    remarks: 'Production work in progress'
  });

  return updateData;
}

function markWorkCompleted(data) {
  var barcode = String(data.barcode).trim().toUpperCase();
  var timeInfo = getFormattedTime();

  var updateData = {
    status: 'WORK COMPLETED',
    completedDate: timeInfo.isoDate,
    completedBy: data.workerName || 'Worker'
  };

  updateRowInSheet(SHEETS.DIAMONDS, 'barcode', barcode, updateData);

  appendRowToSheet(SHEETS.HISTORIES, {
    id: 'hist-' + Date.now(),
    diamondId: '',
    barcode: barcode,
    action: 'Work Completed',
    performedBy: updateData.completedBy,
    date: timeInfo.dateStr,
    time: timeInfo.timeStr,
    remarks: 'Worker marked diamond production completed'
  });

  return updateData;
}

function depositDiamond(data) {
  var barcode = String(data.barcode).trim().toUpperCase();
  var timeInfo = getFormattedTime();

  var updateData = {
    status: 'DEPOSITED',
    depositedDate: timeInfo.isoDate
  };

  updateRowInSheet(SHEETS.DIAMONDS, 'barcode', barcode, updateData);

  appendRowToSheet(SHEETS.HISTORIES, {
    id: 'hist-' + Date.now(),
    diamondId: '',
    barcode: barcode,
    action: 'Diamond Deposited',
    performedBy: data.workerName || 'Worker',
    date: timeInfo.dateStr,
    time: timeInfo.timeStr,
    remarks: 'Returned to safe for barcode & weight verification'
  });

  return updateData;
}

function verifyDiamond(data) {
  var barcode = String(data.barcode).trim().toUpperCase();
  var actualWeight = parseFloat(data.actualWeight);
  var isApproved = !!data.isApproved;
  var verifiedBy = data.verifiedBy || 'QC Supervisor';
  var remarks = data.remarks || '';

  var timeInfo = getFormattedTime();
  var newStatus = isApproved ? 'COMPLETED' : 'REWORK';

  var updateData = {
    actualWeight: actualWeight,
    verifiedDate: timeInfo.isoDate,
    verifiedBy: verifiedBy,
    status: newStatus
  };
  if (remarks) updateData.remarks = remarks;

  updateRowInSheet(SHEETS.DIAMONDS, 'barcode', barcode, updateData);

  appendRowToSheet(SHEETS.HISTORIES, {
    id: 'hist-' + Date.now() + '-1',
    diamondId: '',
    barcode: barcode,
    action: isApproved ? 'Barcode & Weight Verified' : 'QC Verification Failed (Rework)',
    performedBy: verifiedBy,
    date: timeInfo.dateStr,
    time: timeInfo.timeStr,
    remarks: 'Actual Weight: ' + actualWeight + ' ct. ' + (remarks || '')
  });

  appendRowToSheet(SHEETS.HISTORIES, {
    id: 'hist-' + Date.now() + '-2',
    diamondId: '',
    barcode: barcode,
    action: 'Status changed to ' + newStatus,
    performedBy: verifiedBy,
    date: timeInfo.dateStr,
    time: timeInfo.timeStr,
    remarks: isApproved ? 'Approved & marked COMPLETED' : 'Flagged for REWORK'
  });

  return updateData;
}

function getDiamondHistory(query) {
  var allHistories = getTableData(SHEETS.HISTORIES);
  var cleanQuery = String(query).trim().toLowerCase();

  return allHistories.filter(function (h) {
    return (
      (h.barcode && String(h.barcode).toLowerCase() === cleanQuery) ||
      (h.diamondId && String(h.diamondId).toLowerCase() === cleanQuery)
    );
  });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
