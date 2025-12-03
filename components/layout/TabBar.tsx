
import React from 'react';
import { Home, BookOpen, PieChart } from 'lucide-react';

export const TabBar = React.memo(({ current, onChange, isLight }: { current: string, onChange: (v: any) => void, isLight: boolean }) => (
  <div className={`fixed bottom-0 left-0 right-0 ${isLight ? 'bg-white/80 border-black/5' : 'bg-[#050505]/80 border-white/5'} backdrop-blur-xl border-t p-4 flex justify-around items-center z-40 max-w-md mx-auto`}>
    <button onClick={() => onChange('home')} className={`flex flex-col items-center gap-1 ${current === 'home' ? 'text-cyan-400' : 'text-slate-500'}`}>
      <Home size={24} /> <span className="text-[10px] uppercase">Hoje</span>
    </button>
    <button onClick={() => onChange('stats')} className={`flex flex-col items-center gap-1 ${current === 'stats' ? 'text-purple-400' : 'text-slate-500'}`}>
      <PieChart size={24} /> <span className="text-[10px] uppercase">Stats</span>
    </button>
    <button onClick={() => onChange('journal')} className={`flex flex-col items-center gap-1 ${current === 'journal' ? 'text-fuchsia-400' : 'text-slate-500'}`}>
      <BookOpen size={24} /> <span className="text-[10px] uppercase">Histórico</span>
    </button>
  </div>
));
