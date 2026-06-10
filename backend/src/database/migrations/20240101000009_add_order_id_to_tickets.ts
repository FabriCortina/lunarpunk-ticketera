import { Knex } from 'knex';

// Agrupa tickets comprados juntos (cantidad > 1) bajo un mismo order_id, para
// que se paguen con una sola preferencia de MP y el webhook los marque a todos
// como PAID. Los tickets existentes se backfillean con order_id = id (grupos
// de 1) para que el webhook pueda tratarlos de forma uniforme.
export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('tickets', 'order_id');
  if (!hasColumn) {
    await knex.schema.alterTable('tickets', (table) => {
      table.uuid('order_id').nullable();
    });

    await knex('tickets').update({ order_id: knex.raw('id') });

    await knex.schema.alterTable('tickets', (table) => {
      table.uuid('order_id').notNullable().alter();
      table.index('order_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('tickets', 'order_id');
  if (hasColumn) {
    await knex.schema.alterTable('tickets', (table) => {
      table.dropIndex('order_id');
      table.dropColumn('order_id');
    });
  }
}
