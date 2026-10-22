// API Abstraction Service Layer for DIVY IMPEX
// High-performance Local-First Architecture with Asynchronous Google Sheets Cloud Sync

import { INITIAL_COMPANIES, INITIAL_WORKERS, INITIAL_DIAMONDS, INITIAL_HISTORIES } from '../data/mockData';

// Clear legacy mock data keys from earlier sessions
try {
  ['divy_companies_v1', 'divy_workers_v1', 'divy_diamonds_v1', 'divy_histories_v1'].forEach((k) => {
    localStorage.removeItem(k);
  });
} catch (e) {}

export const STORAGE_KEYS = {
  COMPANIES: 'divy_companies_clean',
  WORKERS: 'divy_workers_clean',
  DIAMONDS: 'divy_diamonds_clean',
  HISTORIES: 'divy_histories_clean',
  DISPATCHES: 'divy_dispatches_clean',
  SYNC_MODE: 'divy_sync_mode',
};

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxK3giDdjOqGwSJAm5M28l8SlgGwENHKbU0PDfka0ZMdEVDoJJ2LyKp2Oa3aDeU6pcz-A/exec';
const DEFAULT_API_SECRET = 'DIVY_SECURE_TOKEN_2026';

const SCRIPT_URL = (import.meta.env.VITE_GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL).trim();
const API_SECRET = (import.meta.env.VITE_API_SECRET || DEFAULT_API_SECRET).trim();

// Production: always use Google Sheets cloud sync
const currentSyncMode = 'cloud';

const isRemoteApiEnabled = () => {
  return Boolean(SCRIPT_URL && SCRIPT_URL.startsWith('http'));
};

// In-flight mutation cache to absorb rapid multiple clicks/submissions
const activeMutations = new Map();

