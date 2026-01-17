import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // Database: Railway provides DATABASE_URL which overrides individual fields
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),

  // Security
  JWT_SECRET: z.string().min(10, "JWT Secret must be secure"),
  QR_SECRET: z.string().min(10, "QR Secret must be secure and long"),
  
  // Third Party
  MP_ACCESS_TOKEN: z.string().min(1, "MercadoPago Access Token required"),
  API_KEY: z.string().min(1, "Google Gemini API Key is required"),
  
  // App Config
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z.string().default('*'), // CORS
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

// Logic to ensure DB config exists
const data = _env.data;
if (!data.DATABASE_URL && (!data.DB_HOST || !data.DB_USER || !data.DB_NAME)) {
    throw new Error('❌ Missing Database Configuration: Provide DATABASE_URL or DB_HOST/USER/NAME');
}

export const env = data;