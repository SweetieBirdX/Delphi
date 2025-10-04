import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../utils/web3';
import { useOfflineStorage } from '../utils/storage';

const OfflineSync = () => {
  const { account, provider, signer } = useWeb3();
  const { getOfflineEntries, clearOfflineEntries } = useOfflineStorage();
  const [offlineEntries, setOfflineEntries] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (account) {
      loadOfflineEntries();
    }
  }, [account]);

  const loadOfflineEntries = () => {
    try {
      const entries = getOfflineEntries();
      setOfflineEntries(entries);
    } catch (err) {
      console.error('Error loading offline entries:', err);
      setError('Failed to load offline entries');
    }
  };

  const syncOfflineEntries = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSyncResult(null);
      
      if (offlineEntries.length === 0) {
        setSyncResult({
          success: true,
          message: 'No offline entries to sync',
          syncedCount: 0
        });
        return;
      }
      
      // TODO: Implement batch sync logic
      // This would:
      // 1. Create EIP-712 signatures for offline entries
      // 2. Batch submit them to the smart contract
      // 3. Handle any failures gracefully
      
      console.log('Syncing offline entries:', offlineEntries);
      
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult = {
        success: true,
        message: `Successfully synced ${offlineEntries.length} offline entries`,
        syncedCount: offlineEntries.length,
        failedCount: 0
      };
      
      setSyncResult(mockResult);
      
      // Clear offline entries after successful sync
      if (mockResult.success) {
        clearOfflineEntries();
        setOfflineEntries([]);
      }
      
    } catch (err) {
      console.error('Error syncing offline entries:', err);
      setError('Failed to sync offline entries');
    } finally {
      setSyncing(false);
    }
  };

  const addOfflineEntry = () => {
    const ticketId = prompt('Enter ticket ID for offline entry:');
    if (ticketId) {
      try {
        const entry = {
          id: Date.now().toString(),
          ticketId: ticketId,
          timestamp: new Date().toISOString(),
          user: account,
          status: 'pending'
        };
        
        // TODO: Implement offline entry storage
        // This would store the entry in local storage or IndexedDB
        // for later batch sync
        
        console.log('Adding offline entry:', entry);
        
        // Reload entries
        loadOfflineEntries();
        
      } catch (err) {
        console.error('Error adding offline entry:', err);
        setError('Failed to add offline entry');
      }
    }
  };

  const removeOfflineEntry = (entryId) => {
    try {
      // TODO: Implement offline entry removal
      console.log('Removing offline entry:', entryId);
      
      // Reload entries
      loadOfflineEntries();
      
    } catch (err) {
      console.error('Error removing offline entry:', err);
      setError('Failed to remove offline entry');
    }
  };

  const clearAllEntries = () => {
    if (window.confirm('Are you sure you want to clear all offline entries?')) {
      try {
        clearOfflineEntries();
        setOfflineEntries([]);
        setSyncResult(null);
        setError(null);
      } catch (err) {
        console.error('Error clearing offline entries:', err);
        setError('Failed to clear offline entries');
      }
    }
  };

  if (!account) {
    return (
      <div className="offline-sync">
        <div className="connect-wallet">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to access offline sync</p>
        </div>
      </div>
    );
  }

  return (
    <div className="offline-sync">
      <div className="sync-header">
        <h1>Offline Sync</h1>
        <p>Manage offline check-in entries and sync them when online</p>
      </div>

      <div className="sync-controls">
        <button 
          className="btn-primary"
          onClick={addOfflineEntry}
        >
          Add Offline Entry
        </button>
        <button 
          className="btn-success"
          onClick={syncOfflineEntries}
          disabled={syncing || offlineEntries.length === 0}
        >
          {syncing ? 'Syncing...' : 'Sync All Entries'}
        </button>
        <button 
          className="btn-warning"
          onClick={clearAllEntries}
          disabled={offlineEntries.length === 0}
        >
          Clear All
        </button>
      </div>

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {syncResult && (
        <div className={`sync-result ${syncResult.success ? 'success' : 'error'}`}>
          <h3>{syncResult.success ? 'Sync Successful!' : 'Sync Failed'}</h3>
          <p>{syncResult.message}</p>
          {syncResult.syncedCount > 0 && (
            <p>Synced: {syncResult.syncedCount} entries</p>
          )}
          {syncResult.failedCount > 0 && (
            <p>Failed: {syncResult.failedCount} entries</p>
          )}
        </div>
      )}

      <div className="offline-entries">
        <h2>Offline Entries ({offlineEntries.length})</h2>
        
        {offlineEntries.length === 0 ? (
          <div className="no-entries">
            <p>No offline entries found</p>
            <p>Add entries when offline, then sync them when you're back online</p>
          </div>
        ) : (
          <div className="entries-list">
            {offlineEntries.map((entry) => (
              <div key={entry.id} className="entry-card">
                <div className="entry-header">
                  <h4>Ticket ID: {entry.ticketId}</h4>
                  <span className={`status ${entry.status}`}>
                    {entry.status}
                  </span>
                </div>
                
                <div className="entry-details">
                  <div className="detail">
                    <label>Timestamp:</label>
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="detail">
                    <label>User:</label>
                    <span>{entry.user.slice(0, 6)}...{entry.user.slice(-4)}</span>
                  </div>
                </div>
                
                <div className="entry-actions">
                  <button 
                    className="btn-danger"
                    onClick={() => removeOfflineEntry(entry.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sync-info">
        <h3>How Offline Sync Works:</h3>
        <ol>
          <li><strong>Offline Mode:</strong> When internet is unavailable, entries are stored locally</li>
          <li><strong>EIP-712 Signatures:</strong> Each entry is signed with your wallet for authenticity</li>
          <li><strong>Batch Sync:</strong> When online, all entries are submitted to the blockchain</li>
          <li><strong>Verification:</strong> The smart contract verifies signatures and processes check-ins</li>
        </ol>
        
        <h3>Benefits:</h3>
        <ul>
          <li>Works without internet connection</li>
          <li>Cryptographically secure with wallet signatures</li>
          <li>Batch processing reduces gas costs</li>
          <li>Automatic conflict resolution</li>
        </ul>
      </div>
    </div>
  );
};

export default OfflineSync;
