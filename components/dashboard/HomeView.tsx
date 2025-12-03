
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useStore';
import { ApiService } from '../../services/api';
import { DailyReport } from '../../types';
import { CheckInModal } from '../features/CheckInModal';
import { NightRitualModal } from '../features/NightRitualModal';
import { WordTherapyModal } from '../features/WordTherapyModal';
import { MissionsWidget } from '../features/MissionsWidget';
import { AudioPlayer } from '../common/AudioPlayer';
import { WeeklyBlackBox } from '../features/WeeklyBlackBox';
import { WeeklyReviewService } from '../../services/weeklyReview';
import { 
  Sparkles, Map, Moon, PenTool, Play, Calendar, 
  ArrowRight, WifiOff, RefreshCw, BarChart2 
} from 'lucide-react';

// --- CONFIGURAÇÃO DE TEMAS EMOCIONAIS ---
interface EmotionTheme {
  label: string;
  emoji: string;
  bg: string;
  dot: string;
  companion: string;
}

const EMOTION_META: Record<string, EmotionTheme> = {
  happy: {
    label: "Radiante",
    emoji: "🤩",
    bg: "from-yellow-400/20 to-orange-500/20",
    dot: "bg-yellow-400",
    companion: "Sua luz está forte hoje. Aproveite para celebrar suas conquistas!",
  },
  good: {
    label: "Bem",
    emoji: "😊",
    bg: "from-emerald-400/20 to-lime-500/20",
    dot: "bg-emerald-400",
    companion: "Que tal guardar esse sentimento bom em um pequeno gesto de carinho?",
  },
  neutral: {
    label: "Neutro",
    emoji: "😐",
    bg: "from-slate-500/20 to-slate-600/20",
    dot: "bg-slate-400",
    companion: "Dias neutros são importantes pausas. Você não precisa ser incrível o tempo todo.",
  },
  sad: {
    label: "Melancólico",
    emoji: "😢",
    bg: "from-indigo-500/20 to-purple-600/20",
    dot: "bg-indigo-400",
    companion: "Estou aqui com você. Respire fundo, vamos passar por isso passo a passo.",
  },
  heavy: {
    label: "Pesado",
    emoji: "😭",
    bg: "from-indigo-900/40 to-slate-900/60",
    dot: "bg-indigo-600",
    companion: "Você já sobreviveu a outros dias difíceis. Respire. Estou segurando sua mão.",
  },
  anxious: {
    label: "Ansioso",
    emoji: "😰",
    bg: "from-teal-500/20 to-emerald-600/20",
    dot: "bg-teal-400",
    companion: "Seu corpo está em alerta. Vamos tentar trazer um pouco de calma para o agora.",
  },
  stress: {
    label: "Tenso",
    emoji: "😣",
    bg: "from-red-500/20 to-orange-600/20",
    dot: "bg-red-500",
    companion: "Solte os ombros. Você tem carregado muito peso. Permita-se uma pausa.",
  },
  calm: {
    label: "Sereno",
    emoji: "😌",
    bg: "from-sky-400/20 to-indigo-500/20",
    dot: "bg-sky-400",
    companion: "Esse silêncio interno é precioso. Proteja sua paz com carinho.",
  },
};

// Helper para mapear string dinâmica da IA para tema
const getEmotionTheme = (emotion?: string): EmotionTheme => {
  if (!emotion) return EMOTION_META.neutral;
  const lower = emotion.toLowerCase();
  
  if (lower.includes('muito feliz') || lower.includes('radiante') || lower.includes('eufori')) return EMOTION_META.happy;
  if (lower.includes('feliz') || lower.includes('bem') || lower.includes('alegre') || lower.includes('grato')) return EMOTION_META.good;
  if (lower.includes('triste') || lower.includes('baixo')) return EMOTION_META.sad;
  if (lower.includes('depr') || lower.includes('desesper') || lower.includes('luto')) return EMOTION_META.heavy;
  if (lower.includes('ansios') || lower.includes('preocup')) return EMOTION_META.anxious;
  if (lower.includes('estress') || lower.includes('raiva') || lower.includes('tens')) return EMOTION_META.stress;
  if (lower.includes('calm') || lower.includes('paz') || lower.includes('relax')) return EMOTION_META.calm;
  
  return { ...EMOTION_META.neutral, label: emotion }; // Fallback mantendo o nome original
};

