

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  achievements?: Achievement[]; // Unlocked badges
  level?: number; // Calculated level
  xp?: number; // Experience points
  companion?: Companion; // Virtual Evolutionary Companion
  
  // Daily Missions System
  dailyMissions?: Mission[];
  lastMissionDate?: number; // Timestamp of last mission generation
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'photo' | 'timer';
  target?: string; // For verification (e.g., "sky", "positive")
  duration?: number; // For timer (seconds)
  completed: boolean;
  xpReward: number;
}

export interface Companion {
  stage: number; // 1 (Orb) -> 2 (Spirit) -> 3 (Guardian)
  name: string; // User can name it, default "Aura"
  visualDescription: string; // The prompt used to generate it
  imageUrl: string; // Generated image
  traits: string[]; // e.g., "Empático", "Resiliente", "Poético"
  lastMessage: {
    text: string;
    date: number; // Timestamp to ensure only 1 message per day
    type: 'encouragement' | 'celebration' | 'reflection';
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  unlockedAt?: number;
  isUnlocked: boolean;
  color: string;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  city?: string;
  region?: string;
}

export interface WeatherInfo {
  temperature: number;
  conditionCode: number; // WMO code
  conditionText: string; // "Céu Limpo", "Chuva", etc.
  isDay: boolean;
}

export interface SuggestedPlace {
  name: string;
  type: string; // "Parque", "Café", etc.
  address?: string;
  mapsUrl?: string;
  distanceKm?: number;
  reason?: string;
}

export interface EmotionalEcho {
  type: 'recurrence' | 'resilience' | 'contrast';
  title: string;
  message: string;
  referenceDate?: number; // Timestamp of the past entry
  referenceSummary?: string;
}

export interface SelfCareTask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface NightRitualData {
  story: string;
  meditation: string;
  poem: string;
  audioData?: string; // TTS narration
}

export interface SemanticAnalysis {
  stressIndex: number; // 0 to 100
  keywords: string[]; // e.g. "cansado", "escuro"
  metaphors: string[]; // e.g. "peso no peito", "fundo do poço"
  writingStyle: string; // e.g. "Analítico", "Caótico", "Poético"
  insightMessage: string; // "Notei que você usa muitas palavras de..."
}

export interface EmotionalForecast {
  bestDay: string; // e.g., "Sexta-feira"
  challengingDay: string; // e.g., "Segunda-feira"
  peakTime: string; // e.g., "Manhã"
  sensitiveTime: string; // e.g., "Noite"
  insight: string; // "Historicamente, terças à tarde são momentos de maior ansiedade..."
  trendIcon: 'sun' | 'cloud' | 'rain' | 'storm';
}

export interface WeeklyReviewData {
  range: string; // "10 Out - 17 Out"
  bestDay: { date: string; emotion: string; summary: string };
  tenseMoment: { date: string; emotion: string; trigger: string } | null;
  dominantMood: string;
  bestArtifact: { poem?: string; avatarUrl?: string; emotion: string };
  topPlaces: string[]; // Names of places
  totalEntries: number;
}

export interface DailyReport {
  id: string;
  userId: string;
  createdAt: number; // Timestamp
  
  // Inputs
  text: string;
  photoUrl?: string;
  
  // Audio Input
  transcription?: string;
  rawAudioUrl?: string; // Blob URL local ou remota
  rawAudioMimeType?: string;

  // AI Analysis
  emotion: string; 
  textEmotion?: string; 
  imageEmotion?: string; 
  finalExplanation?: string; 
  
  summary: string; 
  suggestion: string; 
  
  // Visuals & Extras
  moodColor: string; 
  poetry?: string;
  avatarImageUrl?: string; 
  audioData?: string; // TTS
  
  // Creative Scene
  sceneUrl?: string;
  sceneStyle?: string;

  // 🌍 Location & Grounding & Weather
  location?: LocationInfo;
  weather?: WeatherInfo;
  suggestedPlaces?: SuggestedPlace[];

  // 🧠 Memory / Echoes
  echo?: EmotionalEcho;

  // 📊 Deep Semantics
  semanticAnalysis?: SemanticAnalysis;

  // ✨ Self Care
  selfCareChecklist?: SelfCareTask[];
  
  // 🌙 Night Ritual
  nightRitual?: NightRitualData;
  
  // Metrics
  energyLevel: number;
  positivityLevel: number;

  // 🔌 Offline / Sync Status
  pendingAnalysis?: boolean;
}