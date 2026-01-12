
import { SavedInterview } from "../types";

const STORAGE_KEY = 'hirevoice_sessions';

export const storageService = {
  saveInterview: (session: SavedInterview) => {
    const sessions = storageService.getAllInterviews();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index > -1) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },

  getAllInterviews: (): SavedInterview[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  deleteInterview: (id: string) => {
    const sessions = storageService.getAllInterviews().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },

  getInterviewById: (id: string): SavedInterview | undefined => {
    return storageService.getAllInterviews().find(s => s.id === id);
  }
};
