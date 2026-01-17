
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('lunarpunk_db'),
  JWT_SECRET: z.string().min(10, "JWT Secret must be secure"),
  MP_ACCESS_TOKEN: z.string().min(1, "MercadoPago Access Token required"),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  QR_SECRET: z.string().min(10, "QR Secret must be secure and long"),
  API_KEY: z.string().min(1, "Google Gemini API Key is required"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
