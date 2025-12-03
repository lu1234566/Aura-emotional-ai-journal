

import React, { useMemo, useEffect, useState } from 'react';
import { useAppStore } from '../../store/useStore';
import { EmotionalTimeline } from './EmotionalTimeline';
import { SoulCrystal } from './SoulCrystal';
import { AchievementsList } from './AchievementsList';
import { ForecastWidget } from './ForecastWidget';
import { GamificationService } from '../../services/gamification';
import { ForecastingService } from '../../services/forecasting';
import { EmotionalForecast } from '../../types';
import { Calendar, Zap, TrendingUp, Trophy } from 'lucide-react';

export const StatsView = () => {
  const { reports, isLight, user } = useAppStore();
  const [forecast, setForecast] = useState<EmotionalForecast | null>(null);

  useEffect(() => {
    const loadForecast = async () => {
      const data = await ForecastingService.calculateForecast(reports);
      setForecast(data);
    };
    loadForecast();
  }, [reports]);

  const stats = useMemo(() => {
    if (reports.length === 0) return null;
    
    const total = reports.length;
    const avgEnergy = reports.reduce((acc, r) => acc + (r.energyLevel || 5), 0) / total;
    
    // Find most frequent emotion
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.emotion] = (counts[r.emotion] || 0) + 1; });
    const topEmotion = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

    // Gamification
    const { level, progress } = GamificationService.calculateLevel(reports);
    const achievementsList = GamificationService.getDisplayList(user?.achievements || []);

    return { total, avgEnergy, topEmotion, level, progress, achievementsList };
  }, [reports, user]);

  return (
    <div className="h-full pt-8 pb-20 px-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
       <div className="flex justify-between items-end">
         <div>
            <h2 className={`text-2xl font-light ${isLight ? 'text-black' : 'text-white'}`}>Jornada</h2>
            <p className="text-xs text-slate-400">Seu percurso de cura</p>
         </div>
         <span className={`text-xs uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
           {user?.name?.split(' ')[0]}
         </span>
       </div>

       {/* --- GAMIFICATION HEADER: SOUL CRYSTAL --- */}
       <div className={`rounded-3xl border overflow-hidden relative ${isLight ? 'bg-gradient-to-b from-white to-blue-50 border-black/5' : 'bg-gradient-to-b from-slate-900 to-black border-white/5'}`}>
          <SoulCrystal 
            level={stats?.level || 1} 
            progress={stats?.progress || 0} 
            primaryColor={reports[0]?.moodColor || "#06b6d4"} 
            isLight={isLight}
          />
       </div>

       {/* --- EMOTIONAL FORECAST (NEW) --- */}
       {forecast && (
         <div className="animate-slide-up">
           <ForecastWidget forecast={forecast} isLight={isLight} />
         </div>
       )}

       {/* --- ACHIEVEMENTS --- */}
       <div>
         <div className="flex items-center gap-2 mb-4 opacity-70">
           <Trophy size={16} className="text-yellow-500" />
           <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-black' : 'text-white'}`}>Conquistas</h3>
         </div>
         <AchievementsList list={stats?.achievementsList || []} isLight={isLight} />
       </div>

       {/* --- TIMELINE --- */}
       <div>
         <div className="flex items-center gap-2 mb-4 opacity-70">
           <TrendingUp size={16} className="text-cyan-500" />
           <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-black' : 'text-white'}`}>Fluxo Emocional</h3>
         </div>
         <EmotionalTimeline reports={reports} isLight={isLight} />
       </div>

       {/* --- METRICS GRID --- */}
       <div className="grid grid-cols-2 gap-4">
         <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white/60 border-black/5' : 'bg-white/5 border-white/5'}`}>
            <div className="flex items-center gap-2 mb-2 text-purple-400">
               <Calendar size={16} />
               <span className="text-[10px] uppercase font-bold">Total</span>
            </div>
            <p className={`text-2xl font-light ${isLight ? 'text-black' : 'text-white'}`}>{stats?.total || 0}</p>
            <p className="text-[10px] opacity-50">registros na aura</p>
         </div>
         
         <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white/60 border-black/5' : 'bg-white/5 border-white/5'}`}>
            <div className="flex items-center gap-2 mb-2 text-orange-400">
               <Zap size={16} />
               <span className="text-[10px] uppercase font-bold">Energia</span>
            </div>
            <p className={`text-2xl font-light ${isLight ? 'text-black' : 'text-white'}`}>{(stats?.avgEnergy || 0).toFixed(1)}</p>
            <p className="text-[10px] opacity-50">média de nível</p>
         </div>
       </div>

    </div>
  );
};