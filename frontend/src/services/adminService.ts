import { get, post } from '../lib/api';
import { AdminDashboardData, OrganizerSummary } from '../types';

export const adminService = {
  getOrganizers: async (status?: string): Promise<OrganizerSummary[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return get<OrganizerSummary[]>(`/api/admin/organizers${query}`);
  },

  approveOrganizer: async (id: string): Promise<OrganizerSummary> =>
    post(`/api/admin/organizers/${id}/approve`, {}),

  rejectOrganizer: async (id: string, reason: string): Promise<OrganizerSummary> =>
    post(`/api/admin/organizers/${id}/reject`, { reason }),

  suspendOrganizer: async (id: string, reason?: string): Promise<OrganizerSummary> =>
    post(`/api/admin/organizers/${id}/suspend`, reason ? { reason } : {}),

  updateLimits: async (
    id: string,
    limits: { max_events?: number | null; max_tickets_per_event?: number | null; max_monthly_volume?: number | null }
  ): Promise<OrganizerSummary> =>
    post(`/api/admin/organizers/${id}/limits`, limits),

  getDashboard: async (): Promise<AdminDashboardData> =>
    get<AdminDashboardData>('/api/admin/dashboard')
};
