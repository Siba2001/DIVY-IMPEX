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
// GOOGLE SPREADSHEET URL OR ID:
// Standalone script configuration pointing to DIVY IMPEX Database
var SPREADSHEET_URL_OR_ID = 'https://docs.google.com/spreadsheets/d/1Q_OPmxKK-hNNhZuxxtJJvYAISqKwx1YeUxqxpyCklE4/edit';

// =========================================================================
// SECURITY TOKEN AUTHENTICATION
// Protects API endpoints against unauthorized access & formula injection
// =========================================================================
var API_SECRET = 'DIVY_SECURE_TOKEN_2026';

function isAuthorized(e, body) {
  if (!API_SECRET) return true;
  var token = (e && e.parameter && e.parameter.key) || (body && body.key);
  return token === API_SECRET;
}

function sanitizeCell(val, header) {
  if (val === undefined || val === null) return '';
  var s = String(val);
  var h = header ? String(header).toLowerCase() : '';
  // Barcodes, cut numbers, lot/serial numbers must remain exact strings even with leading zeros
  if (h.indexOf('barcode') !== -1 || h.indexOf('rough') !== -1 || h.indexOf('serial') !== -1 || h.indexOf('code') !== -1) {
    if (typeof val === 'string' && val.length > 1 && val.charAt(0) === '0' && /^\d+$/.test(val)) {
      return "'" + val; // Force Google Sheets to treat as literal text preserving leading zeros
    }
  }
  if (typeof val === 'string' && val.length > 0) {
    var c = val.charAt(0);
    if (c === '=' || c === '+' || c === '-' || c === '@') {
      return "'" + val; // Prevent formula injection attacks
    }
  }
  return val;
}

function getSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;

  if (typeof SPREADSHEET_URL_OR_ID !== 'undefined' && SPREADSHEET_URL_OR_ID.trim() !== '') {
    var raw = SPREADSHEET_URL_OR_ID.trim();
    // Extract ID if a full URL or any tab URL (with ?gid=...) was pasted
    var match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    var sheetId = match ? match[1] : raw;
    try {
      return SpreadsheetApp.openById(sheetId);
    } catch (e) {
      if (raw.indexOf('http') === 0) {
        return SpreadsheetApp.openByUrl(raw);
      }
      throw e;
    }
  }

  throw new Error(
    "No linked Google Spreadsheet found!\n\n" +
    "HOW TO FIX:\n" +
    "1. Open your Google Sheet, click Extensions > Apps Script, and paste this code.\n" +
    "OR\n" +
    "2. Copy your Google Sheet URL and paste it into SPREADSHEET_URL_OR_ID at line 25 of this script."
  );
}

// SHEET NAMES
var SHEETS = {
  COMPANIES: 'Companies',
  WORKERS: 'Workers',
  DIAMONDS: 'Diamonds',
  HISTORIES: 'Histories',
  USERS: 'Users'
};

