
import React from 'react';
import { useAppStore } from '../../store/useStore';
import { AuraLogo } from '../common/AuraLogo';
import { LogIn, Loader2 } from 'lucide-react';

export const LoginView = () => {
  const { login, isLoading } = useAppStore();
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/20 to-purple-900/20 blur-3xl"></div>
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
          <AuraLogo className="w-24 h-24" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-light tracking-widest text-white">AURA</h1>
          <p className="text-slate-400 text-sm uppercase tracking-widest">Ressonância Emocional</p>
        </div>
        <button 
          onClick={() => login()}
          disabled={isLoading}
          className="mt-8 flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-medium hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          {isLoading ? <Loader2 className="animate-spin"/> : <LogIn size={20} />} 
          Entrar com Google
        </button>
      </div>
    </div>
  );
};
