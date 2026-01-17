import React, { useState, useEffect } from 'react';
import { Ticket, Event, TicketStatus } from '../types';
import { Button } from './Button';
import { BrandLogo } from './BrandLogo';
import { QrCode, X, CheckCircle, Clock, Ban, CheckCheck, AlertCircle, AlertTriangle, Hourglass, Lock } from 'lucide-react';

interface TicketWalletProps {
  tickets: Ticket[];
  events: Event[];
  onClose: () => void;
  userId: string;
}

const RESERVATION_TTL_MINUTES = 15;
const WARNING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export const TicketWallet: React.FC<TicketWalletProps> = ({ tickets, events, onClose, userId }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const getEvent = (id: string) => events.find(e => e.id === id);
  
  // Filter and Sort for Wallet (Consistent with List)
  const myTickets = tickets
    .filter(t => t.explorerId === userId)
    .sort((a, b) => {
        // Simple sort for wallet: Pending Active -> Others -> Created Desc
        const getPriority = (t: Ticket) => {
             if (t.status === TicketStatus.PENDING) {
                // Check simple expiry without complex calc for sort speed here
                const exp = new Date(t.createdAt).getTime() + (RESERVATION_TTL_MINUTES * 60000);
                return exp > now ? 1 : 2;
             }
             return 3;
        };
        return getPriority(a) - getPriority(b) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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
         timeLeft: isExpired ? 0 : timeLeft,
         progress
       };
    }
    return { isExpired: false, isWarning: false, timeLeft: 0, progress: 0 };
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderStatus = (ticket: Ticket) => {
    const { isExpired, isWarning, timeLeft } = getTicketStatusInfo(ticket);

    switch (ticket.status) {
      case TicketStatus.PAID:
        return (
          <div className="flex items-center gap-1.5 text-xs text-lp-success font-body">
            <CheckCircle size={12} /> <span className="uppercase font-bold">Pagado</span>
          </div>
        );
      case TicketStatus.VALIDATED:
        return (
          <div className="flex items-center gap-1.5 text-xs text-lp-accent font-body">
            <CheckCheck size={12} /> <span className="uppercase font-bold">Usado</span>
          </div>
        );
      case TicketStatus.CANCELED:
        return (
          <div className="flex items-center gap-1.5 text-xs text-lp-error font-body">
            <Ban size={12} /> <span className="uppercase font-bold">Cancelado</span>
          </div>
        );
      case TicketStatus.PENDING:
      default:
        if (isExpired) {
          return (
             <div className="flex items-center gap-1.5 text-xs text-slate-500 font-body">
               <AlertCircle size={12} /> <span className="uppercase font-bold">Expirado</span>
             </div>
          );
        }
        return (
          <div className="flex flex-col items-end font-body">
            <div className={`flex items-center gap-1.5 text-xs ${isWarning ? 'text-lp-error font-bold animate-pulse' : 'text-lp-warning'}`}>
                {isWarning ? <Hourglass size={12} /> : <Clock size={12} />} 
                <span className="uppercase font-bold">{isWarning ? 'Por Expirar' : 'Reservado'}</span>
            </div>
            <span className={`text-[10px] font-mono ${isWarning ? 'text-lp-error' : 'text-lp-warning'}`}>
               {formatTime(timeLeft)}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#050b14] border border-lp-accent w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,255,187,0.2)] flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-lp-navy/50">
          {/* H3 Title (22-26px) -> text-2xl */}
          <h3 className="font-title font-bold text-2xl text-white tracking-widest uppercase">
            Billetera Digital
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {myTickets.length === 0 ? (
            <div className="text-center py-10 text-slate-500 flex flex-col items-center gap-3">
              <div className="flex justify-center mb-2">
                 <BrandLogo variant="icon" size="md" className="opacity-20 grayscale" />
              </div>
              <p className="font-body">No tienes tickets activos en esta cuenta.</p>
            </div>
          ) : (
            myTickets.map((ticket) => {
              const event = getEvent(ticket.eventId);
              if (!event) return null;
              
              const { isExpired, isWarning, progress } = getTicketStatusInfo(ticket);
              const isVisualExpired = ticket.status === TicketStatus.PENDING && isExpired;

              return (
                <div key={ticket.id} className={`relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 border-l-4 border-l-lp-accent overflow-hidden group shadow-lg ${isVisualExpired ? 'grayscale opacity-70 border-slate-600' : ''} ${isWarning ? 'border-lp-error ring-1 ring-lp-error/20' : ''}`}>
                  
                   {/* Progress Bar for Wallet Items */}
                  {ticket.status === TicketStatus.PENDING && !isExpired && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-700 z-10">
                      <div 
                        className={`h-full transition-all duration-1000 linear ${isWarning ? 'bg-lp-error' : 'bg-lp-warning'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4 relative z-10 pt-2">
                    <div>
                      {/* Event Title -> H3 -> text-2xl */}
                      <h4 className="font-title font-bold text-white text-2xl leading-tight mb-1">{event.title}</h4>
                      <p className="text-lp-accent text-xs font-mono">{new Date(event.dateTime).toLocaleDateString()}</p>
                    </div>
                    
                     {/* QR Logic */}
                    {ticket.status === TicketStatus.PAID ? (
                         <div className="bg-white p-1.5 rounded shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                            <QrCode className="text-black" size={40} />
                         </div>
                    ) : (
                         <div className="p-2 rounded bg-slate-800 border border-slate-600 flex items-center justify-center w-[52px] h-[52px]">
                            {ticket.status === TicketStatus.PENDING && <Lock size={24} className="text-lp-warning" />}
                            {ticket.status === TicketStatus.VALIDATED && <CheckCheck size={24} className="text-lp-accent" />}
                            {ticket.status === TicketStatus.CANCELED && <Ban size={24} className="text-lp-error" />}
                         </div>
                    )}
                  </div>
                  
                  <div className="border-t border-white/5 my-3 pt-3 flex justify-between items-center relative z-10 font-body">
                     {renderStatus(ticket)}
                     <span className="text-[10px] text-slate-500 font-mono tracking-wider">{ticket.ticketCode}</span>
                  </div>

                  {isWarning && (
                     <p className="text-[10px] text-lp-error text-right font-bold animate-pulse relative z-10 mt-1 font-body">
                        <AlertTriangle size={10} className="inline mr-1"/> ¡Completa tu pago pronto!
                     </p>
                  )}

                  {/* Contextual Text based on Status */}
                  {ticket.status === TicketStatus.PENDING && !isExpired && (
                     <div className="mt-2 text-center">
                        <p className="text-[10px] text-lp-warning font-bold uppercase tracking-wide font-body">
                            Completá el pago para habilitar tu QR
                        </p>
                     </div>
                  )}
                  {ticket.status === TicketStatus.VALIDATED && (
                      <div className="mt-2 text-center">
                        <p className="text-[10px] text-lp-accent font-bold uppercase tracking-wide font-body">
                            Ticket ya utilizado
                        </p>
                     </div>
                  )}
                  {ticket.status === TicketStatus.CANCELED && (
                      <div className="mt-2 text-center">
                        <p className="text-[10px] text-lp-error font-bold uppercase tracking-wide font-body">
                            Ticket cancelado
                        </p>
                     </div>
                  )}

                  <div className="flex justify-between items-end text-xs text-slate-400 relative z-10 mt-2 font-body">
                    <div>
                      <p className="uppercase text-[10px] text-slate-500">Ubicación</p>
                      <p className="text-slate-200">{event.location}</p>
                    </div>
                    <div className="text-right">
                       <p className="uppercase text-[10px] text-slate-500">Adquirido</p>
                       <p className="text-slate-200">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Visual warning overlay for expired wallet items */}
                  {isVisualExpired && (
                     <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                         <span className="bg-black/80 text-lp-error border border-lp-error/50 px-3 py-1 rounded text-xs font-bold uppercase rotate-12 font-body">
                            Ticket Expirado
                         </span>
                     </div>
                  )}

                  {/* Decorative Elements */}
                  {!isVisualExpired && (
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-lp-accent/10 rounded-full blur-xl group-hover:bg-lp-accent/20 transition-all"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};