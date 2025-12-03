
import React, { useState } from 'react';
import { useAppStore } from '../../store/useStore';
import { ChevronRight, Image as ImageIcon, X, Grid, List } from 'lucide-react';
import { DailyReport } from '../../types';
import { DailyEntryView } from './DailyEntryView';
import { AvatarGallery } from './AvatarGallery';

export const JournalView = () => {
  const { reports, isLight } = useAppStore();
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  
  return (
    <div className="h-full pt-8 pb-20 px-6 overflow-y-auto custom-scrollbar">
      {/* Header with Toggle */}
      <div className="flex justify-between items-end mb-6">
        <div>
           <h2 className={`text-2xl font-light ${isLight ? 'text-black' : 'text-white'}`}>
             {viewMode === 'list' ? 'Histórico' : 'Galeria Emocional'}
           </h2>
           <p className="text-xs text-slate-400">
             {viewMode === 'list' ? 'Seus registros em ordem cronológica' : 'Sua coleção de avatares e estados'}
           </p>
        </div>

        <div className={`flex p-1 rounded-lg ${isLight ? 'bg-black/5' : 'bg-white/10'}`}>
           <button 
             onClick={() => setViewMode('list')}
             className={`p-2 rounded-md transition-all ${viewMode === 'list' ? (isLight ? 'bg-white shadow-sm text-black' : 'bg-white/20 text-white') : 'opacity-50'}`}
           >
             <List size={18} />
           </button>
           <button 
             onClick={() => setViewMode('gallery')}
             className={`p-2 rounded-md transition-all ${viewMode === 'gallery' ? (isLight ? 'bg-white shadow-sm text-black' : 'bg-white/20 text-white') : 'opacity-50'}`}
           >
             <Grid size={18} />
           </button>
        </div>
      </div>
      
      {/* Content */}
      {viewMode === 'gallery' ? (
        <AvatarGallery 
          reports={reports} 
          isLight={isLight} 
          onSelect={setSelectedReport} 
        />
      ) : (
        <div className="space-y-4 pb-20">
          {reports.map((report) => (
            <div 
              key={report.id} 
              onClick={() => setSelectedReport(report)}
              className={`p-4 rounded-2xl border flex gap-4 cursor-pointer ${isLight ? 'bg-white/60 border-black/5 hover:bg-white/80' : 'bg-white/5 border-white/5 hover:bg-white/10'} backdrop-blur-md transition-all active:scale-95`}
            >
              <div className="w-16 h-16 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden relative border border-white/5">
                 {report.avatarImageUrl ? (
                   <img src={report.avatarImageUrl} className="w-full h-full object-cover" alt="Avatar" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: report.moodColor }}>
                      <ImageIcon size={16} className="text-white/50" />
                   </div>
                 )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                   <h3 className={`font-medium truncate ${isLight ? 'text-black' : 'text-white'}`}>{report.emotion}</h3>
                   <span className="text-[10px] text-slate-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 italic">"{report.summary || report.text}"</p>
              </div>
              <ChevronRight size={16} className="text-slate-500 self-center" />
            </div>
          ))}
          {reports.length === 0 && <p className="text-center text-slate-500 mt-10">Nenhum registro ainda.</p>}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className={`fixed inset-0 z-50 flex flex-col ${isLight ? 'bg-[#f0f9ff]' : 'bg-[#050505]'} animate-fade-in`}>
          <div className="p-6 flex justify-between items-center border-b border-white/5">
             <button onClick={() => setSelectedReport(null)} className="p-2 rounded-full hover:bg-white/10">
               <ChevronRight className="rotate-180" />
             </button>
             <span className="text-xs uppercase tracking-widest opacity-50">Detalhes</span>
             <button onClick={() => setSelectedReport(null)} className="p-2 rounded-full hover:bg-white/10">
               <X />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <DailyEntryView entry={selectedReport} isLight={isLight} />
          </div>
        </div>
      )}
    </div>
  );
};
