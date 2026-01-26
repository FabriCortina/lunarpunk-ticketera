import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.enu('role', ['ORGANIZER', 'EXPLORER'], {
      useNative: true,
      enumName: 'user_role'
    }).notNullable();
    table.text('avatar');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

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

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS ticket_status');
  await knex.raw('DROP TYPE IF EXISTS user_role');
}
