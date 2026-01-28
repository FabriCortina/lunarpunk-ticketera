import React, { useState } from 'react';
import { Event, EventMetrics, TicketValidationResult } from '../types';
import { Button } from './Button';
import { X, QrCode, CheckCircle, AlertTriangle } from 'lucide-react';

interface OrganizerEventMetricsModalProps {
  event: Event;
  metrics: EventMetrics | null;
  isLoading: boolean;
  scanResult: TicketValidationResult | null;
  scanError: string | null;
  isScanning: boolean;
  onScan: (qrPayload: string) => void;
  onClose: () => void;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

export const OrganizerEventMetricsModal: React.FC<OrganizerEventMetricsModalProps> = ({
  event,
  metrics,
  isLoading,
  scanResult,
  scanError,
  isScanning,
  onScan,
  onClose
}) => {
  const [qrPayload, setQrPayload] = useState('');

  const handleScan = () => {
    if (!qrPayload.trim()) return;
    onScan(qrPayload.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h3 className="text-2xl font-title font-bold text-white">{event.title}</h3>
            <p className="text-xs text-lp-muted font-body">{event.location}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <p className="text-lp-muted text-sm font-body">Cargando métricas...</p>
          ) : metrics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl border border-white/10">
                  <p className="text-xs uppercase tracking-wider text-lp-muted font-body">Reservas</p>
                  <p className="text-xl text-white font-title mt-1">{metrics.counts.reserved}</p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/10">
                  <p className="text-xs uppercase tracking-wider text-lp-muted font-body">Comprados</p>
                  <p className="text-xl text-white font-title mt-1">{metrics.counts.purchased}</p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/10">
                  <p className="text-xs uppercase tracking-wider text-lp-muted font-body">Asistieron</p>
                  <p className="text-xl text-white font-title mt-1">{metrics.counts.validated}</p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/10">
                  <p className="text-xs uppercase tracking-wider text-lp-muted font-body">Revenue</p>
                  <p className="text-xl text-lp-accent font-title mt-1">{formatMoney(metrics.revenue)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-lp-muted font-body">
                <div className="glass-panel p-4 rounded-xl border border-white/10">
                  <p>Ocupación: <span className="text-white">{metrics.rates.occupancyRate}%</span></p>
                  <p>Asistencia: <span className="text-white">{metrics.rates.attendanceRate}%</span></p>
                  <p>No show: <span className="text-white">{metrics.noShow}</span></p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/10">
                  <p>Reservas totales: <span className="text-white">{metrics.counts.totalTickets}</span></p>
                  <p>Compradores únicos: <span className="text-white">{metrics.counts.uniqueExplorers}</span></p>
                  <p>Cancelados: <span className="text-white">{metrics.counts.canceled}</span></p>
                </div>
              </div>

              {metrics.byTicketType.length > 0 && (
                <div className="glass-panel p-4 rounded-xl border border-white/10">
                  <p className="text-xs uppercase tracking-wider text-lp-muted font-body mb-2">Detalle por tipo</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-body text-lp-muted">
                    {metrics.byTicketType.map((type) => (
                      <div key={type.id} className="flex justify-between border-b border-white/5 pb-1">
                        <span>{type.name}</span>
                        <span>{type.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-lp-muted text-sm font-body">No se pudieron cargar métricas.</p>
          )}

          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-white font-title">
              <QrCode size={18} /> Escaneo de acceso
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={qrPayload}
                onChange={(e) => setQrPayload(e.target.value)}
                placeholder="Pegá el QR payload aquí"
                className="flex-1 bg-lp-bg/50 border border-lp-border rounded p-3 text-lp-navy placeholder:text-lp-navy/60 focus:border-lp-accent focus:outline-none transition-colors font-body"
              />
              <Button onClick={handleScan} isLoading={isScanning} className="md:w-auto">
                Validar QR
              </Button>
            </div>

            {scanError && (
              <p className="text-xs text-lp-error font-body">{scanError}</p>
            )}

            {scanResult && (
              <div className={`mt-2 p-3 rounded-lg border text-xs font-body ${
                scanResult.valid ? 'border-lp-success/40 bg-lp-success/5 text-lp-success' : 'border-lp-error/40 bg-lp-error/5 text-lp-error'
              }`}>
                <div className="flex items-center gap-2">
                  {scanResult.valid ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  <span>{scanResult.message}</span>
                </div>
                {scanResult.buyer && (
                  <div className="mt-2 text-white">
                    <p>Nombre: {scanResult.buyer.name ?? '-'}</p>
                    <p>Email: {scanResult.buyer.email ?? '-'}</p>
                    <p>CUIT/CUIL: {scanResult.buyer.cuitCuil ?? '-'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
