
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useStore';
import { ApiService } from '../../services/api';
import { X, Moon, Wind, Music, Play, Pause, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { AudioPlayer } from '../common/AudioPlayer';

export const NightRitualModal = ({ onClose }: { onClose: () => void }) => {
  const { reports, updateReport, isOnline } = useAppStore();
  const [activeTab, setActiveTab] = useState<'story' | 'breathe' | 'poem'>('story');
  const [loading, setLoading] = useState(false);
  
  // Get latest report
  const latestReport = reports[0];
  const hasRitual = !!latestReport?.nightRitual;

  useEffect(() => {
    const generate = async () => {
      if (!latestReport || hasRitual || !isOnline) return;
      
      setLoading(true);
      try {
        const updated = await ApiService.createNightRitual(latestReport);
        await updateReport(updated);
      } catch (e) {
        console.error("Night ritual gen failed", e);
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, [latestReport, hasRitual, isOnline, updateReport]);

  if (!latestReport) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#020617] text-indigo-100 flex flex-col animate-fade-in overflow-hidden">
      {/* Dynamic Starry Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#020617] to-[#020617]"></div>
        {/* Stars */}
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              animationDelay: `${Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6 border-b border-white/5">
        <div className="flex items-center gap-2 text-indigo-300">
          <Moon size={20} className="fill-current" />
          <span className="text-sm uppercase tracking-widest font-bold">Ritual da Noite</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 text-center">
        {loading ? (
          <div className="space-y-4">
            <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto" />
            <p className="text-sm font-light tracking-wide animate-pulse">Tecendo sonhos...</p>
          </div>
        ) : !hasRitual ? (
          <div className="space-y-4 max-w-xs">
            <Sparkles size={40} className="text-indigo-500 mx-auto opacity-50" />
            <p className="text-sm">Não foi possível gerar o ritual agora. Tente conectar-se à internet.</p>
          </div>
        ) : (
          <div className="w-full max-w-md h-full flex flex-col">
            {/* Tabs */}
            <div className="flex justify-center gap-6 mb-8">
              <button 
                onClick={() => setActiveTab('story')}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${activeTab === 'story' ? 'bg-indigo-500/20 text-indigo-300 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
              >
                <BookOpen size={20} />
                <span className="text-[10px] uppercase">História</span>
              </button>
              <button 
                onClick={() => setActiveTab('breathe')}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${activeTab === 'breathe' ? 'bg-indigo-500/20 text-indigo-300 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
              >
                <Wind size={20} />
                <span className="text-[10px] uppercase">Respirar</span>
              </button>
              <button 
                onClick={() => setActiveTab('poem')}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${activeTab === 'poem' ? 'bg-indigo-500/20 text-indigo-300 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
              >
                <Sparkles size={20} />
                <span className="text-[10px] uppercase">Mantra</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              
              {activeTab === 'story' && (
                <div className="animate-fade-in space-y-6 pb-20">
                  <h3 className="text-xl font-light text-indigo-200">Sua Jornada de Sono</h3>
                  <p className="text-lg leading-relaxed font-light text-slate-300">
                    {latestReport.nightRitual?.story}
                  </p>
                  {latestReport.nightRitual?.audioData && (
                    <div className="mt-8 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                      <p className="text-xs uppercase tracking-widest mb-4 text-indigo-400">Narração IA</p>
                      <AudioPlayer audioData={latestReport.nightRitual.audioData} />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'breathe' && (
                <div className="h-full flex flex-col items-center justify-center animate-fade-in">
                  <div className="relative mb-12">
                     <div className="w-48 h-48 rounded-full border border-indigo-500/30 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                     <div className="absolute inset-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-xl animate-[pulse_4s_ease-in-out_infinite]"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-xs uppercase tracking-[0.2em] text-indigo-300">Inspire</span>
                     </div>
                  </div>
                  <p className="text-center text-lg font-light max-w-xs text-slate-300">
                    {latestReport.nightRitual?.meditation}
                  </p>
                </div>
              )}

              {activeTab === 'poem' && (
                <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in pb-20">
                  <Sparkles className="text-indigo-400 mb-6 animate-pulse" size={24} />
                  <p className="text-2xl italic font-serif leading-loose text-indigo-100">
                    "{latestReport.nightRitual?.poem}"
                  </p>
                  <div className="w-16 h-1 bg-indigo-500/30 rounded-full mt-8"></div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