// COLUMN HEADERS DEFINITIONS
var HEADERS = {
  Companies: ['id', 'name', 'code', 'contactPerson', 'phone', 'email', 'status', 'address'],
  Workers: ['id', 'employeeId', 'name', 'department', 'phone', 'status'],
  Diamonds: [
    'id', 'barcode', 'roughCutNo', 'companyId', 'companyCode', 'companyName',
    'shape', 'size', 'weight', 'scaleWeight', 'targetWeight', 'actualWeight', 'receivedDate', 'receivedBy',
    'assignedWorkerId', 'assignedWorkerName', 'assignedDate',
    'status', 'completedDate', 'completedBy', 'depositedDate',
    'verifiedDate', 'verifiedBy', 'remarks'
  ],
  Histories: ['id', 'diamondId', 'barcode', 'action', 'performedBy', 'date', 'time', 'remarks'],
  Users: ['id', 'username', 'passwordHash', 'role', 'name', 'email', 'status', 'createdAt']
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
    if (!isAuthorized(e, null)) {
      return createJsonResponse({ success: false, error: 'Unauthorized: Invalid or missing API security key.' });
    }

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

      case 'getUsers':
        response = getUsers();
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
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    if (!isAuthorized(e, body)) {
      return createJsonResponse({ success: false, error: 'Unauthorized: Invalid or missing API security key.' });
    }

    // Invalidate initial data cache on any mutation
    try {
      CacheService.getScriptCache().remove('divy_initial_data_v1');
    } catch (ce) {}

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
      case 'assignDiamondsBatch':
        result = assignDiamondsBatch(data);
        break;

      case 'startWork':
        result = startWork(data);
        break;

      case 'markWorkCompleted':
        result = markWorkCompleted(data);
        break;

      case 'login':
      case 'loginUser':
        result = loginUser(data);
        break;

      case 'createUser':
        result = createUser(data);
        break;

      case 'changeUserPassword':
        result = changeUserPassword(data);
        break;

      case 'changeUserId':
        result = changeUserId(data);
        break;

      case 'deleteUser':
        result = deleteUser(data);
        break;

      case 'verifyAdminAccess':
        result = verifyAdminAccess(data);
        break;

      case 'depositDiamond':
        result = depositDiamond(data);
        break;

      case 'verifyDiamond':
        result = verifyDiamond(data);
        break;

      case 'submitDiamondsToCompany':
        result = submitDiamondsToCompany(data);
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

  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  if (!values || values.length <= 1) return [];

  var displayValues = dataRange.getDisplayValues();
  var headers = values[0];
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var cellVal = values[i][j];
      var hName = String(header || '').toLowerCase();

      // For identifiers like barcode, roughCutNo, serialNo: prefer displayValues to never drop leading zeros!
      if (hName.indexOf('barcode') !== -1 || hName.indexOf('rough') !== -1 || hName.indexOf('serial') !== -1) {
        var disp = displayValues && displayValues[i] ? displayValues[i][j] : '';
        if (disp && typeof disp === 'string') {
          cellVal = disp.trim();
        }
      }

      // Normalize dates, times, or null values
      if (cellVal instanceof Date) {
        var year = cellVal.getFullYear();
        // Google Sheets stores time-only values as Dec 30 1899. If year is 1899/1900 or header is time, format as time!
        if (year <= 1900 || hName.indexOf('time') !== -1) {
          cellVal = Utilities.formatDate(cellVal, Session.getScriptTimeZone(), 'hh:mm a');
        } else {
          cellVal = Utilities.formatDate(cellVal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
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

  var lastCol = sheet.getLastColumn();
  var sheetHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : null;
  var headers = (sheetHeaders && sheetHeaders.length > 0 && sheetHeaders[0]) ? sheetHeaders : (HEADERS[sheetName] || []);

  // Ensure roughCutNo, serialNo, batchTotalWeight are present in sheet headers if missing on older sheets
  if (sheetName === SHEETS.DIAMONDS) {
    if (headers.indexOf('roughCutNo') === -1) {
      sheet.getRange(1, headers.length + 1).setValue('roughCutNo');
      headers.push('roughCutNo');
    }
    if (headers.indexOf('serialNo') === -1) {
      sheet.getRange(1, headers.length + 1).setValue('serialNo');
      headers.push('serialNo');
    }
    if (headers.indexOf('batchTotalWeight') === -1) {
      sheet.getRange(1, headers.length + 1).setValue('batchTotalWeight');
      headers.push('batchTotalWeight');
    }
  }

  var rowValues = [];

  for (var i = 0; i < headers.length; i++) {
    var val = obj[headers[i]];
    val = sanitizeCell(val, headers[i]);
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
  var code = String(data.code || '').trim().toUpperCase();
  var name = String(data.name || '').trim();

  // Deduplication check: return existing company if code or name matches
  if (code) {
    var existingCompanies = getTableData(SHEETS.COMPANIES);
    for (var i = 0; i < existingCompanies.length; i++) {
      var c = existingCompanies[i];
      if ((c.code && String(c.code).toUpperCase() === code) || (c.name && String(c.name).toLowerCase() === name.toLowerCase())) {
        Logger.log('Company already exists: ' + code + '. Skipping duplicate insertion.');
        return c;
      }
    }
  }

  var cleanPhone = String(data.phone || '').replace(/\D/g, '').slice(0, 10);

  var newCompany = {
    id: data.id || ('comp-' + Date.now()),
    name: name,
    code: code,
    contactPerson: data.contactPerson ? String(data.contactPerson) : '',
    phone: cleanPhone,
    email: data.email ? String(data.email).trim() : '',
    status: data.status || 'ACTIVE',
    address: data.address ? String(data.address).trim() : ''
  };

  appendRowToSheet(SHEETS.COMPANIES, newCompany);
  return newCompany;
}

function updateCompany(id, data) {
  var updateData = { ...data };
  if (updateData.phone !== undefined) {
    updateData.phone = String(updateData.phone || '').replace(/\D/g, '').slice(0, 10);
  }
  updateRowInSheet(SHEETS.COMPANIES, 'id', id, updateData);
  return updateData;
}

function deleteCompany(id) {
  var deleted = deleteRowFromSheet(SHEETS.COMPANIES, 'id', id);
  return { id: id, deleted: deleted };
}

function addWorker(data) {
  var employeeId = String(data.employeeId || '').trim();
  var name = String(data.name || '').trim();
  var phone = String(data.phone || '').replace(/\D/g, '').slice(0, 10);

  // Deduplication check: return existing worker if employeeId or (phone + name) matches
  var existingWorkers = getTableData(SHEETS.WORKERS);
  for (var i = 0; i < existingWorkers.length; i++) {
    var w = existingWorkers[i];
    if (
      (employeeId && w.employeeId && String(w.employeeId).toUpperCase() === employeeId.toUpperCase()) ||
      (phone && w.phone && String(w.phone) === phone && String(w.name || '').toLowerCase() === name.toLowerCase())
    ) {
      Logger.log('Worker already exists: ' + employeeId + '. Skipping duplicate insertion.');
      return w;
    }
  }

  var newWorker = {
    id: data.id || ('w-' + Date.now()),
    employeeId: employeeId || ('EMP-' + Date.now().toString().slice(-3)),
    name: name,
    department: data.department ? String(data.department) : 'General',
    phone: phone,
    status: data.status || 'ACTIVE'
  };

  appendRowToSheet(SHEETS.WORKERS, newWorker);
  return newWorker;
}

function updateWorker(id, data) {
  var updateData = { ...data };
  if (updateData.phone !== undefined) {
    updateData.phone = String(updateData.phone || '').replace(/\D/g, '').slice(0, 10);
  }
  updateRowInSheet(SHEETS.WORKERS, 'id', id, updateData);
  return updateData;
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

  var serialNo = data.serialNo ? String(data.serialNo).trim() : '';
  var batchTotalWeight = data.batchTotalWeight || data.totalWeight || '';

  for (var k = 0; k < diamondsList.length; k++) {
    var item = diamondsList[k];
    var barcode = String(item.barcode).trim().toUpperCase();

    if (existingBarcodes[barcode]) {
      throw new Error('Barcode ' + barcode + ' already exists!');
    }

    var shapeVal = item.shape ? String(item.shape).trim() : '';
    var roughCutVal = item.roughCutNo ? String(item.roughCutNo).trim() : '';

    var newDiamond = {
      id: 'dia-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      serialNo: serialNo,
      batchTotalWeight: batchTotalWeight ? parseFloat(batchTotalWeight) : '',
      barcode: barcode,
      roughCutNo: roughCutVal,
      companyId: company.id,
      companyCode: company.code,
      companyName: company.name,
      shape: shapeVal,
      size: shapeVal || item.size || '-',
      weight: parseFloat(item.weight) || 0,
      scaleWeight: item.scaleWeight ? (parseFloat(item.scaleWeight) || '') : (parseFloat(item.weight) || 0),
      targetWeight: item.targetWeight ? (parseFloat(item.targetWeight) || '') : '',
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
    var serialLog = serialNo ? 'Sr: #' + serialNo + ', ' : '';
    var batchLog = batchTotalWeight ? 'Batch Wt: ' + batchTotalWeight + ' ct, ' : '';
    var weightDetail = serialLog + batchLog + 'Kacha Wt: ' + newDiamond.weight + ' ct';
    if (newDiamond.targetWeight) weightDetail += ', Teyar Wt: ' + newDiamond.targetWeight + ' ct';
    if (roughCutVal) weightDetail += ', Rough No: ' + roughCutVal;
    if (shapeVal) weightDetail += ', Shape: ' + shapeVal;

    appendRowToSheet(SHEETS.HISTORIES, {
      id: 'hist-' + Date.now() + '-' + k,
      diamondId: newDiamond.id,
      barcode: newDiamond.barcode,
      action: 'Diamond Received',
      performedBy: receivedBy,
      date: timeInfo.dateStr,
      time: timeInfo.timeStr,
      remarks: 'Received from ' + company.name + '. ' + weightDetail + (item.remarks ? ' [' + item.remarks + ']' : '')
    });
  }

  return created;
}

function assignDiamond(data) {
  return assignDiamondsBatch(data);
}

function assignDiamondsBatch(data) {
  var barcodes = data.barcodes || [];
  if (data.barcode && barcodes.indexOf(data.barcode) === -1) {
    barcodes.push(data.barcode);
  }
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
  if (!barcodes || barcodes.length === 0) throw new Error('No barcodes provided for assignment');

  var timeInfo = getFormattedTime();
  var updateData = {
    assignedWorkerId: worker.id,
    assignedWorkerName: worker.name,
    assignedDate: timeInfo.isoDate,
    status: 'ASSIGNED'
  };

  for (var b = 0; b < barcodes.length; b++) {
    var bc = String(barcodes[b]).trim().toUpperCase();
    updateRowInSheet(SHEETS.DIAMONDS, 'barcode', bc, updateData);

    appendRowToSheet(SHEETS.HISTORIES, {
      id: 'hist-' + Date.now() + '-' + b,
      diamondId: '',
      barcode: bc,
      action: 'Assigned to ' + worker.name,
      performedBy: assignedBy,
      date: timeInfo.dateStr,
      time: timeInfo.timeStr,
      remarks: 'Assigned for ' + worker.department + ' work'
    });
  }

  return { success: true, count: barcodes.length, workerName: worker.name, assignedWorkerId: worker.id };
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

function submitDiamondsToCompany(data) {
  var barcodes = (data.barcodes || []).map(function (b) { return String(b).trim().toUpperCase(); });
  var timeInfo = getFormattedTime();
  var challanNo = data.challanNo || ('DC-' + Date.now());
  var receiver = data.receiverName || 'Company Representative';
  var company = data.companyName || 'Client Company';

  barcodes.forEach(function (bc) {
    updateRowInSheet(SHEETS.DIAMONDS, 'barcode', bc, {
      status: 'RETURNED',
      remarks: 'Returned to ' + company + ' under Challan #' + challanNo
    });

    appendRowToSheet(SHEETS.HISTORIES, {
      id: 'hist-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      diamondId: '',
      barcode: bc,
      action: 'Submitted to Company',
      performedBy: data.dispatchedBy || 'Dispatch Supervisor',
      date: timeInfo.dateStr,
      time: timeInfo.timeStr,
      remarks: 'Returned under Challan #' + challanNo + '. Handed over to: ' + receiver
    });
  });

  return { success: true, count: barcodes.length, challanNo: challanNo };
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

// =========================================================================
// SECURE USER & PASSWORD MANAGEMENT (SHA-256 HASHED)
// =========================================================================

function hashPassword(plainPassword) {
  var raw = String(plainPassword || '').trim();
  if (!raw) return '';
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < digest.length; i++) {
    var byteVal = digest[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) hex += '0';
    hex += byteHex;
  }
  return hex;
}

function ensureUsersTable(ss) {
  if (!ss) ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.USERS);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS.Users);
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.Users.length);
    headerRange.setBackground('#0A192F');
    headerRange.setFontColor('#D4AF37');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Pre-seed default Admin account if sheet is empty
  if (sheet.getLastRow() <= 1) {
    var timeInfo = getFormattedTime();
    sheet.appendRow([
      'usr-admin',
      'admin',
      hashPassword('admin123'),
      'admin',
      'Admin Manager',
      'admin@divyimpex.com',
      'ACTIVE',
      timeInfo.dateStr
    ]);
  }
  return sheet;
}

function getUsers() {
  ensureUsersTable();
  var users = getTableData(SHEETS.USERS);
  return users.map(function (u) {
    return {
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role || 'worker',
      email: u.email || '',
      status: u.status || 'ACTIVE',
      createdAt: u.createdAt || ''
    };
  });
}

function loginUser(data) {
  ensureUsersTable();
  var username = String(data.username || '').trim().toLowerCase();
  var password = String(data.password || '').trim();

  if (!username || !password) {
    return { success: false, message: 'Username and password are required.' };
  }

  var hash = hashPassword(password);
  var users = getTableData(SHEETS.USERS);
  var found = null;
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].username).trim().toLowerCase() === username) {
      found = users[i];
      break;
    }
  }

  if (!found || String(found.passwordHash).trim() !== hash) {
    return { success: false, message: 'Invalid username or password!' };
  }

  return {
    success: true,
    user: {
      id: found.id,
      username: found.username,
      name: found.name,
      role: found.role || 'worker',
      email: found.email || '',
      status: found.status || 'ACTIVE'
    }
  };
}

