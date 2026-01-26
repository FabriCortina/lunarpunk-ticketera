import React, { useState } from 'react';
import { Event } from '../types';
import { EventCard } from './EventCard';
import { EventDetailModal } from './EventDetailModal';
import { Search, Map } from 'lucide-react';

interface BuyerPanelProps {
  events: Event[];
  onBuyTicket: (event: Event) => void;
}

export const BuyerPanel: React.FC<BuyerPanelProps> = ({ events, onBuyTicket }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="glass-panel p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-lp-primary/10 rounded-full border border-lp-primary/30 hidden md:block">
            <Map className="text-lp-primary" size={24} />
          </div>
          <div>
            {/* H2 Title (28-32px) -> text-3xl */}
            <h2 className="text-3xl font-title font-bold text-white uppercase tracking-wider">
              Eventos Disponibles
            </h2>
            <p className="text-lp-muted text-sm font-body">Explora las experiencias publicadas en la red.</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Buscar por nombre o ubicación..." 
            className="w-full bg-slate-900/80 border border-slate-700 rounded-full py-2 px-4 pl-10 text-white focus:border-lp-primary focus:outline-none font-body placeholder:font-body"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <p className="text-xl font-title">No se encontraron eventos activos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <div key={event.id} onClick={() => setSelectedEvent(event)} className="cursor-pointer">
               <EventCard 
                 event={event} 
                 onBuy={(e) => {
                    onBuyTicket(e); 
                 }}
               />
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)}
          onBuy={onBuyTicket}
        />
      )}
    </div>
  );
};
