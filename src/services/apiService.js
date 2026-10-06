// API Abstraction Service Layer for DIVY IMPEX
// This layer abstracts data persistence so mock data can later be swapped out with
// Google Apps Script endpoint calls or Spring Boot REST APIs without changing UI components.

import { INITIAL_COMPANIES, INITIAL_WORKERS, INITIAL_DIAMONDS, INITIAL_HISTORIES } from '../data/mockData';

const STORAGE_KEYS = {
  COMPANIES: 'divy_companies_v1',
  WORKERS: 'divy_workers_v1',
  DIAMONDS: 'divy_diamonds_v1',
  HISTORIES: 'divy_histories_v1',
};

// Helper: Initialize LocalStorage if empty
const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(INITIAL_COMPANIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WORKERS)) {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(INITIAL_WORKERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DIAMONDS)) {
    localStorage.setItem(STORAGE_KEYS.DIAMONDS, JSON.stringify(INITIAL_DIAMONDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HISTORIES)) {
    localStorage.setItem(STORAGE_KEYS.HISTORIES, JSON.stringify(INITIAL_HISTORIES));
  }
};

initializeStorage();

const getItem = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setItem = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Date helper
const getFormattedCurrentTime = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { dateStr, timeStr, isoDate: now.toISOString().split('T')[0] };
};

export const apiService = {
  // Reset demo data to default initial state
  resetDataToDefault: async () => {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(INITIAL_COMPANIES));
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(INITIAL_WORKERS));
    localStorage.setItem(STORAGE_KEYS.DIAMONDS, JSON.stringify(INITIAL_DIAMONDS));
    localStorage.setItem(STORAGE_KEYS.HISTORIES, JSON.stringify(INITIAL_HISTORIES));
    return true;
  },

  // COMPANIES API
  getCompanies: async () => {
    return getItem(STORAGE_KEYS.COMPANIES);
  },

  getCompanyById: async (id) => {
    const companies = getItem(STORAGE_KEYS.COMPANIES);
    return companies.find((c) => c.id === id) || null;
  },

  addCompany: async (companyData) => {
    const companies = getItem(STORAGE_KEYS.COMPANIES);
    const newCompany = {
      id: `comp-${Date.now()}`,
      status: 'ACTIVE',
      ...companyData,
    };
    companies.push(newCompany);
    setItem(STORAGE_KEYS.COMPANIES, companies);
    return newCompany;
  },

  updateCompany: async (id, companyData) => {
    const companies = getItem(STORAGE_KEYS.COMPANIES);
    const index = companies.findIndex((c) => c.id === id);
    if (index !== -1) {
      companies[index] = { ...companies[index], ...companyData };
      setItem(STORAGE_KEYS.COMPANIES, companies);
      return companies[index];
    }
    throw new Error('Company not found');
  },

  // WORKERS API
  getWorkers: async () => {
    return getItem(STORAGE_KEYS.WORKERS);
  },

  getWorkerById: async (id) => {
    const workers = getItem(STORAGE_KEYS.WORKERS);
    return workers.find((w) => w.id === id) || null;
  },

  addWorker: async (workerData) => {
    const workers = getItem(STORAGE_KEYS.WORKERS);
    const newWorker = {
      id: `w-${Date.now()}`,
      status: 'ACTIVE',
      ...workerData,
    };
    workers.push(newWorker);
    setItem(STORAGE_KEYS.WORKERS, workers);
    return newWorker;
  },

  updateWorker: async (id, workerData) => {
    const workers = getItem(STORAGE_KEYS.WORKERS);
    const index = workers.findIndex((w) => w.id === id);
    if (index !== -1) {
      workers[index] = { ...workers[index], ...workerData };
      setItem(STORAGE_KEYS.WORKERS, workers);
      return workers[index];
    }
    throw new Error('Worker not found');
  },

  // DIAMONDS API
  getDiamonds: async () => {
    return getItem(STORAGE_KEYS.DIAMONDS);
  },

  getDiamondByBarcode: async (barcode) => {
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);
    return diamonds.find((d) => d.barcode.toLowerCase() === barcode.trim().toLowerCase()) || null;
  },

  // RECEIVE NEW BATCH OF DIAMONDS
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

      // Check unique barcode rule
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

      existingDiamonds.push(newDiamond);
      createdDiamonds.push(newDiamond);

      // Log initial history
      histories.push({
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

    return createdDiamonds;
  },

  // ASSIGN DIAMOND TO WORKER
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

    histories.push({
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
    return diamond;
  },

  // WORKER ACTIONS
  startWork: async ({ barcode, workerId }) => {
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);
    const histories = getItem(STORAGE_KEYS.HISTORIES);

    const diamond = diamonds.find((d) => d.barcode === barcode);
    if (!diamond) throw new Error('Diamond not found');

    const { dateStr, timeStr } = getFormattedCurrentTime();

    diamond.status = 'IN PROGRESS';
    setItem(STORAGE_KEYS.DIAMONDS, diamonds);

    histories.push({
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
    diamond.completedBy = workerName || diamond.assignedWorkerName;

    setItem(STORAGE_KEYS.DIAMONDS, diamonds);

    histories.push({
      id: `hist-${Date.now()}`,
      diamondId: diamond.id,
      barcode: diamond.barcode,
      action: 'Work Completed',
      performedBy: diamond.completedBy,
      date: dateStr,
      time: timeStr,
      remarks: 'Worker marked diamond production completed'
    });

    setItem(STORAGE_KEYS.HISTORIES, histories);
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

    histories.push({
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
    return diamond;
  },

  // SUPERVISOR DEPOSIT VERIFICATION
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

    histories.push({
      id: `hist-${Date.now()}-v1`,
      diamondId: diamond.id,
      barcode: diamond.barcode,
      action: isApproved ? 'Barcode & Weight Verified' : 'QC Verification Failed (Rework)',
      performedBy: verifiedBy || 'QC Supervisor',
      date: dateStr,
      time: timeStr,
      remarks: `Orig Weight: ${diamond.weight} ct, Actual: ${actualWeight} ct. Diff: ${(diamond.weight - actualWeight).toFixed(3)} ct.`
    });

    histories.push({
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
    return diamond;
  },

  // DIAMOND HISTORY TIMELINE
  getDiamondHistory: async (diamondIdOrBarcode) => {
    const histories = getItem(STORAGE_KEYS.HISTORIES);
    const diamonds = getItem(STORAGE_KEYS.DIAMONDS);

    const matchedDiamond = diamonds.find(
      (d) => d.id === diamondIdOrBarcode || d.barcode.toLowerCase() === diamondIdOrBarcode.toLowerCase()
    );

    if (!matchedDiamond) return [];

    return histories
      .filter((h) => h.diamondId === matchedDiamond.id || h.barcode === matchedDiamond.barcode)
      .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
  }
};
