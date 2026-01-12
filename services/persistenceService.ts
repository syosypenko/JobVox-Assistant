
import { SavedInterview, SyncStatus } from "../types";

const STORAGE_KEY = 'hirevoice_sessions';

const apiBase = typeof window === 'undefined'
  ? process.env.API_BASE || ''
  : (import.meta.env.VITE_API_BASE as string | undefined) ||
    (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api');

const remoteDBCall = async (method: string, path: string, data?: any) => {
  try {
    const res = await fetch(`${apiBase}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Remote DB call failed', err);
    throw err;
  }
};

export const persistenceService = {
  saveInterview: async (session: SavedInterview, onSyncUpdate?: (status: SyncStatus) => void) => {
    // 1. Local Save (Immediate)
    const sessions = persistenceService.getAllInterviewsLocal();
    const index = sessions.findIndex(s => s.id === session.id);
    
    const updatedSession = { ...session, syncStatus: 'syncing' as SyncStatus };
    
    if (index > -1) {
      sessions[index] = updatedSession;
    } else {
      sessions.unshift(updatedSession);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    if (onSyncUpdate) onSyncUpdate('syncing');

    // 2. Remote Sync (Postgres via backend)
    try {
      await remoteDBCall('POST', '/api/interviews', { id: session.id, payload: session });
      const finalSessions = persistenceService.getAllInterviewsLocal();
      const finalIndex = finalSessions.findIndex(s => s.id === session.id);
      if (finalIndex > -1) {
        finalSessions[finalIndex].syncStatus = 'synced';
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSessions));
      }
      if (onSyncUpdate) onSyncUpdate('synced');
    } catch (err) {
      console.error('Cloud Sync Failed', err);
      if (onSyncUpdate) onSyncUpdate('error');
    }
  },

  getAllInterviewsLocal: (): SavedInterview[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  deleteInterview: async (id: string) => {
    const sessions = persistenceService.getAllInterviewsLocal().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    try {
      await remoteDBCall('DELETE', `/api/interviews/${id}`);
    } catch (err) {
      console.warn('Remote delete failed', err);
    }
  },

  getInterviewById: (id: string): SavedInterview | undefined => {
    return persistenceService.getAllInterviewsLocal().find(s => s.id === id);
  },

  exportBackup: (): string => {
    return localStorage.getItem(STORAGE_KEY) || '[]';
  },

  importBackup: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) throw new Error('Invalid backup format');
      // Basic validation
      if (data.length > 0 && (!data[0].id || !data[0].updatedAt)) {
         console.warn('Backup data might be missing fields, but proceeding.');
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('Import failed', err);
      return false;
    }
  }
};
