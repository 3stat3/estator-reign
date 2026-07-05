// src/services/onnetService.js - FIXED
import { supabase } from '../../supabase';
import { encryptData, decryptData } from './encryption';

const TABLE_NAME = 'onnet_ela_records';

// Save all records to Supabase (encrypted)
export const saveRecordsToSupabase = async (records, userId, encryptionKey) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    
    const actualUserId = user.id;
    
    // Encrypt each record
    const encryptedRecords = await Promise.all(
      records.map(async (record, index) => {
        // CRITICAL FIX: ONLY use _id if it exists (it's the database ID)
        // If _id doesn't exist, generate a NEW UUID - NEVER use record.id
        const recordId = record._id || crypto.randomUUID();
        
        // Remove _id and id from the data to be encrypted
        // IMPORTANT: Don't include the numeric id in the encrypted data
        const { _id, id, ...recordData } = record;
        
        const encrypted = await encryptData(recordData, encryptionKey);
        
        return {
          id: recordId,
          user_id: actualUserId,
          encrypted_data: encrypted,
          updated_at: new Date().toISOString()
        };
      })
    );

    // Upsert records
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(encryptedRecords, { onConflict: 'id' })
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Load all records from Supabase (decrypted)
export const loadRecordsFromSupabase = async (userId, encryptionKey) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Decrypt each record
    const decryptedRecords = await Promise.all(
      data.map(async (record) => {
        try {
          const decrypted = await decryptData(record.encrypted_data, encryptionKey);
          // Ensure we preserve the database ID as _id
          return {
            ...decrypted,
            _id: record.id // Store the database ID
          };
        } catch (err) {
          return null;
        }
      })
    );

    const validRecords = decryptedRecords.filter(record => record !== null);
    return validRecords;
  } catch (error) {
    throw error;
  }
};

// Delete a single record
export const deleteRecordFromSupabase = async (recordId, userId) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId)
      .select();

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    throw error;
  }
};