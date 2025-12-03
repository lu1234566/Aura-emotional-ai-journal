
import React from 'react';
import * as Icons from 'lucide-react';
import { Achievement } from '../../types';

interface Props {
  list: Achievement[];
  isLight: boolean;
}

export const AchievementsList: React.FC<Props> = ({ list, isLight }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {list.map((item) => {
        // Dynamic Icon Component
        const IconComponent = (Icons as any)[item.icon] || Icons.Star;
        
        return (
          <div 
            key={item.id} 
            className={`
              relative flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-500
              ${item.isUnlocked 
                ? (isLight ? 'bg-white/80 border-cyan-500/30 shadow-lg' : 'bg-white/10 border-white/20 shadow-cyan-500/10 shadow-lg') 
                : (isLight ? 'bg-black/5 border-transparent opacity-40 grayscale' : 'bg-white/5 border-transparent opacity-30 grayscale')
              }
            `}
          >
            <div className={`
              mb-2 p-2 rounded-full 
              ${item.isUnlocked ? 'bg-gradient-to-br from-white/10 to-transparent' : 'bg-transparent'}
              ${item.color}
            `}>
              <IconComponent size={24} className={item.isUnlocked ? 'animate-pulse' : ''} />
            </div>
            
            <h4 className="text-[10px] font-bold uppercase tracking-wide mb-1 line-clamp-1">
              {item.title}
            </h4>
            
            {item.isUnlocked && (
              <span className="text-[9px] text-green-400 absolute top-2 right-2">
                ✓
              </span>
            )}
            
            {/* Tooltip-like description for mobile (simplified as hidden text usually, but here shown if needed or use simple layout) */}
          </div>
        );
      })}
    </div>
  );
};
