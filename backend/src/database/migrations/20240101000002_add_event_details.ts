import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasLocation = await knex.schema.hasColumn('events', 'location');
  if (!hasLocation) {
    await knex.schema.alterTable('events', (table) => {
      table.string('location').notNullable().defaultTo('TBD');
    });
  }

  const hasImageUrl = await knex.schema.hasColumn('events', 'image_url');
  if (!hasImageUrl) {
    await knex.schema.alterTable('events', (table) => {
      table.string('image_url').notNullable().defaultTo('');
    });
  }

  const hasPublished = await knex.schema.hasColumn('events', 'is_published');
  if (!hasPublished) {
    await knex.schema.alterTable('events', (table) => {
      table.boolean('is_published').notNullable().defaultTo(false);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasPublished = await knex.schema.hasColumn('events', 'is_published');
  if (hasPublished) {
    await knex.schema.alterTable('events', (table) => {
      table.dropColumn('is_published');
    });
  }

  const hasImageUrl = await knex.schema.hasColumn('events', 'image_url');
  if (hasImageUrl) {
    await knex.schema.alterTable('events', (table) => {
      table.dropColumn('image_url');
    });
  }

  const hasLocation = await knex.schema.hasColumn('events', 'location');
  if (hasLocation) {
    await knex.schema.alterTable('events', (table) => {
      table.dropColumn('location');
    });
  }
}