function createUser(data) {
  ensureUsersTable();
  var username = String(data.username || '').trim();
  var password = String(data.password || '').trim();
  var name = String(data.name || '').trim();
  var role = String(data.role || 'worker').trim().toLowerCase();
  var email = String(data.email || '').trim();

  if (!username) return { success: false, message: 'User ID is required.' };
  if (!password || password.length < 4) return { success: false, message: 'Password must be at least 4 characters.' };
  if (!name) return { success: false, message: 'Full Name is required.' };

  var users = getTableData(SHEETS.USERS);
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].username).trim().toLowerCase() === username.toLowerCase()) {
      return { success: false, message: 'User ID "' + username + '" already exists in database!' };
    }
  }

  var timeInfo = getFormattedTime();
  var newUser = {
    id: 'usr-' + Date.now(),
    username: username,
    passwordHash: hashPassword(password),
    role: role,
    name: name,
    email: email,
    status: 'ACTIVE',
    createdAt: timeInfo.dateStr
  };

  appendRowToSheet(SHEETS.USERS, newUser);
  return {
    success: true,
    message: 'User account "' + username + '" created securely in database!',
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    }
  };
}

function changeUserPassword(data) {
  ensureUsersTable();
  var username = String(data.username || '').trim().toLowerCase();
  var newPassword = String(data.newPassword || '').trim();

  if (!username) return { success: false, message: 'User ID is required.' };
  if (!newPassword || newPassword.length < 4) return { success: false, message: 'New password must be at least 4 characters.' };

  var newHash = hashPassword(newPassword);
  updateRowInSheet(SHEETS.USERS, 'username', username, {
    passwordHash: newHash
  });

  return { success: true, message: 'Password for "' + username + '" successfully updated in database!' };
}

