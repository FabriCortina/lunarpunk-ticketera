import { post } from '../lib/api';

export const generateEventDescription = async (
  title: string,
  location: string,
  userDescription: string
): Promise<string> => {
  try {
    const { description } = await post<{ description: string }>('/api/ai/event-description', {
      title,
      location,
      description: userDescription
    });
    return description || userDescription || 'No se pudo generar la descripción.';
  } catch (error) {
    console.error('Error generating description:', error);
    return 'Error al conectar con la IA Lunar.';
  }
};

export const suggestEventTitle = async (theme: string): Promise<string> => {
  try {
    const { title } = await post<{ title: string }>('/api/ai/event-title', { theme });
    return title?.trim() || theme;
  } catch (error) {
    return theme;
  }
};