// Helper: Call Google Apps Script Web App Endpoint
const callGas = async (action, data = null, method = 'POST') => {
  if (!SCRIPT_URL || !SCRIPT_URL.startsWith('http')) {
    throw new Error('Google Apps Script URL is missing or invalid in .env (VITE_GOOGLE_SCRIPT_URL).');
  }

  if (method === 'GET') {
    const url = new URL(SCRIPT_URL);
    url.searchParams.set('action', action);
    if (API_SECRET) url.searchParams.set('key', API_SECRET);
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      });
    }

    let res;
    try {
      res = await fetch(url.toString(), { redirect: 'follow' });
    } catch (netErr) {
      throw new Error(`Network error connecting to database: ${netErr.message}`);
    }

    if (res.status === 404) {
      throw new Error('Google Apps Script Web App returned 404 (Page Not Found). Please verify your Web App URL in .env.');
    }

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (parseErr) {
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error('Google Apps Script returned an HTML page instead of JSON. Ensure "Who has access" is set to "Anyone" and deploy a new version.');
      }
      throw new Error(`Invalid response format from database: ${text.slice(0, 100)}`);
    }

    if (!json.success) throw new Error(json.error || 'Failed to fetch from Google Script');
    return json.data;
  } else {
    // Deduplication key for mutations
    const mutationKey = `${action}:${JSON.stringify(data || {})}`;
    if (activeMutations.has(mutationKey)) {
      return activeMutations.get(mutationKey);
    }

    const postPromise = (async () => {
      const payload = { action, key: API_SECRET, data };
      let res;
      try {
        res = await fetch(SCRIPT_URL, {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(payload),
        });
      } catch (netErr) {
        throw new Error(`Network failure on POST to database: ${netErr.message}`);
      }

      if (res.status === 404) {
        throw new Error('Google Apps Script Web App returned 404 (Not Found).');
      }

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Database POST error: ${text.slice(0, 100)}`);
      }

      if (!json.success) throw new Error(json.error || 'Google Script request failed');
      return json.data;
    })();

    activeMutations.set(mutationKey, postPromise);
    postPromise.finally(() => {
      setTimeout(() => {
        activeMutations.delete(mutationKey);
      }, 3000);
    });

    return postPromise;
  }
};

// Helper: Fire-and-forget background push to Google Apps Script
const fireGasBackground = (action, data) => {
  if (!isRemoteApiEnabled()) return Promise.resolve(null);
  return callGas(action, data, 'POST').catch((err) => {
    console.warn(`[DIVY Sync] Background push failed for "${action}":`, err);
    return null;
  });
};

// Helper: Initialize LocalStorage if empty
const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WORKERS)) {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DIAMONDS)) {
    localStorage.setItem(STORAGE_KEYS.DIAMONDS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HISTORIES)) {
    localStorage.setItem(STORAGE_KEYS.HISTORIES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DISPATCHES)) {
    localStorage.setItem(STORAGE_KEYS.DISPATCHES, JSON.stringify([]));
  }
};

initializeStorage();

const getItem = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    return [];
  }
};

const setItem = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
};

// Date helper
const getFormattedCurrentTime = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { dateStr, timeStr, isoDate: now.toISOString().split('T')[0] };
};

let cachedInitialData = null;
let lastInitialDataFetchTime = 0;
const INITIAL_DATA_TTL = 60000; // 60 seconds memory cache

export const apiService = {
  isRemote: () => isRemoteApiEnabled(),

  getSyncMode: () => currentSyncMode,

  setSyncMode: (_mode) => {
    // No-op in production — always cloud
  },

  clearCache: () => {
    cachedInitialData = null;
    lastInitialDataFetchTime = 0;
  },

  // Instant 0ms boot using Stale-While-Revalidate pattern
  getInitialData: async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && cachedInitialData && (now - lastInitialDataFetchTime < INITIAL_DATA_TTL)) {
      return cachedInitialData;
    }

    const localData = {
      companies: getItem(STORAGE_KEYS.COMPANIES),
      workers: getItem(STORAGE_KEYS.WORKERS),
      diamonds: getItem(STORAGE_KEYS.DIAMONDS),
      histories: getItem(STORAGE_KEYS.HISTORIES),
    };

    const hasLocal = localData.companies.length > 0 || localData.workers.length > 0 || localData.diamonds.length > 0;

    if (hasLocal && !cachedInitialData) {
      cachedInitialData = localData;
    }

    // If local mode is forced or remote is disabled, return local immediately
    if (!isRemoteApiEnabled()) {
      return localData;
    }

    // If forceRefresh, await remote call
    if (forceRefresh || !hasLocal) {
      try {
        const remoteData = await callGas('getInitialData', null, 'GET');
        if (remoteData) {
          cachedInitialData = remoteData;
          lastInitialDataFetchTime = Date.now();
          if (remoteData.companies) setItem(STORAGE_KEYS.COMPANIES, remoteData.companies);
          if (remoteData.workers) setItem(STORAGE_KEYS.WORKERS, remoteData.workers);
          if (remoteData.diamonds) setItem(STORAGE_KEYS.DIAMONDS, remoteData.diamonds);
          if (remoteData.histories) setItem(STORAGE_KEYS.HISTORIES, remoteData.histories);
          return { ...remoteData, _syncError: null };
        }
      } catch (err) {
        console.warn('[DIVY Sync] Initial data remote fetch failed, falling back to local cache:', err);
        return { ...localData, _syncError: err.message };
      }
      return { ...localData, _syncError: null };
    }

    // Return instant local data in 0ms, revalidate in background silently!
    callGas('getInitialData', null, 'GET')
      .then((remoteData) => {
        if (remoteData) {
          cachedInitialData = remoteData;
          lastInitialDataFetchTime = Date.now();
          if (remoteData.companies) setItem(STORAGE_KEYS.COMPANIES, remoteData.companies);
          if (remoteData.workers) setItem(STORAGE_KEYS.WORKERS, remoteData.workers);
          if (remoteData.diamonds) setItem(STORAGE_KEYS.DIAMONDS, remoteData.diamonds);
          if (remoteData.histories) setItem(STORAGE_KEYS.HISTORIES, remoteData.histories);
          try {
            window.dispatchEvent(new CustomEvent('divy_remote_sync', { detail: remoteData }));
          } catch (e) {}
        }
      })
      .catch((e) => {
        console.warn('[DIVY Sync] Silent background revalidation error:', e);
      });

    return { ...localData, _syncError: null };
  },

  // Reset demo data to clean empty state or default
  resetDataToDefault: async () => {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(INITIAL_COMPANIES));
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(INITIAL_WORKERS));
    localStorage.setItem(STORAGE_KEYS.DIAMONDS, JSON.stringify(INITIAL_DIAMONDS));
    localStorage.setItem(STORAGE_KEYS.HISTORIES, JSON.stringify(INITIAL_HISTORIES));
    cachedInitialData = null;
    lastInitialDataFetchTime = 0;
    return true;
  },

  // ==================== COMPANIES API ====================
  getCompanies: async () => {
    return getItem(STORAGE_KEYS.COMPANIES);
  },

  getCompanyById: async (id) => {
    const companies = getItem(STORAGE_KEYS.COMPANIES);
    return companies.find((c) => c.id === id) || null;
  },

  addCompany: async (companyData) => {
    const companies = getItem(STORAGE_KEYS.COMPANIES);
    const existing = companies.find(
      (c) => c.code && String(c.code).toUpperCase() === String(companyData.code || '').toUpperCase()
    );
    if (existing) return existing;

    const newCompany = {
      id: `comp-${Date.now()}`,
      status: 'ACTIVE',
      ...companyData,
    };
    companies.unshift(newCompany);
    setItem(STORAGE_KEYS.COMPANIES, companies);

    if (cachedInitialData) {
      cachedInitialData.companies = companies;
    }

    // Fire remote Google Sheets update non-blockingly with complete company record
    fireGasBackground('addCompany', newCompany);

    return newCompany;
  },

  updateCompany: async (id, companyData) => {
    const companies = getItem(STORAGE_KEYS.COMPANIES);
    const index = companies.findIndex((c) => c.id === id);
    if (index !== -1) {
      companies[index] = { ...companies[index], ...companyData };
      setItem(STORAGE_KEYS.COMPANIES, companies);
      if (cachedInitialData) {
        cachedInitialData.companies = companies;
      }
      fireGasBackground('updateCompany', { id, ...companyData });
      return companies[index];
    }
    throw new Error('Company not found');
  },

  deleteCompany: async (id) => {
    const companies = getItem(STORAGE_KEYS.COMPANIES);
    const updated = companies.filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.COMPANIES, updated);
    if (cachedInitialData) {
      cachedInitialData.companies = updated;
    }
    fireGasBackground('deleteCompany', { id });
    return { id, deleted: true };
  },

  // ==================== WORKERS API ====================
  getWorkers: async () => {
    return getItem(STORAGE_KEYS.WORKERS);
  },

  getWorkerById: async (id) => {
    const workers = getItem(STORAGE_KEYS.WORKERS);
    return workers.find((w) => w.id === id) || null;
  },

  addWorker: async (workerData) => {
    const workers = getItem(STORAGE_KEYS.WORKERS);
    const existing = workers.find(
      (w) => w.employeeId && String(w.employeeId).toUpperCase() === String(workerData.employeeId || '').toUpperCase()
    );
    if (existing) return existing;

    const newWorker = {
      id: `w-${Date.now()}`,
      status: 'ACTIVE',
      ...workerData,
    };
    workers.unshift(newWorker);
    setItem(STORAGE_KEYS.WORKERS, workers);

    if (cachedInitialData) {
      cachedInitialData.workers = workers;
    }

    fireGasBackground('addWorker', newWorker);

    return newWorker;
  },

  updateWorker: async (id, workerData) => {
    const workers = getItem(STORAGE_KEYS.WORKERS);
    const index = workers.findIndex((w) => w.id === id);
    if (index !== -1) {
      workers[index] = { ...workers[index], ...workerData };
      setItem(STORAGE_KEYS.WORKERS, workers);
      if (cachedInitialData) {
        cachedInitialData.workers = workers;
      }
      fireGasBackground('updateWorker', { id, ...workerData });
      return workers[index];
    }
    throw new Error('Worker not found');
  },

  deleteWorker: async (id) => {
    const workers = getItem(STORAGE_KEYS.WORKERS);
    const updated = workers.filter((w) => w.id !== id);
    setItem(STORAGE_KEYS.WORKERS, updated);
    if (cachedInitialData) {
      cachedInitialData.workers = updated;
    }
    fireGasBackground('deleteWorker', { id });
    return { id, deleted: true };
  },

  // ==================== DIAMONDS API ====================
  getDiamonds: async () => {
    return getItem(STORAGE_KEYS.DIAMONDS);
  },

  getDiamondByBarcode: async (barcode) => {
    const cleanBarcode = barcode.trim().toLowerCase();
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);
    return diamonds.find((d) => (d.barcode || '').toLowerCase() === cleanBarcode) || null;
  },

  receiveDiamondsBatch: async ({ companyId, receivedDate, receivedBy, remarks, diamondsList }) => {
    const companies = getItem(STORAGE_KEYS.COMPANIES);
    const company = companies.find((c) => c.id === companyId);
    if (!company) throw new Error('Invalid Company selected');

    const existingDiamonds = getItem(STORAGE_KEYS.DIAMONDS);
    const histories = getItem(STORAGE_KEYS.HISTORIES);
    const { dateStr, timeStr } = getFormattedCurrentTime();

    const createdDiamonds = [];

    for (const item of diamondsList) {
      const barcodeClean = item.barcode.trim().toUpperCase();

      if (existingDiamonds.some((d) => d.barcode === barcodeClean)) {
        throw new Error(`Barcode ${barcodeClean} already exists in the system!`);
      }

      const shapeVal = item.shape ? item.shape.trim() : 'Emperal';
      const roughCutVal = item.roughCutNo ? String(item.roughCutNo).trim() : '';

      const newDiamond = {
        id: `dia-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        barcode: barcodeClean,
        roughCutNo: roughCutVal,
        companyId: company.id,
        companyCode: company.code,
        companyName: company.name,
        shape: shapeVal,
        size: shapeVal || item.size || '-',
        weight: parseFloat(item.weight),
        scaleWeight: item.scaleWeight ? parseFloat(item.scaleWeight) : parseFloat(item.weight),
        targetWeight: item.targetWeight ? parseFloat(item.targetWeight) : null,
        actualWeight: null,
        receivedDate: receivedDate || new Date().toISOString().split('T')[0],
        receivedBy: receivedBy || 'Supervisor',
        assignedWorkerId: null,
        assignedWorkerName: null,
        assignedDate: null,
        status: 'RECEIVED',
        completedDate: null,
        completedBy: null,
        depositedDate: null,
        verifiedDate: null,
        verifiedBy: null,
        remarks: item.remarks || remarks || 'Received in batch'
      };

      existingDiamonds.unshift(newDiamond);
      createdDiamonds.push(newDiamond);

      const weightLog = `Kacha Wt: ${newDiamond.weight} ct` +
        (newDiamond.targetWeight ? `, Teyar Wt: ${newDiamond.targetWeight} ct` : '') +
        (roughCutVal ? `, Rough No: ${roughCutVal}` : '') +
        (shapeVal ? `, Shape: ${shapeVal}` : '');

      histories.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        diamondId: newDiamond.id,
        barcode: newDiamond.barcode,
        action: 'Diamond Received',
        performedBy: receivedBy || 'Supervisor',
        date: dateStr,
        time: timeStr,
        remarks: `Received from ${company.name}. ${weightLog}${item.remarks ? ` [${item.remarks}]` : ''}`
      });
    }

    setItem(STORAGE_KEYS.DIAMONDS, existingDiamonds);
    setItem(STORAGE_KEYS.HISTORIES, histories);

    if (cachedInitialData) {
      cachedInitialData.diamonds = existingDiamonds;
      cachedInitialData.histories = histories;
    }

    fireGasBackground('receiveDiamondsBatch', { companyId, receivedDate, receivedBy, remarks, diamondsList });

    return createdDiamonds;
  },

  assignDiamond: async ({ barcode, workerId, assignedBy }) => {
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);
    const workers = getItem(STORAGE_KEYS.WORKERS);
    const histories = getItem(STORAGE_KEYS.HISTORIES);

    const diamond = diamonds.find((d) => d.barcode === barcode);
    if (!diamond) throw new Error('Diamond not found');

    const worker = workers.find((w) => w.id === workerId);
    if (!worker) throw new Error('Worker not found');

    if (diamond.assignedWorkerId && diamond.status !== 'RECEIVED' && diamond.status !== 'REWORK') {
      throw new Error(`Diamond ${barcode} is already assigned to ${diamond.assignedWorkerName}!`);
    }

    const { dateStr, timeStr, isoDate } = getFormattedCurrentTime();

    diamond.assignedWorkerId = worker.id;
    diamond.assignedWorkerName = worker.name;
    diamond.assignedDate = isoDate;
    diamond.status = 'ASSIGNED';

    setItem(STORAGE_KEYS.DIAMONDS, diamonds);

    histories.unshift({
      id: `hist-${Date.now()}`,
      diamondId: diamond.id,
      barcode: diamond.barcode,
      action: `Assigned to ${worker.name}`,
      performedBy: assignedBy || 'Supervisor',
      date: dateStr,
      time: timeStr,
      remarks: `Assigned for ${worker.department} work`
    });

    setItem(STORAGE_KEYS.HISTORIES, histories);

    if (cachedInitialData) {
      cachedInitialData.diamonds = diamonds;
      cachedInitialData.histories = histories;
    }

    fireGasBackground('assignDiamond', { barcode, workerId, assignedBy });

    return diamond;
  },

  startWork: async ({ barcode, workerId }) => {
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);
    const histories = getItem(STORAGE_KEYS.HISTORIES);

    const diamond = diamonds.find((d) => d.barcode === barcode);
    if (!diamond) throw new Error('Diamond not found');

    const { dateStr, timeStr } = getFormattedCurrentTime();

    diamond.status = 'IN PROGRESS';
    setItem(STORAGE_KEYS.DIAMONDS, diamonds);

    histories.unshift({
      id: `hist-${Date.now()}`,
      diamondId: diamond.id,
      barcode: diamond.barcode,
      action: 'Work Started',
      performedBy: diamond.assignedWorkerName || 'Worker',
      date: dateStr,
      time: timeStr,
      remarks: 'Production work in progress'
    });

    setItem(STORAGE_KEYS.HISTORIES, histories);

    if (cachedInitialData) {
      cachedInitialData.diamonds = diamonds;
      cachedInitialData.histories = histories;
    }

    fireGasBackground('startWork', { barcode, workerId });

    return diamond;
  },

  markWorkCompleted: async ({ barcode, workerName }) => {
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);
    const histories = getItem(STORAGE_KEYS.HISTORIES);

    const diamond = diamonds.find((d) => d.barcode === barcode);
    if (!diamond) throw new Error('Diamond not found');

    const { dateStr, timeStr, isoDate } = getFormattedCurrentTime();

    diamond.status = 'WORK COMPLETED';
    diamond.completedDate = isoDate;
    diamond.completedBy = workerName || diamond.assignedWorkerName || 'Worker';

    setItem(STORAGE_KEYS.DIAMONDS, diamonds);

    histories.unshift({
      id: `hist-${Date.now()}`,
      diamondId: diamond.id,
      barcode: diamond.barcode,
      action: 'Work Completed',
      performedBy: diamond.completedBy,
      date: dateStr,
      time: timeStr,
      remarks: 'Artisan finished processing, ready for deposit'
    });

    setItem(STORAGE_KEYS.HISTORIES, histories);

    if (cachedInitialData) {
      cachedInitialData.diamonds = diamonds;
      cachedInitialData.histories = histories;
    }

    fireGasBackground('markWorkCompleted', { barcode, workerName });

    return diamond;
  },

  depositDiamond: async ({ barcode, workerName }) => {
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);
    const histories = getItem(STORAGE_KEYS.HISTORIES);

    const diamond = diamonds.find((d) => d.barcode === barcode);
    if (!diamond) throw new Error('Diamond not found');

    const { dateStr, timeStr, isoDate } = getFormattedCurrentTime();

    diamond.status = 'DEPOSITED';
    diamond.depositedDate = isoDate;

    setItem(STORAGE_KEYS.DIAMONDS, diamonds);

    histories.unshift({
      id: `hist-${Date.now()}`,
      diamondId: diamond.id,
      barcode: diamond.barcode,
      action: 'Diamond Deposited',
      performedBy: workerName || diamond.assignedWorkerName || 'Worker',
      date: dateStr,
      time: timeStr,
      remarks: 'Returned to safe for barcode & weight verification'
    });

    setItem(STORAGE_KEYS.HISTORIES, histories);

    if (cachedInitialData) {
      cachedInitialData.diamonds = diamonds;
      cachedInitialData.histories = histories;
    }

    fireGasBackground('depositDiamond', { barcode, workerName });

    return diamond;
  },

  verifyDiamond: async ({ barcode, actualWeight, isApproved, verifiedBy, remarks }) => {
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);
    const histories = getItem(STORAGE_KEYS.HISTORIES);

    const diamond = diamonds.find((d) => d.barcode === barcode);
    if (!diamond) throw new Error('Diamond not found');

    const { dateStr, timeStr, isoDate } = getFormattedCurrentTime();

    diamond.actualWeight = parseFloat(actualWeight);
    diamond.verifiedDate = isoDate;
    diamond.verifiedBy = verifiedBy || 'QC Supervisor';

    if (isApproved) {
      diamond.status = 'COMPLETED';
    } else {
      diamond.status = 'REWORK';
    }

    if (remarks) {
      diamond.remarks = remarks;
    }

    setItem(STORAGE_KEYS.DIAMONDS, diamonds);

    histories.unshift({
      id: `hist-${Date.now()}-v1`,
      diamondId: diamond.id,
      barcode: diamond.barcode,
      action: isApproved ? 'Barcode & Weight Verified' : 'QC Verification Failed (Rework)',
      performedBy: verifiedBy || 'QC Supervisor',
      date: dateStr,
      time: timeStr,
      remarks: `Orig Weight: ${diamond.weight} ct, Actual: ${actualWeight} ct. Diff: ${(diamond.weight - actualWeight).toFixed(3)} ct.`
    });

    histories.unshift({
      id: `hist-${Date.now()}-v2`,
      diamondId: diamond.id,
      barcode: diamond.barcode,
      action: `Status changed to ${diamond.status}`,
      performedBy: verifiedBy || 'QC Supervisor',
      date: dateStr,
      time: timeStr,
      remarks: isApproved ? 'Approved & marked COMPLETED' : 'Flagged for REWORK'
    });

    setItem(STORAGE_KEYS.HISTORIES, histories);

    if (cachedInitialData) {
      cachedInitialData.diamonds = diamonds;
      cachedInitialData.histories = histories;
    }

    fireGasBackground('verifyDiamond', { barcode, actualWeight, isApproved, verifiedBy, remarks });

    return diamond;
  },

  generateSynthesizedHistory: (diamond) => {
    if (!diamond) return [];
    const events = [];

    if (diamond.receivedDate) {
      events.push({
        id: `synth-rec-${diamond.id || diamond.barcode}`,
        diamondId: diamond.id || '',
        barcode: diamond.barcode,
        action: 'Diamond Received',
        performedBy: diamond.receivedBy || 'Admin Supervisor',
        date: diamond.receivedDate,
        time: '09:00 AM',
        remarks: `Received from ${diamond.companyName || 'Client Company'}. Weight: ${diamond.weight} ct`
      });
    }

    if (diamond.assignedWorkerName || diamond.assignedDate) {
      events.push({
        id: `synth-asg-${diamond.id || diamond.barcode}`,
        diamondId: diamond.id || '',
        barcode: diamond.barcode,
        action: `Assigned to ${diamond.assignedWorkerName || 'Worker'}`,
        performedBy: 'Supervisor',
        date: diamond.assignedDate || diamond.receivedDate,
        time: '10:00 AM',
        remarks: 'Assigned for diamond processing work'
      });
    }

    if (['IN PROGRESS', 'WORK COMPLETED', 'DEPOSITED', 'VERIFIED', 'COMPLETED', 'RETURNED'].includes(diamond.status)) {
      events.push({
        id: `synth-prog-${diamond.id || diamond.barcode}`,
        diamondId: diamond.id || '',
        barcode: diamond.barcode,
        action: 'Work Started',
        performedBy: diamond.assignedWorkerName || 'Worker',
        date: diamond.assignedDate || diamond.receivedDate,
        time: '11:00 AM',
        remarks: 'Artisan processing work started'
      });
    }

    if (['WORK COMPLETED', 'DEPOSITED', 'VERIFIED', 'COMPLETED', 'RETURNED'].includes(diamond.status)) {
      events.push({
        id: `synth-comp-${diamond.id || diamond.barcode}`,
        diamondId: diamond.id || '',
        barcode: diamond.barcode,
        action: 'Work Completed',
        performedBy: diamond.completedBy || diamond.assignedWorkerName || 'Worker',
        date: diamond.completedDate || diamond.assignedDate || diamond.receivedDate,
        time: '04:00 PM',
        remarks: 'Artisan finished processing, diamond ready for safe deposit'
      });
    }

    if (['DEPOSITED', 'VERIFIED', 'COMPLETED', 'RETURNED'].includes(diamond.status)) {
      events.push({
        id: `synth-dep-${diamond.id || diamond.barcode}`,
        diamondId: diamond.id || '',
        barcode: diamond.barcode,
        action: 'Diamond Deposited',
        performedBy: diamond.assignedWorkerName || 'Worker',
        date: diamond.depositedDate || diamond.completedDate || diamond.receivedDate,
        time: '05:00 PM',
        remarks: 'Returned to safe vault for verification'
      });
    }

    if (['VERIFIED', 'COMPLETED', 'RETURNED'].includes(diamond.status)) {
      events.push({
        id: `synth-ver-${diamond.id || diamond.barcode}`,
        diamondId: diamond.id || '',
        barcode: diamond.barcode,
        action: 'Barcode & Weight Verified',
        performedBy: diamond.verifiedBy || 'QC Supervisor',
        date: diamond.verifiedDate || diamond.completedDate || diamond.receivedDate,
        time: '05:30 PM',
        remarks: `Weight verified: ${diamond.actualWeight || diamond.weight} ct`
      });
    }

    if (diamond.status === 'RETURNED') {
      events.push({
        id: `synth-ret-${diamond.id || diamond.barcode}`,
        diamondId: diamond.id || '',
        barcode: diamond.barcode,
        action: 'Submitted to Company',
        performedBy: diamond.receiverName || 'Dispatch Supervisor',
        date: diamond.dispatchedDate || diamond.verifiedDate || diamond.receivedDate,
        time: '06:00 PM',
        remarks: `Returned to ${diamond.companyName || 'Company'}${diamond.challanNo ? ` under Challan #${diamond.challanNo}` : ''}`
      });
    }

    return events;
  },

  getLocalHistory: (diamondIdOrBarcode, diamondObj = null) => {
    const sanitizeHistoryItem = (h) => {
      if (!h) return h;
      let cleanTime = h.time;
      if (!cleanTime || String(cleanTime).includes('1899') || String(cleanTime).includes('1900')) {
        const match = String(h.id || '').match(/\d{12,13}/);
        if (match) {
          try {
            const dt = new Date(parseInt(match[0], 10));
            if (!isNaN(dt.getTime())) {
              cleanTime = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
          } catch (e) {}
        }
      }
      return { ...h, time: cleanTime };
    };

    const histories = getItem(STORAGE_KEYS.HISTORIES);
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);
    const cleanQuery = String(diamondIdOrBarcode || '').trim().toLowerCase();

    const diamond = diamondObj || diamonds.find(
      (d) => String(d.id || '').toLowerCase() === cleanQuery || String(d.barcode || '').trim().toLowerCase() === cleanQuery
    );

    const targetBarcode = String(diamond?.barcode || diamondIdOrBarcode || '').trim().toLowerCase();
    const targetId = String(diamond?.id || '').trim().toLowerCase();

    const localMatches = histories
      .filter((h) => {
        const hBarcode = String(h.barcode || '').trim().toLowerCase();
        const hDiamondId = String(h.diamondId || '').trim().toLowerCase();
        return (targetBarcode && hBarcode === targetBarcode) ||
               (targetId && hDiamondId === targetId) ||
               (cleanQuery && (hBarcode === cleanQuery || hDiamondId === cleanQuery));
      })
      .map(sanitizeHistoryItem)
      .sort((a, b) => new Date(a.date + ' ' + (a.time || '')) - new Date(b.date + ' ' + (b.time || '')));

    if (localMatches.length > 0) {
      return localMatches;
    }

    if (diamond) {
      return apiService.generateSynthesizedHistory(diamond);
    }

    return [];
  },

  getDiamondHistory: async (diamondIdOrBarcode, diamondObj = null) => {
    // 1. Immediately get local or synthesized history (0ms)
    const immediate = apiService.getLocalHistory(diamondIdOrBarcode, diamondObj);

    // 2. If remote API is not configured or disabled, return immediate
    if (!isRemoteApiEnabled()) {
      return immediate;
    }

    // 3. Quick bounded remote fetch (never hangs: 4.5 second hard timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const url = new URL(SCRIPT_URL);
      url.searchParams.set('action', 'getHistory');
      url.searchParams.set('diamondIdOrBarcode', diamondIdOrBarcode);
      if (API_SECRET) url.searchParams.set('key', API_SECRET);

      const res = await fetch(url.toString(), { redirect: 'follow', signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const sanitizeHistoryItem = (h) => {
            if (!h) return h;
            let cleanTime = h.time;
            if (!cleanTime || String(cleanTime).includes('1899') || String(cleanTime).includes('1900')) {
              const match = String(h.id || '').match(/\d{12,13}/);
              if (match) {
                try {
                  const dt = new Date(parseInt(match[0], 10));
                  if (!isNaN(dt.getTime())) {
                    cleanTime = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                  }
                } catch (e) {}
              }
            }
            return { ...h, time: cleanTime };
          };

          const sanitizedRemote = json.data.map(sanitizeHistoryItem);
          const existing = getItem(STORAGE_KEYS.HISTORIES);
          const existingIds = new Set(existing.map((h) => h.id));
          sanitizedRemote.forEach((rh) => {
            if (!existingIds.has(rh.id)) existing.push(rh);
          });
          setItem(STORAGE_KEYS.HISTORIES, existing);
          return sanitizedRemote;
        }
      }
    } catch (e) {
      console.warn('[DIVY Sync] Remote history quick-fetch notice:', e.message);
    }

    return immediate;
  },

  // ==================== COMPANY SUBMISSION & DISPATCH API ====================
  getDispatches: async () => {
    return getItem(STORAGE_KEYS.DISPATCHES) || [];
  },

  submitDiamondsToCompany: async ({ companyId, barcodes, challanNo, dispatchDate, receiverName, remarks, dispatchedBy }) => {
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);
    const companies = getItem(STORAGE_KEYS.COMPANIES);
    const histories = getItem(STORAGE_KEYS.HISTORIES);
    const dispatches = getItem(STORAGE_KEYS.DISPATCHES) || [];
    const { dateStr, timeStr, isoDate } = getFormattedCurrentTime();

    const company = companies.find((c) => c.id === companyId);
    const effectiveDispatchDate = dispatchDate || isoDate;
    const effectiveChallanNo = (challanNo || '').trim() || `DC-${company?.code || 'DIVY'}-${Date.now().toString().slice(-6)}`;
    const effectiveDispatchedBy = dispatchedBy || 'Dispatch Supervisor';
    const effectiveReceiver = (receiverName || '').trim() || (company?.contactPerson || 'Authorized Representative');

    const barcodeSet = new Set((barcodes || []).map((b) => String(b).toUpperCase()));
    const targetDiamonds = diamonds.filter((d) => barcodeSet.has(String(d.barcode || '').toUpperCase()));

    if (targetDiamonds.length === 0) {
      throw new Error('No valid diamonds selected for company submission');
    }

    let totalOrigWeight = 0;
    let totalActWeight = 0;
    const snapshots = [];

    targetDiamonds.forEach((d) => {
      d.status = 'RETURNED';
      d.dispatchedDate = effectiveDispatchDate;
      d.challanNo = effectiveChallanNo;
      d.receiverName = effectiveReceiver;
      d.dispatchRemarks = remarks || '';

      const origW = parseFloat(d.weight) || 0;
      const actW = parseFloat(d.actualWeight || d.weight) || 0;
      totalOrigWeight += origW;
      totalActWeight += actW;

      snapshots.push({
        id: d.id,
        barcode: d.barcode,
        size: d.size,
        weight: origW,
        actualWeight: actW,
        workerName: d.assignedWorkerName || '-'
      });

      histories.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        diamondId: d.id,
        barcode: d.barcode,
        action: 'Submitted to Company',
        performedBy: effectiveDispatchedBy,
        date: dateStr,
        time: timeStr,
        remarks: `Returned to ${company?.name || d.companyName || 'Company'} under Challan #${effectiveChallanNo}. Receiver: ${effectiveReceiver}`
      });
    });

    const newDispatch = {
      id: `disp-${Date.now()}`,
      challanNo: effectiveChallanNo,
      companyId: company?.id || targetDiamonds[0]?.companyId,
      companyCode: company?.code || targetDiamonds[0]?.companyCode,
      companyName: company?.name || targetDiamonds[0]?.companyName,
      dispatchDate: effectiveDispatchDate,
      dispatchTime: timeStr,
      diamondsCount: targetDiamonds.length,
      totalOriginalWeight: parseFloat(totalOrigWeight.toFixed(3)),
      totalActualWeight: parseFloat(totalActWeight.toFixed(3)),
      receiverName: effectiveReceiver,
      dispatchedBy: effectiveDispatchedBy,
      remarks: remarks || '',
      barcodes: targetDiamonds.map((d) => d.barcode),
      diamonds: snapshots
    };

    dispatches.unshift(newDispatch);
    setItem(STORAGE_KEYS.DISPATCHES, dispatches);
    setItem(STORAGE_KEYS.DIAMONDS, diamonds);
    setItem(STORAGE_KEYS.HISTORIES, histories);

    if (cachedInitialData) {
      cachedInitialData.diamonds = diamonds;
      cachedInitialData.histories = histories;
      cachedInitialData.dispatches = dispatches;
    }

    fireGasBackground('submitDiamondsToCompany', newDispatch);

    return newDispatch;
  }
};
