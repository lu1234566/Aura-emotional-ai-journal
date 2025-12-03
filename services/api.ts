





import * as Gemini from './geminiService';
import { BackendService } from './backend';
import { DailyReport, LocationInfo, WeatherInfo } from '../types';
import { fileToBase64 } from './utils';
import { WeatherService } from './weather';

export const ApiService = {
  processDiaryEntry: async (
    text: string, 
    userId: string,
    file?: File,
    audioFile?: File,
    location?: LocationInfo,
    pastReports: DailyReport[] = []
  ): Promise<Partial<DailyReport>> => {
    console.log('[API] Processing Entry. Online:', navigator.onLine);
    
    // 1. Image Upload (Local Blob if offline)
    let photoUrl: string | undefined;
    let imageBase64: string | undefined;

    if (file) {
      try {
        photoUrl = await BackendService.uploadFile(file, userId);
        imageBase64 = await fileToBase64(file);
      } catch (e) { console.error('[API] Image processing failed', e); }
    }

    // 2. Audio Processing (Local Blob if offline)
    let transcription = "";
    let rawAudioUrl: string | undefined;

    if (audioFile) {
      try {
        rawAudioUrl = await BackendService.uploadFile(audioFile, userId);
        if (navigator.onLine) {
           const audioB64 = await fileToBase64(audioFile);
           transcription = await Gemini.transcribeAudio(audioB64);
        } else {
           transcription = "(Transcrição pendente - Offline)";
        }
      } catch (e) { console.error('[API] Audio processing failed', e); }
    }

    const combinedText = `
      ${text}
      ${transcription && navigator.onLine ? `\n(Transcrição de Áudio: "${transcription}")` : ""}
    `.trim();

    // --- FETCH WEATHER (If location present) ---
    let weather: WeatherInfo | undefined;
    if (location && navigator.onLine) {
      console.log('[API] Fetching Weather...');
      const w = await WeatherService.getCurrentWeather(location.lat, location.lng);
      if (w) weather = w;
    }

    // --- OFFLINE BYPASS ---
    if (!navigator.onLine) {
      console.warn('[API] Offline mode detected. Skipping Gemini.');
      return {
        userId,
        createdAt: Date.now(),
        text: text || "Registro Offline",
        photoUrl,
        rawAudioUrl,
        rawAudioMimeType: audioFile?.type,
        transcription: transcription,
        
        // Placeholder data
        emotion: "Offline",
        textEmotion: "Neutro",
        summary: "Registro salvo localmente. Conecte-se para analisar.",
        suggestion: "Este momento está guardado com segurança.",
        moodColor: "#64748b", // Slate-500
        energyLevel: 5,
        positivityLevel: 5,
        location,
        weather, // Store weather even if offline analysis not done
        
        pendingAnalysis: true
      };
    }

    // 3. Core Analysis (Online)
    console.time('[API] Analysis');
    // Pass weather data to Gemini
    const analysis = await Gemini.analyzeMood(combinedText || "Sem texto, apenas presença.", imageBase64, weather);
    console.timeEnd('[API] Analysis');
    
    const recentHistory = pastReports
      .filter(r => !r.pendingAnalysis)
      .slice(0, 10)
      .map(r => ({ date: r.createdAt, emotion: r.emotion, summary: r.summary }));

    // 4. Parallel Generation
    console.log('[API] Generating assets...');
    console.time('[API] Assets');
    
    const [poem, avatarUrl, audioData, suggestedPlaces, echo, selfCareChecklist] = await Promise.all([
      Gemini.generateMoodPoem(combinedText, analysis.emotion).catch(() => null),
      Gemini.generateMoodAvatar(analysis.emotion, analysis.moodColor).catch(() => null),
      Gemini.generateAudioSummary(analysis.summary).catch(() => null),
      location ? Gemini.suggestLocationsViaMaps(analysis.emotion, location.lat, location.lng).catch(() => []) : Promise.resolve([]),
      Gemini.findEmotionalEcho(combinedText, analysis.emotion, recentHistory).catch(() => null),
      Gemini.generateSelfCareChecklist(analysis.emotion, analysis.summary).catch(() => [])
    ]);
    
    console.timeEnd('[API] Assets');

    return {
      userId,
      createdAt: Date.now(),
      text: combinedText,
      photoUrl,
      
      transcription,
      rawAudioUrl,
      rawAudioMimeType: audioFile?.type,
      
      emotion: analysis.emotion,
      textEmotion: analysis.textEmotion,
      imageEmotion: analysis.imageEmotion,
      finalExplanation: analysis.finalExplanation,
      
      summary: analysis.summary,
      suggestion: analysis.suggestion,
      moodColor: analysis.moodColor,
      energyLevel: analysis.energyLevel,
      positivityLevel: analysis.positivityLevel,
      
      // Semantic Analysis Data
      semanticAnalysis: {
        stressIndex: analysis.stressIndex || 0,
        keywords: analysis.keywords || [],
        metaphors: analysis.metaphors || [],
        writingStyle: analysis.writingStyle || "Neutro",
        insightMessage: analysis.insightMessage || ""
      },
      
      poetry: poem || undefined,
      avatarImageUrl: avatarUrl || undefined,
      audioData: audioData || undefined,

      location,
      weather, // Save weather in final report
      suggestedPlaces,
      echo: echo || undefined,
      selfCareChecklist: selfCareChecklist || undefined,
      pendingAnalysis: false
    };
  },

  // Function to re-run AI on an existing offline report
  reanalyzeEntry: async (report: DailyReport, pastReports: DailyReport[]): Promise<DailyReport> => {
    console.log('[API] Re-analyzing entry:', report.id);
    
    // We construct 'combinedText' again if needed or use existing
    // We need to fetch base64 of the image if it exists in blob format (photoUrl)
    let imageBase64: string | undefined;
    
    if (report.photoUrl && report.photoUrl.startsWith('blob:')) {
       // Convert blob url back to base64 if possible
       try {
         const blob = await fetch(report.photoUrl).then(r => r.blob());
         imageBase64 = await fileToBase64(new File([blob], "image.png"));
       } catch (e) { console.warn("Could not retrieve blob for analysis"); }
    }

    // Audio transcription if missing
    let finalTranscription = report.transcription;
    if (report.rawAudioUrl && (!report.transcription || report.transcription.includes("Offline"))) {
       try {
         const blob = await fetch(report.rawAudioUrl).then(r => r.blob());
         const b64 = await fileToBase64(new File([blob], "audio.webm"));
         finalTranscription = await Gemini.transcribeAudio(b64);
       } catch (e) { console.warn("Could not transcribe offline audio"); }
    }

    const combinedText = `
      ${report.text}
      ${finalTranscription ? `\n(Transcrição de Áudio: "${finalTranscription}")` : ""}
    `.trim();

    // Call Analyze (Use stored weather if available)
    const analysis = await Gemini.analyzeMood(combinedText || "Reanálise.", imageBase64, report.weather);
    
    const recentHistory = pastReports.filter(r => r.id !== report.id && !r.pendingAnalysis).slice(0, 10)
      .map(r => ({ date: r.createdAt, emotion: r.emotion, summary: r.summary }));

    const [poem, avatarUrl, audioData, suggestedPlaces, echo, selfCareChecklist] = await Promise.all([
      Gemini.generateMoodPoem(combinedText, analysis.emotion).catch(() => null),
      Gemini.generateMoodAvatar(analysis.emotion, analysis.moodColor).catch(() => null),
      Gemini.generateAudioSummary(analysis.summary).catch(() => null),
      report.location ? Gemini.suggestLocationsViaMaps(analysis.emotion, report.location.lat, report.location.lng).catch(() => []) : Promise.resolve([]),
      Gemini.findEmotionalEcho(combinedText, analysis.emotion, recentHistory).catch(() => null),
      Gemini.generateSelfCareChecklist(analysis.emotion, analysis.summary).catch(() => [])
    ]);

    return {
      ...report,
      transcription: finalTranscription,
      text: combinedText, // Update text to include transcription if needed
      emotion: analysis.emotion,
      textEmotion: analysis.textEmotion,
      imageEmotion: analysis.imageEmotion,
      finalExplanation: analysis.finalExplanation,
      summary: analysis.summary,
      suggestion: analysis.suggestion,
      moodColor: analysis.moodColor,
      energyLevel: analysis.energyLevel,
      positivityLevel: analysis.positivityLevel,
      
      semanticAnalysis: {
        stressIndex: analysis.stressIndex || 0,
        keywords: analysis.keywords || [],
        metaphors: analysis.metaphors || [],
        writingStyle: analysis.writingStyle || "Neutro",
        insightMessage: analysis.insightMessage || ""
      },

      poetry: poem || undefined,
      avatarImageUrl: avatarUrl || undefined,
      audioData: audioData || undefined,
      suggestedPlaces,
      echo: echo || undefined,
      selfCareChecklist: selfCareChecklist || undefined,
      pendingAnalysis: false
    };
  },

  createNightRitual: async (report: DailyReport): Promise<DailyReport> => {
    if (!navigator.onLine) throw new Error("Offline");
    
    // Generate Text Content
    const content = await Gemini.generateNightContent(report.summary, report.emotion);
    if (!content) throw new Error("Failed to generate night content");

    // Generate Audio for the story
    const audioData = await Gemini.generateNightAudio(content.story);

    return {
      ...report,
      nightRitual: {
        story: content.story,
        meditation: content.meditation,
        poem: content.poem,
        audioData: audioData || undefined
      }
    };
  },

  generateCinematicScene: async (emotion: string, summary: string, style: string) => {
    if (!navigator.onLine) return null;
    return Gemini.generateCinematicScene(emotion, summary, style);
  },
  
  chatWithAura: async (message: string, history: any[], context?: string) => {
    if (!navigator.onLine) return "Estou em modo offline. Conecte-se para conversar.";
    return Gemini.chatWithAura(message, history, context);
  }
};
