import { GoogleGenAI } from "@google/genai";
import { env } from '../config/env';

const ai = new GoogleGenAI({ apiKey: env.API_KEY });

export const generateEventDescription = async (title: string, location: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escribe una descripción corta, emocionante y futurista (estilo cyberpunk/lunarpunk) de un párrafo para un evento llamado "${title}" que tendrá lugar en "${location}". Usa un tono misterioso y atractivo.`,
    });
    
    return response.text || "No se pudo generar la descripción.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "Error al conectar con la IA Lunar.";
  }
};

export const suggestEventTitle = async (theme: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Genera UN solo nombre creativo y corto para un evento estilo LunarPunk basado en la temática: "${theme}". No uses comillas.`,
    });
    return response.text?.trim() || theme;
  } catch (error) {
    return theme;
  }
}