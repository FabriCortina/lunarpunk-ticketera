import knex from 'knex';
import config from '../../knexfile';

// Initialize knex with the configuration (which already handles env logic)
const db = knex(config);

export default db;