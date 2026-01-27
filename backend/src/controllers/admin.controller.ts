import { FastifyReply, FastifyRequest } from 'fastify';
import { AdminService } from '../services/admin.service';

export class AdminController {
  constructor(private adminService: AdminService) {}

  listOrganizers = async (req: FastifyRequest, reply: FastifyReply) => {
    const status = (req.query as { status?: string }).status;
    const organizers = await this.adminService.listOrganizers(status as any);
    return reply.send(organizers);
  };

  approveOrganizer = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const organizer = await this.adminService.approveOrganizer(req.params.id, req.user!.id);
    return reply.send(organizer);
  };

  rejectOrganizer = async (
    req: FastifyRequest<{ Params: { id: string }; Body: { reason: string } }>,
    reply: FastifyReply
  ) => {
    const organizer = await this.adminService.rejectOrganizer(req.params.id, req.user!.id, req.body.reason);
    return reply.send(organizer);
  };

  suspendOrganizer = async (
    req: FastifyRequest<{ Params: { id: string }; Body?: { reason?: string } }>,
    reply: FastifyReply
  ) => {
    const organizer = await this.adminService.suspendOrganizer(req.params.id, req.user!.id, req.body?.reason);
    return reply.send(organizer);
  };

  updateLimits = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: { max_events?: number | null; max_tickets_per_event?: number | null; max_monthly_volume?: number | null };
    }>,
    reply: FastifyReply
  ) => {
    const organizer = await this.adminService.updateOrganizerLimits(req.params.id, req.user!.id, req.body);
    return reply.send(organizer);
  };

  dashboard = async (_req: FastifyRequest, reply: FastifyReply) => {
    const dashboard = await this.adminService.getDashboard();
    return reply.send(dashboard);
  };
}
