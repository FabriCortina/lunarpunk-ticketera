import type { Knex } from 'knex';
import { env } from './backend/src/config/env';
import path from 'path';

const migrationDir = path.join(__dirname, 'backend', 'src', 'database', 'migrations');

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
    loadExtensions: ['.ts', '.js']
  },
  pool: {
    min: 2,
    max: 10
  }
};

export default config;