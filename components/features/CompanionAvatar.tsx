

import React from 'react';
import { Companion } from '../../types';
import { Sparkles, MessageCircleHeart } from 'lucide-react';

interface Props {
  companion?: Companion;
  isLight: boolean;
}

export const CompanionAvatar: React.FC<Props> = ({ companion, isLight }) => {
  if (!companion) return null;

  return (
    <div className="relative flex items-center gap-4 animate-fade-in">
      {/* Avatar Visual */}
      <div className="relative w-16 h-16 group">
        {/* Glow */}
        <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-30 animate-pulse group-hover:opacity-50 transition-opacity"></div>
        
        {/* Image / Placeholder */}
        <div className={`relative w-full h-full rounded-full overflow-hidden border-2 ${isLight ? 'border-white shadow-lg' : 'border-white/20 shadow-cyan-500/20'} animate-float`}>
          {companion.imageUrl ? (
            <img src={companion.imageUrl} className="w-full h-full object-cover" alt="Companion" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center">
              <Sparkles className="text-white animate-spin-slow" size={24} />
            </div>
          )}
        </div>
      </div>

      {/* Message Bubble */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {companion.name}
          </span>
          <span className="text-[9px] bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded border border-cyan-500/20">
             Nível {Math.floor((companion.stage || 1))}
          </span>
        </div>
        
        <div className={`relative p-3 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm
          ${isLight ? 'bg-white border border-slate-100 text-slate-700' : 'bg-white/10 border border-white/5 text-slate-200'}
        `}>
           {/* Triangle */}
           <div className={`absolute -left-2 top-0 w-0 h-0 border-t-[8px] border-r-[8px] border-l-0 border-b-0 border-transparent 
             ${isLight ? 'border-t-white' : 'border-t-white/10'}
           `}></div>
           
           {companion.lastMessage ? (
             <p>"{companion.lastMessage.text}"</p>
           ) : (
             <p className="italic opacity-70">Estou aqui observando sua jornada.</p>
           )}
        </div>
      </div>
    </div>
  );
};