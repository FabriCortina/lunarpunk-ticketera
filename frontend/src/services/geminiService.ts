import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEventDescription = async (
  title: string,
  location: string,
  userDescription: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escribe una descripción breve (6–8 líneas) para un evento llamado "${title}" en "${location}". Tono: divertido, atractivo y misterioso. Integra y mejora este texto base del organizador: "${userDescription}". Evita repetir frases y usa español neutro.`,
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
