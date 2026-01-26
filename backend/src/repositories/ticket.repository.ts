import { Knex } from 'knex';
import db from '../database/connection';

export interface TicketEntity {
  id: string;
  event_id: string;
  explorer_id: string;
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
      .select('tickets.*', 'events.title as event_title', 'events.datetime as event_datetime')
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

  async findByIdWithEvent(id: string): Promise<TicketWithEvent | undefined> {
    return this.db('tickets')
      .join('events', 'tickets.event_id', 'events.id')
      .select(
        'tickets.*',
        'events.title as event_title',
        'events.price as event_price',
        'events.description as event_description',
        'events.organizer_id'
      )
      .where('tickets.id', id)
      .first();
  }

  async update(id: string, data: Partial<TicketEntity>): Promise<void> {
    await this.db('tickets').where({ id }).update(data);
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
}
