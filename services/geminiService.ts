


import { GoogleGenAI, Type, Modality } from "@google/genai";
import { wait } from './utils';
import { DailyReport, WeatherInfo } from '../types';

// Safe getter for API Key
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  if (typeof window !== 'undefined' && (window as any).API_KEY) {
    return (window as any).API_KEY;
  }
  return "";
};

const getAi = () => new GoogleGenAI({ apiKey: getApiKey() });

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    console.warn(`[Gemini] Operation failed. Retries left: ${retries}. Error:`, error);
    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      await wait(delay);
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

// ... existing code (analyzeMood) ...
export const analyzeMood = async (text: string, imageBase64?: string, weather?: WeatherInfo) => {
  return retryOperation(async () => {
    console.group('[Gemini] Analyze Mood (Multimodal + Semantic + Weather)');
    console.log('Input Text:', text);
    
    const ai = getAi();
    
    let weatherContext = "";
    if (weather) {
      weatherContext = `
      CONTEXTO CLIMÁTICO ATUAL:
      - Temperatura: ${weather.temperature}°C
      - Condição: ${weather.conditionText}
      - Período: ${weather.isDay ? "Dia" : "Noite"}
      
      IMPORTANTE: Use o clima para refinar a "suggestion".
      - Se Frio/Chuva + Triste: Sugira conforto (chá, cobertor, música calma).
      - Se Calor/Sol + Triste: Sugira sair um pouco, hidratação.
      - Se Calor + Feliz: Sugira celebrar fora.
      - Se Chovendo + Feliz: Sugira criatividade interna.
      `;
    }

    const promptText = `
      Você é um analisador emocional multimodal e linguístico para um diário inteligente (Aura).
      Analise o texto e, se fornecida, a imagem.

      ${weatherContext}

      TAREFA 1: ANÁLISE BÁSICA
      1. Identifique a emoção no TEXTO e na IMAGEM.
      2. Combine para determinar a 'emotion' final.
      3. Resumo (1 frase) e Sugestão prática (Considere o clima se fornecido!).
      4. Cores e níveis de energia (1-10) e positividade (1-10).

      TAREFA 2: ANÁLISE SEMÂNTICA PROFUNDA (Semantic Stress Index)
      1. Calcule o 'stressIndex' (0 a 100) baseado na tensão do texto.
      2. Extraia 'keywords' (palavras-chave emocionais fortes).
      3. Identifique 'metaphors' recorrentes ou significativas (ex: "carregando o mundo", "vazio no peito").
      4. Defina o 'writingStyle' (ex: "Analítico", "Poético", "Caótico", "Urgente").
      5. Gere uma 'insightMessage': Uma observação direta para o usuário sobre os padrões de palavras usados. 
         Ex: "Notei que você usou muitas palavras ligadas a peso e bloqueio. Quer explorar o que está te prendendo?"
         Se for positivo: "Sua linguagem hoje transmite clareza e leveza."
      
      Se o clima influenciou a sugestão, mencione sutilmente na sugestão. Ex: "Com essa chuva, que tal..."

      Retorne JSON estrito.
    `;

    const parts: any[] = [{ text: promptText }];
    parts.push({ text: `Texto do Usuário: "${text}"` });

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: { type: Type.STRING },
            textEmotion: { type: Type.STRING },
            imageEmotion: { type: Type.STRING },
            finalExplanation: { type: Type.STRING },
            summary: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            moodColor: { type: Type.STRING },
            energyLevel: { type: Type.INTEGER },
            positivityLevel: { type: Type.INTEGER },
            // Novos campos semânticos
            stressIndex: { type: Type.INTEGER },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            metaphors: { type: Type.ARRAY, items: { type: Type.STRING } },
            writingStyle: { type: Type.STRING },
            insightMessage: { type: Type.STRING }
          },
          required: ["emotion", "summary", "suggestion", "moodColor", "energyLevel", "positivityLevel", "stressIndex", "writingStyle", "insightMessage"]
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      console.log('Parsed Analysis:', parsed);
      console.groupEnd();
      return parsed;
    } catch (e) {
      console.error("[Gemini] JSON Parse Error", e);
      console.groupEnd();
      return {
        emotion: "Reflexivo",
        summary: "Um momento registrado.",
        suggestion: "Continue respirando.",
        moodColor: "#888888",
        energyLevel: 5,
        positivityLevel: 5,
        stressIndex: 0,
        keywords: [],
        metaphors: [],
        writingStyle: "Neutro",
        insightMessage: "Registrado com sucesso."
      };
    }
  });
};

