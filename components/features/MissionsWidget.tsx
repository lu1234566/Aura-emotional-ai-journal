
import React, { useState } from 'react';
import { useAppStore } from '../../store/useStore';
import { Mission } from '../../types';
import { CheckCircle2, Circle, Trophy, ArrowRight, Loader2 } from 'lucide-react';
import { MissionActionModal } from './MissionActionModal';

export const MissionsWidget = () => {
  const { user, isLight } = useAppStore();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  if (!user?.dailyMissions || user.dailyMissions.length === 0) return null;

  const completedCount = user.dailyMissions.filter(m => m.completed).length;
  const totalXp = user.dailyMissions.filter(m => m.completed).reduce((acc, m) => acc + m.xpReward, 0);

  return (
    <div className={`p-5 rounded-2xl border mb-6 ${isLight ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100' : 'bg-gradient-to-br from-emerald-900/10 to-slate-900 border-emerald-500/20'}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
           <div className={`p-2 rounded-lg ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
             <Trophy size={16} />
           </div>
           <div>
             <h3 className={`text-sm font-bold uppercase tracking-wide ${isLight ? 'text-emerald-900' : 'text-emerald-100'}`}>
               Missões Diárias
             </h3>
             <p className="text-[10px] opacity-60">+{totalXp} Pontos Emocionais Hoje</p>
           </div>
        </div>
        <span className="text-xs font-mono font-bold opacity-50">{completedCount}/3</span>
      </div>

      <div className="space-y-3">
        {user.dailyMissions.map(mission => (
          <button
            key={mission.id}
            onClick={() => !mission.completed && setSelectedMission(mission)}
            disabled={mission.completed}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group
              ${mission.completed 
                ? (isLight ? 'bg-emerald-100/50 border-emerald-200 opacity-60' : 'bg-emerald-900/10 border-emerald-500/10 opacity-50') 
                : (isLight ? 'bg-white border-black/5 hover:bg-emerald-50 hover:border-emerald-200' : 'bg-white/5 border-white/5 hover:bg-white/10')
              }
            `}
          >
            <div className="flex items-center gap-3">
              {mission.completed ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : (
                <Circle size={18} className="opacity-30 group-hover:text-emerald-400 transition-colors" />
              )}
              <div>
                <span className={`text-sm font-medium ${mission.completed && 'line-through opacity-70'} ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {mission.title}
                </span>
                <p className="text-[10px] opacity-50">{mission.xpReward} XP</p>
              </div>
            </div>
            {!mission.completed && (
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all" />
            )}
          </button>
        ))}
      </div>

      {selectedMission && (
        <MissionActionModal 
          mission={selectedMission} 
          onClose={() => setSelectedMission(null)} 
        />
      )}
    </div>
  );
};