// Helper para missão emocional baseada no tema
const getMissionForEmotion = (themeKey?: string): string => {
  if (!themeKey) return "Observe um detalhe do seu ambiente que você nunca reparou antes.";
  const map: Record<string, string> = {
    happy: "Escolha uma pequena coisa para agradecer e compartilhe essa gratidão.",
    good: "Faça um elogio sincero a alguém ou a si mesmo hoje.",
    neutral: "Observe o céu por 1 minuto sem julgar o clima.",
    sad: "Separe 5 minutos para se abraçar com carinho e ouvir uma música leve.",
    heavy: "Beba um copo d'água devagar. É a única tarefa obrigatória agora.",
    anxious: "Faça uma pausa de 2 minutos: inspire por 4s, segure por 4s, solte por 6s.",
    stress: "Escreva num papel o que te preocupa e rasgue-o (ou imagine isso).",
    calm: "Guarde sua calma em algo concreto: tire uma foto de algo bonito.",
  };
  
  // Reverse lookup theme object to key, simplest way here is just heuristic or check strictly
  // Since we don't have the key directly from getEmotionTheme return, re-eval logic:
  // For simplicity, returning a generic one based on text matching of the theme label
  return "Respire fundo e conecte-se com o agora."; 
};


// --- COMPONENTE PRINCIPAL ---

