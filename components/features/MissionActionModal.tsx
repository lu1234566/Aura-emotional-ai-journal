
import React, { useState, useRef, useEffect } from 'react';
import { Mission } from '../../types';
import { useAppStore } from '../../store/useStore';
import { MissionService } from '../../services/missions';
import { X, Camera, Send, Loader2, CheckCircle, Timer } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  mission: Mission;
  onClose: () => void;
}

export const MissionActionModal: React.FC<Props> = ({ mission, onClose }) => {
  const { completeMission, isLight, isOnline } = useAppStore();
  const [textInput, setTextInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Camera
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(mission.duration || 30);
  const [timerActive, setTimerActive] = useState(false);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleComplete(null); // Auto complete when timer ends
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const handleComplete = async (payload: string | File | null) => {
    setIsVerifying(true);
    setError(null);
    
    // For timer, payload is null, validation is implicit by reaching 0
    let valid = true;
    if (mission.type !== 'timer' && payload) {
      valid = await MissionService.verifyMission(mission, payload);
    }

    if (valid) {
      await completeMission(mission.id);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(onClose, 1500); // Close after celebration
    } else {
      setError("A IA não conseguiu verificar sua missão. Tente novamente com mais clareza.");
      setIsVerifying(false);
    }
  };

  const bgClass = isLight ? 'bg-white text-black' : 'bg-[#09090b] text-white';

  return (
    <div className={`fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in`}>
      <div className={`w-full max-w-sm rounded-3xl p-6 ${bgClass} shadow-2xl relative overflow-hidden`}>
        <button onClick={onClose} className="absolute top-4 right-4 opacity-50 hover:opacity-100">
          <X size={20} />
        </button>

        <div className="mb-6 text-center">
          <span className="text-[10px] uppercase tracking-widest opacity-50 mb-2 block">Missão Diária</span>
          <h2 className="text-xl font-bold mb-2">{mission.title}</h2>
          <p className="opacity-70 text-sm leading-relaxed">{mission.description}</p>
        </div>

        {/* --- TEXT TYPE --- */}
        {mission.type === 'text' && (
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Escreva aqui..."
              className={`w-full p-4 rounded-xl resize-none h-32 outline-none border transition-all ${isLight ? 'bg-slate-50 border-slate-200 focus:border-emerald-500' : 'bg-white/5 border-white/10 focus:border-emerald-500/50'}`}
            />
            <button
              onClick={() => handleComplete(textInput)}
              disabled={!textInput.trim() || isVerifying}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isVerifying ? <Loader2 className="animate-spin" /> : <Send size={18} />}
              {isVerifying ? "Verificando..." : "Enviar"}
            </button>
          </div>
        )}

        {/* --- PHOTO TYPE --- */}
        {mission.type === 'photo' && (
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative ${isLight ? 'border-slate-300 hover:bg-slate-50' : 'border-slate-700 hover:bg-white/5'}`}
            >
              {previewUrl ? (
                <img src={previewUrl} className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera size={32} className="opacity-30 mb-2" />
                  <span className="text-xs opacity-50">Toque para fotografar</span>
                </>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            
            <button
              onClick={() => selectedFile && handleComplete(selectedFile)}
              disabled={!selectedFile || isVerifying}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isVerifying ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
              {isVerifying ? "Analisando Imagem..." : "Concluir"}
            </button>
          </div>
        )}

        {/* --- TIMER TYPE --- */}
        {mission.type === 'timer' && (
          <div className="flex flex-col items-center py-4">
             <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                   <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="4" fill="transparent" className="opacity-10" />
                   <circle 
                     cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="4" fill="transparent" 
                     className="text-emerald-500 transition-all duration-1000"
                     strokeDasharray={377}
                     strokeDashoffset={377 - (377 * timeLeft) / (mission.duration || 30)}
                   />
                </svg>
                <span className="absolute text-3xl font-mono font-bold">{timeLeft}s</span>
             </div>

             {timeLeft === 0 ? (
               <div className="text-emerald-500 font-bold animate-pulse">Concluído!</div>
             ) : (
               <button
                 onClick={() => setTimerActive(!timerActive)}
                 className={`px-8 py-3 rounded-full font-bold transition-all ${timerActive ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'}`}
               >
                 {timerActive ? "Pausar" : "Começar"}
               </button>
             )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
