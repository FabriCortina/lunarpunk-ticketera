import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'cuit_cuil');
  if (!hasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.string('cuit_cuil');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('cuit_cuil');
  });
}