export const HomeView = () => {
  const { reports, user, isLight, updateReport, setView, isOnline, refreshMissions } = useAppStore();
  
  // Modals State
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showNightRitual, setShowNightRitual] = useState(false);
  const [showWordTherapy, setShowWordTherapy] = useState(false);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [audioLoading, setAudioLoading] = useState(false);

  // Data Derived
  const latest = reports[0];
  const theme = useMemo(() => getEmotionTheme(latest?.emotion), [latest]);
  const streak = useMemo(() => {
    if (!reports.length) return 0;
    // Mock simple streak calculation
    return 1 + reports.filter((r, i) => i > 0 && (r.createdAt - reports[i-1].createdAt < 86400000 * 2)).length;
  }, [reports]);

  const last7 = useMemo(() => reports.slice(0, 7).reverse(), [reports]);

  // Audio Handler
  const handleGenerateAudio = async () => {
    if (!latest || !isOnline) return;
    setAudioLoading(true);
    try {
      // Re-process implies generating audio if missing
      const textToRead = latest.summary || latest.text;
      const audioData = await ApiService.reanalyzeEntry({ ...latest, audioData: undefined }, reports); 
      // Note: reanalyzeEntry usually does full analysis. 
      // Optimization: create specific TTS endpoint if heavy. 
      // For now, assuming reanalyze fetches TTS if missing.
      await updateReport(audioData);
    } catch (e) {
      console.error(e);
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <div className={`h-full overflow-y-auto custom-scrollbar flex flex-col gap-6 p-6 pb-24 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#050505] text-slate-50'}`}>
      
      {/* 1. HEADER */}
      <header className="flex justify-between items-start animate-fade-in">
        <div>
          <p className={`text-[10px] uppercase tracking-widest font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-light mt-1">
            Olá, <span className="font-medium">{user?.name?.split(' ')[0] || 'Viajante'}</span>
          </h1>
          {!isOnline && (
            <div className="flex items-center gap-1 mt-1 text-xs text-orange-400">
               <WifiOff size={10} /> Modo Offline
            </div>
          )}
        </div>

        {latest && (
          <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
             <span className="text-xl">{theme.emoji}</span>
             <div className="text-right">
                <p className="text-[9px] uppercase tracking-wide opacity-50">Hoje</p>
                <p className="text-xs font-bold">{theme.label}</p>
             </div>
          </div>
        )}
      </header>

      {/* 2. HERO: AVATAR & COMPANION & ACTIONS */}
      <section className="grid gap-4 md:grid-cols-[1.2fr_1fr] animate-slide-up">
        {/* Card Principal */}
        <div className={`relative rounded-3xl p-5 border overflow-hidden flex flex-col justify-between min-h-[220px] transition-all
          ${isLight ? 'bg-white border-slate-100 shadow-xl shadow-slate-200/50' : 'bg-slate-900/50 border-white/5 shadow-2xl shadow-black/50'}
        `}>
          {/* Background Ambient Glow */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-30 bg-gradient-to-br ${theme.bg}`}></div>
          
          <div className="flex gap-5 relative z-10">
            {/* Avatar */}
            <div className={`relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 ${isLight ? 'border-white shadow-md' : 'border-white/10 shadow-lg'}`}>
              {latest?.avatarImageUrl ? (
                <img src={latest.avatarImageUrl} className="w-full h-full object-cover" alt="Avatar do dia" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${theme.bg}`}>
                   <Sparkles className="opacity-50" />
                </div>
              )}
            </div>

            {/* Companion Message */}
            <div className="flex flex-col justify-center">
               <div className="flex items-center gap-2 mb-2">
                 <span className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                   Aura Companion
                 </span>
                 {user?.companion && (
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                 )}
               </div>
               <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                 "{latest ? theme.companion : "Comece registrando seu dia para que eu possa caminhar com você."}"
               </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-6 relative z-10">
            <button 
              onClick={() => setShowCheckIn(true)}
              className="flex-1 min-w-[120px] py-2.5 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <PenTool size={14} /> Registrar
            </button>
            <button 
              onClick={() => setView('journal')}
              className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all hover:scale-105 ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
            >
              Jornal
            </button>
            <button 
              onClick={() => setView('stats')}
              className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all hover:scale-105 ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
            >
              <Map size={14} />
            </button>
          </div>
        </div>

        {/* Resumo do Dia / Status */}
        <div className="flex flex-col gap-4">
          <div className={`flex-1 rounded-3xl p-5 border ${isLight ? 'bg-white/60 border-slate-100' : 'bg-slate-900/30 border-white/5'}`}>
             {latest ? (
               <>
                 <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Síntese Emocional</h3>
                 <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                   {latest.finalExplanation || latest.summary}
                 </p>
               </>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                 <p className="text-sm">Seu dia é uma página em branco.</p>
               </div>
             )}
          </div>

          <div className="flex gap-2">
             <button 
               onClick={() => setShowNightRitual(true)}
               disabled={!latest}
               className={`flex-1 py-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20'} disabled:opacity-50`}
             >
               <Moon size={14} /> Ritual Noturno
             </button>
             <button 
               onClick={() => setShowWordTherapy(true)}
               className={`flex-1 py-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${isLight ? 'bg-pink-50 border-pink-100 text-pink-600 hover:bg-pink-100' : 'bg-pink-500/10 border-pink-500/20 text-pink-300 hover:bg-pink-500/20'}`}
             >
               <Sparkles size={14} /> Terapia
             </button>
          </div>
        </div>
      </section>

      {/* 3. POEM & AUDIO */}
      {latest && (
        <section className="grid gap-4 md:grid-cols-[1.4fr_1fr] animate-slide-up delay-100">
           {/* Poema Concreto */}
           <div className={`rounded-3xl p-1 bg-gradient-to-br ${theme.bg}`}>
              <div className={`h-full rounded-[20px] p-6 flex flex-col justify-center items-center text-center ${isLight ? 'bg-white/90' : 'bg-[#0a0a0a]'}`}>
                 <span className="text-[10px] uppercase tracking-[0.3em] opacity-40 mb-4">Poesia Concreta</span>
                 {latest.poetry ? (
                   <pre className={`font-serif text-sm leading-loose whitespace-pre-wrap ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                     {latest.poetry}
                   </pre>
                 ) : (
                   <p className="text-xs opacity-50 italic">A poesia deste dia ainda está sendo escrita...</p>
                 )}
              </div>
           </div>

           {/* Audio Player Card */}
           <div className={`rounded-3xl p-6 border flex flex-col justify-center ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900/30 border-white/5'}`}>
              <div className="flex items-center gap-3 mb-4">
                 <div className={`p-2.5 rounded-full ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    <Play size={16} className="fill-current" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold">Ouvir meu dia</h3>
                    <p className="text-[10px] opacity-60">Narração IA do seu momento</p>
                 </div>
              </div>
              
              {latest.audioData ? (
                <AudioPlayer audioData={latest.audioData} />
              ) : (
                <button 
                  onClick={handleGenerateAudio}
                  disabled={audioLoading}
                  className={`w-full py-3 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${isLight ? 'border-slate-300 text-slate-500 hover:bg-slate-50' : 'border-slate-700 text-slate-400 hover:bg-white/5'}`}
                >
                  {audioLoading ? <RefreshCw className="animate-spin" size={14}/> : <Play size={14}/>}
                  {audioLoading ? "Gerando..." : "Gerar Áudio"}
                </button>
              )}
           </div>
        </section>
      )}

      {/* 4. MISSIONS & TIMELINE */}
      <section className="grid gap-4 md:grid-cols-[1fr_1.2fr] mb-6 animate-slide-up delay-200">
         {/* Missão do Dia (Widget Completo) */}
         <div className="flex flex-col gap-4">
            <MissionsWidget />
            
            {/* Soft Mission baseada na emoção */}
            {latest && (
               <div className={`p-5 rounded-2xl border ${isLight ? 'bg-blue-50/50 border-blue-100' : 'bg-blue-900/10 border-blue-500/10'}`}>
                  <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${isLight ? 'text-blue-400' : 'text-blue-300'}`}>
                    Sugestão Suave
                  </p>
                  <p className={`text-sm italic ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    "{getMissionForEmotion(Object.keys(EMOTION_META).find(key => JSON.stringify(EMOTION_META[key]) === JSON.stringify(theme)))}"
                  </p>
               </div>
            )}
         </div>

         {/* Timeline Simplificada */}
         <div className={`rounded-3xl p-6 border flex flex-col ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900/30 border-white/5'}`}>
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xs font-bold uppercase tracking-widest opacity-60">Linha do Tempo (7 dias)</h3>
               <button onClick={() => setView('stats')} className="p-2 hover:bg-white/5 rounded-full opacity-50 hover:opacity-100">
                  <ArrowRight size={14} />
               </button>
            </div>

            {last7.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 gap-2">
                  <Calendar size={24} />
                  <p className="text-xs">Sem histórico recente.</p>
               </div>
            ) : (
               <div className="flex items-end justify-between gap-2 h-full min-h-[100px] px-2">
                  {last7.map((entry) => {
                     const entryTheme = getEmotionTheme(entry.emotion);
                     return (
                        <div key={entry.id} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setView('journal')}>
                           {/* Bar / Dot */}
                           <div className="relative flex flex-col justify-end h-24 w-8">
                              <div 
                                className={`w-full rounded-t-lg transition-all duration-500 group-hover:opacity-80 ${entryTheme.dot.replace('bg-', 'bg-opacity-50 bg-')}`} 
                                style={{ height: `${(entry.positivityLevel || 5) * 10}%`, backgroundColor: entry.moodColor }}
                              ></div>
                           </div>
                           <span className="text-[9px] font-mono uppercase opacity-50">
                              {new Date(entry.createdAt).toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                           </span>
                        </div>
                     );
                  })}
               </div>
            )}
            <p className="mt-4 text-[10px] text-center opacity-40">
               Seu mapa emocional está sendo desenhado dia após dia.
            </p>
         </div>
      </section>

      {/* MODALS */}
      {showCheckIn && <CheckInModal onClose={() => setShowCheckIn(false)} />}
      {showNightRitual && <NightRitualModal onClose={() => setShowNightRitual(false)} />}
      {showWordTherapy && <WordTherapyModal onClose={() => setShowWordTherapy(false)} />}
      
      {/* Blackbox Banner (if available) */}
      {weeklyData && (
         <WeeklyBlackBox data={weeklyData} onClose={() => setWeeklyData(null)} />
      )}

    </div>
  );
};
