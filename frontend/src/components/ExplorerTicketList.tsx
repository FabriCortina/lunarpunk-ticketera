import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, Event, TicketStatus } from '../types';
import { Button } from './Button';
import { BrandLogo } from './BrandLogo';
import { ticketsService } from '../services/ticketsService';
import { paymentsService } from '../services/paymentsService';
import { QrCode, Calendar, MapPin, Clock, CheckCircle, Ban, CheckCheck, Ticket as TicketIcon, AlertCircle, RefreshCcw, CreditCard, AlertTriangle, Hourglass, Lock, X, Share2 } from 'lucide-react';

interface ExplorerTicketListProps {
  tickets: Ticket[];
  events: Event[];
  userId: string;
  onGoToEvents?: () => void;
  onDeleteTicket?: (ticketId: string) => void;
}

const RESERVATION_TTL_MINUTES = 15;
const WARNING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export const ExplorerTicketList: React.FC<ExplorerTicketListProps> = ({ tickets, events, userId, onGoToEvents, onDeleteTicket }) => {
  const [now, setNow] = useState(Date.now());
  const [qrPayloads, setQrPayloads] = useState<Record<string, string | null>>({});
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [retryEnabledIds, setRetryEnabledIds] = useState<Set<string>>(new Set());
  const [shareFeedbackId, setShareFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadQrPayloads = async () => {
      const paidTickets = tickets.filter(ticket => ticket.status === TicketStatus.PAID);

      await Promise.all(
        paidTickets.map(async (ticket) => {
          if (ticket.qrPayload || Object.prototype.hasOwnProperty.call(qrPayloads, ticket.id)) {
            return;
          }

          try {
            const result = await ticketsService.getTicketQr(ticket.id);
            if (!isActive) return;
            setQrPayloads(prev => ({ ...prev, [ticket.id]: result.qrPayload }));
          } catch (error) {
            if (!isActive) return;
            setQrPayloads(prev => ({ ...prev, [ticket.id]: null }));
          }
        })
      );
    };

    loadQrPayloads();

    return () => {
      isActive = false;
    };
  }, [tickets, qrPayloads]);

  const getEvent = (id: string) => events.find(e => e.id === id);

  // Helper to calculate status details
  const getTicketStatusInfo = (ticket: Ticket) => {
    if (ticket.status === TicketStatus.PENDING) {
       const createdTime = new Date(ticket.createdAt).getTime();
       const ttlMs = RESERVATION_TTL_MINUTES * 60 * 1000;
       const expireTime = createdTime + ttlMs;
       const timeLeft = expireTime - now;
       
       const isExpired = timeLeft <= 0;
       const progress = isExpired ? 0 : Math.min(Math.max(timeLeft / ttlMs, 0), 1) * 100;
       const isWarning = !isExpired && timeLeft <= WARNING_THRESHOLD_MS;

       return {
         isExpired,
         isWarning,
         label: isExpired ? 'Reserva Expirada' : (isWarning ? 'Reservado — por expirar' : 'Reservado'),
         timeLeft: isExpired ? 0 : timeLeft,
         progress
       };
    }
    return { isExpired: false, isWarning: false, label: '', timeLeft: 0, progress: 0 };
  };

  // Sort Tickets Logic
  const sortedTickets = useMemo(() => {
    const myTickets = tickets.filter(t => t.explorerId === userId);

    return myTickets.sort((a, b) => {
      const infoA = getTicketStatusInfo(a);
      const infoB = getTicketStatusInfo(b);

      // Priority Definition:
      // 1. Active Pending (Priority to expire soonest)
      // 2. Expired Pending
      // 3. Paid
      // 4. Validated
      // 5. Canceled
      const getPriority = (t: Ticket, info: any) => {
        if (t.status === TicketStatus.PENDING) {
          return info.isExpired ? 2 : 1;
        }
        if (t.status === TicketStatus.PAID) return 3;
        if (t.status === TicketStatus.VALIDATED) return 4;
        if (t.status === TicketStatus.CANCELED) return 5;
        return 6;
      };

      const pA = getPriority(a, infoA);
      const pB = getPriority(b, infoB);

      // Primary Sort: Priority Group
      if (pA !== pB) return pA - pB;

      // Secondary Sort:
      if (pA === 1) {
        // Active Pending: Sort by TimeLeft ASC (Urgent first)
        return infoA.timeLeft - infoB.timeLeft;
      }

      // All others: Sort by CreatedAt DESC (Newest first)
      // Note: For VALIDATED, prompt asked for validatedAt, but falling back to createdAt as strictly frontend model doesn't have it.
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tickets, userId, now]); // Recalculate when time changes

  // Para compras de varios tickets (mismo orderId), mostramos un único botón
  // de "Completar Pago" en el primer ticket pendiente del grupo.
  const orderGroupInfo = useMemo(() => {
    const sizes = new Map<string, number>();
    const leaders = new Map<string, string>();

    sortedTickets
      .filter((t) => t.status === TicketStatus.PENDING)
      .forEach((t) => {
        sizes.set(t.orderId, (sizes.get(t.orderId) ?? 0) + 1);
        if (!leaders.has(t.orderId)) {
          leaders.set(t.orderId, t.id);
        }
      });

    return { sizes, leaders };
  }, [sortedTickets]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderStatus = (ticket: Ticket) => {
    const { isExpired, isWarning, label, timeLeft } = getTicketStatusInfo(ticket);

    switch (ticket.status) {
      case TicketStatus.PAID:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-lp-success bg-lp-success/10 px-2 py-1 rounded border border-lp-success/30 font-body">
            <CheckCircle size={12} /> Pagado
          </span>
        );
      case TicketStatus.VALIDATED:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-lp-accent bg-lp-accent/10 px-2 py-1 rounded border border-lp-accent/30 font-body">
            <CheckCheck size={12} /> Usado
          </span>
        );
      case TicketStatus.CANCELED:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-lp-error bg-lp-error/10 px-2 py-1 rounded border border-lp-error/30 font-body">
            <Ban size={12} /> Cancelado
          </span>
        );
      case TicketStatus.PENDING:
      default:
        if (isExpired) {
           return (
             <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-600 font-body">
               <AlertCircle size={12} /> Reserva Expirada
             </span>
           );
        }
        return (
          <div className="flex flex-col items-end font-body">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded border transition-colors ${
              isWarning 
                ? 'text-lp-error bg-lp-error/10 border-lp-error/50 animate-pulse' 
                : 'text-lp-warning bg-lp-warning/10 border-lp-warning/30'
            }`}>
              {isWarning ? <Hourglass size={12} /> : <Clock size={12} />} 
              {label}
            </span>
            <span className={`text-[10px] font-mono mt-1 ${isWarning ? 'text-lp-error font-bold' : 'text-lp-warning'}`}>
               Expira en: {formatTime(timeLeft)}
            </span>
          </div>
        );
    }
  };

  const getQrPayload = (ticket: Ticket) => ticket.qrPayload ?? qrPayloads[ticket.id] ?? null;

  const handleShareQr = async (ticket: Ticket, qrUrl: string, eventTitle: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Ticket - ${eventTitle}`, text: `Mi entrada para ${eventTitle}`, url: qrUrl });
      } catch {
        // Usuario canceló el share, no hacer nada
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(qrUrl);
      setShareFeedbackId(ticket.id);
      setTimeout(() => setShareFeedbackId((current) => (current === ticket.id ? null : current)), 2000);
    } catch {
      // Clipboard no disponible
    }
  };

  const renderQrSection = (ticket: Ticket, isExpired: boolean, eventTitle: string) => {
    if (isExpired && ticket.status === TicketStatus.PENDING) {
        return (
             <div className="flex flex-col items-center gap-2 opacity-50 font-body">
                 <div className="bg-slate-800 p-2 rounded-lg">
                    <Ban size={60} className="text-slate-600" />
                 </div>
                 <span className="text-[10px] text-slate-500 uppercase tracking-widest text-center">Expirado</span>
             </div>
        );
    }

    switch(ticket.status) {
        case TicketStatus.PAID:
            const qrPayload = getQrPayload(ticket);
            const qrUrl = qrPayload
              ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`
              : null;
            return (
                <div className="font-body flex flex-col items-center">
                 <div className="bg-white p-2 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all">
                    {qrUrl ? (
                      <img src={qrUrl} alt="QR Ticket" className="w-20 h-20" />
                    ) : (
                      <QrCode size={80} className="text-black" />
                    )}
                 </div>
                 <span className="text-[10px] text-slate-500 uppercase tracking-widest text-center mt-2">
                   {qrUrl ? 'Presentá este QR en el acceso' : 'Generando QR...'}
                 </span>
                 {qrUrl && (
                   <button
                     type="button"
                     onClick={() => handleShareQr(ticket, qrUrl, eventTitle)}
                     className="mt-2 flex items-center gap-1 text-[10px] text-lp-accent hover:text-white uppercase tracking-widest transition-colors"
                   >
                     <Share2 size={12} />
                     {shareFeedbackId === ticket.id ? 'Copiado!' : 'Compartir'}
                   </button>
                 )}
                </div>
            );
        case TicketStatus.PENDING:
            return (
                <div className="text-center flex flex-col items-center gap-2 font-body">
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center bg-slate-800/50">
                        <Lock size={24} className="text-slate-500" />
                    </div>
                    <span className="text-[10px] text-lp-warning font-bold uppercase tracking-wide text-center max-w-[140px]">
                        Completá el pago para habilitar tu QR
                    </span>
                </div>
            );
        case TicketStatus.VALIDATED:
             return (
                 <div className="text-center flex flex-col items-center gap-2 font-body">
                    <div className="w-20 h-20 rounded-lg border border-lp-accent/20 flex items-center justify-center bg-lp-accent/5">
                        <CheckCheck size={32} className="text-lp-accent" />
                    </div>
                    <span className="text-[10px] text-lp-accent font-bold uppercase tracking-wide text-center">
                        Ticket ya utilizado
                    </span>
                </div>
            );
        case TicketStatus.CANCELED:
             return (
                 <div className="text-center flex flex-col items-center gap-2 font-body">
                    <div className="w-20 h-20 rounded-lg border border-lp-error/20 flex items-center justify-center bg-lp-error/5">
                        <Ban size={32} className="text-lp-error" />
                    </div>
                    <span className="text-[10px] text-lp-error font-bold uppercase tracking-wide text-center">
                        Ticket cancelado
                    </span>
                </div>
            );
        default: return null;
    }
  };

  if (sortedTickets.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
        <div className="flex justify-center mb-4">
            <BrandLogo variant="icon" size="lg" className="opacity-50 grayscale" />
        </div>
        <p className="text-xl font-title text-slate-500">No tienes tickets en tu inventario.</p>
        <p className="text-sm text-slate-600 mt-2 font-body">Explora los eventos disponibles y adquiere tu primera experiencia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between mb-4">
          {/* H2 Title -> text-3xl */}
          <h2 className="text-3xl font-title font-bold text-white flex items-center gap-3">
            <TicketIcon className="text-lp-accent" size={24} />
            Mis Tickets <span className="text-sm text-slate-500 font-body font-normal">({sortedTickets.length})</span>
          </h2>
       </div>

       <div className="grid grid-cols-1 gap-6">
        {sortedTickets.map((ticket) => {
          const event = getEvent(ticket.eventId);
          // If event is deleted but ticket exists, we handle it gracefully
          if (!event) return null; 

          const { isExpired, isWarning, progress } = getTicketStatusInfo(ticket);
          const canRetry = retryEnabledIds.has(ticket.id);
          const isExpiredForUI = isExpired && !canRetry;

          const canDelete = ticket.status === TicketStatus.PENDING || ticket.status === TicketStatus.CANCELED;

          const groupSize = orderGroupInfo.sizes.get(ticket.orderId) ?? 1;
          const isGroupLeader = orderGroupInfo.leaders.get(ticket.orderId) === ticket.id;

          return (
            <div 
              key={ticket.id} 
              className={`glass-panel p-0 rounded-xl flex flex-col md:flex-row overflow-hidden group transition-all duration-300 relative ${
                isExpiredForUI && ticket.status === TicketStatus.PENDING 
                  ? 'opacity-60 border-slate-700' 
                  : isWarning 
                    ? 'border-lp-error/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                    : 'hover:border-lp-accent/50'
              }`}
            >
              {onDeleteTicket && canDelete && (
                <button
                  type="button"
                  onClick={() => onDeleteTicket(ticket.id)}
                  className="absolute top-3 right-3 z-20 text-slate-400 hover:text-lp-error transition-colors bg-black/40 rounded-full p-1.5"
                  aria-label="Eliminar ticket"
                >
                  <X size={14} />
                </button>
              )}
              {/* Progress Bar for Pending Tickets */}
              {ticket.status === TicketStatus.PENDING && !isExpiredForUI && (
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 z-10">
                  <div 
                    className={`h-full transition-all duration-1000 ease-linear ${isWarning ? 'bg-lp-error shadow-[0_0_10px_red]' : 'bg-lp-warning'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}

              {/* Left: Event Image & Date */}
              <div className="relative w-full md:w-48 h-40 md:h-auto shrink-0 overflow-hidden">
                <img 
                  src={event.imageUrl} 
                  alt={event.title} 
                  className={`w-full h-full object-cover transition-all ${isExpired ? 'grayscale' : ''}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3">
                  <p className="text-xs text-white font-body uppercase tracking-widest">
                    {new Date(ticket.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              {/* Middle: Ticket Info */}
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-title font-bold text-white leading-tight">{event.title}</h3>
                    <p className="text-slate-400 text-xs font-body">{event.location}</p>
                  </div>
                  {renderStatus(ticket)}
                </div>

                {ticket.ticketTypeName && (
                  <div className="mb-4 text-center">
                    <p className="text-lp-accent text-lg md:text-xl font-title uppercase tracking-wider">
                      {ticket.ticketTypeName}
                    </p>
                  </div>
                )}

                <div className="space-y-2 text-sm text-slate-400 font-body">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} /> <span>{new Date(event.dateTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} /> <span>{event.location}</span>
                  </div>
                </div>

                {/* Pending Actions */}
              {ticket.status === TicketStatus.PENDING && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-3 flex-col sm:flex-row items-start sm:items-center">
                     {!isGroupLeader ? (
                        <p className="text-xs text-slate-400 flex-1 flex items-center font-body">
                           <CreditCard size={12} className="mr-1" /> Incluido en una compra de {groupSize} tickets.
                        </p>
                     ) : isExpiredForUI ? (
                        <>
                           <p className="text-xs text-lp-error flex-1 flex items-center font-body">
                              <AlertCircle size={12} className="mr-1" /> Reserva expirada. Si aún quieres asistir, intenta nuevamente.
                           </p>
                           <Button
                              variant="ghost"
                              isLoading={checkoutLoadingId === ticket.orderId}
                              onClick={async () => {
                                setRetryEnabledIds(prev => new Set(prev).add(ticket.id));
                                setCheckoutError(null);
                                setCheckoutLoadingId(ticket.orderId);
                                try {
                                  const response = await paymentsService.createPreference(ticket.orderId);
                                  window.location.href = response.init_point;
                                } catch (error: any) {
                                  setCheckoutError(error?.message || 'No se pudo iniciar el pago.');
                                } finally {
                                  setCheckoutLoadingId(null);
                                }
                              }}
                              className="text-xs !py-1 font-body"
                           >
                              <RefreshCcw size={12} /> Reintentar Compra
                           </Button>
                        </>
                     ) : (
                        <>
                          <div className="flex-1">
                             {isWarning && (
                               <p className="text-xs text-lp-error font-bold animate-pulse flex items-center mb-2 sm:mb-0 font-body">
                                  <AlertTriangle size={12} className="mr-1"/> Quedan menos de 2 minutos para completar el pago.
                               </p>
                             )}
                          </div>
                          <Button
                            variant="primary"
                            className={`w-full sm:w-auto text-xs !py-2 text-black shadow-none font-body ${isWarning ? 'bg-lp-error hover:bg-red-400' : 'bg-lp-warning hover:bg-yellow-300'}`}
                            isLoading={checkoutLoadingId === ticket.orderId}
                            onClick={async () => {
                              setCheckoutError(null);
                              setCheckoutLoadingId(ticket.orderId);
                              try {
                                const response = await paymentsService.createPreference(ticket.orderId);
                                window.location.href = response.init_point;
                              } catch (error: any) {
                                setCheckoutError(error?.message || 'No se pudo iniciar el pago.');
                              } finally {
                                setCheckoutLoadingId(null);
                              }
                            }}
                          >
                            <CreditCard size={14} /> Completar Pago{groupSize > 1 ? ` (${groupSize} tickets)` : ''}
                          </Button>
                        </>
                     )}
                  </div>
                )}
                {checkoutError && (
                  <p className="mt-2 text-xs text-lp-error font-body">{checkoutError}</p>
                )}
              </div>

              {/* Right: QR & Action */}
              <div className={`p-6 md:w-48 bg-slate-900/50 flex flex-col items-center justify-center gap-3 border-l border-white/5 ${isExpiredForUI && ticket.status === TicketStatus.PENDING ? 'pointer-events-none' : ''}`}>
                 {renderQrSection(ticket, isExpiredForUI, event.title)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