export const generateMoodPoem = async (text: string, emotion: string) => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [{ text: `Escreva uma poesia concreta curta em Português sobre: "${text}" com o sentimento "${emotion}". Foco visual. Sem títulos.` }]
      }
    });
    return response.text;
  } catch (e) { return null; }
};

export const generateMoodAvatar = async (emotion: string, colorHex: string) => {
  try {
    const ai = getAi();
    const prompt = `Abstract 3D glossy orb representing '${emotion}', glowing with ${colorHex}, minimal, 8k render, ethereal background.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (e) { return null; }
};

export const generateAudioSummary = async (text: string) => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { return null; }
};

// ============================================================================
// Night Ritual Content
// ============================================================================
export const generateNightContent = async (summary: string, emotion: string) => {
  console.log('[Gemini] Generating Night Ritual Content...');
  try {
    const ai = getAi();
    const prompt = `
      Crie um "Ritual da Noite" personalizado para alguém que teve este dia:
      Resumo: "${summary}"
      Emoção Principal: "${emotion}"

      Gere 3 itens em JSON estrito:
      1. "story": Uma micro-história de ninar (max 100 palavras) em segunda pessoa ("Você..."), onde o usuário deixa as preocupações do dia e entra num mundo de sonhos relaxante.
      2. "meditation": Um guia de respiração muito curto (max 30 palavras). Ex: "Inspire paz... segure... expire tensão."
      3. "poem": Um haicai ou frase calmante sobre descanso.

      Output JSON:
      {
        "story": "...",
        "meditation": "...",
        "poem": "..."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error('[Gemini] Night Content failed:', e);
    return null;
  }
};

export const generateNightAudio = async (text: string) => {
  console.log('[Gemini] Generating Night Audio...');
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { 
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } // Deeper, calmer voice
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { 
    console.error('[Gemini] Night Audio failed:', e);
    return null; 
  }
};

// ============================================================================
// Transcribe Audio (Speech-to-Text)
// ============================================================================
export const transcribeAudio = async (audioBase64: string): Promise<string> => {
  console.log('[Gemini] Transcribing Audio...');
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Fast multimodal model
      contents: {
        parts: [
          { text: "Transcreva o áudio a seguir exatamente como foi falado. Se não houver fala, retorne string vazia." },
          {
            inlineData: {
              mimeType: "audio/webm", // Assuming webm from MediaRecorder
              data: audioBase64
            }
          }
        ]
      }
    });
    
    const text = response.text || "";
    console.log('[Gemini] Transcription:', text);
    return text;
  } catch (e) {
    console.error('[Gemini] Transcription failed:', e);
    return "";
  }
};

