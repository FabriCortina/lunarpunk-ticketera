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
  QR_TTL_SECONDS: z.coerce.number().int().min(0).default(0),
  
  // Third Party
  MP_ACCESS_TOKEN: z.string().min(1, "MercadoPago Access Token required"),
  MP_WEBHOOK_SECRET: z.string().optional(),
  MP_WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().min(30).default(300),
  API_KEY: z.string().optional(),
  ADMIN_BOOTSTRAP_SECRET: z.string().optional(),

  // Email (Resend) - Recuperación de contraseña
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('LunarPunk <onboarding@resend.dev>'),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).default(60),
  
  // App Config
  BACKEND_PUBLIC_BASE_URL: z.string().url().default('http://localhost:3100'),
  FRONTEND_PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z.string().default('*'), // CORS
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

// Logic to ensure DB config exists
let data = _env.data;
data = {
  ...data,
  BACKEND_PUBLIC_BASE_URL: data.BACKEND_PUBLIC_BASE_URL.replace(/\/+$/, ''),
  FRONTEND_PUBLIC_BASE_URL: data.FRONTEND_PUBLIC_BASE_URL.replace(/\/+$/, '')
};

if (data.NODE_ENV === 'production') {
  if (!data.BACKEND_PUBLIC_BASE_URL.startsWith('https://')) {
    throw new Error('❌ BACKEND_PUBLIC_BASE_URL must use https in production');
  }
  if (!data.FRONTEND_PUBLIC_BASE_URL.startsWith('https://')) {
    throw new Error('❌ FRONTEND_PUBLIC_BASE_URL must use https in production');
  }
  // El wildcard combinado con CORS credentials:true refleja cualquier Origin
  // y permite el envío de la cookie de sesión, lo que en producción equivale
  // a deshabilitar CORS para requests autenticados. Debe configurarse explícitamente.
  if (data.ALLOWED_ORIGINS === '*') {
    throw new Error('❌ ALLOWED_ORIGINS must be explicitly set to a comma-separated allowlist in production (wildcard + credentialed CORS is unsafe)');
  }
}

if (data.NODE_ENV === 'production' && !data.MP_WEBHOOK_SECRET) {
  console.warn('⚠️ MP_WEBHOOK_SECRET is not configured; webhook verification is disabled.');
}

if (data.NODE_ENV === 'production' && !data.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY is not configured; password reset emails will not be sent.');
}

if (!data.DATABASE_URL && (!data.DB_HOST || !data.DB_USER || !data.DB_NAME)) {
    throw new Error('❌ Missing Database Configuration: Provide DATABASE_URL or DB_HOST/USER/NAME');
}

export const env = data;