import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('password_reset_tokens');
  if (!hasTable) {
    await knex.schema.createTable('password_reset_tokens', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('token_hash').notNullable().unique();
      table.timestamp('expires_at').notNullable();
      table.timestamp('used_at');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

      table.index('user_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('password_reset_tokens');
  if (hasTable) {
    await knex.schema.dropTable('password_reset_tokens');
  }
}
