import React, { useEffect, useMemo, useState } from 'react';
import { Event } from '../types';
import { Button } from './Button';
import { X, Calendar, MapPin, Info } from 'lucide-react';

interface EventDetailModalProps {
  event: Event;
  onClose: () => void;
  onBuy: (event: Event, ticketTypeId?: string) => void;
  onSelectType?: (eventId: string, ticketTypeName: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, onBuy, onSelectType }) => {
  const formattedDate = new Date(event.dateTime).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const ticketTypes = event.ticketTypes || [];
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>(ticketTypes[0]?.id);
  const selectedType = useMemo(
    () => ticketTypes.find((type) => type.id === selectedTypeId),
    [ticketTypes, selectedTypeId]
  );
  const remaining = selectedType?.available ?? event.availableTickets;

  useEffect(() => {
    if (selectedType?.name) {
      onSelectType?.(event.id, selectedType.name);
    }
  }, [event.id, onSelectType, selectedType?.name]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#050b14] border border-lp-accent/30 w-full max-w-4xl rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,240,255,0.15)] flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Image Column */}
        <div className="w-full md:w-2/5 h-48 md:h-auto relative">
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-transparent to-transparent"></div>
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 md:hidden bg-black/50 p-2 rounded-full text-white backdrop-blur-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Column */}
        <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col overflow-y-auto relative bg-slate-900/50">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 hidden md:block text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-lp-accent/10 border border-lp-accent/30 rounded-full text-lp-accent text-xs font-bold tracking-widest uppercase mb-3 font-body">
              Evento Verificado
            </span>
            {/* H1 Modal Title (34-40px) -> text-4xl */}
            <h2 className="text-3xl md:text-4xl font-title font-bold text-white leading-tight mb-2 neon-text">
              {event.title}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 text-lp-accent mb-1 font-body">
                   <Calendar size={16} /> <span className="text-xs uppercase font-bold">Fecha</span>
                </div>
                <p className="text-slate-200 text-sm capitalize font-body">{formattedDate}</p>
             </div>
             <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 text-lp-accent mb-1 font-body">
                   <MapPin size={16} /> <span className="text-xs uppercase font-bold">Ubicación</span>
                </div>
                <p className="text-slate-200 text-sm font-body">{event.location}</p>
             </div>
          </div>

          <div className="prose prose-invert max-w-none mb-8">
            <h3 className="text-white font-title text-lg flex items-center gap-2 mb-3">
               <Info size={18} className="text-lp-accent" /> Esencia de la experiencia
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm md:text-base font-body">
              {event.description}
            </p>
          </div>

          <div className="mt-auto border-t border-white/10 pt-6 flex flex-col gap-5">
            {ticketTypes.length > 0 && (
              <div className="space-y-3">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-body">Accesos a la aventura</p>
                <div className="grid grid-cols-1 gap-3">
                  {ticketTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setSelectedTypeId(type.id);
                        onSelectType?.(event.id, type.name);
                      }}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
                        selectedTypeId === type.id
                          ? 'border-lp-accent bg-lp-accent/10'
                          : 'border-white/10 bg-slate-900/40 hover:border-lp-accent/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-32 text-center">
                          <span className="text-white font-body font-bold block">{type.name}</span>
                          <span className="text-lp-accent font-body font-bold block">${type.price}</span>
                        </div>
                        <p className="flex-1 text-xs text-slate-400 font-body text-center break-words">
                          {type.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
               <Button 
                  onClick={() => {
                     onBuy(event, selectedTypeId);
                     onClose();
                  }}
                  disabled={remaining === 0}
                  className="w-full md:w-auto px-10 py-3 text-base font-body"
               >
                  {remaining === 0 ? "Sold Out" : "Comprar Ticket (Reservar)"}
               </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
