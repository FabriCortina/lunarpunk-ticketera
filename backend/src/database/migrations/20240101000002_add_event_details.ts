import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Verificar si las columnas ya existen antes de intentar crearlas (idempotencia básica)
  const hasLocation = await knex.schema.hasColumn('events', 'location');
  const hasImageUrl = await knex.schema.hasColumn('events', 'image_url');

  await knex.schema.alterTable('events', (table) => {
    if (!hasLocation) {
      table.string('location').defaultTo('TBA');
    }
    if (!hasImageUrl) {
      table.string('image_url');
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('events', (table) => {
    table.dropColumn('location');
    table.dropColumn('image_url');
  });
}