// ============================================================================
// Maps: Suggest Locations
// ============================================================================
export const suggestLocationsViaMaps = async (emotion: string, lat: number, lng: number) => {
  console.log(`[Gemini] Getting suggestions for ${emotion} at ${lat}, ${lng}`);
  try {
    const ai = getAi();
    const prompt = `
      Você é um guia local empático.
      O usuário está nas coordenadas: ${lat}, ${lng}.
      O humor do usuário é: "${emotion}".
      
      Sugira 3 lugares reais próximos (máx 5km) que combinem com esse humor.
      Ex: Se triste -> parque calmo, café aconchegante. Se feliz -> praça movimentada, mirante.
      
      Retorne JSON estrito:
      {
        "places": [
          {
            "name": "Nome do Lugar",
            "type": "Categoria (Parque, Café, etc)",
            "address": "Endereço curto",
            "reason": "Por que combina com o humor",
            "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Nome+do+Lugar"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Fast logic
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(response.text || "{}");
    return parsed.places || [];
  } catch (e) {
    console.error('[Gemini] Maps suggestion failed:', e);
    return [];
  }
};

// ============================================================================
// Echoes: Memory Pattern Matching
// ============================================================================
export const findEmotionalEcho = async (
  currentText: string,
  currentEmotion: string,
  history: { date: number; emotion: string; summary: string }[]
) => {
  if (history.length === 0) return null;

  console.log('[Gemini] Finding Emotional Echoes...');
  try {
    const ai = getAi();
    const historyText = history
      .map(h => `- Data: ${new Date(h.date).toLocaleDateString()}, Emoção: ${h.emotion}, Resumo: ${h.summary}`)
      .join('\n');

    const prompt = `
      Você é a memória emocional do Aura.
      
      HOJE:
      Emoção: "${currentEmotion}"
      Texto: "${currentText}"

      HISTÓRICO RECENTE:
      ${historyText}

      TAREFA:
      Encontre UM padrão significativo (Eco) comparando hoje com o passado.
      Pode ser:
      1. Recorrência: "Você sentiu isso semana passada também."
      2. Resiliência: "Da última vez que sentiu isso, [ação do resumo] te ajudou."
      3. Contraste: "Você está muito mais leve hoje do que no dia X."

      Se não houver conexão clara, retorne JSON vazio {}.
      
      Retorne JSON estrito:
      {
        "type": "recurrence" | "resilience" | "contrast",
        "title": "Título curto do Eco",
        "message": "Mensagem empática e curta (máx 2 frases) conectando os pontos.",
        "referenceDate": 1234567890 (timestamp da entrada passada relevante)
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Deep reasoning needed for patterns
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(response.text || "{}");
    if (!parsed.type) return null;
    
    return parsed;
  } catch (e) {
    console.error('[Gemini] Echo finding failed:', e);
    return null;
  }
};

// ============================================================================
// Self Care Checklist
// ============================================================================
export const generateSelfCareChecklist = async (emotion: string, summary: string) => {
  console.log('[Gemini] Generating Self Care Checklist...');
  try {
    const ai = getAi();
    const prompt = `
      Baseado na emoção "${emotion}" e no resumo do dia: "${summary}",
      crie uma checklist de autocuidado com 3 a 5 itens simples e rápidos (max 10 min).
      Ex: "Beber um copo d'água", "Ouvir uma música calma", "Respirar fundo 10x".
      
      Retorne JSON estrito:
      {
        "tasks": [
          { "text": "Tarefa 1" },
          { "text": "Tarefa 2" }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(response.text || "{}");
    if (!parsed.tasks) return [];
    
    return parsed.tasks.map((t: any, i: number) => ({
      id: `task-${Date.now()}-${i}`,
      text: t.text,
      isCompleted: false
    }));
  } catch (e) {
    console.error('[Gemini] Checklist generation failed:', e);
    return [];
  }
};

// ============================================================================
// Forecasting Insight
// ============================================================================
export const generateForecastInsight = async (stats: any) => {
  console.log('[Gemini] Generating Emotional Forecast...');
  try {
    const ai = getAi();
    const prompt = `
      Atue como um analista de "Previsão do Tempo Emocional".
      Baseado nos padrões estatísticos do usuário, gere uma mensagem curta de previsão (insight).
      
      DADOS:
      - Melhor Dia da Semana: ${stats.bestDay}
      - Dia Mais Difícil: ${stats.challengingDay}
      - Horário de Pico de Energia: ${stats.peakTime}
      - Horário Sensível (Baixa Positividade): ${stats.sensitiveTime}
      
      TAREFA:
      Escreva uma frase empática e útil (máx 20 palavras) usando esses dados.
      Ex: "Historicamente, terças à tarde são tensas. Reserve um tempo para você hoje."
      
      Não repita os dados roboticamente, interprete-os.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }] }
    });
    
    return response.text.trim();
  } catch (e) {
    console.error('[Gemini] Forecast failed:', e);
    return "Os ventos estão mudando. Mantenha-se atento aos seus sentimentos.";
  }
};

