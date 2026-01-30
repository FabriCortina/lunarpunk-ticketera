import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const result = await knex.raw(
    `
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'events'
      AND column_name = 'image_url'
    LIMIT 1
    `
  );
  const dataType = result?.rows?.[0]?.data_type;
  if (dataType && dataType !== 'text') {
    await knex.raw('ALTER TABLE events ALTER COLUMN image_url TYPE text');
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE events ALTER COLUMN image_url TYPE varchar(255)');
}
