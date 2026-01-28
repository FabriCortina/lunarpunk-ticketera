import { Knex } from 'knex';
import db from '../database/connection';

export interface TicketEntity {
  id: string;
  event_id: string;
  explorer_id: string;
  ticket_type_id?: string | null;
  status: 'PENDING' | 'PAID' | 'VALIDATED' | 'CANCELED';
  created_at: Date;
  mp_preference_id?: string;
  mp_payment_id?: string;
  qr_payload?: string;
  validated_at?: Date;
}

export interface TicketWithEvent extends TicketEntity {
  event_title: string;
  event_price: number;
  event_description: string;
  organizer_id: string;
  explorer_name?: string | null;
  explorer_email?: string | null;
  explorer_cuit_cuil?: string | null;
  ticket_type_name?: string | null;
  ticket_type_description?: string | null;
  ticket_type_price?: number | null;
}

export class TicketRepository {
  private db: Knex = db;

  async create(data: Partial<TicketEntity>): Promise<TicketEntity> {
    const [ticket] = await this.db('tickets')
      .insert(data)
      .returning('*');
    return ticket;
  }

  async findByExplorerId(explorerId: string): Promise<TicketEntity[]> {
    return this.db('tickets')
      .join('events', 'tickets.event_id', 'events.id')
      .leftJoin('ticket_types', 'tickets.ticket_type_id', 'ticket_types.id')
      .select(
        'tickets.*',
        'events.title as event_title',
        'events.datetime as event_datetime',
        'ticket_types.name as ticket_type_name',
        'ticket_types.price as ticket_type_price'
      )
      .where({ explorer_id: explorerId })
      .orderBy('tickets.created_at', 'desc');
  }

  async findByEventId(eventId: string): Promise<TicketEntity[]> {
    return this.db('tickets')
      .where({ event_id: eventId })
      .orderBy('created_at', 'desc');
  }

  async countByEventId(eventId: string): Promise<number> {
    const result = await this.db('tickets')
      .where({ event_id: eventId })
      .andWhereNot({ status: 'CANCELED' })
      .count('id as count')
      .first();

    return Number(result?.count || 0);
  }

  async countByTicketTypeId(ticketTypeId: string): Promise<number> {
    const result = await this.db('tickets')
      .where({ ticket_type_id: ticketTypeId })
      .andWhereNot({ status: 'CANCELED' })
      .count('id as count')
      .first();

    return Number(result?.count || 0);
  }

  async findByIdWithEvent(id: string): Promise<TicketWithEvent | undefined> {
    return this.db('tickets')
      .join('events', 'tickets.event_id', 'events.id')
      .leftJoin('users as explorers', 'tickets.explorer_id', 'explorers.id')
      .leftJoin('ticket_types', 'tickets.ticket_type_id', 'ticket_types.id')
      .select(
        'tickets.*',
        'events.title as event_title',
        'events.price as event_price',
        'events.description as event_description',
        'events.organizer_id',
        'explorers.name as explorer_name',
        'explorers.email as explorer_email',
        'explorers.cuit_cuil as explorer_cuit_cuil',
        'ticket_types.name as ticket_type_name',
        'ticket_types.description as ticket_type_description',
        'ticket_types.price as ticket_type_price'
      )
      .where('tickets.id', id)
      .first();
  }

  async update(id: string, data: Partial<TicketEntity>): Promise<void> {
    await this.db('tickets').where({ id }).update(data);
  }

  async delete(id: string): Promise<void> {
    await this.db('tickets').where({ id }).del();
  }

  async markAsPaid(id: string, data: Partial<TicketEntity>): Promise<TicketEntity | undefined> {
    const [ticket] = await this.db('tickets')
      .where({ id, status: 'PENDING' })
      .update({
        ...data,
        status: 'PAID'
      })
      .returning('*');
    return ticket;
  }

  async markAsValidated(id: string): Promise<TicketEntity | undefined> {
    const [ticket] = await this.db('tickets')
      .where({ id, status: 'PAID' })
      .update({
        status: 'VALIDATED',
        validated_at: new Date()
      })
      .returning('*');
    return ticket;
  }

  async getEventStatusCounts(eventId: string) {
    const rows = await this.db('tickets')
      .where({ event_id: eventId })
      .select('status')
      .count('id as count')
      .groupBy('status');
    return rows.reduce<Record<string, number>>((acc, row: any) => {
      acc[row.status] = Number(row.count || 0);
      return acc;
    }, {});
  }

  async getEventRevenue(eventId: string) {
    const hasTicketTypes = await this.db.schema.withSchema('public').hasTable('ticket_types');
    const query = this.db('tickets')
      .leftJoin('events', 'tickets.event_id', 'events.id')
      .where({ 'tickets.event_id': eventId })
      .whereIn('tickets.status', ['PAID', 'VALIDATED']);

    if (hasTicketTypes) {
      query.leftJoin('ticket_types', 'tickets.ticket_type_id', 'ticket_types.id');
      query.sum(
        this.db.raw('COALESCE(ticket_types.price, events.price) as revenue')
      );
    } else {
      query.sum(this.db.raw('events.price as revenue'));
    }

    const result = await query.first();
    return Number(result?.revenue || 0);
  }

  async getEventTicketTypesBreakdown(eventId: string) {
    const hasTicketTypes = await this.db.schema.withSchema('public').hasTable('ticket_types');
    if (!hasTicketTypes) return [];

    const rows = await this.db('tickets')
      .leftJoin('ticket_types', 'tickets.ticket_type_id', 'ticket_types.id')
      .where({ 'tickets.event_id': eventId })
      .select(
        'ticket_types.id',
        'ticket_types.name',
        'ticket_types.price'
      )
      .count('tickets.id as count')
      .groupBy('ticket_types.id', 'ticket_types.name', 'ticket_types.price')
      .orderBy('ticket_types.name', 'asc');

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price || 0),
      count: Number(row.count || 0)
    }));
  }

  async getEventUniqueExplorers(eventId: string) {
    const result = await this.db('tickets')
      .where({ event_id: eventId })
      .countDistinct('explorer_id as count')
      .first();
    return Number(result?.count || 0);
  }
}
