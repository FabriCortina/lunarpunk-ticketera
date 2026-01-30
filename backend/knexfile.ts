import type { Knex } from 'knex';
import { env } from './src/config/env';
import path from 'path';

const isProduction = env.NODE_ENV === 'production';
const migrationDir = isProduction
  ? path.join(__dirname, 'dist', 'src', 'database', 'migrations')
  : path.join(__dirname, 'src', 'database', 'migrations');

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
