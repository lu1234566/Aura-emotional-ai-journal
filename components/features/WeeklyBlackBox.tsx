
import React from 'react';
import { WeeklyReviewData } from '../../types';
import { X, TrendingUp, AlertTriangle, MapPin, Quote, Crown, Activity } from 'lucide-react';
import { AuraLogo } from '../common/AuraLogo';

interface Props {
  data: WeeklyReviewData;
  onClose: () => void;
}

export const WeeklyBlackBox: React.FC<Props> = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] bg-[#09090b] text-zinc-100 flex flex-col font-mono animate-fade-in overflow-hidden">
      {/* Background Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center border border-zinc-700">
            <AuraLogo className="w-5 h-5 opacity-70" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-400">Caixa Preta</h2>
            <p className="text-[10px] text-zinc-600">REGISTRO DE VOO: {data.range}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded transition-colors text-zinc-500">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* TOP METRICS */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-500 mb-2">
                    <TrendingUp size={14} />
                    <span className="text-[10px] uppercase tracking-widest">Melhor Dia</span>
                </div>
                <div className="text-xl font-bold">{data.bestDay.date}</div>
                <div className="text-xs text-zinc-500 mt-1">"{data.bestDay.emotion}"</div>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-cyan-500 mb-2">
                    <Activity size={14} />
                    <span className="text-[10px] uppercase tracking-widest">Mood</span>
                </div>
                <div className="text-xl font-bold">{data.dominantMood}</div>
                <div className="text-xs text-zinc-500 mt-1">Predominante</div>
            </div>
        </div>

        {/* TENSE MOMENT (If exists) */}
        {data.tenseMoment && (
            <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-lg flex items-start gap-4">
                <div className="p-2 bg-red-900/20 rounded text-red-500 mt-1">
                    <AlertTriangle size={16} />
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Turbulência Detectada</h3>
                    <p className="text-sm text-zinc-300">
                        {data.tenseMoment.date} foi marcado por <span className="text-red-300 font-bold">{data.tenseMoment.emotion}</span>.
                    </p>
                    <p className="text-[10px] text-red-500/60 mt-2 uppercase">Gatilho provável: {data.tenseMoment.trigger}</p>
                </div>
            </div>
        )}

        {/* ARTIFACTS */}
        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
            <div className="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Destaque da Semana</span>
                <Crown size={12} className="text-yellow-600" />
            </div>
            <div className="p-6 flex flex-col items-center text-center">
                {data.bestArtifact.avatarUrl && (
                    <div className="w-24 h-24 rounded-full border-2 border-zinc-700 overflow-hidden mb-4 shadow-2xl shadow-cyan-900/20">
                        <img src={data.bestArtifact.avatarUrl} className="w-full h-full object-cover" />
                    </div>
                )}
                {data.bestArtifact.poem ? (
                    <div className="relative">
                        <Quote size={20} className="absolute -top-3 -left-4 text-zinc-700" />
                        <p className="text-sm italic text-zinc-300 font-serif leading-relaxed max-w-xs">
                            {data.bestArtifact.poem}
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-zinc-600">Nenhum artefato poético gerado.</p>
                )}
            </div>
        </div>

        {/* PLACES */}
        {data.topPlaces.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-orange-500 mb-4">
                    <MapPin size={14} />
                    <span className="text-[10px] uppercase tracking-widest">Refúgios</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {data.topPlaces.map((place, i) => (
                        <span key={i} className="px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700">
                            {place}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* FOOTER */}
        <div className="text-center pt-8 pb-4 opacity-30">
            <p className="text-[10px] uppercase tracking-[0.5em]">Fim do Relatório</p>
            <div className="w-1 h-8 bg-zinc-800 mx-auto mt-2"></div>
        </div>

      </div>
    </div>
  );
};
