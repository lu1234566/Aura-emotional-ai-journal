
import React, { useEffect } from 'react';
import { useAppStore } from './store/useStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { TabBar } from './components/layout/TabBar';
import { LoginView } from './components/auth/LoginView';
import { HomeView } from './components/dashboard/HomeView';
import { JournalView } from './components/journal/JournalView';
import { StatsView } from './components/stats/StatsView';

function App() {
  const { user, view, setView, isLight } = useAppStore();

  if (!user) {
    return (
      <ErrorBoundary>
        <div className={`h-full max-w-md mx-auto ${isLight ? 'bg-[#f0f9ff]' : 'bg-[#050505]'} border-x ${isLight ? 'border-black/5' : 'border-white/5'} transition-colors`}>
          <LoginView />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`h-full max-w-md mx-auto relative ${isLight ? 'bg-[#f0f9ff]' : 'bg-[#050505]'} border-x ${isLight ? 'border-black/5' : 'border-white/5'} shadow-2xl transition-colors duration-500`}>
        {view === 'home' && <HomeView />}
        {view === 'stats' && <StatsView />}
        {view === 'journal' && <JournalView />}
        <TabBar current={view} onChange={setView} isLight={isLight} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
