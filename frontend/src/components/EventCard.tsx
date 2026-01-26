import React from 'react';
import { Event } from '../types';
import { Button } from './Button';
import { Calendar, MapPin, Tag, Eye } from 'lucide-react';

interface EventCardProps {
  event: Event;
  onBuy?: (event: Event) => void;
  isOrganizer?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onBuy, isOrganizer }) => {
  const formattedDate = new Date(event.dateTime).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (onBuy) onBuy(event);
  };

  const hasTicketTypes = !!event.ticketTypes?.length;

  return (
    <div className="glass-panel rounded-xl overflow-hidden group hover:border-lp-accent/50 transition-all duration-300 flex flex-col h-full hover:shadow-lg hover:shadow-lp-accent/10 transform hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-lp-bg via-transparent to-transparent"></div>
        {/* Badge de precio -> Body */}
        <div className="absolute bottom-3 right-3 bg-lp-navy/80 backdrop-blur px-3 py-1 rounded-full border border-lp-border text-lp-accent font-body font-bold">
          {hasTicketTypes ? `Desde $${event.price}` : `$${event.price}`}
        </div>
        
        {/* Overlay Hint */}
        {!isOrganizer && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="flex items-center gap-2 text-white font-bold bg-black/50 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm font-title uppercase tracking-wider">
                    <Eye size={16} /> Ver Detalles
                </span>
            </div>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col bg-transparent">
        {/* Título -> Xystema H3 (22-26px) -> text-2xl is 24px */}
        <h3 className="text-2xl font-title font-bold text-white mb-2 line-clamp-1 group-hover:text-lp-accent transition-colors tracking-wide">
          {event.title}
        </h3>
        
        <div className="space-y-2 mb-4 text-lp-muted text-sm font-body">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-lp-primary" />
            <span className="capitalize">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-lp-primary" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
             <Tag size={14} className="text-lp-primary" />
             <span className={`${event.availableTickets < 10 ? 'text-lp-orange' : ''}`}>
               {event.availableTickets} tickets restantes
             </span>
          </div>
        </div>

        <p className="text-lp-muted text-sm mb-6 line-clamp-2 flex-1 font-body">
          {event.description}
        </p>

        {!isOrganizer && (
          <Button 
            onClick={handleBuyClick} 
            disabled={event.availableTickets === 0}
            className="w-full relative z-20 font-body"
            variant={event.availableTickets === 0 ? "ghost" : "primary"}
          >
            {event.availableTickets === 0 ? "Sold Out" : "Comprar Ticket"}
          </Button>
        )}
      </div>
    </div>
  );
};
