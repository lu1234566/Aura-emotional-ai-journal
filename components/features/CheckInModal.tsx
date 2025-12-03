import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store/useStore';
import { ApiService } from '../../services/api';
import { X, Sparkles, Loader2, Camera, Trash2, Mic, Square, Play, MapPin, WifiOff, CheckSquare } from 'lucide-react';
import { DailyReport, LocationInfo } from '../../types';

export const CheckInModal = ({ onClose }: { onClose: () => void }) => {
  const { saveReport, user, reports, isLight, isOnline } = useAppStore();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Location State
  const [location, setLocation] = useState<LocationInfo | undefined>(undefined);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };
  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Audio Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) { alert("Erro ao acessar microfone."); }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  const clearAudio = () => { setAudioBlob(null); setAudioPreviewUrl(null); };

  // Location Logic
  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Geolocalização não suportada.");
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoadingLocation(false);
      },
      (err) => {
        console.error(err);
        alert("Erro ao obter localização.");
        setLoadingLocation(false);
      }
    );
  };

  const processEntry = async () => {
    if ((!text.trim() && !file && !audioBlob) || !user) return;
    setIsProcessing(true);
    try {
      setStatus(isOnline ? "Processando mídia..." : "Salvando localmente...");
      
      let audioFile: File | undefined;
      if (audioBlob) audioFile = new File([audioBlob], "rec.webm", { type: "audio/webm" });

      if (isOnline) setStatus("Analisando alma...");
      
      const partialReport = await ApiService.processDiaryEntry(
        text, 
        user.id, 
        file || undefined, 
        audioFile,
        location,
        reports // Pass history for Echoes
      );
      
      const fullReport: DailyReport = {
        id: Date.now().toString(),
        ...partialReport as any
      };

      setStatus("Finalizando...");
      await saveReport(fullReport);
      onClose();
    } catch (e) {
      console.error(e);
      setStatus("Erro!");
    } finally { setIsProcessing(false); }
  };

  const bgClass = isLight ? 'bg-white text-black' : 'bg-[#050505] text-white';
  const cardClass = isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10';

  return (
    <div className={`fixed inset-0 z-50 ${bgClass} flex flex-col p-6 animate-fade-in`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-light tracking-wide flex items-center gap-2">
           Novo Registro
           {!isOnline && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-full flex items-center gap-1"><WifiOff size={10}/> Offline</span>}
        </h2>
        <button onClick={onClose} disabled={isProcessing} className="opacity-50 hover:opacity-100"><X /></button>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        {/* Text */}
        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder={isOnline ? "Como você se sente agora?" : "Diário Offline (salvar agora, analisar depois)"}
          className={`flex-shrink-0 min-h-[120px] w-full ${cardClass} rounded-2xl p-4 text-lg resize-none outline-none focus:border-cyan-500 transition-all`}
          disabled={isProcessing}
        />

        {/* Audio */}
        <div className={`w-full p-4 rounded-xl border border-dashed ${isLight ? 'border-slate-300' : 'border-slate-700'} flex flex-col gap-3 items-center justify-center`}>
          {!audioPreviewUrl ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-800'}`}
            >
              {isRecording ? <Square className="fill-white text-white" size={20} /> : <Mic className="text-white" size={24} />}
            </button>
          ) : (
            <div className="flex items-center gap-3 w-full bg-slate-800/50 p-2 rounded-lg">
              <button className="w-8 h-8 flex items-center justify-center bg-cyan-500 rounded-full text-white"><Play size={14}/></button>
              <span className="text-xs text-slate-400 flex-1">Áudio gravado</span>
              <button onClick={clearAudio} className="p-2 text-red-400 hover:bg-red-400/10 rounded-full"><Trash2 size={16}/></button>
            </div>
          )}
          {!audioPreviewUrl && <span className="text-xs text-slate-400">{isRecording ? "Gravando..." : "Gravar voz"}</span>}
        </div>

        {/* Location */}
        <button 
          onClick={handleGetLocation}
          disabled={!!location || loadingLocation}
          className={`w-full p-3 rounded-xl border border-dashed flex items-center justify-center gap-2 text-sm transition-colors ${location ? 'border-cyan-500/50 text-cyan-500 bg-cyan-500/10' : 'border-slate-700 text-slate-400 hover:bg-white/5'}`}
        >
          {loadingLocation ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={16} />}
          {location ? `Localização anexada` : "Adicionar Localização"}
        </button>

        {/* Image */}
        {previewUrl ? (
          <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10 group flex-shrink-0">
             <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={clearFile} className="p-2 bg-red-500 rounded-full text-white"><Trash2 size={20} /></button>
             </div>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()} className={`w-full h-16 border-2 border-dashed ${isLight ? 'border-slate-300' : 'border-slate-700'} rounded-xl flex items-center justify-center gap-2 cursor-pointer text-slate-500`}>
            <Camera size={20} /><span className="text-sm">Adicionar Foto</span>
          </div>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      </div>

      <div className="pt-4">
        <button 
          onClick={processEntry} 
          disabled={isProcessing || (!text && !file && !audioBlob)}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isProcessing ? 'bg-slate-700' : 'bg-gradient-to-r from-cyan-600 to-purple-600 shadow-lg'}`}
        >
          {isProcessing ? (
            <><Loader2 className="animate-spin"/> {status}</>
          ) : isOnline ? (
            <><Sparkles size={20}/> Gerar Memória</>
          ) : (
            <><CheckSquare size={20}/> Salvar Offline</>
          )}
        </button>
      </div>
    </div>
  );
};