import React from 'react';
import { AdminDashboardData, OrganizerSummary } from '../types';
import { Button } from './Button';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, SlidersHorizontal } from 'lucide-react';

interface AdminDashboardProps {
  data: AdminDashboardData | null;
  pendingOrganizers: OrganizerSummary[];
  organizers: OrganizerSummary[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateLimits: (id: string) => void;
}

const formatMoney = (value?: number | null) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(value ?? 0));

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  data,
  pendingOrganizers,
  organizers,
  onApprove,
  onReject,
  onUpdateLimits
}) => {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-3xl font-title font-bold text-white mb-6 pl-4 border-l-4 border-lp-accent flex items-center gap-3">
          <ShieldCheck className="text-lp-accent" size={24} />
          Panel Platform Admin
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-white/10">
            <p className="text-xs uppercase tracking-wider text-lp-muted font-body">Organizadores</p>
            <p className="text-2xl font-title text-white mt-2">{data?.kpis.organizers ?? 0}</p>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-white/10">
            <p className="text-xs uppercase tracking-wider text-lp-muted font-body">Pendientes</p>
            <p className="text-2xl font-title text-lp-warning mt-2">{data?.kpis.organizersPending ?? 0}</p>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-white/10">
            <p className="text-xs uppercase tracking-wider text-lp-muted font-body">Eventos</p>
            <p className="text-2xl font-title text-white mt-2">{data?.kpis.events ?? 0}</p>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-white/10">
            <p className="text-xs uppercase tracking-wider text-lp-muted font-body">Tickets</p>
            <p className="text-2xl font-title text-white mt-2">{data?.kpis.tickets ?? 0}</p>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-white/10">
            <p className="text-xs uppercase tracking-wider text-lp-muted font-body">Revenue</p>
            <p className="text-2xl font-title text-lp-accent mt-2">{formatMoney(data?.kpis.revenue)}</p>
            <p className="text-[11px] text-lp-muted mt-1">Anchoring {data?.kpis.anchoring ?? 0}%</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-title text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="text-lp-warning" size={18} />
          Solicitudes pendientes
        </h3>
        <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead className="bg-lp-surface/60 text-lp-muted uppercase text-xs tracking-wider">
              <tr>
                <th className="text-left p-3">Organizador</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Fecha</th>
                <th className="text-right p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrganizers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-lp-muted">
                    No hay solicitudes pendientes.
                  </td>
                </tr>
              ) : (
                pendingOrganizers.map((org) => (
                  <tr key={org.id} className="border-t border-white/5">
                    <td className="p-3 text-white">{org.name}</td>
                    <td className="p-3 text-lp-muted">{org.email}</td>
                    <td className="p-3 text-lp-muted">{new Date(org.created_at).toLocaleDateString()}</td>
                    <td className="p-3 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => onReject(org.id)}
                        className="text-lp-error hover:bg-lp-error/10 !px-3"
                        title="Rechazar"
                      >
                        <XCircle size={16} />
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => onApprove(org.id)}
                        className="!px-3"
                        title="Aprobar"
                      >
                        <CheckCircle2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-title text-white mb-4 flex items-center gap-2">
          <SlidersHorizontal className="text-lp-accent" size={18} />
          Límites por organizador
        </h3>
        <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead className="bg-lp-surface/60 text-lp-muted uppercase text-xs tracking-wider">
              <tr>
                <th className="text-left p-3">Organizador</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Límites</th>
                <th className="text-right p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {organizers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-lp-muted">
                    No hay organizadores cargados.
                  </td>
                </tr>
              ) : (
                organizers.map((org) => (
                  <tr key={org.id} className="border-t border-white/5">
                    <td className="p-3 text-white">{org.name}</td>
                    <td className="p-3 text-lp-muted">{org.email}</td>
                    <td className="p-3 text-lp-muted">{org.status ?? '-'}</td>
                    <td className="p-3 text-lp-muted">
                      <div className="flex flex-col text-xs">
                        <span>Eventos: {org.limits?.max_events ?? '—'}</span>
                        <span>Tickets/evento: {org.limits?.max_tickets_per_event ?? '—'}</span>
                        <span>Volumen mensual: {org.limits?.max_monthly_volume ?? '—'}</span>
                      </div>
                    </td>
                    <td className="p-3 flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => onUpdateLimits(org.id)}
                        className="text-lp-accent hover:bg-lp-accent/10 !px-3"
                        title="Editar límites"
                      >
                        <SlidersHorizontal size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl border border-white/10 p-5">
          <h4 className="text-lg font-title text-white mb-3">Auditoría de Tickets</h4>
          <div className="space-y-2 text-xs text-lp-muted">
            {data?.recentTickets?.length ? (
              data.recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex justify-between border-b border-white/5 pb-2">
                  <div>
                    <p className="text-white">{ticket.event_title ?? 'Evento'}</p>
                    <p>{ticket.explorer_email ?? 'Explorer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">{ticket.status}</p>
                    <p>{formatMoney(Number(ticket.amount ?? 0))}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>No hay actividad reciente.</p>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-xl border border-white/10 p-5">
          <h4 className="text-lg font-title text-white mb-3">Auditoría de Pagos</h4>
          <div className="space-y-2 text-xs text-lp-muted">
            {data?.recentPayments?.length ? (
              data.recentPayments.map((payment) => (
                <div key={payment.id} className="flex justify-between border-b border-white/5 pb-2">
                  <div>
                    <p className="text-white">{payment.event_title ?? 'Evento'}</p>
                    <p>{payment.explorer_email ?? 'Explorer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">{formatMoney(Number(payment.amount ?? 0))}</p>
                    <p>{payment.mp_payment_id ?? 'MP -'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>No hay pagos recientes.</p>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="glass-panel rounded-xl border border-white/10 p-5">
          <h4 className="text-lg font-title text-white mb-3">Antifraude (solo lectura)</h4>
          <div className="space-y-2 text-xs text-lp-muted">
            {data?.antifraudFlags?.length ? (
              data.antifraudFlags.map((flag) => (
                <div key={flag.id} className="flex justify-between border-b border-white/5 pb-2">
                  <div>
                    <p className="text-white">{flag.event_title ?? 'Evento'}</p>
                    <p>{flag.explorer_email ?? 'Explorer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">PENDING</p>
                    <p>{new Date(flag.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>No hay señales antifraude recientes.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
