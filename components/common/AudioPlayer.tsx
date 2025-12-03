
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { base64ToUint8Array, decodeAudioData } from '../../services/utils';

interface Props {
  audioData?: string; // Base64 PCM
  onRegenerate?: () => void;
  isLoading?: boolean;
}

export const AudioPlayer: React.FC<Props> = ({ audioData, onRegenerate, isLoading }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const sourceNode = useRef<AudioBufferSourceNode | null>(null);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    setHasAudio(!!audioData);
    return () => stop();
  }, [audioData]);

  const play = async () => {
    if (!audioData) return;
    
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContext.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const buffer = await decodeAudioData(base64ToUint8Array(audioData), ctx);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      
      sourceNode.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch (e) {
      console.error("Audio playback error", e);
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (sourceNode.current) {
      sourceNode.current.stop();
      sourceNode.current.disconnect();
    }
    setIsPlaying(false);
  };

  const toggle = () => isPlaying ? stop() : play();

  if (!hasAudio && !onRegenerate) return null;

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 mt-4 backdrop-blur-md">
      {hasAudio ? (
        <button 
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center bg-cyan-500 rounded-full text-white hover:bg-cyan-400 transition-colors"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>
      ) : (
        <button 
          onClick={onRegenerate}
          disabled={isLoading}
          className="flex items-center gap-2 text-xs font-medium text-cyan-400 uppercase tracking-wider disabled:opacity-50"
        >
          {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
          Gerar Áudio
        </button>
      )}
      
      <div className="flex-1">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full bg-cyan-500 transition-all duration-300 ${isPlaying ? 'w-full animate-pulse' : 'w-0'}`}></div>
        </div>
      </div>
      
      <span className="text-[10px] text-slate-400 font-mono uppercase">
        {hasAudio ? (isPlaying ? "Reproduzindo" : "Ouvir") : "TTS IA"}
      </span>
    </div>
  );
};
