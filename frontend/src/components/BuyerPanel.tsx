import React from 'react';
import { Event } from '../types';
import { Button } from './Button';

type BuyerPanelProps = {
  events: Event[];
  onBuyTicket: (event: Event) => void;
};

export const BuyerPanel: React.FC<BuyerPanelProps> = ({ events, onBuyTicket }) => {
  if (events.length === 0) {
    return <p className="text-sm text-lp-muted">No hay eventos publicados.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {events.map((event) => (
        <div key={event.id} className="glass-panel rounded-xl p-4 flex flex-col gap-3">
          <div>
            <h4 className="font-title text-lg">{event.title}</h4>
            <p className="text-xs text-lp-muted">{event.location}</p>
            <p className="text-xs text-lp-muted">{event.dateTime}</p>
          </div>
          <p className="text-sm text-lp-muted line-clamp-3">{event.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lp-accent font-bold">${event.price}</span>
            <Button onClick={() => onBuyTicket(event)}>Comprar Ticket</Button>
          </div>
        </div>
      ))}
    </div>
  );
};
