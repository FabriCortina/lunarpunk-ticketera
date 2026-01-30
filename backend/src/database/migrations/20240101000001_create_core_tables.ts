import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'user_role'
          AND n.nspname = current_schema()
      ) THEN
        CREATE TYPE user_role AS ENUM ('ORGANIZER', 'EXPLORER');
      END IF;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END$$;
  `);

  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) {
    await knex.schema.createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.specificType('role', 'user_role').notNullable();
      table.text('avatar');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  const hasEvents = await knex.schema.hasTable('events');
  if (!hasEvents) {
    await knex.schema.createTable('events', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('organizer_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('title').notNullable();
      table.text('description').notNullable();
      table.timestamp('datetime').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.integer('capacity').notNullable();
      table.string('location').notNullable();
      table.string('image_url').notNullable();
      table.boolean('is_published').notNullable().defaultTo(false);
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  const hasTickets = await knex.schema.hasTable('tickets');
  if (!hasTickets) {
    await knex.schema.createTable('tickets', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
      table.uuid('explorer_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.enu('status', ['PENDING', 'PAID', 'VALIDATED', 'CANCELED'], {
        useNative: true,
        enumName: 'ticket_status'
      }).notNullable().defaultTo('PENDING');
      table.string('mp_preference_id');
      table.string('mp_payment_id');
      table.text('qr_payload');
      table.timestamp('validated_at');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS ticket_status');
  await knex.raw('DROP TYPE IF EXISTS user_role');
}
