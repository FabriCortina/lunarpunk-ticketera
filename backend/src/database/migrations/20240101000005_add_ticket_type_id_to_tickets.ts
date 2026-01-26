import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tickets', (table) => {
    table.uuid('ticket_type_id').nullable().references('id').inTable('ticket_types').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tickets', (table) => {
    table.dropColumn('ticket_type_id');
  });
}
