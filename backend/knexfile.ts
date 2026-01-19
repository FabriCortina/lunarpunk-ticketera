import type { Knex } from 'knex';
import { env } from './src/config/env';
import path from 'path';

// Usar process.cwd() para asegurar rutas absolutas correctas tanto en dev como en prod
const isProduction = env.NODE_ENV === 'production';
const migrationExt = isProduction ? 'js' : 'ts';

const migrationDir = path.join(
  process.cwd(), 
  isProduction ? 'dist/src/database/migrations' : 'src/database/migrations'
);

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