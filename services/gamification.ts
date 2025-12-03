
import { DailyReport, Achievement } from '../types';

// Definition of all available achievements
export const ALL_ACHIEVEMENTS: Omit<Achievement, 'isUnlocked' | 'unlockedAt'>[] = [
  {
    id: 'first_step',
    title: 'Primeiro Passo',
    description: 'Fez o primeiro registro emocional.',
    icon: 'Footprints',
    color: 'text-cyan-400'
  },
  {
    id: 'streak_3',
    title: 'Constância',
    description: '3 dias seguidos de registros.',
    icon: 'Flame',
    color: 'text-orange-400'
  },
  {
    id: 'zen_master',
    title: 'Mestre Zen',
    description: 'Registrou 3 momentos de calma.',
    icon: 'Wind',
    color: 'text-emerald-400'
  },
  {
    id: 'resilient',
    title: 'Resiliente',
    description: 'Registrou e enfrentou um dia difícil.',
    icon: 'Shield',
    color: 'text-purple-400'
  },
  {
    id: 'poet',
    title: 'Alma Poética',
    description: 'Gerou 5 poesias concretas.',
    icon: 'Feather',
    color: 'text-pink-400'
  },
  {
    id: 'explorer',
    title: 'Explorador',
    description: 'Adicionou localização a um registro.',
    icon: 'Map',
    color: 'text-yellow-400'
  },
  {
    id: 'voice',
    title: 'Voz Interior',
    description: 'Usou o recurso de gravação de áudio.',
    icon: 'Mic',
    color: 'text-blue-400'
  }
];

export const GamificationService = {
  calculateLevel: (reports: DailyReport[]) => {
    const totalXP = reports.length * 100; // 100 XP per entry
    const level = Math.floor(totalXP / 500) + 1; // Level up every 5 entries
    const progress = (totalXP % 500) / 500 * 100; // % to next level
    return { level, currentXP: totalXP, progress };
  },

  checkAchievements: (reports: DailyReport[], currentAchievements: Achievement[] = []): Achievement[] => {
    const unlockedIds = new Set(currentAchievements.map(a => a.id));
    const newAchievements: Achievement[] = [];

    // Helper to add if not already unlocked
    const unlock = (id: string) => {
      if (!unlockedIds.has(id)) {
        const base = ALL_ACHIEVEMENTS.find(a => a.id === id);
        if (base) {
          newAchievements.push({ ...base, isUnlocked: true, unlockedAt: Date.now() });
          unlockedIds.add(id);
        }
      }
    };

    // Logic checks
    if (reports.length > 0) unlock('first_step');

    // Count specific moods
    const calmCount = reports.filter(r => r.emotion.toLowerCase().includes('calm') || r.emotion.toLowerCase().includes('paz')).length;
    if (calmCount >= 3) unlock('zen_master');

    const sadCount = reports.filter(r => r.emotion.toLowerCase().includes('triste') || r.emotion.toLowerCase().includes('ansios')).length;
    if (sadCount >= 1) unlock('resilient');

    const poemCount = reports.filter(r => r.poetry).length;
    if (poemCount >= 5) unlock('poet');

    const locationCount = reports.filter(r => r.location).length;
    if (locationCount >= 1) unlock('explorer');

    const audioCount = reports.filter(r => r.transcription).length;
    if (audioCount >= 1) unlock('voice');

    // Streak Logic (Simplified)
    // In a real app, we'd check consecutive dates
    if (reports.length >= 3) unlock('streak_3');

    // Return the full list (old + new)
    return [...currentAchievements, ...newAchievements];
  },

  // Get display list (merged locked and unlocked)
  getDisplayList: (userAchievements: Achievement[] = []) => {
    const unlockedMap = new Map(userAchievements.map(a => [a.id, a]));
    
    return ALL_ACHIEVEMENTS.map(base => {
      const unlocked = unlockedMap.get(base.id);
      return unlocked || { ...base, isUnlocked: false };
    });
  }
};
