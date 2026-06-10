import type { Knex } from 'knex';
import { env } from './src/config/env';
import path from 'path';
import fs from 'fs';

// When running compiled knexfile from backend/dist/, __dirname is backend/dist.
const backendRoot = path.basename(__dirname) === 'dist'
  ? path.join(__dirname, '..')
  : __dirname;

const distMigrations = path.join(backendRoot, 'dist', 'src', 'database', 'migrations');
const srcMigrations = path.join(backendRoot, 'src', 'database', 'migrations');
const compiledMarker = path.join(distMigrations, '20240101000001_create_core_tables.js');
const migrationDir =
  env.NODE_ENV === 'production' && fs.existsSync(compiledMarker)
    ? distMigrations
    : srcMigrations;

const config: Knex.Config = {
  client: 'pg',
  connection: env.DATABASE_URL
    ? {
        connectionString: env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME
      },
  migrations: {
    directory: migrationDir,
    loadExtensions: ['.ts', '.js']
  },
  pool: {
    min: 2,
    max: 10
  }
};

export default config;
