
import { SavedCV } from "../types";

const STORAGE_KEY = 'hirevoice_saved_cvs';

export const cvStorageService = {
  getAllCVs: (): SavedCV[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCV: (name: string, cvText: string): SavedCV => {
    const cvs = cvStorageService.getAllCVs();
    const newCV: SavedCV = {
      id: crypto.randomUUID(),
      name,
      cvText,
      createdAt: Date.now()
    };
    cvs.unshift(newCV);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cvs));
    return newCV;
  },

  deleteCV: (id: string): void => {
    const cvs = cvStorageService.getAllCVs().filter(cv => cv.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cvs));
  },

  getCVById: (id: string): SavedCV | undefined => {
    return cvStorageService.getAllCVs().find(cv => cv.id === id);
  }
};
