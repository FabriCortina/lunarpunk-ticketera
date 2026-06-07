import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

const getClient = () => {
  if (!env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: env.API_KEY });
};

export class AiService {
  async generateEventDescription(
    title: string,
    location: string,
    baseDescription: string
  ): Promise<string> {
    const ai = getClient();
    if (!ai) return baseDescription || 'No se pudo generar la descripción.';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Escribe una descripción breve (6–8 líneas) para un evento llamado "${title}" en "${location}". Tono: divertido, atractivo y misterioso. Integra y mejora este texto base del organizador: "${baseDescription}". Evita repetir frases y usa español neutro.`
      });
      return response.text || baseDescription || 'No se pudo generar la descripción.';
    } catch (error) {
      return 'Error al conectar con la IA Lunar.';
    }
  }

  async suggestEventTitle(theme: string): Promise<string> {
    const ai = getClient();
    if (!ai) return theme;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Genera UN solo nombre creativo y corto para un evento estilo LunarPunk basado en la temática: "${theme}". No uses comillas.`
      });
      return response.text?.trim() || theme;
    } catch (error) {
      return theme;
    }
  }
}
