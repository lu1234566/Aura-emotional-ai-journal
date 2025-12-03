
import { Companion, User, DailyReport } from '../types';
import * as Gemini from './geminiService';
import { BackendService } from './backend';

export const CompanionService = {
  // Initialize or Update Companion on App Launch
  checkAndRefresh: async (user: User, reports: DailyReport[], isOnline: boolean): Promise<User> => {
    let companion = user.companion;
    let needsSave = false;
    const today = new Date().setHours(0,0,0,0);

    // 1. Initialize if missing
    if (!companion) {
      companion = {
        name: "Aura",
        stage: 1,
        visualDescription: "Glowing light orb",
        imageUrl: "", // Will generate if online
        traits: ["Calmo"],
        lastMessage: {
          text: `Olá, ${user.name.split(' ')[0]}. Estou aqui com você.`,
          date: Date.now(),
          type: 'reflection'
        }
      };
      needsSave = true;
    }

    if (!isOnline) {
       // If offline and first creation, just save standard structure
       if (needsSave) {
          await BackendService.saveUser({ ...user, companion });
       }
       return { ...user, companion };
    }

    // 2. Refresh Message (Once per day)
    const lastMsgDate = new Date(companion.lastMessage.date).setHours(0,0,0,0);
    if (lastMsgDate < today && reports.length > 0) {
      const greeting = await Gemini.generateCompanionGreeting(user.name, reports);
      if (greeting) {
        companion.lastMessage = {
          text: greeting.text,
          date: Date.now(),
          type: greeting.type || 'reflection'
        };
        needsSave = true;
      }
    }

    // 3. Evolve Visuals (If missing or level changed significantly)
    // For prototype: If no image, generate one.
    if (!companion.imageUrl && reports.length > 0) {
      const dominantEmotions = reports.slice(0, 5).map(r => r.emotion);
      const imageUrl = await Gemini.generateCompanionVisual(user.level || 1, dominantEmotions);
      if (imageUrl) {
        companion.imageUrl = imageUrl;
        needsSave = true;
      }
    }

    if (needsSave) {
      const updatedUser = { ...user, companion };
      // BackendService typically doesn't have a direct 'saveUser' in this mock except via signin, 
      // but let's assume we patch the local storage user object.
      localStorage.setItem("aura_user_v1", JSON.stringify(updatedUser));
      return updatedUser;
    }

    return user;
  }
};