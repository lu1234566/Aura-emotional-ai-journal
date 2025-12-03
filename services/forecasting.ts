import { DailyReport, EmotionalForecast } from '../types';
import * as Gemini from './geminiService';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TIMES = ['Madrugada', 'Manhã', 'Tarde', 'Noite'];

// Helper to get time of day string
const getTimeOfDay = (date: Date): string => {
  const hour = date.getHours();
  if (hour < 6) return 'Madrugada';
  if (hour < 12) return 'Manhã';
  if (hour < 18) return 'Tarde';
  return 'Noite';
};

export const ForecastingService = {
  calculateForecast: async (reports: DailyReport[]): Promise<EmotionalForecast | null> => {
    if (reports.length < 3) return null; // Need some data

    // --- 1. Aggregation Logic ---
    const dayStats = Array(7).fill(0).map(() => ({ sumPositivity: 0, count: 0 }));
    const timeStats: Record<string, { sumPositivity: 0, count: 0 }> = {
      'Madrugada': { sumPositivity: 0, count: 0 },
      'Manhã': { sumPositivity: 0, count: 0 },
      'Tarde': { sumPositivity: 0, count: 0 },
      'Noite': { sumPositivity: 0, count: 0 },
    };

    reports.forEach(r => {
      const date = new Date(r.createdAt);
      const day = date.getDay();
      const time = getTimeOfDay(date);
      const positivity = r.positivityLevel || 5;

      dayStats[day].sumPositivity += positivity;
      dayStats[day].count += 1;

      timeStats[time].sumPositivity += positivity;
      timeStats[time].count += 1;
    });

    // --- 2. Find Extremes ---
    let bestDayIdx = -1, worstDayIdx = -1;
    let maxDayAvg = -1, minDayAvg = 11;

    dayStats.forEach((stat, i) => {
      if (stat.count > 0) {
        const avg = stat.sumPositivity / stat.count;
        if (avg > maxDayAvg) { maxDayAvg = avg; bestDayIdx = i; }
        if (avg < minDayAvg) { minDayAvg = avg; worstDayIdx = i; }
      }
    });

    let bestTime = "Dia", worstTime = "Noite";
    let maxTimeAvg = -1, minTimeAvg = 11;

    Object.entries(timeStats).forEach(([time, stat]) => {
      if (stat.count > 0) {
        const avg = stat.sumPositivity / stat.count;
        if (avg > maxTimeAvg) { maxTimeAvg = avg; bestTime = time; }
        if (avg < minTimeAvg) { minTimeAvg = avg; worstTime = time; }
      }
    });

    const stats = {
      bestDay: bestDayIdx > -1 ? DAYS[bestDayIdx] : "N/A",
      challengingDay: worstDayIdx > -1 ? DAYS[worstDayIdx] : "N/A",
      peakTime: bestTime,
      sensitiveTime: worstTime
    };

    // --- 3. AI Insight Generation ---
    // Only call AI if we are online, otherwise return generic
    let insight = "Continue registrando para previsões mais precisas.";
    if (navigator.onLine) {
       const aiMsg = await Gemini.generateForecastInsight(stats);
       if (aiMsg) insight = aiMsg;
    }

    // Determine Icon based on recent trend (last 3 days)
    const recent = reports.slice(0, 3);
    const recentAvg = recent.reduce((a, b) => a + (b.positivityLevel || 5), 0) / recent.length;
    let icon: 'sun' | 'cloud' | 'rain' | 'storm' = 'cloud';
    
    if (recentAvg >= 7) icon = 'sun';
    else if (recentAvg >= 5) icon = 'cloud';
    else if (recentAvg >= 3) icon = 'rain';
    else icon = 'storm';

    return {
      ...stats,
      insight,
      trendIcon: icon
    };
  }
};
