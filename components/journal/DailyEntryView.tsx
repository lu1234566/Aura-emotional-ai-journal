





import React, { useState, useRef } from 'react';
import { DailyReport, SelfCareTask } from '../../types';
import { AudioPlayer } from '../common/AudioPlayer';
import { EchoCard } from '../dashboard/EchoCard';
import { Quote, MapPin, ExternalLink, Mic, Share2, Download, Copy, Loader2, Check, CheckSquare, Square, Palette, Image as ImageIcon, WifiOff, Sparkles, Brain, Activity, Tag, Cloud, Sun, CloudRain } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { ApiService } from '../../services/api';
import { useAppStore } from '../../store/useStore';
import { AuraLogo } from '../common/AuraLogo';

interface Props {
  entry: DailyReport;
  isLight: boolean;
}

export const DailyEntryView: React.FC<Props> = ({ entry, isLight }) => {
  const { updateReport, processPendingReport, isOnline, isLoading } = useAppStore();
  const [audioData] = useState<string | undefined>(entry.audioData);
  
  // Ref for the main detailed view (private)
  const captureRef = useRef<HTMLDivElement>(null);
  // Ref for the social share card (public/safe)
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Scene Generation State
  const [sceneUrl, setSceneUrl] = useState<string | undefined>(entry.sceneUrl);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('Studio Ghibli');

  const textColor = isLight ? 'text-black' : 'text-white';
  const subText = isLight ? 'text-slate-600' : 'text-slate-400';
  const cardBg = isLight ? 'bg-white/60 border-black/5' : 'bg-white/5 border-white/10';
  
  // Background for share card is always dark/atmospheric for better aesthetics
  const shareBg = '#050505'; 

  const styles = ['Studio Ghibli', 'Cyberpunk Neon', 'Watercolor', 'Pixel Art'];
  const isOfflineEntry = entry.pendingAnalysis;

  // Weather Icon Logic
  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun size={14} />;
    if (code >= 51) return <CloudRain size={14} />;
    return <Cloud size={14} />;
  };

  // --- Export Actions ---

  const handleShareImage = async () => {
    // Use shareCardRef for safe sharing
    if (!shareCardRef.current) return;
    setIsExporting(true);
    try {
      // 1. Generate Blob from the SAFE card
      const blob = await toBlob(shareCardRef.current, { 
        cacheBust: true, 
        backgroundColor: shareBg,
        pixelRatio: 2 // High Res
      });

      if (blob) {
        const file = new File([blob], 'aura-story.png', { type: 'image/png' });
        
        // 2. Native Share
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Aura - ${entry.emotion}`,
            text: `Meu momento na Aura.`
          });
        } else {
          // Fallback to download
          const link = document.createElement('a');
          link.download = `aura-story-${entry.id}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
        }
      }
    } catch (err) {
      console.error("Erro ao compartilhar imagem:", err);
      alert("Não foi possível gerar a imagem para compartilhamento.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadImage = async () => {
    // Downloads the SAFE card
    if (!shareCardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, { 
        cacheBust: true, 
        backgroundColor: shareBg,
        pixelRatio: 2 
      });
      
      const link = document.createElement('a');
      link.download = `aura-story-${entry.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erro ao baixar imagem:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyText = () => {
    const text = `✨ Aura - Registro Emocional\n\nSentimento: ${entry.emotion}\n"${entry.summary}"\n\n${entry.text}\n\n${entry.poetry ? `Poesia:\n${entry.poetry}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Scene Generation ---
  const handleGenerateScene = async () => {
    setIsGeneratingScene(true);
    try {
      const url = await ApiService.generateCinematicScene(entry.emotion, entry.summary, selectedStyle);
      if (url) {
        const updatedEntry = { ...entry, sceneUrl: url, sceneStyle: selectedStyle };
        setSceneUrl(url);
        updateReport(updatedEntry); // Save to backend
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar cena.");
    } finally {
      setIsGeneratingScene(false);
    }
  };

  // --- Checklist Toggle ---
  const toggleTask = (taskId: string) => {
    if (!entry.selfCareChecklist) return;
    
    const updatedChecklist = entry.selfCareChecklist.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    
    const updatedEntry = { ...entry, selfCareChecklist: updatedChecklist };
    updateReport(updatedEntry);
  };

  const handleSync = () => {
     processPendingReport(entry);
  };

  return (
    <div className="w-full animate-fade-in space-y-8 pb-10">
      
      {/* --- HIDDEN SAFE SHARE CARD (Off-screen rendering) --- */}
      {/* This structure is specifically designed for Instagram Stories / Social Media */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
         <div 
           ref={shareCardRef} 
           className="w-[400px] h-[700px] bg-[#050505] relative flex flex-col items-center justify-between py-12 px-8 text-center overflow-hidden font-sans"
         >
            {/* Dynamic Atmospheric Background */}
            <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 30%, ${entry.moodColor || '#4b5563'}, transparent 70%)` }} />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
            
            {/* Header */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <AuraLogo className="w-12 h-12" />
              <div className="flex flex-col">
                <span className="text-white text-lg font-light tracking-[0.4em] uppercase">Aura</span>
                <span className="text-slate-400 text-[10px] uppercase tracking-widest">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Visual Centerpiece */}
            <div className="relative z-10 my-4">
              <div className="w-48 h-48 rounded-full p-1 border border-white/20 shadow-2xl shadow-cyan-500/10">
                 <div className="w-full h-full rounded-full overflow-hidden relative bg-black">
                   {entry.avatarImageUrl ? (
                     <img src={entry.avatarImageUrl} className="w-full h-full object-cover" crossOrigin="anonymous" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: entry.moodColor }}>
                        <Sparkles className="text-white/50" size={48} />
                     </div>
                   )}
                 </div>
              </div>
              <div className="mt-6">
                <h2 className="text-3xl text-white font-light tracking-wide">{entry.emotion}</h2>
              </div>
            </div>

            {/* Artistic Content (Poem or Quote) */}
            <div className="relative z-10 max-w-[80%]">
              {entry.poetry ? (
                <pre className="font-serif text-slate-200 text-sm whitespace-pre-wrap leading-relaxed opacity-90">
                  {entry.poetry}
                </pre>
              ) : (
                <p className="font-serif text-slate-200 text-base italic leading-relaxed opacity-90">
                  "{entry.summary}"
                </p>
              )}
              {entry.suggestion && !entry.poetry && (
                 <p className="mt-4 text-[10px] text-cyan-400 uppercase tracking-widest font-medium">
                   {entry.suggestion}
                 </p>
              )}
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-auto opacity-50">
               <span className="text-[9px] text-white uppercase tracking-[0.3em]">Ressonância Emocional</span>
            </div>
         </div>
      </div>

      {/* OFFLINE WARNING BANNER */}
      {isOfflineEntry && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isLight ? 'bg-orange-50 border-orange-200' : 'bg-orange-900/20 border-orange-500/20'}`}>
           <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-500/10 rounded-full text-orange-500">
               <WifiOff size={18} />
             </div>
             <div>
               <h4 className={`text-sm font-bold ${isLight ? 'text-orange-900' : 'text-orange-200'}`}>Análise Pendente</h4>
               <p className={`text-xs opacity-70 ${isLight ? 'text-orange-800' : 'text-orange-300'}`}>
                 Registro salvo offline. Conecte-se para gerar insights.
               </p>
             </div>
           </div>
           {isOnline && (
             <button 
               onClick={handleSync}
               disabled={isLoading}
               className="bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
             >
               {isLoading ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
               Analisar
             </button>
           )}
        </div>
      )}

      {/* CAPTURE CONTAINER (Private View) */}
      <div ref={captureRef} className={`space-y-8 p-4 rounded-3xl ${isLight ? 'bg-[#f0f9ff]' : 'bg-[#050505]'}`}>
        
        {/* 1. HERO */}
        <div className="text-center relative pt-4">
          <div className="relative w-64 h-64 mx-auto mb-6 group cursor-pointer">
            <div className={`absolute inset-0 blur-[60px] rounded-full animate-pulse ${isOfflineEntry ? 'bg-slate-500/10' : 'bg-cyan-500/20'}`}></div>
            {entry.avatarImageUrl ? (
              <img 
                src={entry.avatarImageUrl} 
                className="relative z-10 w-full h-full object-cover rounded-full border-4 border-white/10 shadow-2xl" 
                alt="Mood Art" 
                crossOrigin="anonymous" 
              />
            ) : (
              <div className={`relative z-10 w-full h-full rounded-full border-4 border-white/10 flex items-center justify-center shadow-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
                 <div className="w-40 h-40 rounded-full blur-xl opacity-60 animate-breathe" style={{ backgroundColor: entry.moodColor || "#888" }}></div>
                 {isOfflineEntry && <WifiOff size={48} className="absolute opacity-20" />}
              </div>
            )}
          </div>
          <h2 className={`text-4xl font-light tracking-tight mb-2 ${textColor}`}>{entry.emotion}</h2>
          
          <div className="flex items-center justify-center gap-2 opacity-80 mb-2">
            <p className={`text-sm italic ${subText}`}>"{entry.summary}"</p>
          </div>

          {/* WEATHER BADGE */}
          {entry.weather && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/20 text-blue-200'}`}>
              {getWeatherIcon(entry.weather.conditionCode)}
              <span>{Math.round(entry.weather.temperature)}°C</span>
              <span className="opacity-70 mx-1">•</span>
              <span>{entry.weather.conditionText}</span>
            </div>
          )}
        </div>

        {/* --- SELF CARE CHECKLIST --- */}
        {entry.selfCareChecklist && entry.selfCareChecklist.length > 0 && (
          <div className={`p-6 rounded-2xl border ${cardBg}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
              <CheckSquare size={14}/> Autocuidado
            </p>
            <div className="space-y-3">
              {entry.selfCareChecklist.map((task) => (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${task.isCompleted ? (isLight ? 'bg-emerald-100/50' : 'bg-emerald-500/10') : 'hover:bg-white/5'}`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                    {task.isCompleted && <Check size={12} className="text-white" />}
                  </div>
                  <span className={`text-sm ${task.isCompleted ? (isLight ? 'text-emerald-800 line-through opacity-70' : 'text-emerald-200 line-through opacity-50') : textColor}`}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SEMANTIC ANALYSIS CARD --- */}
        {entry.semanticAnalysis && (entry.semanticAnalysis.keywords.length > 0 || entry.semanticAnalysis.metaphors.length > 0) && (
          <div className={`p-6 rounded-2xl border ${cardBg} relative overflow-hidden`}>
             <div className="flex items-center gap-2 mb-6">
               <div className="p-2 bg-pink-500/10 rounded-full text-pink-500">
                 <Brain size={18} />
               </div>
               <div>
                 <h3 className={`text-sm font-bold uppercase tracking-widest ${isLight ? 'text-pink-600' : 'text-pink-300'}`}>Ressonância Semântica</h3>
                 <p className="text-[10px] opacity-60">Padrões de linguagem detectados</p>
               </div>
             </div>

             <div className="mb-6">
               <div className="flex justify-between text-xs mb-2">
                 <span className={subText}>Nível de Tensão</span>
                 <span className={`font-bold ${entry.semanticAnalysis.stressIndex > 70 ? 'text-red-400' : 'text-green-400'}`}>
                   {entry.semanticAnalysis.stressIndex}%
                 </span>
               </div>
               <div className={`h-1.5 w-full rounded-full ${isLight ? 'bg-black/5' : 'bg-white/10'}`}>
                 <div 
                   className={`h-full rounded-full transition-all duration-1000 ${entry.semanticAnalysis.stressIndex > 70 ? 'bg-red-400' : 'bg-green-400'}`} 
                   style={{ width: `${entry.semanticAnalysis.stressIndex}%` }}
                 ></div>
               </div>
             </div>

             <div className="flex flex-wrap gap-2 mb-6">
                {entry.semanticAnalysis.keywords.map((k, i) => (
                  <span key={`kw-${i}`} className={`text-[10px] px-2 py-1 rounded-md border ${isLight ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-pink-500/10 border-pink-500/20 text-pink-300'}`}>
                     #{k}
                  </span>
                ))}
                {entry.semanticAnalysis.metaphors.map((m, i) => (
                  <span key={`mt-${i}`} className={`text-[10px] px-2 py-1 rounded-md border flex items-center gap-1 ${isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'}`}>
                     <Activity size={10} /> {m}
                  </span>
                ))}
             </div>

             <div className={`p-4 rounded-xl text-sm leading-relaxed border-l-2 ${isLight ? 'bg-white border-pink-400 text-slate-700 shadow-sm' : 'bg-black/20 border-pink-500 text-slate-300'}`}>
                <span className="block text-[10px] font-bold uppercase text-pink-500 mb-1">Feedback da Aura</span>
                "{entry.semanticAnalysis.insightMessage}"
             </div>
          </div>
        )}

        {/* --- ECHO CARD --- */}
        {entry.echo && (
          <div className="animate-slide-up">
            <EchoCard echo={entry.echo} isLight={isLight} />
          </div>
        )}

        {/* 2. POEM */}
        {entry.poetry && (
          <div className={`p-8 rounded-2xl border ${cardBg} backdrop-blur-md relative overflow-hidden`}>
            <div className="absolute top-4 right-4 opacity-10"><Quote size={40} /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-4">Poesia Concreta</p>
            <pre className={`font-mono text-sm leading-relaxed whitespace-pre-wrap text-center ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {entry.poetry}
            </pre>
          </div>
        )}

        {/* 3. DETAILS */}
        <div className="grid gap-4">
          <div className={`p-6 rounded-2xl border ${cardBg}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-2">Seu Registro</p>
            <p className={`${subText} leading-relaxed whitespace-pre-wrap`}>{entry.text}</p>
            
            {entry.transcription && (
               <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-500 mb-2">
                     <Mic size={12} /> Transcrição da fala
                  </p>
                  <p className={`text-sm italic ${subText}`}>"{entry.transcription}"</p>
               </div>
            )}
            
            {entry.photoUrl && (
              <div className="mt-4 rounded-lg overflow-hidden border border-white/10">
                <img src={entry.photoUrl} className="w-full h-auto" alt="User upload" crossOrigin="anonymous" />
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl border ${cardBg}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-green-500 mb-2">Conselho do Dia</p>
            <p className={`${subText}`}>{entry.suggestion}</p>
          </div>
        </div>

        {/* Branding Footer for Image */}
        <div className="text-center pt-4 opacity-30">
           <p className={`text-[10px] uppercase tracking-[0.3em] ${textColor}`}>Aura • Emotional Resonance</p>
        </div>
      </div>

      {/* --- MAGIC CANVAS (Scenes) --- */}
      {!isOfflineEntry && (
        <div className={`p-6 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center gap-2 mb-4 text-fuchsia-400">
            <Palette size={16} />
            <p className="text-xs font-bold uppercase tracking-widest">Cenas do Dia</p>
          </div>

          {sceneUrl ? (
            <div className="relative group rounded-xl overflow-hidden shadow-2xl border border-white/10">
              <img src={sceneUrl} className="w-full h-auto" alt="Cinematic Scene" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <a href={sceneUrl} download={`aura-scene-${entry.id}.png`} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition-transform">
                  <Download size={16} /> Wallpaper
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className={`text-sm ${subText}`}>Transforme sua emoção em arte cinematográfica.</p>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {styles.map(style => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${selectedStyle === style ? 'bg-fuchsia-500 text-white border-fuchsia-500' : `${isLight ? 'bg-white border-black/10 text-black hover:bg-black/5' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleGenerateScene}
                disabled={isGeneratingScene}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/20"
              >
                {isGeneratingScene ? <Loader2 className="animate-spin" /> : <><ImageIcon size={18} /> Gerar Arte</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* INTERACTIVE ELEMENTS */}
      <AudioPlayer audioData={audioData} />

      {/* 5. LOCATIONS */}
      {(entry.location || (entry.suggestedPlaces && entry.suggestedPlaces.length > 0)) && (
        <div className={`p-6 rounded-2xl border ${cardBg}`}>
           <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-orange-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                Lugares para a Alma
              </p>
           </div>
           
           {entry.suggestedPlaces && entry.suggestedPlaces.length > 0 ? (
             <div className="grid gap-3">
               {entry.suggestedPlaces.map((place, i) => (
                 <a 
                   key={i}
                   href={place.mapsUrl}
                   target="_blank"
                   rel="noreferrer"
                   className={`block p-3 rounded-xl border ${isLight ? 'bg-white/50 border-black/5 hover:bg-white' : 'bg-black/20 border-white/5 hover:bg-white/5'} transition-colors group`}
                 >
                   <div className="flex justify-between items-start">
                     <div>
                       <h4 className={`font-medium text-sm ${textColor} group-hover:text-cyan-400 transition-colors`}>{place.name}</h4>
                       <span className="text-[10px] uppercase tracking-wider opacity-60">{place.type}</span>
                     </div>
                     <ExternalLink size={14} className="opacity-40 group-hover:opacity-100" />
                   </div>
                   <p className={`text-xs mt-2 ${subText}`}>{place.reason}</p>
                 </a>
               ))}
             </div>
           ) : (
             <p className="text-xs opacity-50">{entry.location ? "Localização registrada." : "Sem localização."}</p>
           )}
        </div>
      )}

      {/* --- ACTION TOOLBAR --- */}
      {!isOfflineEntry && (
        <div className="flex gap-2 items-center justify-center pt-4 border-t border-white/10">
           <button 
              onClick={handleShareImage}
              disabled={isExporting}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl min-w-[80px] transition-colors ${isLight ? 'hover:bg-black/5' : 'hover:bg-white/5'} ${isExporting ? 'opacity-50' : ''}`}
           >
              {isExporting ? <Loader2 size={20} className="animate-spin text-cyan-500" /> : <Share2 size={20} className="text-cyan-500" />}
              <span className={`text-[10px] uppercase ${subText}`}>Story</span>
           </button>

           <button 
              onClick={handleDownloadImage}
              disabled={isExporting}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl min-w-[80px] transition-colors ${isLight ? 'hover:bg-black/5' : 'hover:bg-white/5'}`}
           >
              <Download size={20} className="text-purple-500" />
              <span className={`text-[10px] uppercase ${subText}`}>Salvar</span>
           </button>

           <button 
              onClick={handleCopyText}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl min-w-[80px] transition-colors ${isLight ? 'hover:bg-black/5' : 'hover:bg-white/5'}`}
           >
              {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-pink-500" />}
              <span className={`text-[10px] uppercase ${subText}`}>{copied ? "Copiado" : "Texto"}</span>
           </button>
        </div>
      )}

    </div>
  );
};
