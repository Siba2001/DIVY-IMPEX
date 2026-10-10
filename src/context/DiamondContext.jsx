import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

const DiamondContext = createContext();

export const DiamondProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cData, wData, dData] = await Promise.all([
        apiService.getCompanies(),
        apiService.getWorkers(),
        apiService.getDiamonds()
      ]);
      setCompanies(cData);
      setWorkers(wData);
      setDiamonds(dData);
    } catch (err) {
      console.error('Failed loading diamond management data', err);
      showToast('Error loading data', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const addCompany = async (companyData) => {
    const res = await apiService.addCompany(companyData);
    await loadData();
    showToast(`Company ${res.name} added successfully!`);
    return res;
  };

  const updateCompany = async (id, companyData) => {
    const res = await apiService.updateCompany(id, companyData);
    await loadData();
    showToast(`Company ${res.name} updated!`);
    return res;
  };

  const addWorker = async (workerData) => {
    const res = await apiService.addWorker(workerData);
    await loadData();
    showToast(`Worker ${res.name} added!`);
    return res;
  };

  const updateWorker = async (id, workerData) => {
    const res = await apiService.updateWorker(id, workerData);
    await loadData();
    showToast(`Worker ${res.name} updated!`);
    return res;
  };

  const receiveBatch = async (batchData) => {
    const created = await apiService.receiveDiamondsBatch(batchData);
    await loadData();
    showToast(`Successfully received batch of ${created.length} diamonds!`);
    return created;
  };

  const assignWorker = async ({ barcode, workerId, assignedBy }) => {
    const res = await apiService.assignDiamond({ barcode, workerId, assignedBy });
    await loadData();
    showToast(`Diamond ${barcode} assigned to ${res.assignedWorkerName}!`);
    return res;
  };

  const startWorkerWork = async ({ barcode, workerId }) => {
    const res = await apiService.startWork({ barcode, workerId });
    await loadData();
    showToast(`Work started on diamond ${barcode}`);
    return res;
  };

  const markWorkCompleted = async ({ barcode, workerName }) => {
    const res = await apiService.markWorkCompleted({ barcode, workerName });
    await loadData();
    showToast(`Diamond ${barcode} marked WORK COMPLETED!`);
    return res;
  };

  const depositDiamond = async ({ barcode, workerName }) => {
    const res = await apiService.depositDiamond({ barcode, workerName });
    await loadData();
    showToast(`Diamond ${barcode} deposited for QC verification!`);
    return res;
  };

  const verifyDiamond = async (verifyPayload) => {
    const res = await apiService.verifyDiamond(verifyPayload);
    await loadData();
    if (verifyPayload.isApproved) {
      showToast(`Diamond ${verifyPayload.barcode} verified & COMPLETED!`, 'success');
    } else {
      showToast(`Diamond ${verifyPayload.barcode} rejected & sent for REWORK!`, 'warning');
    }
    return res;
  };

  const resetAllData = async () => {
    await apiService.resetDataToDefault();
    await loadData();
    showToast('Demo data restored to initial default state!', 'info');
  };

  // Helper metrics calculations
  const getKpis = () => {
    const totalCompanies = companies.length;
    const totalDiamonds = diamonds.length;
    
    // Today ISO
    const today = new Date().toISOString().split('T')[0];
    const todaysReceived = diamonds.filter(d => d.receivedDate === today).length;
    
    const completed = diamonds.filter(d => ['COMPLETED', 'VERIFIED'].includes(d.status)).length;
    const inProduction = diamonds.filter(d => ['IN PROGRESS', 'WORK COMPLETED'].includes(d.status)).length;
    const pending = diamonds.filter(d => ['RECEIVED', 'ASSIGNED', 'DEPOSITED', 'REWORK'].includes(d.status)).length;
    const workCompleted = diamonds.filter(d => d.status === 'WORK COMPLETED').length;
    const deposited = diamonds.filter(d => d.status === 'DEPOSITED').length;
    const verified = diamonds.filter(d => d.status === 'VERIFIED').length;

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
        toastMessage,
        showToast,
        loadData,
        addCompany,
        updateCompany,
        addWorker,
        updateWorker,
        receiveBatch,
        assignWorker,
        startWorkerWork,
        markWorkCompleted,
        depositDiamond,
        verifyDiamond,
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
