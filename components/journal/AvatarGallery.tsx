
import React from 'react';
import { DailyReport } from '../../types';
import { Calendar, Sparkles } from 'lucide-react';

interface Props {
  reports: DailyReport[];
  isLight: boolean;
  onSelect: (report: DailyReport) => void;
}

export const AvatarGallery: React.FC<Props> = ({ reports, isLight, onSelect }) => {
  // Filter only reports with avatars
  const artPieces = reports.filter(r => r.avatarImageUrl);

  if (artPieces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center opacity-50">
        <div className="w-16 h-16 border-2 border-dashed border-current rounded-full flex items-center justify-center mb-4">
          <Sparkles size={24} />
        </div>
        <p className="text-sm">Sua galeria está vazia.</p>
        <p className="text-xs mt-1">Gere registros com IA para colecionar seus "Eu's".</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 animate-fade-in pb-20">
      {artPieces.map((report) => (
        <div 
          key={report.id}
          onClick={() => onSelect(report)}
          className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] border ${isLight ? 'border-black/5 bg-white shadow-sm' : 'border-white/10 bg-white/5'}`}
        >
          {/* Image */}
          <img 
            src={report.avatarImageUrl} 
            alt={report.emotion} 
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity"></div>

          {/* Text Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <span className="text-[9px] uppercase tracking-widest text-white/60 mb-1 flex items-center gap-1">
               <Calendar size={8} /> {new Date(report.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
            </span>
            <h3 className="text-white font-light text-sm leading-tight">
              <span className="opacity-50 text-[10px] mr-1">Eu de</span>
              <strong className="font-medium">{report.emotion}</strong>
            </h3>
            
            {/* Mood Color Indicator */}
            <div 
               className="absolute top-4 right-4 w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]"
               style={{ backgroundColor: report.moodColor, color: report.moodColor }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};
