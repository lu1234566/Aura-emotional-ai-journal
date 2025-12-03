import React from 'react';
import { EmotionalForecast } from '../../types';
import { CloudRain, Sun, Cloud, Wind, CloudLightning } from 'lucide-react';

interface Props {
  forecast: EmotionalForecast | null;
  isLight: boolean;
}

export const ForecastWidget: React.FC<Props> = ({ forecast, isLight }) => {
  if (!forecast) return null;

  const getIcon = () => {
    switch (forecast.trendIcon) {
      case 'sun': return <Sun size={32} className="text-yellow-400 animate-pulse" />;
      case 'rain': return <CloudRain size={32} className="text-blue-400" />;
      case 'storm': return <CloudLightning size={32} className="text-purple-400" />;
      default: return <Cloud size={32} className="text-slate-400" />;
    }
  };

  const getBgClass = () => {
    switch (forecast.trendIcon) {
      case 'sun': return isLight ? 'bg-orange-50 border-orange-200' : 'bg-orange-900/10 border-orange-500/20';
      case 'rain': return isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/10 border-blue-500/20';
      case 'storm': return isLight ? 'bg-purple-50 border-purple-200' : 'bg-purple-900/10 border-purple-500/20';
      default: return isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/20 border-slate-700';
    }
  };

  return (
    <div className={`p-5 rounded-2xl border ${getBgClass()} relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <Wind size={14} className="opacity-50" />
             <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Previsão Emocional</h3>
           </div>
           <p className={`text-sm font-medium leading-relaxed max-w-[85%] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
             "{forecast.insight}"
           </p>
        </div>
        <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
          {getIcon()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] opacity-70">
         <div className="flex flex-col">
            <span className="uppercase tracking-wider">Atenção</span>
            <span className="font-bold">{forecast.challengingDay} - {forecast.sensitiveTime}</span>
         </div>
         <div className="flex flex-col text-right">
            <span className="uppercase tracking-wider">Melhor Momento</span>
            <span className="font-bold">{forecast.bestDay} - {forecast.peakTime}</span>
         </div>
      </div>
    </div>
  );
};
