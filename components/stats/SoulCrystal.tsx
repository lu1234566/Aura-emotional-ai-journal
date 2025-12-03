
import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  level: number;
  progress: number;
  primaryColor: string;
  isLight: boolean;
}

export const SoulCrystal: React.FC<Props> = ({ level, progress, primaryColor, isLight }) => {
  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Crystal Container */}
      <div className="relative w-40 h-40 group cursor-pointer">
        {/* Glow Effect */}
        <div 
          className="absolute inset-0 blur-[60px] opacity-40 animate-pulse transition-colors duration-1000"
          style={{ backgroundColor: primaryColor }}
        ></div>
        
        {/* The Crystal (CSS 3D Shape) */}
        <div className="relative w-full h-full flex items-center justify-center animate-float">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
            <defs>
              <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
                <stop offset="50%" stopColor={isLight ? '#fff' : '#444'} stopOpacity="0.5" />
                <stop offset="100%" stopColor={primaryColor} stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* Dynamic shape based on level (Triangle -> Diamond -> Hexagon) */}
            {level === 1 && <path d="M50 10 L90 80 L10 80 Z" fill="url(#crystalGrad)" stroke="white" strokeWidth="0.5" />}
            {level === 2 && <path d="M50 5 L90 50 L50 95 L10 50 Z" fill="url(#crystalGrad)" stroke="white" strokeWidth="0.5" />}
            {level >= 3 && <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="url(#crystalGrad)" stroke="white" strokeWidth="0.5" />}
          </svg>
          
          {/* Inner Core */}
          <div className="absolute w-20 h-20 bg-white/30 blur-md rounded-full animate-breathe"></div>
        </div>

        {/* Level Badge */}
        <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-yellow-400 to-orange-500 text-black font-bold text-xs w-10 h-10 flex items-center justify-center rounded-full border-2 border-white shadow-lg z-10">
          Lv.{level}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-48 mt-6">
        <div className="flex justify-between text-[10px] uppercase tracking-widest mb-1 opacity-60">
          <span>Evolução</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className={`h-2 w-full rounded-full overflow-hidden ${isLight ? 'bg-black/10' : 'bg-white/10'}`}>
          <div 
            className="h-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ width: `${progress}%`, backgroundColor: primaryColor }}
          >
             <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>
      
      <div className="mt-2 flex items-center gap-1 text-xs opacity-50">
        <Sparkles size={12} />
        <span>Continue registrando para evoluir</span>
      </div>
    </div>
  );
};
