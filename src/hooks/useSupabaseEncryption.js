// src/hooks/useSupabaseEncryption.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { getMasterKey } from '../services/encryption';
import { 
  saveRecordsToSupabase, 
  loadRecordsFromSupabase,
  deleteRecordFromSupabase 
} from '../services/onnetService';

export const useSupabaseEncryption = (user) => {
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');
  const isSaving = useRef(false);

  // Initialize encryption key when user changes
  useEffect(() => {
    const initEncryption = async () => {
      if (user?.id && user?.email) {
        try {
          const key = await getMasterKey(user.id, user.email);
          setEncryptionKey(key);
        } catch (err) {
          setError('Failed to generate encryption key');
        }
      }
    };

    initEncryption();
  }, [user]);

  // Load records from Supabase
  const loadRecords = useCallback(async () => {
    if (!user?.id || !encryptionKey) {
      return null;
    }

    setIsLoading(true);
    setError(null);
    setSyncStatus('Loading...');

    try {
      const records = await loadRecordsFromSupabase(user.id, encryptionKey);
      setSyncStatus(`Loaded ${records?.length || 0} records`);
      return records;
    } catch (err) {
      setError(err.message || 'Failed to load records from cloud');
      setSyncStatus('Failed to load');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, encryptionKey]);

  // Save records to Supabase
  const saveRecords = useCallback(async (records) => {
    if (!user?.id || !encryptionKey) {
      return false;
    }

    // Prevent concurrent saves
    if (isSaving.current) {
      return false;
    }

    isSaving.current = true;
    setIsLoading(true);
    setError(null);
    setSyncStatus('Syncing...');

    try {
      const result = await saveRecordsToSupabase(records, user.id, encryptionKey);
      setSyncStatus('Synced successfully');
      return true;
    } catch (err) {
      setError(err.message || 'Failed to sync to cloud');
      setSyncStatus('Sync failed');
      return false;
    } finally {
      setIsLoading(false);
      isSaving.current = false;
    }
  }, [user, encryptionKey]);

  // Delete a record
  const deleteRecord = useCallback(async (recordId) => {
    if (!user?.id) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await deleteRecordFromSupabase(recordId, user.id);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete record');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Auto-save with debounce - FIXED
  const autoSave = useCallback(async (records) => {
    if (!user?.id || !encryptionKey) {
      return;
    }
    
    if (isSaving.current) {
      return;
    }
    
    // Clear any pending timeout
    clearTimeout(window._autoSaveTimeout);
    
    // Debounce: save after 3 seconds of inactivity
    window._autoSaveTimeout = setTimeout(async () => {
      if (records.length === 0) {
        return;
      }
      
      await saveRecords(records);
    }, 3000);
  }, [user, encryptionKey, saveRecords]);

  return {
    encryptionKey,
    isLoading,
    error,
    syncStatus,
    loadRecords,
    saveRecords,
    deleteRecord,
    autoSave
  };
};