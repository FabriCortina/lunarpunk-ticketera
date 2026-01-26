import React, { useMemo, useState } from 'react';
import { Event } from '../types';
import { Button } from './Button';
import { X, Calendar, MapPin, Tag, Share2, Info } from 'lucide-react';

interface EventDetailModalProps {
  event: Event;
  onClose: () => void;
  onBuy: (event: Event, ticketTypeId?: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, onBuy }) => {
  const formattedDate = new Date(event.dateTime).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const ticketTypes = event.ticketTypes || [];
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>(
    ticketTypes[0]?.id
  );
  const selectedType = useMemo(
    () => ticketTypes.find((type) => type.id === selectedTypeId),
    [ticketTypes, selectedTypeId]
  );
  const displayPrice = selectedType?.price ?? event.price;
  const remaining = selectedType?.available ?? event.availableTickets;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#050b14] border border-lp-accent/30 w-full max-w-4xl rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,240,255,0.15)] flex flex-col md:flex-row max-h-[90vh]">
        
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
            <div className="flex items-center gap-2 text-lp-muted text-sm font-body">
               <Share2 size={14} /> <span>ID: {event.id}</span>
            </div>
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
               <Info size={18} className="text-lp-accent" /> Acerca del evento
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm md:text-base font-body">
              {event.description}
            </p>
          </div>

          <div className="mt-auto border-t border-white/10 pt-6 flex flex-col gap-5">
            {ticketTypes.length > 0 && (
              <div className="space-y-3">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-body">Tipos de ticket</p>
                <div className="grid grid-cols-1 gap-3">
                  {ticketTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedTypeId(type.id)}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
                        selectedTypeId === type.id
                          ? 'border-lp-accent bg-lp-accent/10'
                          : 'border-white/10 bg-slate-900/40 hover:border-lp-accent/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-body font-bold">{type.name}</span>
                        <span className="text-lp-accent font-body font-bold">${type.price}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-body">{type.description}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-body">
                        {type.available} disponibles
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-body">Precio del Ticket</p>
              <p className="text-3xl font-title font-bold text-white">${displayPrice}</p>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-2">
               <Button 
                  onClick={() => {
                     onBuy(event, selectedTypeId);
                     onClose();
                  }}
                  disabled={remaining === 0}
                  className="w-full md:w-auto px-8 py-3 text-base font-body"
               >
                  {remaining === 0 ? "Sold Out" : "Comprar Ticket (Reservar)"}
               </Button>
               {remaining > 0 && (
                 <p className="text-[10px] text-center text-slate-500 font-body">
                    <Tag size={10} className="inline mr-1" />
                   {remaining} tickets restantes
                 </p>
               )}
            </div>
          </div>
          </div>

        </div>
      </div>
    </div>
  );
};
