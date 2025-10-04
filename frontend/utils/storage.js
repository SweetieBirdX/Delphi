import { createContext, useContext, useState, useEffect } from 'react';

/**
 * Offline storage utilities for managing check-in entries
 */

const StorageContext = createContext();

export const useOfflineStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useOfflineStorage must be used within a StorageProvider');
  }
  return context;
};

export const StorageProvider = ({ children }) => {
  const [offlineEntries, setOfflineEntries] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline entries from storage
  useEffect(() => {
    loadOfflineEntries();
  }, []);

  const loadOfflineEntries = () => {
    try {
      const stored = localStorage.getItem('delphi-offline-entries');
      if (stored) {
        const entries = JSON.parse(stored);
        setOfflineEntries(entries);
      }
    } catch (error) {
      console.error('Error loading offline entries:', error);
    }
  };

  const saveOfflineEntries = (entries) => {
    try {
      localStorage.setItem('delphi-offline-entries', JSON.stringify(entries));
      setOfflineEntries(entries);
    } catch (error) {
      console.error('Error saving offline entries:', error);
    }
  };

  const addOfflineEntry = (entry) => {
    try {
      const newEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'pending',
        ...entry
      };
      
      const updatedEntries = [...offlineEntries, newEntry];
      saveOfflineEntries(updatedEntries);
      
      return newEntry;
    } catch (error) {
      console.error('Error adding offline entry:', error);
      throw error;
    }
  };

  const removeOfflineEntry = (entryId) => {
    try {
      const updatedEntries = offlineEntries.filter(entry => entry.id !== entryId);
      saveOfflineEntries(updatedEntries);
    } catch (error) {
      console.error('Error removing offline entry:', error);
      throw error;
    }
  };

  const updateOfflineEntry = (entryId, updates) => {
    try {
      const updatedEntries = offlineEntries.map(entry => 
        entry.id === entryId ? { ...entry, ...updates } : entry
      );
      saveOfflineEntries(updatedEntries);
    } catch (error) {
      console.error('Error updating offline entry:', error);
      throw error;
    }
  };

  const clearOfflineEntries = () => {
    try {
      localStorage.removeItem('delphi-offline-entries');
      setOfflineEntries([]);
    } catch (error) {
      console.error('Error clearing offline entries:', error);
      throw error;
    }
  };

  const getOfflineEntries = () => {
    return offlineEntries;
  };

  const getPendingEntries = () => {
    return offlineEntries.filter(entry => entry.status === 'pending');
  };

  const getSyncedEntries = () => {
    return offlineEntries.filter(entry => entry.status === 'synced');
  };

  const getFailedEntries = () => {
    return offlineEntries.filter(entry => entry.status === 'failed');
  };

  const markEntryAsSynced = (entryId) => {
    updateOfflineEntry(entryId, { status: 'synced', syncedAt: new Date().toISOString() });
  };

  const markEntryAsFailed = (entryId, error) => {
    updateOfflineEntry(entryId, { 
      status: 'failed', 
      failedAt: new Date().toISOString(),
      error: error.message || error
    });
  };

  const syncOfflineEntries = async (syncFunction) => {
    try {
      const pendingEntries = getPendingEntries();
      
      if (pendingEntries.length === 0) {
        return { success: true, message: 'No pending entries to sync' };
      }

      const results = [];
      
      for (const entry of pendingEntries) {
        try {
          await syncFunction(entry);
          markEntryAsSynced(entry.id);
          results.push({ entry, success: true });
        } catch (error) {
          markEntryAsFailed(entry.id, error);
          results.push({ entry, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      return {
        success: failureCount === 0,
        message: `Synced ${successCount} entries, ${failureCount} failed`,
        results,
        successCount,
        failureCount
      };
    } catch (error) {
      console.error('Error syncing offline entries:', error);
      throw error;
    }
  };

  // EIP-712 signature utilities
  const generateOfflineSignature = async (entry, signer) => {
    try {
      const domain = {
        name: 'Delphi Ticket System',
        version: '1',
        chainId: 1234, // Monad testnet
        verifyingContract: process.env.NEXT_PUBLIC_TICKET_NFT_ADDRESS
      };
      
      const types = {
        OfflineEntry: [
          { name: 'ticketId', type: 'uint256' },
          { name: 'eventId', type: 'uint256' },
          { name: 'seatSerial', type: 'uint256' },
          { name: 'user', type: 'address' },
          { name: 'timestamp', type: 'uint256' }
        ]
      };
      
      const value = {
        ticketId: entry.ticketId,
        eventId: entry.eventId,
        seatSerial: entry.seatSerial,
        user: entry.user,
        timestamp: entry.timestamp
      };
      
      const signature = await signer._signTypedData(domain, types, value);
      
      return {
        domain,
        types,
        value,
        signature
      };
    } catch (error) {
      console.error('Error generating offline signature:', error);
      throw error;
    }
  };

  const verifyOfflineSignature = (entry, signature, expectedSigner) => {
    try {
      // TODO: Implement signature verification
      // This would use ethers.js to verify the EIP-712 signature
      console.log('Verifying signature for entry:', entry);
      console.log('Signature:', signature);
      console.log('Expected signer:', expectedSigner);
      
      // For now, return true (implement actual verification)
      return true;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  };

  const value = {
    // State
    offlineEntries,
    isOnline,
    
    // Entry management
    addOfflineEntry,
    removeOfflineEntry,
    updateOfflineEntry,
    clearOfflineEntries,
    getOfflineEntries,
    getPendingEntries,
    getSyncedEntries,
    getFailedEntries,
    
    // Status management
    markEntryAsSynced,
    markEntryAsFailed,
    
    // Sync operations
    syncOfflineEntries,
    
    // Signature utilities
    generateOfflineSignature,
    verifyOfflineSignature
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
};

// Utility functions for data persistence
export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to storage:', error);
    throw error;
  }
};

export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return defaultValue;
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from storage:', error);
    throw error;
  }
};

// IndexedDB utilities for larger data storage
export const openIndexedDB = (name, version) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('offlineEntries')) {
        const store = db.createObjectStore('offlineEntries', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

export const addToIndexedDB = async (storeName, data) => {
  try {
    const db = await openIndexedDB('DelphiStorage', 1);
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error adding to IndexedDB:', error);
    throw error;
  }
};

export const getFromIndexedDB = async (storeName, key) => {
  try {
    const db = await openIndexedDB('DelphiStorage', 1);
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting from IndexedDB:', error);
    throw error;
  }
};

export const getAllFromIndexedDB = async (storeName) => {
  try {
    const db = await openIndexedDB('DelphiStorage', 1);
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting all from IndexedDB:', error);
    throw error;
  }
};
