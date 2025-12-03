
import React from 'react';
import { EmotionalEcho } from '../../types';
import { Repeat, ArrowUpRight, History } from 'lucide-react';

interface Props {
  echo: EmotionalEcho;
  isLight: boolean;
}

export const EchoCard: React.FC<Props> = ({ echo, isLight }) => {
  const getIcon = () => {
    switch (echo.type) {
      case 'recurrence': return <Repeat size={18} className="text-orange-400" />;
      case 'resilience': return <ArrowUpRight size={18} className="text-green-400" />;
      case 'contrast': return <History size={18} className="text-blue-400" />;
      default: return <History size={18} className="text-purple-400" />;
    }
  };

  const getTypeLabel = () => {
    switch (echo.type) {
      case 'recurrence': return "Padrão Recorrente";
      case 'resilience': return "Lembrança de Força";
      case 'contrast': return "Mudança de Perspectiva";
      default: return "Eco do Diário";
    }
  };

  const bgClass = isLight 
    ? 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100' 
    : 'bg-gradient-to-br from-indigo-900/20 to-slate-900 border-indigo-500/20';

  return (
    <div className={`p-5 rounded-2xl border ${bgClass} relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {getIcon()}
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-full ${isLight ? 'bg-white shadow-sm' : 'bg-white/5'}`}>
          {getIcon()}
        </div>
        <span className={`text-[10px] uppercase font-bold tracking-widest ${isLight ? 'text-indigo-900/50' : 'text-indigo-200/50'}`}>
          {getTypeLabel()}
        </span>
      </div>

      <h3 className={`font-semibold mb-1 ${isLight ? 'text-indigo-950' : 'text-indigo-100'}`}>
        {echo.title}
      </h3>
      
      <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
        {echo.message}
      </p>

      {echo.referenceDate && (
        <p className="mt-3 text-[10px] opacity-50 text-right">
          Ref: {new Date(echo.referenceDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};