// ============================================================================
// COMPANION: Message & Visuals
// ============================================================================

export const generateCompanionGreeting = async (name: string, history: DailyReport[]) => {
  console.log('[Gemini] Generating Companion Greeting...');
  try {
    const ai = getAi();
    
    // Sort and get last few entries
    const recent = history.slice(0, 3).map(r => ({
      summary: r.summary,
      emotion: r.emotion,
      positivity: r.positivityLevel || 5
    }));

    // If no history, generic greeting
    if (recent.length === 0) {
      return { text: `Olá, ${name}. Estou aqui para começar essa jornada com você.`, type: 'encouragement' };
    }

    const yesterday = recent[0]; // Most recent
    const prompt = `
      Você é a "Aura", uma companheira espiritual de diário do usuário chamado "${name}".
      
      CONTEXTO RECENTE:
      - Ontem: Emoção "${yesterday.emotion}", Positividade ${yesterday.positivity}/10. Resumo: "${yesterday.summary}".
      
      TAREFA:
      Escreva uma mensagem muito curta (máx 15 palavras) para exibir na tela inicial hoje.
      - Se ontem foi difícil (positivity < 5): Seja encorajadora e orgulhosa. (ex: "Vi que ontem foi difícil. Orgulho da sua força.")
      - Se ontem foi bom (positivity >= 5): Celebre ou inspire. (ex: "Sua luz brilhou ontem. Vamos manter essa energia?")
      
      Retorne JSON:
      {
        "text": "...",
        "type": "encouragement" | "celebration" | "reflection"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error('[Gemini] Companion Greeting failed:', e);
    return { text: `Olá, ${name}. Espero que hoje seja um dia leve.`, type: 'reflection' };
  }
};

export const generateCompanionVisual = async (level: number, dominantEmotions: string[]) => {
  console.log('[Gemini] Generating Companion Visual...');
  try {
    const ai = getAi();
    
    // Determine archetype based on emotions
    const emotionsStr = dominantEmotions.join(", ");
    const promptDescription = `
      Based on emotions: [${emotionsStr}] and Level ${level}.
      Create a prompt for a "Spirit Companion" avatar.
      Level 1-5: Small, floating orb/wisp.
      Level 5-10: Small animal spirit (fox, owl, cat) made of light/crystal.
      Level 10+: Majestic ethereal guardian.
      
      Return ONLY the image generation prompt string describing the visual style (Abstract, Bioluminescent, 3D Render).
    `;
    
    const descResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: promptDescription }] }
    });
    
    const imagePrompt = descResponse.text;
    
    // Generate Image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `A centralized, cute and mystical spirit avatar. ${imagePrompt}. Dark background, glowing, 8k resolution, minimalist character design.` }] }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (e) {
    console.error('[Gemini] Companion Visual failed:', e);
    return null;
  }
};

// ============================================================================
// Chat with Aura
// ============================================================================
export const chatWithAura = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  context?: string
) => {
  try {
    const ai = getAi();
    const systemInstruction = `
      Você é a Aura, uma companheira de IA empática, calma e reflexiva.
      Não dê conselhos médicos. Foco em acolhimento, validação e perguntas que ajudem o usuário a entender seus sentimentos.
      Seja breve e natural. Fale português do Brasil.
      
      Contexto emocional atual do usuário: ${context || "Desconhecido"}
    `;

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction },
      history: history
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (e) {
    console.error('[Gemini] Chat failed:', e);
    return "Estou tendo dificuldade para processar isso agora. Podemos tentar de novo?";
  }
};

export const generateCinematicScene = async (emotion: string, summary: string, style: string) => {
  try {
    const ai = getAi();
    const prompt = `
      Cinematic scene representing the feeling of '${emotion}' based on this story: '${summary}'.
      Art Style: ${style}.
      High resolution, detailed, atmospheric, 8k wallpaper.
      No text, pure visual storytelling.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (e) { return null; }
};
