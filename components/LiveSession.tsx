import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/utils';
import { Mic, MicOff, PhoneOff, Activity, Sparkles } from 'lucide-react';

interface LiveSessionProps {
  onClose: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        
        const outputNode = audioContextRef.current.createGain();
        outputNode.connect(audioContextRef.current.destination);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              if (!mounted) return;
              setStatus('connected');
              
              if (!inputAudioContextRef.current) return;
              const source = inputAudioContextRef.current.createMediaStreamSource(stream);
              const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                if (isMuted) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(processor);
              processor.connect(inputAudioContextRef.current.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
               if (!mounted) return;
               
               const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
               if (base64Audio && audioContextRef.current) {
                 const ctx = audioContextRef.current;
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                 
                 const audioBuffer = await decodeAudioData(
                   base64ToUint8Array(base64Audio),
                   ctx
                 );
                 
                 const source = ctx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(outputNode);
                 source.start(nextStartTimeRef.current);
                 
                 nextStartTimeRef.current += audioBuffer.duration;
                 sourcesRef.current.add(source);
                 
                 source.onended = () => sourcesRef.current.delete(source);
               }

               if (message.serverContent?.interrupted) {
                 sourcesRef.current.forEach(s => s.stop());
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
               }
            },
            onclose: () => {
               if(mounted) setStatus('error');
            },
            onerror: (err) => {
              console.error(err);
              if(mounted) setStatus('error');
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: "Você é um terapeuta empático e perspicaz, ajudando o usuário a processar suas emoções no diário LumenMind. Fale português do Brasil."
          }
        });
        
        sessionRef.current = await sessionPromise;

      } catch (e) {
        console.error("Live session failed", e);
        if (mounted) setStatus('error');
      }
    };

    startSession();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      processorRef.current?.disconnect();
      inputAudioContextRef.current?.close();
      audioContextRef.current?.close();
      sessionRef.current?.close();
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#050505] flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-float"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-10">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
          <div className="bg-white/5 backdrop-blur-xl p-10 rounded-full border border-white/10 shadow-2xl">
            <Activity size={64} className={`text-cyan-400 ${status === 'connected' ? 'animate-pulse' : ''}`} />
          </div>
          {status === 'connected' && (
            <div className="absolute -top-2 -right-2 bg-green-500 w-4 h-4 rounded-full border-2 border-black animate-ping"></div>
          )}
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-light text-white tracking-wide">
            {status === 'connecting' && "Sintonizando..."}
            {status === 'connected' && "Escutando sua alma"}
            {status === 'error' && "Sinal perdido"}
          </h2>
          <p className="text-slate-400 font-light">
            Fale livremente. A IA está aqui para ouvir.
          </p>
        </div>

        <div className="flex gap-8 mt-8">
          <button 
            onClick={toggleMute}
            className={`p-6 rounded-full transition-all border border-white/10 ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white hover:bg-white/10 hover:scale-105'}`}
          >
            {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          
          <button 
            onClick={onClose}
            className="p-6 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 hover:scale-105"
          >
            <PhoneOff size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveSession;