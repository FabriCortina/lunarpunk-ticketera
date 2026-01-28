import React from 'react';
import { Event } from '../types';
import { Button } from './Button';
import { BrandLogo } from './BrandLogo';
import { Edit2, Trash2, Eye, EyeOff, Calendar, MapPin, Tag } from 'lucide-react';

interface OrganizerEventListProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onTogglePublish: (event: Event) => void;
  onViewMetrics: (event: Event) => void;
}

export const OrganizerEventList: React.FC<OrganizerEventListProps> = ({ 
  events, 
  onEdit, 
  onDelete,
  onTogglePublish,
  onViewMetrics
}) => {

  if (events.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
        <div className="flex justify-center mb-4">
           <BrandLogo variant="icon" size="lg" className="opacity-50 grayscale" />
        </div>
        <p className="text-xl font-title text-slate-500">No has creado eventos aún.</p>
        <p className="text-sm text-slate-600 mt-2 font-body">Usa el panel superior para publicar tu primera experiencia.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {events.map((event) => (
        <div 
          key={event.id} 
          className={`glass-panel p-4 md:p-6 rounded-xl flex flex-col md:flex-row gap-6 transition-all border-l-4 ${event.isPublished ? 'border-l-lunar-accent' : 'border-l-slate-600 bg-slate-900/80 opacity-80'}`}
        >
          {/* Image Section */}
          <div className="w-full md:w-48 h-32 md:h-auto shrink-0 rounded-lg overflow-hidden relative group">
            <img 
              src={event.imageUrl} 
              alt={event.title} 
              className={`w-full h-full object-cover transition-all ${!event.isPublished ? 'grayscale' : ''}`}
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-xs font-bold uppercase tracking-wider text-white border border-white px-2 py-1 rounded font-body">
                 ID: {event.id.slice(-4)}
               </span>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 flex flex-col justify-center">
             <div className="flex items-start justify-between mb-2">
                {/* H3 equivalent (22-26px) -> text-2xl */}
                <h3 className={`text-2xl font-title font-bold ${event.isPublished ? 'text-white' : 'text-slate-400'}`}>
                  {event.title}
                  {!event.isPublished && <span className="ml-3 text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full align-middle font-body">BORRADOR</span>}
                </h3>
                <span className="text-lp-accent font-body font-bold text-lg">
                  {event.ticketTypes && event.ticketTypes.length > 0 ? `Desde $${event.price}` : `$${event.price}`}
                </span>
             </div>

             <div className="space-y-1 text-sm text-slate-400 mb-4 font-body">
                <div className="flex items-center gap-2">
                   <Calendar size={14} /> 
                   <span>{new Date(event.dateTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                   <MapPin size={14} /> 
                   <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Tag size={14} /> 
                   <span>{event.availableTickets} / {event.capacity} tickets disponibles</span>
                </div>
             </div>
             
             <p className="text-slate-500 text-sm line-clamp-1 font-body">{event.description}</p>
          </div>

          {/* Actions Section */}
          <div className="flex flex-row md:flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 min-w-[160px]">
             <Button 
                onClick={() => onEdit(event)} 
                variant="secondary" 
                className="flex-1 md:flex-none !py-2 text-xs font-body"
             >
                <Edit2 size={14} /> Editar
             </Button>
             
             <Button 
                onClick={() => onTogglePublish(event)} 
                variant="ghost" 
                className={`flex-1 md:flex-none !py-2 text-xs border border-transparent font-body ${event.isPublished ? 'text-yellow-400 hover:border-yellow-400/50' : 'text-green-400 hover:border-green-400/50'}`}
             >
                {event.isPublished ? <><EyeOff size={14} /> Ocultar</> : <><Eye size={14} /> Publicar</>}
             </Button>

             <Button
               onClick={() => onViewMetrics(event)}
               variant="secondary"
               className="flex-1 md:flex-none !py-2 text-xs font-body"
             >
               Métricas
             </Button>

             <Button 
                onClick={() => onDelete(event.id)} 
                variant="danger" 
                className="flex-1 md:flex-none !py-2 text-xs font-body"
             >
                <Trash2 size={14} /> Eliminar
             </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
