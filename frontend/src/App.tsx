import React, { useState, useEffect } from 'react';
import { UserRole, Event, Ticket, TicketStatus, User, AdminDashboardData, OrganizerSummary, EventMetrics, TicketValidationResult } from './types';
import { OrganizerPanel } from './components/OrganizerPanel';
import { OrganizerEventList } from './components/OrganizerEventList';
import { BuyerPanel } from './components/BuyerPanel';
import { ExplorerTicketList } from './components/ExplorerTicketList';
import { TicketWallet } from './components/TicketWallet'; 
import { ProfileModal } from './components/ProfileModal';
import { AuthScreen } from './components/AuthScreen';
import { TermsModal } from './components/TermsModal';
import { Button } from './components/Button';
import { BrandLogo } from './components/BrandLogo';
import { Moon } from './components/Moon';
import { MoonCursor } from './components/MoonCursor';
import { AdminDashboard } from './components/AdminDashboard';
import { BlogReader } from './components/BlogReader';
import { BlogManager } from './components/BlogManager';
import { OrganizerEventMetricsModal } from './components/OrganizerEventMetricsModal';
import { authService } from './services/authService';
import { eventsService } from './services/eventsService';
import { ticketsService } from './services/ticketsService';
import { adminService } from './services/adminService';
import { Ticket as TicketIcon, Sparkles, LogOut, ShieldCheck, Map, Database, AlertTriangle, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failure' | 'pending' | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardData | null>(null);
  const [pendingOrganizers, setPendingOrganizers] = useState<OrganizerSummary[]>([]);
  const [allOrganizers, setAllOrganizers] = useState<OrganizerSummary[]>([]);
  const [metricsEvent, setMetricsEvent] = useState<Event | null>(null);
  const [metricsData, setMetricsData] = useState<EventMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<TicketValidationResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  
  const [explorerView, setExplorerView] = useState<'events' | 'tickets'>('events');
  const [activeSection, setActiveSection] = useState<'primary' | 'blog'>('primary');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // --- SECURITY / AUTHORIZATION LAYER ---

  const getAuthorizedEvents = (currentUser: User | null): Event[] => {
    if (!currentUser) return [];
    
    if (currentUser.role === UserRole.ORGANIZER) {
      return events.filter(e => e.organizerId === currentUser.id);
    }
    
    if (currentUser.role === UserRole.EXPLORER) {
      return events.filter(e => e.isPublished);
    }

    return [];
  };

  const getAuthorizedTickets = (currentUser: User | null): Ticket[] => {
    if (!currentUser) return [];

    if (currentUser.role === UserRole.EXPLORER) {
      return tickets.filter(t => t.explorerId === currentUser.id);
    }

    if (currentUser.role === UserRole.ORGANIZER) {
       const myEventIds = events
         .filter(e => e.organizerId === currentUser.id)
         .map(e => e.id);
       return tickets.filter(t => myEventIds.includes(t.eventId));
    }

    return [];
  };

  const verifyEventOwnership = (currentUser: User, eventId: string): boolean => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return false;
    return targetEvent.organizerId === currentUser.id;
  };

  // --- END SECURITY LAYER ---

  useEffect(() => {
    const loadSession = async () => {
      const currentUser = await authService.refreshSession();
      setUser(currentUser);
      setIsAuthLoading(false);
    };

    loadSession();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success' || status === 'failure' || status === 'pending') {
      setPaymentStatus(status);
      setPaymentMessage(
        status === 'success'
          ? 'Procesando tu pago...'
          : status === 'failure'
            ? 'El pago no se pudo completar.'
            : 'Tu pago está pendiente.'
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (paymentStatus !== 'failure' && paymentStatus !== 'pending') {
      return;
    }

    const timer = setTimeout(() => {
      setPaymentStatus(null);
      setPaymentMessage(null);
    }, 6000);

    return () => clearTimeout(timer);
  }, [paymentStatus]);

  useEffect(() => {
    if (paymentStatus !== 'success' || paymentMessage !== 'Pago confirmado.') {
      return;
    }

    const timer = setTimeout(() => {
      setPaymentStatus(null);
      setPaymentMessage(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [paymentStatus, paymentMessage]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setEvents([]);
        setTickets([]);
        return;
      }

      setIsDataLoading(true);
      setDataError(null);

      try {
        if (user.role === UserRole.ORGANIZER) {
          const organizerEvents = await eventsService.getMine();
          setEvents(organizerEvents);
          setTickets([]);
        } else if (user.role === UserRole.ADMIN) {
          const [dashboard, organizers, all] = await Promise.all([
            adminService.getDashboard(),
            adminService.getOrganizers('PENDING_APPROVAL'),
            adminService.getOrganizers()
          ]);
          setAdminDashboard(dashboard);
          setPendingOrganizers(organizers);
          setAllOrganizers(all);
          setEvents([]);
          setTickets([]);
        } else {
          const [publishedEvents, myTickets] = await Promise.all([
            eventsService.getPublished(),
            ticketsService.getMyTickets()
          ]);
          setEvents(publishedEvents);
          setTickets(myTickets);
        }
      } catch (error: any) {
        setDataError(error?.message || 'No se pudieron cargar los datos.');
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!paymentStatus || paymentStatus !== 'success' || !user || user.role !== UserRole.EXPLORER) {
      return;
    }

    let isActive = true;
    const startTime = Date.now();

    const poll = async () => {
      if (!isActive) return;
      try {
        const latestTickets = await ticketsService.getMyTickets();
        if (!isActive) return;

        const hasNewPaid = latestTickets.some(t => t.status === TicketStatus.PAID);
        setTickets(latestTickets);

        if (hasNewPaid) {
          setPaymentMessage('Pago confirmado.');
          isActive = false;
          return;
        }
      } catch (error) {
        // keep silent to avoid noisy UI
      }

      if (Date.now() - startTime >= 20000) {
        isActive = false;
        return;
      }
    };

    const interval = setInterval(poll, 2000);
    poll();

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [paymentStatus, user]);

  const handleAuthSuccess = (authUser: User) => {
    setUser(authUser);
    setNotification(`Bienvenido, ${authUser.name}. Modo: ${authUser.role}`);
    setExplorerView('events');
    setActiveSection('primary');
  };

  const handleUpdateProfile = async (updatedUser: User, newPassword?: string) => {
    try {
      const savedUser = await authService.updateProfile(updatedUser, newPassword);
      setUser(savedUser);
      setNotification('Perfil actualizado correctamente.');
    } catch (error) {
      setNotification('Error al actualizar perfil.');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setEditingEvent(null);
    setExplorerView('events');
    setActiveSection('primary');
    setShowWallet(false);
    setShowProfile(false);
    setAdminDashboard(null);
    setPendingOrganizers([]);
    setAllOrganizers([]);
    setMetricsEvent(null);
    setMetricsData(null);
    setScanResult(null);
    setScanError(null);
  };

  const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
      }
  };

  const handleGoToEvents = () => {
    setActiveSection('primary');
    setExplorerView('events');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveTicket = async (ticketId: string) => {
    try {
      await ticketsService.deleteTicket(ticketId);
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
      setNotification('Ticket eliminado.');
    } catch (error: any) {
      setNotification(error?.message || 'No se pudo eliminar el ticket.');
    }
  };

  const handleOpenMetrics = async (event: Event) => {
    setMetricsEvent(event);
    setMetricsLoading(true);
    setScanResult(null);
    setScanError(null);
    try {
      const metrics = await eventsService.getMetrics(event.id);
      setMetricsData(metrics);
    } catch (error: any) {
      setMetricsData(null);
      setScanError(error?.message || 'No se pudieron cargar las métricas.');
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleCloseMetrics = () => {
    setMetricsEvent(null);
    setMetricsData(null);
    setScanResult(null);
    setScanError(null);
  };

  const handleScanQr = async (qrPayload: string) => {
    setScanLoading(true);
    setScanError(null);
    try {
      const result = await ticketsService.validateTicket(qrPayload);
      setScanResult(result);
    } catch (error: any) {
      setScanResult(null);
      setScanError(error?.message || 'No se pudo validar el QR.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleApproveOrganizer = async (organizerId: string) => {
    try {
      await adminService.approveOrganizer(organizerId);
      setPendingOrganizers((prev) => prev.filter((org) => org.id !== organizerId));
      setAllOrganizers((prev) => prev.map((org) => (org.id === organizerId ? { ...org, status: 'APPROVED' } : org)));
      const dashboard = await adminService.getDashboard();
      setAdminDashboard(dashboard);
      setNotification('Organizador aprobado.');
    } catch (error: any) {
      setNotification(error?.message || 'No se pudo aprobar el organizador.');
    }
  };

  const handleRejectOrganizer = async (organizerId: string) => {
    const reason = window.prompt('Motivo de rechazo:');
    if (!reason) {
      return;
    }
    try {
      await adminService.rejectOrganizer(organizerId, reason);
      setPendingOrganizers((prev) => prev.filter((org) => org.id !== organizerId));
      setAllOrganizers((prev) => prev.map((org) => (org.id === organizerId ? { ...org, status: 'REJECTED', rejection_reason: reason } : org)));
      const dashboard = await adminService.getDashboard();
      setAdminDashboard(dashboard);
      setNotification('Organizador rechazado.');
    } catch (error: any) {
      setNotification(error?.message || 'No se pudo rechazar el organizador.');
    }
  };

  const handleUpdateLimits = async (organizerId: string) => {
    const target = allOrganizers.find((org) => org.id === organizerId);
    if (!target) return;

    const maxEvents = window.prompt('Máximo de eventos (vacío = sin límite):', target.limits?.max_events?.toString() ?? '');
    if (maxEvents === null) return;
    const maxTickets = window.prompt('Máximo de tickets por evento (vacío = sin límite):', target.limits?.max_tickets_per_event?.toString() ?? '');
    if (maxTickets === null) return;
    const maxMonthly = window.prompt('Máximo de volumen mensual (vacío = sin límite):', target.limits?.max_monthly_volume?.toString() ?? '');
    if (maxMonthly === null) return;

    const parseLimit = (value: string) => (value.trim() === '' ? null : Number(value));
    const limits = {
      max_events: parseLimit(maxEvents),
      max_tickets_per_event: parseLimit(maxTickets),
      max_monthly_volume: parseLimit(maxMonthly)
    };

    if (
      (limits.max_events !== null && (!Number.isFinite(limits.max_events) || limits.max_events <= 0)) ||
      (limits.max_tickets_per_event !== null && (!Number.isFinite(limits.max_tickets_per_event) || limits.max_tickets_per_event <= 0)) ||
      (limits.max_monthly_volume !== null && (!Number.isFinite(limits.max_monthly_volume) || limits.max_monthly_volume <= 0))
    ) {
      setNotification('Los límites deben ser números positivos.');
      return;
    }

    try {
      const updated = await adminService.updateLimits(organizerId, limits);
      setAllOrganizers((prev) => prev.map((org) => (org.id === organizerId ? updated : org)));
      setNotification('Límites actualizados.');
    } catch (error: any) {
      setNotification(error?.message || 'No se pudieron actualizar los límites.');
    }
  };

  // --- ORGANIZER ACTIONS (STRICT) ---

  const handleCreateEvent = async (eventData: Omit<Event, 'organizerId'>) => {
    if (!user || user.role !== UserRole.ORGANIZER) {
        setNotification('Error de Seguridad: Permisos insuficientes.');
        return;
    }
    
    try {
      const createdEvent = await eventsService.create(eventData);
      setEvents([createdEvent, ...events]);
      setNotification('Evento creado exitosamente en la red lunar.');
      scrollToSection('organizer-events');
    } catch (error: any) {
      setNotification(error?.message || 'No se pudo crear el evento.');
    }
  };

  const handleUpdateEvent = async (updatedEvent: Event) => {
    if (!user || user.role !== UserRole.ORGANIZER) return;
    
    if (!verifyEventOwnership(user, updatedEvent.id)) {
       setNotification('ALERTA DE SEGURIDAD: Intento de modificación no autorizada bloqueado.');
       return;
    }

    try {
      const savedEvent = await eventsService.update(updatedEvent.id, updatedEvent);
      setEvents(events.map(e => e.id === savedEvent.id ? savedEvent : e));
      setEditingEvent(null);
      setNotification('Evento actualizado correctamente.');
      scrollToSection('organizer-events');
    } catch (error: any) {
      setNotification(error?.message || 'No se pudo actualizar el evento.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user || user.role !== UserRole.ORGANIZER) return;

    if (!verifyEventOwnership(user, eventId)) {
        setNotification('ALERTA DE SEGURIDAD: Intento de eliminación no autorizada bloqueado.');
        return;
    }

    if(window.confirm("¿Seguro que quieres eliminar este evento de la red?")) {
        try {
          await eventsService.remove(eventId);
          setEvents(events.filter(e => e.id !== eventId));
          setNotification('Evento eliminado.');
        } catch (error: any) {
          setNotification(error?.message || 'No se pudo eliminar el evento.');
        }
    }
  };

  const handleTogglePublish = async (event: Event) => {
     if (!user || user.role !== UserRole.ORGANIZER) return;
     
     if (!verifyEventOwnership(user, event.id)) {
        setNotification('Error: No tienes permiso sobre este evento.');
        return;
     }

     try {
       const updatedEvent = await eventsService.togglePublish(event.id);
       setEvents(events.map(e => e.id === event.id ? updatedEvent : e));
       setNotification(updatedEvent.isPublished ? 'Evento publicado.' : 'Evento ocultado (Borrador).');
     } catch (error: any) {
       setNotification(error?.message || 'No se pudo actualizar el estado del evento.');
     }
  };

  const handleStartEdit = (event: Event) => {
      if (!user) return;
      if (!verifyEventOwnership(user, event.id)) return;
      
      setEditingEvent(event);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingEvent(null);
  };

  // --- EXPLORER ACTIONS (STRICT) ---

  const handleBuyTicket = async (event: Event, ticketTypeId?: string) => {
    if (!user) return;
    
    if (user.role !== UserRole.EXPLORER) {
        setNotification('Solo los exploradores pueden adquirir tickets.');
        return;
    }

    const targetEvent = events.find(e => e.id === event.id);
    if (!targetEvent || !targetEvent.isPublished) {
        setNotification('Este evento no está disponible.');
        return;
    }

    if (targetEvent.ticketTypes && targetEvent.ticketTypes.length > 0 && !ticketTypeId) {
        setNotification('Selecciona un tipo de ticket.');
        return;
    }

    if (targetEvent.availableTickets > 0) {
      try {
        const newTicket = await ticketsService.reserveTicket(targetEvent.id, ticketTypeId);
        const selectedType = targetEvent.ticketTypes?.find((type) => type.id === ticketTypeId);
        const hydratedTicket = {
          ...newTicket,
          ticketTypeName: newTicket.ticketTypeName ?? selectedType?.name ?? null,
          ticketTypeDescription: newTicket.ticketTypeDescription ?? selectedType?.description ?? null,
          ticketTypePrice: newTicket.ticketTypePrice ?? selectedType?.price ?? null
        };
        setTickets([hydratedTicket, ...tickets]);
        
        setEvents(events.map(e => 
          e.id === targetEvent.id 
            ? {
                ...e,
                availableTickets: Math.max(e.availableTickets - 1, 0),
                ticketTypes: e.ticketTypes?.map((type) =>
                  type.id === ticketTypeId
                    ? { ...type, available: Math.max(type.available - 1, 0) }
                    : type
                )
              }
            : e
        ));

        setNotification(`¡Ticket reservado para ${targetEvent.title}! Revisa "Mis Tickets".`);
        setExplorerView('tickets'); 
      } catch (error: any) {
        setNotification(error?.message || 'No se pudo reservar el ticket.');
      }
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-lp-bg flex items-center justify-center">
        <BrandLogo variant="icon" size="xl" withGlow className="animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <MoonCursor />
        <AuthScreen onAuthSuccess={handleAuthSuccess} onOpenTerms={() => setShowTerms(true)} />
        {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      </>
    );
  }

  const authorizedEvents = getAuthorizedEvents(user);
  const authorizedTickets = getAuthorizedTickets(user);
  const myTicketCount = user.role === UserRole.EXPLORER ? authorizedTickets.length : 0;

  return (
    <div className="min-h-screen bg-lp-bg font-body text-lp-text selection:bg-lp-accent selection:text-lp-navy cursor-none">
      <MoonCursor />

      {/* Header - Surface color with Accent Strip */}
      <header className="sticky top-0 z-40 w-full bg-lp-surface backdrop-blur-md relative shadow-lg">
        {/* Accent Strip (Gradient) */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-lp-grad-primary"></div>
        
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <BrandLogo variant="icon" size="md" withGlow />
             <div className="hidden sm:block">
               {/* H1 Title -> Xystema (34-40px) */}
               <h1 className="lp-title text-4xl font-bold text-white tracking-widest leading-none text-gradient-lp">
                 LUNARPUNK
               </h1>
               {/* Body -> Montserrat */}
               <p className="text-xs uppercase tracking-[0.2em] text-lp-muted font-body mt-1">Ticketera Descentralizada</p>
             </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wider font-body ${
              user.role === UserRole.ADMIN
                ? 'bg-lp-warning/10 border-lp-warning text-lp-warning'
                : user.role === UserRole.ORGANIZER 
                  ? 'bg-lp-primary/10 border-lp-primary text-lp-primary' 
                  : 'bg-lp-accent/10 border-lp-accent text-lp-accent'
            }`}>
              {user.role === UserRole.ADMIN
                ? <ShieldCheck size={14} />
                : user.role === UserRole.ORGANIZER
                  ? <ShieldCheck size={14} />
                  : <Map size={14} />}
              {user.role === UserRole.ADMIN
                ? 'ADMIN'
                : user.role === UserRole.ORGANIZER
                  ? 'ORGANIZER'
                  : 'EXPLORER'}
            </div>

            <div className="h-8 w-px bg-lp-border hidden md:block"></div>

            <div className="hidden md:flex items-center gap-2">
              <div className="glass-panel p-1.5 rounded-full border border-white/10">
                <Moon size={34} />
              </div>
            </div>

            <nav className="flex items-center gap-3">
                
                <Button
                  variant={activeSection === 'blog' ? "primary" : "ghost"}
                  onClick={() => {
                    setActiveSection('blog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hidden md:flex font-body"
                >
                  <Sparkles size={18} /> Blog
                </Button>

                {/* ADMIN MENU */}
                {user.role === UserRole.ADMIN && (
                    <Button
                      variant={activeSection === 'primary' ? "primary" : "ghost"}
                      onClick={() => {
                        setActiveSection('primary');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hidden md:flex font-body"
                    >
                      <ShieldCheck size={18} /> Panel
                    </Button>
                )}

                {/* ORGANIZER MENU */}
                {user.role === UserRole.ORGANIZER && (
                    <Button 
                        variant="ghost" 
                        onClick={() => scrollToSection('organizer-events')}
                        className="hidden md:flex font-body"
                    >
                        <Database size={18} /> Mis eventos
                    </Button>
                )}

                {/* EXPLORER MENU */}
                {user.role === UserRole.EXPLORER && (
                    <>
                        <Button 
                            variant={activeSection === 'primary' && explorerView === 'events' ? "primary" : "ghost"}
                            onClick={() => {
                                setActiveSection('primary');
                                setExplorerView('events');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="hidden md:flex font-body"
                        >
                            <Map size={18} /> Eventos
                        </Button>

                        <Button 
                            variant={activeSection === 'primary' && explorerView === 'tickets' ? "primary" : "ghost"} 
                            onClick={() => {
                                setActiveSection('primary');
                                setExplorerView('tickets');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="relative !px-3 font-body"
                            title="Mis Tickets"
                        >
                            <TicketIcon size={18} />
                            <span className="hidden md:inline ml-2">Mis tickets</span>
                            {myTicketCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-lp-warning text-lp-navy text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-body">
                                {myTicketCount}
                            </span>
                            )}
                        </Button>
                    </>
                )}

                {/* USER PROFILE & LOGOUT */}
                <div className="flex items-center gap-2 pl-2 md:border-l border-lp-border md:ml-2">
                    <button 
                      onClick={() => setShowProfile(true)}
                      className="flex items-center gap-2 mr-2 group hover:bg-white/5 p-1 rounded-lg transition-colors"
                      title="Editar Perfil"
                    >
                         <div className="w-8 h-8 rounded-full bg-lp-blue/20 border border-lp-muted flex items-center justify-center overflow-hidden group-hover:border-lp-accent relative">
                           {user.avatar ? (
                             <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                           ) : (
                             <UserIcon size={14} className="text-lp-muted group-hover:text-white" />
                           )}
                         </div>
                         <div className="flex flex-col items-start hidden md:flex">
                           <span className="text-sm font-bold font-body text-white max-w-[100px] truncate group-hover:text-lp-accent transition-colors">{user.name}</span>
                         </div>
                    </button>
                    
                    <Button variant="ghost" onClick={handleLogout} className="!px-3 text-lp-error hover:bg-lp-error/10 font-body" title="Cerrar Sesión">
                        <LogOut size={18} /> <span className="hidden md:inline ml-1">Salir</span>
                    </Button>
                </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="animate-fadeIn">
          {paymentStatus && paymentMessage && (
            <div className="mb-6">
              <div className={`glass-panel px-5 py-4 rounded-xl border flex items-center gap-3 ${
                paymentStatus === 'success'
                  ? 'border-lp-accent/40 bg-lp-accent/5'
                  : paymentStatus === 'failure'
                    ? 'border-lp-error/40 bg-lp-error/5'
                    : 'border-lp-warning/40 bg-lp-warning/5'
              }`}>
                <div className={`p-2 rounded-full ${
                  paymentStatus === 'success'
                    ? 'bg-lp-accent/20 text-lp-accent'
                    : paymentStatus === 'failure'
                      ? 'bg-lp-error/20 text-lp-error'
                      : 'bg-lp-warning/20 text-lp-warning'
                }`}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-sm font-body text-white font-bold uppercase tracking-wider">Estado del pago</p>
                  <p className="text-xs text-lp-muted font-body">{paymentMessage}</p>
                </div>
              </div>
            </div>
          )}

          {isDataLoading && (
            <div className="mb-6 text-lp-muted text-sm font-body">
              Cargando datos...
            </div>
          )}

          {dataError && (
            <div className="mb-6">
              <div className="glass-panel px-5 py-4 rounded-xl border border-lp-error/40 bg-lp-error/5 text-lp-error text-sm font-body">
                {dataError}
              </div>
            </div>
          )}
          
          {activeSection === 'blog' && (
            <div className="space-y-10">
              <BlogReader userRole={user.role} isAuthenticated />
              {(user.role === UserRole.ADMIN || user.role === UserRole.ORGANIZER) && (
                <BlogManager role={user.role} onNotify={setNotification} />
              )}
            </div>
          )}

          {/* RENDER FOR ORGANIZER */}
          {activeSection === 'primary' && user.role === UserRole.ORGANIZER && (
            <div className="space-y-12">
              <section>
                 <OrganizerPanel 
                   onEventCreate={handleCreateEvent} 
                   onEventUpdate={handleUpdateEvent}
                   editingEvent={editingEvent}
                   onCancelEdit={handleCancelEdit}
                 />
              </section>
              
              <section id="organizer-events">
                {/* H2 equivalent Section Heading (28-32px) */}
                <h3 className="text-3xl font-title font-bold text-white mb-6 pl-4 border-l-4 border-lp-primary flex items-center gap-3">
                  <Database className="text-lp-primary" size={24} />
                  Mis Eventos <span className="text-sm text-lp-muted font-body font-normal ml-2">({authorizedEvents.length})</span>
                </h3>
                
                <OrganizerEventList 
                  events={authorizedEvents} 
                  onEdit={handleStartEdit}
                  onDelete={handleDeleteEvent}
                  onTogglePublish={handleTogglePublish}
                onViewMetrics={handleOpenMetrics}
                />
              </section>
            </div>
          )}

          {/* RENDER FOR EXPLORER */}
          {activeSection === 'primary' && user.role === UserRole.EXPLORER && (
            <div>
               {explorerView === 'events' ? (
                 <BuyerPanel events={authorizedEvents} onBuyTicket={handleBuyTicket} />
               ) : (
                 <ExplorerTicketList 
                    tickets={authorizedTickets} 
                    events={events} // We pass all events to look up details, but tickets are strict filtered
                    userId={user.id}
                    onGoToEvents={handleGoToEvents}
                    onDeleteTicket={handleRemoveTicket}
                 />
               )}
            </div>
          )}

          {activeSection === 'primary' && user.role === UserRole.ADMIN && (
            <AdminDashboard
              data={adminDashboard}
              pendingOrganizers={pendingOrganizers}
              organizers={allOrganizers}
              onApprove={handleApproveOrganizer}
              onReject={handleRejectOrganizer}
              onUpdateLimits={handleUpdateLimits}
            />
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-lp-border py-8 mt-12 bg-lp-bg">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center gap-2 text-xs font-body text-lp-muted">
            <span>© 2077 LUNARPUNK TICKETERA.</span>
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-lp-accent hover:text-white underline underline-offset-2"
            >
              Términos y condiciones
            </button>
          </div>
        </div>
      </footer>

      {/* Modals/Overlays */}
      {showWallet && (
        <TicketWallet 
          tickets={authorizedTickets} // Pass strictly authorized tickets
          events={events} 
          onClose={() => setShowWallet(false)}
          userId={user.id} 
          onDeleteTicket={handleRemoveTicket}
        />
      )}

      {showProfile && user && (
        <ProfileModal 
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={handleUpdateProfile}
        />
      )}

      {metricsEvent && (
        <OrganizerEventMetricsModal
          event={metricsEvent}
          metrics={metricsData}
          isLoading={metricsLoading}
          scanResult={scanResult}
          scanError={scanError}
          isScanning={scanLoading}
          onScan={handleScanQr}
          onClose={handleCloseMetrics}
        />
      )}

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div className={`glass-panel px-6 py-4 rounded-lg border-l-4 flex items-center gap-3 shadow-xl ${notification.includes('Error') || notification.includes('ALERTA') ? 'border-lp-error bg-lp-error/10' : 'border-lp-accent bg-lp-surface'}`}>
            <div className={`p-2 rounded-full ${notification.includes('Error') || notification.includes('ALERTA') ? 'bg-lp-error/20 text-lp-error' : 'bg-lp-accent/20 text-lp-accent'}`}>
               {notification.includes('Error') || notification.includes('ALERTA') ? <AlertTriangle size={16} /> : <Sparkles size={16} />}
            </div>
            <p className="font-body text-sm font-bold text-white">{notification}</p>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes bounceIn {
           0% { transform: scale(0.8); opacity: 0; }
           60% { transform: scale(1.05); opacity: 1; }
           100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
