import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE events ALTER COLUMN image_url TYPE text');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE events ALTER COLUMN image_url TYPE varchar(255)');
}
