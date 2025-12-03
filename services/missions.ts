
import { Mission, User } from '../types';
import { GoogleGenAI } from "@google/genai";

// Pool of possible missions
const MISSION_POOL: Omit<Mission, 'id' | 'completed'>[] = [
  { title: "Gratidão", description: "Escreva uma frase sobre algo que te fez sorrir hoje.", type: "text", target: "positive", xpReward: 20 },
  { title: "Olhar para o Céu", description: "Tire uma foto do céu agora.", type: "photo", target: "sky", xpReward: 30 },
  { title: "Natureza Próxima", description: "Encontre algo verde (planta, árvore) e fotografe.", type: "photo", target: "plant", xpReward: 30 },
  { title: "Pausa", description: "Respire fundo por 30 segundos.", type: "timer", duration: 30, xpReward: 15 },
  { title: "Hidratação", description: "Tire uma foto do seu copo de água.", type: "photo", target: "glass", xpReward: 25 },
  { title: "Afirmação", description: "Escreva: 'Eu sou capaz de superar desafios'.", type: "text", target: "affirmation", xpReward: 20 },
  { title: "Silêncio", description: "Fique 1 minuto em silêncio absoluto.", type: "timer", duration: 60, xpReward: 40 },
  { title: "Desconectar", description: "Escreva como você se sente ao largar o celular.", type: "text", target: "reflection", xpReward: 25 },
];

export const MissionService = {
  // Check if missions need refresh (new day)
  checkAndRefresh: (user: User): User => {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastDate = user.lastMissionDate ? new Date(user.lastMissionDate).setHours(0, 0, 0, 0) : 0;

    if (!user.dailyMissions || lastDate < today) {
      // Generate 3 random missions
      const shuffled = [...MISSION_POOL].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3).map((m, i) => ({
        ...m,
        id: `mission-${Date.now()}-${i}`,
        completed: false
      }));

      return {
        ...user,
        dailyMissions: selected,
        lastMissionDate: Date.now()
      };
    }
    
    return user;
  },

  // Verify mission completion
  verifyMission: async (mission: Mission, input: string | File): Promise<boolean> => {
    // 1. Timer Logic (Client side trust)
    if (mission.type === 'timer') {
      return true; // If the component called this, the timer finished.
    }

    // 2. Offline Bypass
    if (!navigator.onLine) {
       console.log("Offline: trusting user for mission");
       return true;
    }

    // 3. AI Verification
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || (window as any).API_KEY });
      
      let prompt = "";
      let parts: any[] = [];

      if (mission.type === 'text') {
        prompt = `
          Analise a frase: "${input}".
          A missão era: "${mission.description}".
          
          Responda APENAS "true" se a frase for válida/relevante para a missão, ou "false" se for spam/sem sentido.
          Não explique.
        `;
        parts.push({ text: prompt });
      } 
      else if (mission.type === 'photo' && input instanceof File) {
        // Convert File to Base64
        const base64 = await new Promise<string>((resolve) => {
           const reader = new FileReader();
           reader.onload = () => resolve((reader.result as string).split(',')[1]);
           reader.readAsDataURL(input);
        });

        prompt = `
          Veja esta imagem.
          A missão é encontrar: "${mission.target}" (ex: céu, planta, copo).
          
          Responda APENAS "true" se a imagem contiver algo relacionado ao alvo, ou "false" caso contrário.
        `;
        
        parts.push({ text: prompt });
        parts.push({ inlineData: { mimeType: input.type, data: base64 } });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts }
      });
      
      const text = response.text?.trim().toLowerCase();
      console.log(`[Mission] AI Verification: ${text}`);
      return text?.includes("true") || false;

    } catch (e) {
      console.error("[Mission] Verification failed", e);
      // Fallback: trust user if AI fails
      return true;
    }
  }
};
