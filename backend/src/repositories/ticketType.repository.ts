import { Knex } from 'knex';
import db from '../database/connection';

export interface TicketTypeEntity {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  created_at: Date;
}

export class TicketTypeRepository {
  private db: Knex = db;

  async createMany(eventId: string, types: Omit<TicketTypeEntity, 'id' | 'event_id' | 'created_at'>[]) {
    const payload = types.map((type) => ({
      event_id: eventId,
      name: type.name,
      description: type.description,
      price: type.price,
      capacity: type.capacity
    }));

    const inserted = await this.db('ticket_types').insert(payload).returning('*');
    return inserted as TicketTypeEntity[];
  }

  async findByEventId(eventId: string): Promise<TicketTypeEntity[]> {
    return this.db('ticket_types')
      .where({ event_id: eventId })
      .orderBy('created_at', 'asc');
  }

  async findById(id: string): Promise<TicketTypeEntity | undefined> {
    return this.db('ticket_types').where({ id }).first();
  }
}
