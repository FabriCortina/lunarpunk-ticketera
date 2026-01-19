import type { Knex } from 'knex';
import { env } from './src/config/env';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determinar si estamos ejecutando desde 'dist' (js) o 'src' (ts) para las migraciones
const isProduction = env.NODE_ENV === 'production';
const migrationExt = isProduction ? 'js' : 'ts';
const migrationDir = isProduction 
  ? path.join(__dirname, 'dist', 'src', 'database', 'migrations') 
  : path.join(__dirname, 'src', 'database', 'migrations');

const config: Knex.Config = {
  client: 'pg',
  connection: env.DATABASE_URL 
    ? {
        connectionString: env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Railway/Heroku Postgres
      }
    : {
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
      },
  migrations: {
    directory: migrationDir,
    extension: migrationExt,
    loadExtensions: [`.${migrationExt}`]
  },
  pool: {
    min: 2,
    max: 10
  }
};

export default config;