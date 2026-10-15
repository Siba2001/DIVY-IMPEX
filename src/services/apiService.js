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
  SYNC_MODE: 'divy_sync_mode',
};

const SCRIPT_URL = (import.meta.env.VITE_GOOGLE_SCRIPT_URL || '').trim();

// Get sync mode: 'cloud' (Google Sheets sync) or 'local' (⚡ Turbo demo mode)
const getStoredSyncMode = () => {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.SYNC_MODE);
    if (val === 'local' || val === 'cloud') return val;
  } catch (e) {}
  return 'cloud';
};

let currentSyncMode = getStoredSyncMode();

const isRemoteApiEnabled = () => {
  return currentSyncMode === 'cloud' && Boolean(SCRIPT_URL && SCRIPT_URL.startsWith('http'));
};

// In-flight mutation cache to absorb rapid multiple clicks/submissions
const activeMutations = new Map();

// Helper: Call Google Apps Script Web App Endpoint
const callGas = async (action, data = null, method = 'POST') => {
  if (!SCRIPT_URL || !SCRIPT_URL.startsWith('http')) return null;

  if (method === 'GET') {
    const url = new URL(SCRIPT_URL);
    url.searchParams.set('action', action);
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      });
    }
    const res = await fetch(url.toString(), { redirect: 'follow' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch from Google Script');
    return json.data;
  } else {
    // Deduplication key for mutations
    const mutationKey = `${action}:${JSON.stringify(data || {})}`;
    if (activeMutations.has(mutationKey)) {
      return activeMutations.get(mutationKey);
    }

    const postPromise = (async () => {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, data }),
      });
      const json = await res.json();
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

  setSyncMode: (mode) => {
    currentSyncMode = mode;
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_MODE, mode);
    } catch (e) {}
    cachedInitialData = null;
    lastInitialDataFetchTime = 0;
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
          return remoteData;
        }
      } catch (err) {
        console.warn('[DIVY Sync] Initial data remote fetch failed, falling back to local cache:', err);
      }
      return localData;
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
        }
      })
      .catch((e) => {
        console.warn('[DIVY Sync] Silent background revalidation error:', e);
      });

    return localData;
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
      (c) => c.code && c.code.toUpperCase() === (companyData.code || '').toUpperCase()
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

    // Fire remote Google Sheets update non-blockingly
    fireGasBackground('addCompany', companyData);

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
      (w) => w.employeeId && w.employeeId.toUpperCase() === (workerData.employeeId || '').toUpperCase()
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

    fireGasBackground('addWorker', workerData);

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

      const newDiamond = {
        id: `dia-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        barcode: barcodeClean,
        companyId: company.id,
        companyCode: company.code,
        companyName: company.name,
        size: item.size,
        weight: parseFloat(item.weight),
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

      histories.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        diamondId: newDiamond.id,
        barcode: newDiamond.barcode,
        action: 'Diamond Received',
        performedBy: receivedBy || 'Supervisor',
        date: dateStr,
        time: timeStr,
        remarks: `Received from ${company.name}. Weight: ${newDiamond.weight} ct, Size: ${newDiamond.size}`
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

  getDiamondHistory: async (diamondIdOrBarcode) => {
    const histories = getItem(STORAGE_KEYS.HISTORIES);
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);

    const cleanQuery = (diamondIdOrBarcode || '').toString().toLowerCase();

    const matchedDiamond = diamonds.find(
      (d) => d.id === diamondIdOrBarcode || (d.barcode && d.barcode.toLowerCase() === cleanQuery)
    );

    if (matchedDiamond) {
      const localMatches = histories
        .filter((h) => h.diamondId === matchedDiamond.id || (h.barcode && h.barcode.toLowerCase() === matchedDiamond.barcode.toLowerCase()))
        .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

      if (localMatches.length > 0) {
        return localMatches;
      }
    }

    // Try remote fetch only if not available locally
    if (isRemoteApiEnabled()) {
      try {
        const remoteHistory = await callGas('getHistory', { diamondIdOrBarcode }, 'GET');
        if (Array.isArray(remoteHistory) && remoteHistory.length > 0) {
          const existing = getItem(STORAGE_KEYS.HISTORIES);
          const existingIds = new Set(existing.map((h) => h.id));
          remoteHistory.forEach((rh) => {
            if (!existingIds.has(rh.id)) existing.push(rh);
          });
          setItem(STORAGE_KEYS.HISTORIES, existing);
          return remoteHistory;
        }
      } catch (e) {
        console.warn('[DIVY Sync] Remote history fetch failed:', e);
      }
    }

    return [];
  }
};
