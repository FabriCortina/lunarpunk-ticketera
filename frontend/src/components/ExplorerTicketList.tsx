import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, Event, TicketStatus } from '../types';
import { Button } from './Button';
import { BrandLogo } from './BrandLogo';
import { Calendar, MapPin, Clock, CheckCircle, Ban, CheckCheck, Ticket as TicketIcon, AlertCircle, RefreshCcw, CreditCard, AlertTriangle, Hourglass } from 'lucide-react';
import { ticketsService } from '../services/ticketsService';
import { paymentsService } from '../services/paymentsService';

interface ExplorerTicketListProps {
  tickets: Ticket[];
  events: Event[];
  userId: string;
  onGoToEvents?: () => void;
}

const RESERVATION_TTL_MINUTES = 15;
const WARNING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export const ExplorerTicketList: React.FC<ExplorerTicketListProps> = ({ tickets, events, userId, onGoToEvents }) => {
  const [now, setNow] = useState(Date.now());
  const [qrPayloads, setQrPayloads] = useState<Record<string, string>>({});
  const [loadingTicketId, setLoadingTicketId] = useState<string | null>(null);
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const paidTickets = tickets.filter(ticket => ticket.status === TicketStatus.PAID);
    const missingQr = paidTickets.filter(ticket => !qrPayloads[ticket.id]);

    if (missingQr.length === 0) {
      return () => {
        isMounted = false;
      };
    }

    const loadQrPayloads = async () => {
      try {
        const results = await Promise.all(
          missingQr.map(async ticket => {
            const { qrPayload } = await ticketsService.getTicketQr(ticket.id);
            return { id: ticket.id, qrPayload };
          })
        );

        if (!isMounted) {
          return;
        }

        setQrPayloads(prev => {
          const next = { ...prev };
          results.forEach(result => {
            if (result.qrPayload) {
              next[result.id] = result.qrPayload;
            }
          });
          return next;
        });
      } catch (error) {
        console.error('Error loading ticket QR:', error);
      }
    };

    loadQrPayloads();

    return () => {
      isMounted = false;
    };
  }, [tickets, qrPayloads]);

  const getEvent = (id: string) => events.find(e => e.id === id);

  const handleCompletePayment = async (ticketId: string) => {
    setLoadingTicketId(ticketId);
    setPaymentErrors(prev => {
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });

    try {
      const { init_point } = await paymentsService.createPreference(ticketId);
      window.location.href = init_point;
    } catch (error: any) {
      setPaymentErrors(prev => ({
        ...prev,
        [ticketId]: error?.message || 'Error al iniciar el pago.'
      }));
    } finally {
      setLoadingTicketId(prev => (prev === ticketId ? null : prev));
    }
  };

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

  const renderQrSection = (ticket: Ticket) => {
    if (ticket.status !== TicketStatus.PAID) {
      return null;
    }

    const qrPayload = qrPayloads[ticket.id];
    if (!qrPayload) {
      return (
        <span className="text-[10px] text-slate-500 uppercase tracking-widest text-center font-body">
          Cargando QR...
        </span>
      );
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrPayload)}`;
    return (
      <div className="font-body flex flex-col items-center">
        <img
          src={qrUrl}
          alt="QR del ticket"
          className="w-24 h-24 rounded-lg bg-white p-1 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        />
        <span className="text-[10px] text-slate-500 uppercase tracking-widest text-center mt-2">
          Presentá este QR en el acceso
        </span>
      </div>
    );
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

          return (
            <div 
              key={ticket.id} 
              className={`glass-panel p-0 rounded-xl flex flex-col md:flex-row overflow-hidden group transition-all duration-300 relative ${
                isExpired && ticket.status === TicketStatus.PENDING 
                  ? 'opacity-60 border-slate-700' 
                  : isWarning 
                    ? 'border-lp-error/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                    : 'hover:border-lp-accent/50'
              }`}
            >
              {/* Progress Bar for Pending Tickets */}
              {ticket.status === TicketStatus.PENDING && !isExpired && (
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 z-10">
                  <div 
                    className={`h-full transition-all duration-1000 ease-linear ${isWarning ? 'bg-lp-error shadow-[0_0_10px_red]' : 'bg-lp-warning'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}

              {/* Left: Event Image & Date */}
              <div className="w-full md:w-64 relative min-h-[160px]">
                <img 
                  src={event.imageUrl} 
                  alt={event.title} 
                  className={`w-full h-full object-cover transition-transform duration-700 ${isExpired ? 'grayscale' : 'group-hover:scale-105'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r"></div>
                
                {/* Overlay Date */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-3 py-2 rounded text-center border border-white/10 font-body">
                   <p className="text-lp-accent text-xs font-bold uppercase">{new Date(event.dateTime).toLocaleString('default', { month: 'short' })}</p>
                   <p className="text-white text-xl font-title font-bold leading-none">{new Date(event.dateTime).getDate()}</p>
                </div>
              </div>

              {/* Middle: Ticket Details */}
              <div className="flex-1 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5 pt-8">
                <div className="flex justify-between items-start mb-2">
                   <div>
                      {/* Event Title -> H3 -> text-2xl */}
                      <h3 className="text-2xl font-title font-bold text-white group-hover:text-lp-accent transition-colors">{event.title}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-1">CODE: {ticket.ticketCode}</p>
                   </div>
                   {renderStatus(ticket)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm text-slate-400 font-body">
                   <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-lp-accent" />
                      <span>{event.location}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-lp-accent" />
                      <span>Comprado el: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                   </div>
                </div>

                {/* Expiration Actions for PENDING */}
                {ticket.status === TicketStatus.PENDING && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-3 flex-col sm:flex-row items-start sm:items-center">
                     {isExpired ? (
                        <>
                           <p className="text-xs text-lp-error flex-1 flex items-center font-body">
                              <AlertCircle size={12} className="mr-1" /> Reserva expirada. Si aún quieres asistir, intenta nuevamente.
                           </p>
                           <Button 
                              variant="ghost" 
                              onClick={onGoToEvents} 
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
                            onClick={() => handleCompletePayment(ticket.id)}
                            disabled={loadingTicketId === ticket.id}
                          >
                            <CreditCard size={14} /> Completar Pago
                          </Button>
                          {paymentErrors[ticket.id] && (
                            <p className="text-xs text-lp-error mt-2 font-body">
                              {paymentErrors[ticket.id]}
                            </p>
                          )}
                        </>
                     )}
                  </div>
                )}
              </div>

              {/* Right: QR */}
              <div className="p-6 md:w-48 bg-slate-900/50 flex flex-col items-center justify-center gap-3 border-l border-white/5">
                 {renderQrSection(ticket)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};