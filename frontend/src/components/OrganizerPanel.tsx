import React, { useState } from 'react';
import { Event } from '../types';
import { Button } from './Button';

type OrganizerPanelProps = {
  onEventCreate: (eventData: Omit<Event, 'organizerId'>) => void;
  onEventUpdate: (eventData: Event) => void;
  editingEvent: Event | null;
  onCancelEdit: () => void;
};

export const OrganizerPanel: React.FC<OrganizerPanelProps> = ({
  onEventCreate,
  onEventUpdate,
  editingEvent,
  onCancelEdit
}) => {
  const [formState, setFormState] = useState<Omit<Event, 'organizerId'>>({
    id: editingEvent?.id || crypto.randomUUID(),
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    dateTime: editingEvent?.dateTime || '',
    price: editingEvent?.price || 0,
    location: editingEvent?.location || '',
    imageUrl: editingEvent?.imageUrl || '',
    availableTickets: editingEvent?.availableTickets || 0,
    capacity: editingEvent?.capacity || 0,
    isPublished: editingEvent?.isPublished || false
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingEvent) {
      onEventUpdate({ ...editingEvent, ...formState });
    } else {
      onEventCreate(formState);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-3">
      <h3 className="font-title text-xl">
        {editingEvent ? 'Editar evento' : 'Crear evento'}
      </h3>
      <input
        className="w-full rounded bg-black/30 border border-lp-border px-3 py-2"
        placeholder="Título"
        value={formState.title}
        onChange={(e) => setFormState({ ...formState, title: e.target.value })}
      />
      <input
        className="w-full rounded bg-black/30 border border-lp-border px-3 py-2"
        placeholder="Fecha y hora"
        value={formState.dateTime}
        onChange={(e) => setFormState({ ...formState, dateTime: e.target.value })}
      />
      <div className="flex gap-2">
        <input
          className="w-full rounded bg-black/30 border border-lp-border px-3 py-2"
          placeholder="Precio"
          type="number"
          value={formState.price}
          onChange={(e) => setFormState({ ...formState, price: Number(e.target.value) })}
        />
        <input
          className="w-full rounded bg-black/30 border border-lp-border px-3 py-2"
          placeholder="Capacidad"
          type="number"
          value={formState.capacity}
          onChange={(e) => setFormState({ ...formState, capacity: Number(e.target.value) })}
        />
      </div>
      <textarea
        className="w-full rounded bg-black/30 border border-lp-border px-3 py-2"
        placeholder="Descripción"
        value={formState.description}
        onChange={(e) => setFormState({ ...formState, description: e.target.value })}
      />
      <input
        className="w-full rounded bg-black/30 border border-lp-border px-3 py-2"
        placeholder="Ubicación"
        value={formState.location}
        onChange={(e) => setFormState({ ...formState, location: e.target.value })}
      />
      <input
        className="w-full rounded bg-black/30 border border-lp-border px-3 py-2"
        placeholder="URL de imagen"
        value={formState.imageUrl}
        onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
      />
      <div className="flex gap-2">
        <Button type="submit">{editingEvent ? 'Actualizar' : 'Crear'}</Button>
        {editingEvent && (
          <Button type="button" variant="ghost" onClick={onCancelEdit}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};
