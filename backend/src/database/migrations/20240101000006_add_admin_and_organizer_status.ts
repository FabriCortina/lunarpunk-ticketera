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

  const hasStatus = await knex.schema.hasColumn('users', 'status');
  const hasApprovedAt = await knex.schema.hasColumn('users', 'approved_at');
  const hasApprovedBy = await knex.schema.hasColumn('users', 'approved_by_admin_id');
  const hasRejection = await knex.schema.hasColumn('users', 'rejection_reason');
  const hasLimits = await knex.schema.hasColumn('users', 'limits');
  if (!hasStatus || !hasApprovedAt || !hasApprovedBy || !hasRejection || !hasLimits) {
    await knex.schema.alterTable('users', (table) => {
      if (!hasStatus) {
        table.specificType('status', 'organizer_status').nullable();
      }
      if (!hasApprovedAt) {
        table.timestamp('approved_at');
      }
      if (!hasApprovedBy) {
        table.uuid('approved_by_admin_id').references('id').inTable('users').onDelete('SET NULL');
      }
      if (!hasRejection) {
        table.text('rejection_reason');
      }
      if (!hasLimits) {
        table.jsonb('limits');
      }
    });
  }

  await knex('users')
    .where({ role: 'ORGANIZER' })
    .whereNull('status')
    .update({ status: 'APPROVED' });

  const hasAdminActions = await knex.schema.hasTable('admin_actions');
  if (!hasAdminActions) {
    await knex.schema.createTable('admin_actions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('admin_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('target_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('action').notNullable();
      table.jsonb('metadata');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }
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
