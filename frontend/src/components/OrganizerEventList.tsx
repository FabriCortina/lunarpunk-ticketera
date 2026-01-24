import React from 'react';
import { Event } from '../types';
import { Button } from './Button';

type OrganizerEventListProps = {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onTogglePublish: (event: Event) => void;
};

export const OrganizerEventList: React.FC<OrganizerEventListProps> = ({
  events,
  onEdit,
  onDelete,
  onTogglePublish
}) => {
  if (events.length === 0) {
    return <p className="text-sm text-lp-muted">No hay eventos creados.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="glass-panel rounded-xl p-4 flex flex-col gap-3">
          <div>
            <h4 className="font-title text-lg">{event.title}</h4>
            <p className="text-xs text-lp-muted">{event.location}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onEdit(event)} variant="ghost">
              Editar
            </Button>
            <Button onClick={() => onTogglePublish(event)} variant="ghost">
              {event.isPublished ? 'Ocultar' : 'Publicar'}
            </Button>
            <Button onClick={() => onDelete(event.id)} variant="ghost">
              Eliminar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
