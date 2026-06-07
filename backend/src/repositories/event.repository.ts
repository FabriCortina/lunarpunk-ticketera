import { Knex } from 'knex';
import db from '../database/connection';

export interface EventEntity {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  datetime: Date;
  price: number;
  capacity: number;
  is_published: boolean;
  location: string;
  image_url: string;
  created_at: Date;
}

export class EventRepository {
  private db: Knex = db;

  async create(data: Partial<EventEntity>): Promise<EventEntity> {
    const [event] = await this.db('events')
      .insert(data)
      .returning('*');
    return event;
  }

  async findById(id: string): Promise<EventEntity | undefined> {
    return this.db('events').where({ id }).first();
  }

  async lockById(trx: Knex, id: string): Promise<EventEntity | undefined> {
    return trx('events').where({ id }).forUpdate().first();
  }

  async findAllPublished(): Promise<EventEntity[]> {
    return this.db('events')
      .where({ is_published: true })
      .orderBy('datetime', 'asc');
  }

  async findAllByOrganizer(organizerId: string): Promise<EventEntity[]> {
    return this.db('events')
      .where({ organizer_id: organizerId })
      .orderBy('created_at', 'desc');
  }

  async update(id: string, data: Partial<EventEntity>): Promise<EventEntity> {
    const [updated] = await this.db('events')
      .where({ id })
      .update(data)
      .returning('*');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db('events').where({ id }).delete();
  }
}
