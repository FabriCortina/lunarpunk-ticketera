import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Users Table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable(); // Hashed
    table.string('role').notNullable(); // 'ORGANIZER' | 'EXPLORER'
    table.string('avatar').nullable();
    table.timestamps(true, true); // created_at, updated_at
  });

  // 2. Events Table
  await knex.schema.createTable('events', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('organizer_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description');
    table.dateTime('datetime').notNullable();
    table.decimal('price', 14, 2).notNullable(); // Precision para moneda
    table.integer('capacity').notNullable();
    // Nota: available_tickets se puede calcular, pero lo mantenemos denormalizado o se asume igual a capacity al inicio
    table.boolean('is_published').defaultTo(false);
    table.timestamps(true, true);
  });

  // 3. Tickets Table
  await knex.schema.createTable('tickets', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.uuid('explorer_id').references('id').inTable('users').onDelete('CASCADE');
    
    table.string('status').defaultTo('PENDING'); // PENDING, PAID, VALIDATED, CANCELED
    table.string('ticket_code').nullable(); // Código legible humano
    
    // MercadoPago integration
    table.string('mp_preference_id').nullable();
    table.string('mp_payment_id').nullable();
    
    // Security
    table.text('qr_payload').nullable();
    table.dateTime('validated_at').nullable();
    
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('users');
}