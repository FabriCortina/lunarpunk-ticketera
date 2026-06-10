import type { Knex } from 'knex';
import { env } from './src/config/env';
import path from 'path';

// El pre-deploy de Railway corre 'knex migrate:latest --cwd backend' contra
// este knexfile.ts vía ts-node, y los registros existentes en la tabla
// knex_migrations usan los nombres .ts de src/database/migrations. Por eso
// el directorio de migraciones es siempre 'src', tanto en dev como en prod.
const migrationDir = path.join(__dirname, 'src', 'database', 'migrations');

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
