import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('ticket_types');
  if (!hasTable) {
    await knex.schema.createTable('ticket_types', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
      table.string('name').notNullable();
      table.text('description').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.integer('capacity').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ticket_types');
}
