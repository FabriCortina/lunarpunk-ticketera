import { z } from 'zod';

// z.string().url() acepta cualquier esquema válido para WHATWG URL, incluyendo
// 'javascript:' y 'data:'. Si ese valor termina en un atributo src/href del
// frontend, habilita XSS. Restringimos a http/https para URLs de imágenes.
export const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, { message: 'URL must use http or https protocol' });
