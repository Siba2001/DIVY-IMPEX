import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService, STORAGE_KEYS, normalizeDiamond } from '../services/apiService';

const DiamondContext = createContext();

const CACHE_KEY = 'divy_app_cache_v2';

const getInitialLocalCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          companies: parsed.companies || [],
          workers: parsed.workers || [],
          diamonds: (parsed.diamonds || []).map(normalizeDiamond),
          histories: parsed.histories || []
        };
      }
    }
    // Fallback to storage keys
    const c = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]');
    const w = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKERS) || '[]');
    const d = JSON.parse(localStorage.getItem(STORAGE_KEYS.DIAMONDS) || '[]').map(normalizeDiamond);
    const h = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORIES) || '[]');
    return { companies: c, workers: w, diamonds: d, histories: h };
  } catch (e) { }
  return { companies: [], workers: [], diamonds: [], histories: [] };
};

const saveLocalCache = (companies, workers, diamonds, histories = []) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ companies, workers, diamonds, histories }));
  } catch (e) { }
};

export const DiamondProvider = ({ children }) => {
  const initialCache = getInitialLocalCache();
  const [companies, setCompanies] = useState(initialCache.companies);
  const [workers, setWorkers] = useState(initialCache.workers);
  const [diamonds, setDiamonds] = useState(initialCache.diamonds);
  const [dispatches, setDispatches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DISPATCHES) || '[]');
    } catch (e) {
      return [];
    }
  });

  const hasCachedData = initialCache.companies.length > 0 || initialCache.workers.length > 0 || initialCache.diamonds.length > 0;
  const [loading, setLoading] = useState(!hasCachedData);
  const [toastMessage, setToastMessage] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [toastTimer, setToastTimer] = useState(null);

  const hideToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToastMessage({ message, type, timestamp: Date.now() });
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
    setToastTimer(timer);
  }, [toastTimer]);

  // High performance SWR data loader
  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading && !hasCachedData) setLoading(true);
    try {
      const initial = await apiService.getInitialData(showLoading);
      if (initial._syncError) {
        setSyncError(initial._syncError);
      } else {
        setSyncError(null);
      }

      const newCompanies = initial.companies || [];
      const newWorkers = initial.workers || [];
      const newDiamonds = initial.diamonds || [];
      const newHistories = initial.histories || [];

      // Only overwrite local state if sync had no error OR returned real data
      if (!initial._syncError || newCompanies.length > 0 || newWorkers.length > 0 || newDiamonds.length > 0) {
        setCompanies(newCompanies);
        setWorkers(newWorkers);
        setDiamonds(newDiamonds);
        if (newHistories.length > 0) {
          try {
            localStorage.setItem(STORAGE_KEYS.HISTORIES, JSON.stringify(newHistories));
          } catch (e) { }
        }
        saveLocalCache(newCompanies, newWorkers, newDiamonds, newHistories);
      }
    } catch (err) {
      console.warn('Sync notice:', err);
      setSyncError(err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  }, [hasCachedData]);

  useEffect(() => {
    // If local cache is empty (e.g. fresh session or pulled code), force refresh to fetch directly from Google Sheet
    loadData(!hasCachedData);
  }, [loadData, hasCachedData]);

  // Listen for background remote sync updates from apiService
  useEffect(() => {
    const handleRemoteSync = (e) => {
      const data = e.detail;
      if (data) {
        const cleanDiamonds = Array.isArray(data.diamonds) ? data.diamonds.map(normalizeDiamond) : [];
        if (Array.isArray(data.companies)) setCompanies(data.companies);
        if (Array.isArray(data.workers)) setWorkers(data.workers);
        if (cleanDiamonds.length > 0) setDiamonds(cleanDiamonds);
        saveLocalCache(
          data.companies || [],
          data.workers || [],
          cleanDiamonds,
          data.histories || []
        );
        setSyncError(null);
      }
    };

    window.addEventListener('divy_remote_sync', handleRemoteSync);
    return () => window.removeEventListener('divy_remote_sync', handleRemoteSync);
  }, []);

  // ==================== FAST OPTIMISTIC ACTIONS (0ms) ====================
  const addCompany = async (companyData) => {
    const res = await apiService.addCompany(companyData);
    setCompanies((prev) => {
      const updated = [res, ...prev.filter((c) => c.id !== res.id)];
      saveLocalCache(updated, workers, diamonds);
      return updated;
    });
    showToast(`Company "${res.name}" added successfully!`);
    return res;
  };

  const updateCompany = async (id, companyData) => {
    const res = await apiService.updateCompany(id, companyData);
    setCompanies((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...res } : c));
      saveLocalCache(updated, workers, diamonds);
      return updated;
    });
    showToast(`Company "${res.name || 'details'}" updated!`);
    return res;
  };

  const deleteCompany = async (id) => {
    await apiService.deleteCompany(id);
    setCompanies((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveLocalCache(updated, workers, diamonds);
      return updated;
    });
    showToast('Company removed successfully!', 'info');
  };

  const addWorker = async (workerData) => {
    const res = await apiService.addWorker(workerData);
    setWorkers((prev) => {
      const updated = [res, ...prev.filter((w) => w.id !== res.id)];
      saveLocalCache(companies, updated, diamonds);
      return updated;
    });
    showToast(`Worker "${res.name}" added!`);
    return res;
  };

  const updateWorker = async (id, workerData) => {
    const res = await apiService.updateWorker(id, workerData);
    setWorkers((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, ...res } : w));
      saveLocalCache(companies, updated, diamonds);
      return updated;
    });
    showToast(`Worker "${res.name || 'details'}" updated!`);
    return res;
  };

  const deleteWorker = async (id) => {
    await apiService.deleteWorker(id);
    setWorkers((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      saveLocalCache(companies, updated, diamonds);
      return updated;
    });
    showToast('Worker removed successfully!', 'info');
  };

  const receiveBatch = async (batchData) => {
    const created = await apiService.receiveDiamondsBatch(batchData);
    const newItems = Array.isArray(created) ? created : [created];
    setDiamonds((prev) => {
      const updated = [...newItems, ...prev];
      saveLocalCache(companies, workers, updated);
      return updated;
    });
    showToast(`Successfully received batch of ${newItems.length} diamonds!`);
    return created;
  };

  const assignWorker = async ({ barcode, workerId, assignedBy }) => {
    const res = await apiService.assignDiamond({ barcode, workerId, assignedBy });
    setDiamonds((prev) => {
      const updated = prev.map((d) => (d.barcode === barcode ? { ...d, ...res } : d));
      saveLocalCache(companies, workers, updated);
      return updated;
    });
    showToast(`Diamond ${barcode} assigned to ${res.assignedWorkerName}!`);
    return res;
  };

  const assignWorkersBatch = async ({ barcodes, workerId, assignedBy }) => {
    const res = await apiService.assignDiamondsBatch({ barcodes, workerId, assignedBy });
    const barcodeSet = new Set((barcodes || []).map((b) => String(b).trim().toUpperCase()));

    setDiamonds((prev) => {
      const updated = prev.map((d) =>
        barcodeSet.has(String(d.barcode || '').trim().toUpperCase())
          ? {
              ...d,
              assignedWorkerId: workerId,
              assignedWorkerName: res.workerName,
              assignedDate: new Date().toISOString().split('T')[0],
              status: 'ASSIGNED'
            }
          : d
      );
      saveLocalCache(companies, workers, updated);
      return updated;
    });
    showToast(`Successfully assigned ${res.assignedCount} diamonds to ${res.workerName}!`, 'success');
    return res;
  };

  const startWorkerWork = async ({ barcode, workerId }) => {
    const res = await apiService.startWork({ barcode, workerId });
    setDiamonds((prev) => {
      const updated = prev.map((d) => (d.barcode === barcode ? { ...d, ...res } : d));
      saveLocalCache(companies, workers, updated);
      return updated;
    });
    showToast(`Work started on diamond ${barcode}`);
    return res;
  };

  const markWorkCompleted = async ({ barcode, workerName }) => {
    const res = await apiService.markWorkCompleted({ barcode, workerName });
    setDiamonds((prev) => {
      const updated = prev.map((d) => (d.barcode === barcode ? { ...d, ...res } : d));
      saveLocalCache(companies, workers, updated);
      return updated;
    });
    showToast(`Diamond ${barcode} marked WORK COMPLETED!`);
    return res;
  };

  const depositDiamond = async ({ barcode, workerName }) => {
    const res = await apiService.depositDiamond({ barcode, workerName });
    setDiamonds((prev) => {
      const updated = prev.map((d) => (d.barcode === barcode ? { ...d, ...res } : d));
      saveLocalCache(companies, workers, updated);
      return updated;
    });
    showToast(`Diamond ${barcode} deposited for QC verification!`);
    return res;
  };

  const verifyDiamond = async (verifyPayload) => {
    const res = await apiService.verifyDiamond(verifyPayload);
    setDiamonds((prev) => {
      const updated = prev.map((d) => (d.barcode === verifyPayload.barcode ? { ...d, ...res } : d));
      saveLocalCache(companies, workers, updated);
      return updated;
    });
    if (verifyPayload.isApproved) {
      showToast(`Diamond ${verifyPayload.barcode} verified & COMPLETED!`, 'success');
    } else {
      showToast(`Diamond ${verifyPayload.barcode} rejected & sent for REWORK!`, 'warning');
    }
    return res;
  };

  const submitDiamondsToCompany = async (submissionPayload) => {
    const dispatchRecord = await apiService.submitDiamondsToCompany(submissionPayload);
    const barcodeSet = new Set((submissionPayload.barcodes || []).map((b) => String(b).toUpperCase()));

    setDiamonds((prev) => {
      const updated = prev.map((d) =>
        barcodeSet.has(String(d.barcode || '').toUpperCase())
          ? {
            ...d,
            status: 'RETURNED',
            dispatchedDate: dispatchRecord.dispatchDate,
            challanNo: dispatchRecord.challanNo,
            receiverName: dispatchRecord.receiverName
          }
          : d
      );
      saveLocalCache(companies, workers, updated);
      return updated;
    });

    setDispatches((prev) => [dispatchRecord, ...prev.filter((dp) => dp.id !== dispatchRecord.id)]);
    showToast(`Successfully returned ${dispatchRecord.diamondsCount} diamonds to ${dispatchRecord.companyName}!`, 'success');
    return dispatchRecord;
  };

  const resetAllData = async () => {
    await apiService.resetDataToDefault();
    setCompanies([]);
    setWorkers([]);
    setDiamonds([]);
    saveLocalCache([], [], []);
    showToast('Clean state restored successfully!', 'info');
  };

  // Helper metrics calculations
  const getKpis = () => {
    const totalCompanies = companies.length;
    const totalDiamonds = diamonds.length;

    const today = new Date().toISOString().split('T')[0];
    const todaysReceived = diamonds.filter((d) => d.receivedDate === today).length;

    const completed = diamonds.filter((d) => ['COMPLETED', 'VERIFIED'].includes(d.status)).length;
    const inProduction = diamonds.filter((d) => ['IN PROGRESS', 'WORK COMPLETED'].includes(d.status)).length;
    const pending = diamonds.filter((d) => ['RECEIVED', 'ASSIGNED', 'DEPOSITED', 'REWORK'].includes(d.status)).length;
    const workCompleted = diamonds.filter((d) => d.status === 'WORK COMPLETED').length;
    const deposited = diamonds.filter((d) => d.status === 'DEPOSITED').length;
    const verified = diamonds.filter((d) => d.status === 'VERIFIED').length;

    return {
      totalCompanies,
      totalDiamonds,
      todaysReceived,
      pending,
      inProduction,
      workCompleted,
      deposited,
      verified,
      completed
    };
  };

  return (
    <DiamondContext.Provider
      value={{
        companies,
        workers,
        diamonds,
        loading,
        syncError,
        toastMessage,
        showToast,
        hideToast,
        loadData,
        addCompany,
        updateCompany,
        deleteCompany,
        addWorker,
        updateWorker,
        deleteWorker,
        receiveBatch,
        assignWorker,
        assignWorkersBatch,
        startWorkerWork,
        markWorkCompleted,
        depositDiamond,
        verifyDiamond,
        dispatches,
        submitDiamondsToCompany,
        resetAllData,
        getKpis
      }}
    >
      {children}
    </DiamondContext.Provider>
  );
};

export const useDiamonds = () => {
  const context = useContext(DiamondContext);
  if (!context) {
    throw new Error('useDiamonds must be used within DiamondProvider');
  }
  return context;
};
