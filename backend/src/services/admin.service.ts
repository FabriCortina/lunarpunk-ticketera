import db from '../database/connection';
import { AppError } from '../utils/errors';

type OrganizerStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export class AdminService {
  async listOrganizers(status?: OrganizerStatus) {
    const query = db('users')
      .where({ role: 'ORGANIZER' })
      .select(
        'id',
        'name',
        'email',
        'created_at',
        'status',
        'approved_at',
        'approved_by_admin_id',
        'rejection_reason',
        'limits'
      )
      .orderBy('created_at', 'desc');

    if (status) {
      query.andWhere({ status });
    }

    return query;
  }

  async updateOrganizerLimits(
    organizerId: string,
    adminId: string,
    limits: { max_events?: number | null; max_tickets_per_event?: number | null; max_monthly_volume?: number | null }
  ) {
    const normalizedLimits = {
      max_events: limits.max_events ?? null,
      max_tickets_per_event: limits.max_tickets_per_event ?? null,
      max_monthly_volume: limits.max_monthly_volume ?? null
    };

    const [updated] = await db('users')
      .where({ id: organizerId, role: 'ORGANIZER' })
      .update({ limits: normalizedLimits })
      .returning([
        'id',
        'name',
        'email',
        'status',
        'approved_at',
        'approved_by_admin_id',
        'rejection_reason',
        'limits'
      ]);

    if (!updated) {
      throw new AppError('Organizer not found', 404);
    }

    await this.logAdminAction('UPDATE_LIMITS', adminId, organizerId, normalizedLimits);

    return updated;
  }

  async approveOrganizer(organizerId: string, adminId: string) {
    const [updated] = await db('users')
      .where({ id: organizerId, role: 'ORGANIZER' })
      .update({
        status: 'APPROVED',
        approved_at: db.fn.now(),
        approved_by_admin_id: adminId,
        rejection_reason: null
      })
      .returning([
        'id',
        'name',
        'email',
        'status',
        'approved_at',
        'approved_by_admin_id',
        'rejection_reason',
        'limits'
      ]);

    if (!updated) {
      throw new AppError('Organizer not found', 404);
    }

    await this.logAdminAction('APPROVE_ORGANIZER', adminId, organizerId);

    return updated;
  }

  async rejectOrganizer(organizerId: string, adminId: string, reason: string) {
    const [updated] = await db('users')
      .where({ id: organizerId, role: 'ORGANIZER' })
      .update({
        status: 'REJECTED',
        approved_at: null,
        approved_by_admin_id: adminId,
        rejection_reason: reason
      })
      .returning([
        'id',
        'name',
        'email',
        'status',
        'approved_at',
        'approved_by_admin_id',
        'rejection_reason',
        'limits'
      ]);

    if (!updated) {
      throw new AppError('Organizer not found', 404);
    }

    await this.logAdminAction('REJECT_ORGANIZER', adminId, organizerId, { reason });

    return updated;
  }

  async suspendOrganizer(organizerId: string, adminId: string, reason?: string) {
    const [updated] = await db('users')
      .where({ id: organizerId, role: 'ORGANIZER' })
      .update({
        status: 'SUSPENDED',
        approved_by_admin_id: adminId,
        rejection_reason: reason ?? null
      })
      .returning([
        'id',
        'name',
        'email',
        'status',
        'approved_at',
        'approved_by_admin_id',
        'rejection_reason',
        'limits'
      ]);

    if (!updated) {
      throw new AppError('Organizer not found', 404);
    }

    await this.logAdminAction('SUSPEND_ORGANIZER', adminId, organizerId, reason ? { reason } : undefined);

    return updated;
  }

  async getDashboard() {
    let hasTicketTypes = await db.schema.withSchema('public').hasTable('ticket_types');

    const buildRevenueQuery = (useTicketTypes: boolean) => {
      const query = db('tickets')
        .leftJoin('events', 'tickets.event_id', 'events.id')
        .where('tickets.status', 'PAID');
      if (useTicketTypes) {
        query.leftJoin('ticket_types', 'tickets.ticket_type_id', 'ticket_types.id');
        query.sum<{ revenue: string }>(
          db.raw('COALESCE(ticket_types.price, events.price) as revenue')
        );
      } else {
        query.sum<{ revenue: string }>(db.raw('events.price as revenue'));
      }
      return query;
    };

    const buildRecentTicketsQuery = (useTicketTypes: boolean) => {
      const query = db('tickets')
        .leftJoin('events', 'tickets.event_id', 'events.id')
        .leftJoin('users as explorers', 'tickets.explorer_id', 'explorers.id');
      if (useTicketTypes) {
        query.leftJoin('ticket_types', 'tickets.ticket_type_id', 'ticket_types.id');
      }
      return query
        .select(
          'tickets.id',
          'tickets.status',
          'tickets.created_at',
          'tickets.mp_payment_id',
          'events.title as event_title',
          'explorers.email as explorer_email',
          useTicketTypes
            ? db.raw('COALESCE(ticket_types.price, events.price) as amount')
            : db.raw('events.price as amount')
        )
        .orderBy('tickets.created_at', 'desc')
        .limit(20);
    };

    const buildRecentPaymentsQuery = (useTicketTypes: boolean) => {
      const query = db('tickets')
        .leftJoin('events', 'tickets.event_id', 'events.id')
        .leftJoin('users as explorers', 'tickets.explorer_id', 'explorers.id')
        .where('tickets.status', 'PAID');
      if (useTicketTypes) {
        query.leftJoin('ticket_types', 'tickets.ticket_type_id', 'ticket_types.id');
      }
      return query
        .select(
          'tickets.id',
          'tickets.created_at',
          'tickets.mp_payment_id',
          'events.title as event_title',
          'explorers.email as explorer_email',
          useTicketTypes
            ? db.raw('COALESCE(ticket_types.price, events.price) as amount')
            : db.raw('events.price as amount')
        )
        .orderBy('tickets.created_at', 'desc')
        .limit(20);
    };

    let revenueQuery = buildRevenueQuery(hasTicketTypes);
    let recentTicketsQuery = buildRecentTicketsQuery(hasTicketTypes);
    let recentPaymentsQuery = buildRecentPaymentsQuery(hasTicketTypes);

    const [
      totalOrganizersRow,
      pendingOrganizersRow,
      totalEventsRow,
      totalTicketsRow,
      revenueRow
    ] = await Promise.all([
      db('users')
        .where({ role: 'ORGANIZER' })
        .count<{ totalOrganizers: string }>('id as totalOrganizers')
        .first(),
      db('users')
        .where({ role: 'ORGANIZER', status: 'PENDING_APPROVAL' })
        .count<{ pendingOrganizers: string }>('id as pendingOrganizers')
        .first(),
      db('events')
        .count<{ totalEvents: string }>('id as totalEvents')
        .first(),
      db('tickets')
        .count<{ totalTickets: string }>('id as totalTickets')
        .first(),
      (async () => {
        try {
          return await revenueQuery.first();
        } catch (error: any) {
          if (error?.code === '42P01') {
            hasTicketTypes = false;
            revenueQuery = buildRevenueQuery(false);
            return revenueQuery.first();
          }
          throw error;
        }
      })()
    ]);

    const totalOrganizers = totalOrganizersRow?.totalOrganizers;
    const pendingOrganizers = pendingOrganizersRow?.pendingOrganizers;
    const totalEvents = totalEventsRow?.totalEvents;
    const totalTickets = totalTicketsRow?.totalTickets;
    const revenue = revenueRow?.revenue;

    const approvedOrganizersCount = await db('users')
      .where({ role: 'ORGANIZER', status: 'APPROVED' })
      .count<{ count: string }>('id as count')
      .first();

    const activeOrganizersCount = await db('events')
      .where({ is_published: true })
      .distinct('organizer_id')
      .count<{ count: string }>('organizer_id as count')
      .first();

    const approvedCount = Number(approvedOrganizersCount?.count ?? 0);
    const activeCount = Number(activeOrganizersCount?.count ?? 0);
    const anchoring = approvedCount > 0 ? Math.round((activeCount / approvedCount) * 100) : 0;

    let recentTickets: any[] = [];
    let recentPayments: any[] = [];
    try {
      recentTickets = await recentTicketsQuery;
      recentPayments = await recentPaymentsQuery;
    } catch (error: any) {
      if (error?.code === '42P01') {
        hasTicketTypes = false;
        recentTickets = await buildRecentTicketsQuery(false);
        recentPayments = await buildRecentPaymentsQuery(false);
      } else {
        throw error;
      }
    }

    const antifraudFlags = await db('tickets')
      .leftJoin('events', 'tickets.event_id', 'events.id')
      .leftJoin('users as explorers', 'tickets.explorer_id', 'explorers.id')
      .where('tickets.status', 'PENDING')
      .andWhere('tickets.created_at', '<', db.raw("now() - interval '24 hours'"))
      .select(
        'tickets.id',
        'tickets.created_at',
        'events.title as event_title',
        'explorers.email as explorer_email'
      )
      .orderBy('tickets.created_at', 'asc')
      .limit(20);

    return {
      kpis: {
        organizers: Number(totalOrganizers ?? 0),
        organizersPending: Number(pendingOrganizers ?? 0),
        events: Number(totalEvents ?? 0),
        tickets: Number(totalTickets ?? 0),
        revenue: Number(revenue ?? 0),
        anchoring
      },
      recentTickets,
      recentPayments,
      antifraudFlags
    };
  }

  private async logAdminAction(
    action: string,
    adminId: string,
    targetUserId: string,
    metadata?: Record<string, unknown>
  ) {
    await db('admin_actions').insert({
      admin_id: adminId,
      target_user_id: targetUserId,
      action,
      metadata: metadata ?? null
    });
  }
}