function changeUserId(data) {
  ensureUsersTable();
  var oldUsername = String(data.oldUsername || '').trim();
  var newUsername = String(data.newUsername || '').trim();

  if (!newUsername) return { success: false, message: 'New User ID cannot be empty.' };

  var users = getTableData(SHEETS.USERS);
  var conflict = users.some(function (u) {
    return String(u.username).trim().toLowerCase() === newUsername.toLowerCase();
  });
  if (conflict) {
    return { success: false, message: 'User ID "' + newUsername + '" is already taken in database!' };
  }

  updateRowInSheet(SHEETS.USERS, 'username', oldUsername, {
    username: newUsername
  });

  return { success: true, message: 'User ID changed to "' + newUsername + '" in database!' };
}

function deleteUser(data) {
  ensureUsersTable();
  var username = String(data.username || '').trim().toLowerCase();
  var users = getTableData(SHEETS.USERS);

  var adminCount = 0;
  var target = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].role === 'admin') adminCount++;
    if (String(users[i].username).trim().toLowerCase() === username) {
      target = users[i];
    }
  }

  if (!target) return { success: false, message: 'User not found in database.' };
  if (target.role === 'admin' && adminCount <= 1) {
    return { success: false, message: 'Cannot delete the only remaining Admin account in database!' };
  }

  deleteRowFromSheet(SHEETS.USERS, 'username', username);
  return { success: true, message: 'User "' + username + '" deleted from database.' };
}

function verifyAdminAccess(data) {
  var inputKey = String((data && data.key) || '').trim();
  if (!inputKey) return { success: false, message: 'Security key or password is required.' };

  // Check 1: Matches server-side API_SECRET (only configured inside private Google Apps Script)
  if (typeof API_SECRET !== 'undefined' && API_SECRET && inputKey === API_SECRET) {
    return { success: true };
  }

  // Check 2: Matches any Admin account password in the database (via SHA-256 hash comparison)
  ensureUsersTable();
  var inputHash = hashPassword(inputKey);
  var users = getTableData(SHEETS.USERS);
  for (var i = 0; i < users.length; i++) {
    if (users[i].role === 'admin' && String(users[i].passwordHash).trim() === inputHash) {
      return { success: true };
    }
  }

  return { success: false, message: 'Invalid security key or admin password!' };
}


