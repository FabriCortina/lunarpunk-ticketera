import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizer_id').notNullable();
    table.string('title', 255).notNullable();
    table.text('description');
    table.timestamp('datetime', { useTz: true }).notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.integer('capacity').notNullable();
    table.boolean('is_published').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['organizer_id'], 'events_organizer_id_idx');
    table.index(['datetime'], 'events_datetime_idx');
  });

  await knex.schema.createTable('tickets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
    table.uuid('explorer_id').notNullable();
    table
      .enu('status', ['PENDING', 'PAID', 'VALIDATED', 'CANCELED'], {
        useNative: true,
        enumName: 'ticket_status'
      })
      .notNullable()
      .defaultTo('PENDING');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.string('mp_preference_id', 255);
    table.string('mp_payment_id', 255);
    table.text('qr_payload');
    table.timestamp('validated_at', { useTz: true });

    table.index(['event_id'], 'tickets_event_id_idx');
    table.index(['explorer_id'], 'tickets_explorer_id_idx');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('events');
  await knex.raw('DROP TYPE IF EXISTS ticket_status');
}
