
import { WeatherInfo } from '../types';

export const WeatherService = {
  getCurrentWeather: async (lat: number, lng: number): Promise<WeatherInfo | null> => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const current = data.current_weather;
      
      if (!current) return null;

      return {
        temperature: current.temperature,
        conditionCode: current.weathercode,
        conditionText: getWeatherDescription(current.weathercode),
        isDay: current.is_day === 1
      };
    } catch (e) {
      console.error("Failed to fetch weather", e);
      return null;
    }
  }
};

// WMO Weather interpretation codes (WW)
function getWeatherDescription(code: number): string {
  if (code === 0) return "Céu Limpo";
  if (code === 1) return "Principalmente Limpo";
  if (code === 2) return "Parcialmente Nublado";
  if (code === 3) return "Nublado";
  if (code >= 45 && code <= 48) return "Nevoeiro";
  if (code >= 51 && code <= 55) return "Chuvisco";
  if (code >= 61 && code <= 65) return "Chuva";
  if (code >= 71 && code <= 77) return "Neve";
  if (code >= 80 && code <= 82) return "Pancadas de Chuva";
  if (code >= 95) return "Tempestade";
  return "Clima Variável";
}
