import type { Knex } from 'knex';
import { env } from './backend/src/config/env';
import path from 'path';
import fs from 'fs';

// Determinar si estamos ejecutando desde 'dist' (js) o 'src' (ts) para las migraciones
const distMigrations = path.join(__dirname, 'backend', 'dist', 'src', 'database', 'migrations');
const srcMigrations = path.join(__dirname, 'backend', 'src', 'database', 'migrations');
const useDist = env.NODE_ENV === 'production' && fs.existsSync(distMigrations);
const migrationExt = useDist ? 'js' : 'ts';
const migrationDir = useDist ? distMigrations : srcMigrations;

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