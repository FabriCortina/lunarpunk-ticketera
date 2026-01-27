import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN'`);

  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'organizer_status'
          AND n.nspname = current_schema()
      ) THEN
        CREATE TYPE organizer_status AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');
      END IF;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END$$;
  `);

  await knex.schema.alterTable('users', (table) => {
    table.specificType('status', 'organizer_status').nullable();
    table.timestamp('approved_at');
    table.uuid('approved_by_admin_id').references('id').inTable('users').onDelete('SET NULL');
    table.text('rejection_reason');
    table.jsonb('limits');
  });

  await knex('users')
    .where({ role: 'ORGANIZER' })
    .whereNull('status')
    .update({ status: 'APPROVED' });

  await knex.schema.createTable('admin_actions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('admin_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('target_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('action').notNullable();
    table.jsonb('metadata');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('admin_actions');

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('limits');
    table.dropColumn('rejection_reason');
    table.dropColumn('approved_by_admin_id');
    table.dropColumn('approved_at');
    table.dropColumn('status');
  });

  await knex.raw('DROP TYPE IF EXISTS organizer_status');
}
