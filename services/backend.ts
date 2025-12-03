

import { DailyReport, User } from '../types';
import { wait } from './utils';

// --- Backend Service (Mock / LocalStorage Implementation) ---
// This replaces the real Firebase backend to allow the app to run 
// without configuration/environment errors.

const STORAGE_KEY_ENTRIES = "aura_daily_entries_v1";
const STORAGE_KEY_USER = "aura_user_v1";

export const BackendService = {
  // Auth Mock
  signInWithGoogle: async (): Promise<User> => {
    console.log('[Backend-Mock] Signing in...');
    await wait(800); // Simulate network delay
    
    // Check local storage for existing user with companion data
    const existing = localStorage.getItem(STORAGE_KEY_USER);
    if (existing) {
      return JSON.parse(existing);
    }
    
    const mockUser: User = {
      id: "mock-user-123",
      name: "Viajante da Aura",
      email: "demo@aura.app",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
    };
    
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mockUser));
    return mockUser;
  },

  saveUser: async (user: User): Promise<void> => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  },

  signOut: async () => {
    console.log('[Backend-Mock] Signing out...');
    localStorage.removeItem(STORAGE_KEY_USER);
  },

  // Firestore Mock: daily_entries
  saveDailyEntry: async (entry: DailyReport): Promise<void> => {
    console.log('[Backend-Mock] Saving entry...', entry);
    await wait(600);

    const existingJson = localStorage.getItem(STORAGE_KEY_ENTRIES);
    const entries: DailyReport[] = existingJson ? JSON.parse(existingJson) : [];
    
    // Add new entry
    entries.push(entry);
    
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    console.log('[Backend-Mock] Saved. Total entries:', entries.length);
  },

  updateDailyEntry: async (updatedEntry: DailyReport): Promise<void> => {
    console.log('[Backend-Mock] Updating entry...', updatedEntry.id);
    // await wait(300); // Fast update

    const existingJson = localStorage.getItem(STORAGE_KEY_ENTRIES);
    let entries: DailyReport[] = existingJson ? JSON.parse(existingJson) : [];
    
    entries = entries.map(e => e.id === updatedEntry.id ? updatedEntry : e);
    
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
  },

  getDailyEntries: async (userId: string): Promise<DailyReport[]> => {
    console.log('[Backend-Mock] Fetching entries for', userId);
    await wait(500);

    const existingJson = localStorage.getItem(STORAGE_KEY_ENTRIES);
    const entries: DailyReport[] = existingJson ? JSON.parse(existingJson) : [];
    
    // Filter by user (mock logic)
    const userEntries = entries.filter(e => e.userId === userId);
    
    return userEntries;
  },
  
  // Storage Mock
  uploadFile: async (file: File, userId: string): Promise<string> => {
    console.log('[Backend-Mock] Uploading file...', file.name);
    await wait(1000);
    
    // In a mock environment, we just use the local Object URL 
    // so the image displays immediately without a real server.
    return URL.createObjectURL(file);
  }
};