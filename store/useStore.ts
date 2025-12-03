



import { create } from 'zustand';
import { DailyReport, User, Mission } from '../types';
import { BackendService } from '../services/backend';
import { GamificationService } from '../services/gamification';
import { ApiService } from '../services/api';
import { CompanionService } from '../services/companion';
import { MissionService } from '../services/missions';

interface AppState {
  user: User | null;
  reports: DailyReport[];
  isLoading: boolean;
  view: 'home' | 'journal' | 'stats' | 'chat';
  isLight: boolean;
  messages: { role: 'user' | 'model'; text: string }[];
  isOnline: boolean;
  
  // Actions
  login: () => Promise<void>;
  logout: () => void;
  setView: (view: 'home' | 'journal' | 'stats' | 'chat') => void;
  fetchReports: () => Promise<void>;
  saveReport: (report: DailyReport) => Promise<void>;
  updateReport: (report: DailyReport) => Promise<void>;
  processPendingReport: (report: DailyReport) => Promise<void>;
  toggleTheme: () => void;
  addMessage: (text: string, isUser: boolean) => void;
  clearChat: () => void;
  initializeCompanion: () => Promise<void>;
  
  // Missions
  refreshMissions: () => void;
  completeMission: (missionId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => {
  // Setup listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => set({ isOnline: true }));
    window.addEventListener('offline', () => set({ isOnline: false }));
  }

  return {
    user: null,
    reports: [],
    isLoading: false,
    view: 'home',
    isLight: false,
    messages: [],
    isOnline: navigator.onLine,

    login: async () => {
      console.log('[Store] Action: Login');
      set({ isLoading: true });
      try {
        let user = await BackendService.signInWithGoogle();
        
        // Load stored achievements if any (mock logic, in real backend this comes with user)
        const storedAchievements = localStorage.getItem(`achievements_${user.id}`);
        if (storedAchievements) {
          user.achievements = JSON.parse(storedAchievements);
        } else {
          user.achievements = [];
        }

        // Initialize Missions
        user = MissionService.checkAndRefresh(user);
        
        // Persist the mission update immediately if it changed
        await BackendService.saveUser(user);

        set({ user });
        console.log('[Store] Login success:', user.name);
        await get().fetchReports();
        // Initialize Companion logic after reports are loaded
        await get().initializeCompanion();
      } catch (e) {
        console.error('[Store] Login failed:', e);
      } finally {
        set({ isLoading: false });
      }
    },

    logout: async () => {
      console.log('[Store] Action: Logout');
      await BackendService.signOut();
      set({ user: null, reports: [], view: 'home' });
    },

    setView: (view) => {
      console.log('[Store] View changed to:', view);
      set({ view });
    },

    fetchReports: async () => {
      const { user } = get();
      if (!user) return;
      console.log('[Store] Fetching reports for user:', user.id);
      set({ isLoading: true });
      try {
        const reports = await BackendService.getDailyEntries(user.id);
        reports.sort((a, b) => b.createdAt - a.createdAt);
        
        // Calculate Gamification Stats
        if (user) {
          const newAchievements = GamificationService.checkAchievements(reports, user.achievements || []);
          // Save if different (Mock)
          if (newAchievements.length !== (user.achievements?.length || 0)) {
             user.achievements = newAchievements;
             localStorage.setItem(`achievements_${user.id}`, JSON.stringify(newAchievements));
          }
          // Calculate Level
          const { level } = GamificationService.calculateLevel(reports);
          user.level = level;
        }

        set({ reports, user: { ...user } });
        console.log('[Store] Reports loaded:', reports.length);
      } catch (e) {
        console.error('[Store] Fetch failed:', e);
      } finally {
        set({ isLoading: false });
      }
    },

    initializeCompanion: async () => {
      const { user, reports, isOnline } = get();
      if (!user) return;
      
      try {
        const updatedUser = await CompanionService.checkAndRefresh(user, reports, isOnline);
        set({ user: updatedUser });
      } catch (e) {
        console.error("Failed to init companion", e);
      }
    },

    saveReport: async (report) => {
      console.log('[Store] Saving report...');
      set({ isLoading: true });
      try {
        await BackendService.saveDailyEntry(report);
        console.log('[Store] Report saved.');
        await get().fetchReports(); // Refresh list & update gamification
      } catch (e) {
        console.error('[Store] Save failed:', e);
        throw e; 
      } finally {
        set({ isLoading: false });
      }
    },

    updateReport: async (report) => {
      // Optimistic update for checklist toggles to feel snappy
      set(state => ({
        reports: state.reports.map(r => r.id === report.id ? report : r)
      }));
      
      try {
        await BackendService.updateDailyEntry(report);
      } catch (e) {
        console.error('[Store] Update failed:', e);
      }
    },

    processPendingReport: async (report) => {
      if (!get().isOnline) return;
      set({ isLoading: true });
      try {
        const updated = await ApiService.reanalyzeEntry(report, get().reports);
        await get().updateReport(updated);
        await get().fetchReports();
      } catch (e) {
        console.error("Failed to reanalyze", e);
      } finally {
        set({ isLoading: false });
      }
    },

    toggleTheme: () => {
      set((state) => {
        const next = !state.isLight;
        console.log('[Store] Toggling theme. Light mode:', next);
        document.documentElement.setAttribute('data-theme', next ? 'light' : 'dark');
        return { isLight: next };
      });
    },

    addMessage: (text, isUser) => {
      set(state => ({
         messages: [...state.messages, { role: isUser ? 'user' : 'model', text }]
      }));
    },
    
    clearChat: () => set({ messages: [] }),

    refreshMissions: () => {
      const { user } = get();
      if (user) {
        const updated = MissionService.checkAndRefresh(user);
        set({ user: updated });
        BackendService.saveUser(updated);
      }
    },

    completeMission: async (missionId: string) => {
      const { user } = get();
      if (!user || !user.dailyMissions) return;

      const updatedMissions = user.dailyMissions.map(m => 
        m.id === missionId ? { ...m, completed: true } : m
      );

      const updatedUser = { ...user, dailyMissions: updatedMissions };
      set({ user: updatedUser });
      await BackendService.saveUser(updatedUser);
    }
  };
});