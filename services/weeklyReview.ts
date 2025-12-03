
import { DailyReport, WeeklyReviewData } from '../types';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const WeeklyReviewService = {
  calculate: (reports: DailyReport[]): WeeklyReviewData | null => {
    // 1. Filter Last 7 Days
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyReports = reports.filter(r => r.createdAt >= oneWeekAgo && !r.pendingAnalysis);

    if (weeklyReports.length < 2) return null; // Need at least some data

    // 2. Sort by date desc
    weeklyReports.sort((a, b) => b.createdAt - a.createdAt);

    // 3. Find Best Day (Highest Positivity)
    const bestReport = [...weeklyReports].sort((a, b) => (b.positivityLevel || 0) - (a.positivityLevel || 0))[0];
    const bestDay = {
      date: DAYS[new Date(bestReport.createdAt).getDay()],
      emotion: bestReport.emotion,
      summary: bestReport.summary
    };

    // 4. Find Tense Moment (Lowest Positivity or High Stress)
    const tenseReport = [...weeklyReports].sort((a, b) => {
        const stressA = a.semanticAnalysis?.stressIndex || 0;
        const stressB = b.semanticAnalysis?.stressIndex || 0;
        // Prioritize stress index if available, else inverse positivity
        if (stressA !== stressB) return stressB - stressA;
        return (a.positivityLevel || 0) - (b.positivityLevel || 0);
    })[0];
    
    let tenseMoment = null;
    if ((tenseReport.positivityLevel || 10) < 5 || (tenseReport.semanticAnalysis?.stressIndex || 0) > 50) {
        tenseMoment = {
            date: DAYS[new Date(tenseReport.createdAt).getDay()],
            emotion: tenseReport.emotion,
            trigger: tenseReport.semanticAnalysis?.keywords?.[0] || "Sobrecarga"
        };
    }

    // 5. Dominant Mood
    const counts: Record<string, number> = {};
    weeklyReports.forEach(r => { counts[r.emotion] = (counts[r.emotion] || 0) + 1; });
    const dominantMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

    // 6. Best Artifact (Prioritize poem + avatar presence)
    const artisticReport = [...weeklyReports].sort((a, b) => {
        let scoreA = (a.poetry ? 2 : 0) + (a.avatarImageUrl ? 1 : 0) + (a.positivityLevel || 0)/10;
        let scoreB = (b.poetry ? 2 : 0) + (b.avatarImageUrl ? 1 : 0) + (b.positivityLevel || 0)/10;
        return scoreB - scoreA;
    })[0];

    const bestArtifact = {
        poem: artisticReport.poetry,
        avatarUrl: artisticReport.avatarImageUrl,
        emotion: artisticReport.emotion
    };

    // 7. Places
    const places = new Set<string>();
    weeklyReports.forEach(r => {
        r.suggestedPlaces?.forEach(p => places.add(p.name));
    });

    const start = new Date(weeklyReports[weeklyReports.length - 1].createdAt);
    const end = new Date(weeklyReports[0].createdAt);

    return {
        range: `${start.getDate()}/${start.getMonth()+1} - ${end.getDate()}/${end.getMonth()+1}`,
        bestDay,
        tenseMoment,
        dominantMood,
        bestArtifact,
        topPlaces: Array.from(places).slice(0, 3),
        totalEntries: weeklyReports.length
    };
  }
};
