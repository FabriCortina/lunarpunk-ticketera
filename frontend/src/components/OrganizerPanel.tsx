import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Event } from '../types';
import { generateEventDescription, suggestEventTitle } from '../services/geminiService';
import { Sparkles, MapPin, Calendar, Save, X, RotateCcw, Upload, Image as ImageIcon } from 'lucide-react';

interface OrganizerPanelProps {
  onEventCreate: (event: Omit<Event, 'organizerId'>) => void;
  onEventUpdate?: (event: Event) => void;
  onCancelEdit?: () => void;
  editingEvent?: Event | null;
}

export const OrganizerPanel: React.FC<OrganizerPanelProps> = ({ 
  onEventCreate, 
  onEventUpdate, 
  onCancelEdit,
  editingEvent 
}) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dateTime: '',
    location: '',
    imageUrl: '',
    ticketTypes: [
      { name: 'General', description: 'Acceso general', price: '', capacity: '' }
    ]
  });

  useEffect(() => {
    if (editingEvent) {
      const fallbackType = {
        name: 'General',
        description: editingEvent.description || 'Acceso general',
        price: editingEvent.price.toString(),
        capacity: editingEvent.capacity.toString()
      };
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description,
        dateTime: editingEvent.dateTime,
        location: editingEvent.location,
        imageUrl: editingEvent.imageUrl,
        ticketTypes: editingEvent.ticketTypes?.length
          ? editingEvent.ticketTypes.map((type) => ({
              name: type.name,
              description: type.description,
              price: type.price.toString(),
              capacity: type.capacity.toString()
            }))
          : [fallbackType]
      });
    } else {
      resetForm();
    }
  }, [editingEvent]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dateTime: '',
      location: '',
      imageUrl: '',
      ticketTypes: [
        { name: 'General', description: 'Acceso general', price: '', capacity: '' }
      ]
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateTicketType = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const next = [...prev.ticketTypes];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, ticketTypes: next };
    });
  };

  const addTicketType = () => {
    setFormData((prev) => ({
      ...prev,
      ticketTypes: [
        ...prev.ticketTypes,
        { name: '', description: '', price: '', capacity: '' }
      ]
    }));
  };

  const removeTicketType = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter((_, idx) => idx !== index)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiAssist = async () => {
    if (!formData.title && !formData.location) return;
    setLoading(true);
    
    let finalTitle = formData.title;
    
    if(!finalTitle) {
         finalTitle = await suggestEventTitle("Evento Futuro");
    }

    const desc = await generateEventDescription(finalTitle, formData.location || 'Metaverso');
    
    setFormData(prev => ({
      ...prev,
      title: prev.title || finalTitle,
      description: desc
    }));
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dateTime) return;
    if (!formData.ticketTypes.length) return;

    const validTypes = formData.ticketTypes.filter(
      (type) => type.name && type.description && type.price && type.capacity
    );
    if (validTypes.length !== formData.ticketTypes.length) return;

    const parsedTypes = validTypes.map((type) => ({
      name: type.name,
      description: type.description,
      price: Number(type.price),
      capacity: Number(type.capacity)
    }));
    const totalCapacity = parsedTypes.reduce((sum, type) => sum + type.capacity, 0);
    const minPrice = Math.min(...parsedTypes.map((type) => type.price));

    const finalImageUrl = formData.imageUrl || `https://picsum.photos/seed/${Date.now()}/800/600`;

    if (editingEvent && onEventUpdate) {
      const updatedEvent: Event = {
        ...editingEvent,
        title: formData.title,
        description: formData.description,
        dateTime: formData.dateTime,
        location: formData.location,
        imageUrl: finalImageUrl,
        price: minPrice,
        capacity: totalCapacity,
        availableTickets: totalCapacity - (editingEvent.capacity - editingEvent.availableTickets),
        ticketTypes: parsedTypes.map((type, index) => ({
          id: editingEvent.ticketTypes?.[index]?.id || `${index}`,
          name: type.name,
          description: type.description,
          price: type.price,
          capacity: type.capacity,
          available: type.capacity
        }))
      };
      onEventUpdate(updatedEvent);
    } else {
      const newEvent: Omit<Event, 'organizerId'> = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        dateTime: formData.dateTime,
        location: formData.location,
        price: minPrice,
        availableTickets: totalCapacity,
        capacity: totalCapacity,
        imageUrl: finalImageUrl,
        isPublished: true,
        ticketTypes: parsedTypes.map((type, index) => ({
          id: `${index}`,
          name: type.name,
          description: type.description,
          price: type.price,
          capacity: type.capacity,
          available: type.capacity
        }))
      };
      onEventCreate(newEvent);
    }
    
    if (!editingEvent) resetForm();
  };

  return (
    <div className="max-w-2xl mx-auto glass-panel p-8 rounded-2xl relative overflow-hidden transition-all duration-300 shadow-2xl">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${editingEvent ? 'via-lp-primary' : 'via-lp-accent'} to-transparent opacity-70`}></div>
      
      <div className="flex items-center justify-between mb-8">
        {/* H2 Title (28-32px) -> text-3xl is 30px */}
        <h2 className="text-3xl font-title font-bold text-white flex items-center gap-3">
          {editingEvent ? (
            <>
              <RotateCcw className="text-lp-primary" /> Editar Evento
            </>
          ) : (
            <>
              <Sparkles className="text-lp-accent" /> Nuevo Evento
            </>
          )}
        </h2>
        
        <div className="flex gap-2">
          {!editingEvent && (
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleAiAssist} 
              isLoading={loading}
              className="text-xs font-body"
            >
              <Sparkles size={16} /> LunarIA
            </Button>
          )}
          {editingEvent && onCancelEdit && (
            <Button type="button" variant="ghost" onClick={onCancelEdit} className="text-xs border border-lp-border font-body">
              <X size={16} /> Cancelar
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-lp-muted text-sm font-body uppercase tracking-wider">Nombre del Evento</label>
            <div className="relative">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full bg-lp-bg/50 border border-lp-border rounded p-3 text-lp-navy placeholder:text-lp-navy/60 focus:border-lp-accent focus:outline-none transition-colors pl-10 font-body"
                placeholder="Ej. Cyber Rave 2099"
                required
              />
              <Sparkles className="absolute left-3 top-3.5 text-slate-500" size={18} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-lp-muted text-sm font-body uppercase tracking-wider">Ubicación</label>
            <div className="relative">
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full bg-lp-bg/50 border border-lp-border rounded p-3 text-lp-navy placeholder:text-lp-navy/60 focus:border-lp-accent focus:outline-none transition-colors pl-10 font-body"
                placeholder="Ej. Sector 7, Neo-Tokyo"
                required
              />
              <MapPin className="absolute left-3 top-3.5 text-slate-500" size={18} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-lp-muted text-sm font-body uppercase tracking-wider">Flyer / Imagen</label>
          <div className="flex gap-4 items-start">
             <div 
               className="w-32 h-20 bg-lp-bg border border-lp-border rounded overflow-hidden flex items-center justify-center cursor-pointer hover:border-lp-accent transition-colors relative group"
               onClick={() => fileInputRef.current?.click()}
             >
                {formData.imageUrl ? (
                  <>
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={16} className="text-white"/>
                    </div>
                  </>
                ) : (
                  <ImageIcon className="text-slate-500" size={24} />
                )}
             </div>
             <div className="flex-1">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                <Button 
                   type="button" 
                   variant="secondary" 
                   onClick={() => fileInputRef.current?.click()}
                   className="text-xs mb-1 font-body"
                >
                   <Upload size={14} /> Subir Imagen
                </Button>
                <p className="text-[10px] text-lp-muted font-body">
                  Formatos recomendados: JPG, PNG. Se redimensionará automáticamente.
                  Si no subes nada, se generará una imagen aleatoria.
                </p>
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-lp-muted text-sm font-body uppercase tracking-wider">Descripción {editingEvent ? '' : '(Puedes enriquecerla con LunarIA)'}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full bg-lp-bg/50 border border-lp-border rounded p-3 text-lp-navy placeholder:text-lp-navy/60 focus:border-lp-accent focus:outline-none transition-colors font-body"
            placeholder="Describe la experiencia..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-lp-muted text-sm font-body uppercase tracking-wider">Fecha</label>
            <div className="relative">
              <input
                type="datetime-local"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleInputChange}
                className="w-full bg-lp-bg/50 border border-lp-border rounded p-3 text-lp-navy placeholder:text-lp-navy/60 focus:border-lp-accent focus:outline-none transition-colors pl-10 text-sm font-body"
                required
              />
              <Calendar className="absolute left-3 top-3.5 text-slate-500" size={18} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-lp-muted text-sm font-body uppercase tracking-wider">Tipos de tickets</label>
            {!editingEvent && (
              <Button type="button" variant="secondary" onClick={addTicketType} className="text-xs font-body">
                + Agregar tipo
              </Button>
            )}
          </div>

          {formData.ticketTypes.map((type, index) => (
            <div key={`${type.name}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 glass-panel p-4 rounded-xl">
              <div className="space-y-2 md:col-span-1">
                <label className="text-[10px] uppercase tracking-wider text-lp-muted font-body">Nombre</label>
                <input
                  type="text"
                  value={type.name}
                  onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                  className="w-full bg-lp-bg/50 border border-lp-border rounded p-2 text-lp-navy placeholder:text-lp-navy/60 focus:border-lp-accent focus:outline-none transition-colors font-body text-sm"
                  placeholder="General"
                  required
                  disabled={!!editingEvent}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-lp-muted font-body">Descripción</label>
                <textarea
                  value={type.description}
                  onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                  rows={2}
                  className="w-full bg-lp-bg/50 border border-lp-border rounded p-2 text-lp-navy placeholder:text-lp-navy/60 focus:border-lp-accent focus:outline-none transition-colors font-body text-sm resize-none"
                  placeholder="Acceso general"
                  required
                  disabled={!!editingEvent}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 md:col-span-1">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-lp-muted font-body">Precio</label>
                  <input
                    type="number"
                    value={type.price}
                    onChange={(e) => updateTicketType(index, 'price', e.target.value)}
                    className="w-full bg-lp-bg/50 border border-lp-border rounded p-2 text-lp-navy placeholder:text-lp-navy/60 focus:border-lp-accent focus:outline-none transition-colors font-body text-sm"
                    placeholder="0.00"
                    min="0"
                    required
                    disabled={!!editingEvent}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-lp-muted font-body">Cantidad</label>
                  <input
                    type="number"
                    value={type.capacity}
                    onChange={(e) => updateTicketType(index, 'capacity', e.target.value)}
                    className="w-full bg-lp-bg/50 border border-lp-border rounded p-2 text-lp-navy placeholder:text-lp-navy/60 focus:border-lp-accent focus:outline-none transition-colors font-body text-sm"
                    placeholder="100"
                    min="1"
                    required
                    disabled={!!editingEvent}
                  />
                </div>
              </div>
              {!editingEvent && formData.ticketTypes.length > 1 && (
                <div className="md:col-span-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeTicketType(index)}
                    className="text-xs text-lp-error hover:text-lp-error/80 font-body"
                  >
                    Quitar tipo
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            className={`w-full py-4 text-lg font-body ${editingEvent ? 'bg-lp-grad-purple text-white shadow-lg' : ''}`}
          >
            {editingEvent ? (
              <><Save size={20} /> Actualizar Evento</>
            ) : (
              'Publicar evento a la comunidad'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
