import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  HardHat, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  ChevronRight, 
  ChevronDown,
  Navigation, 
  Truck, 
  FileText, 
  Sparkles, 
  Radio, 
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Check,
  CheckCheck,
  Briefcase,
  Tag,
  Edit3,
  X
} from 'lucide-react';
import { Collaborator, WorkContract, ActiveUserProfile, ServiceStatus } from '../types';
import { 
  subscribeToCollaboratorChats, 
  ChatSummary, 
  updateChatClientAlias, 
  getClientAlias,
  getChatClientAlias,
  markChatAsRead,
  isChatUnreadForTechnician 
} from '../services/firebase';

interface TechnicianWorkspaceProps {
  activeProfile: ActiveUserProfile;
  collaborators: Collaborator[];
  contracts: WorkContract[];
  onOpenChat: (collaborator: Collaborator, contractId?: string, directChatId?: string) => void;
  onOpenTracking: (contractId: string) => void;
  onSwitchToClientMode: () => void;
  onUpdateAvailability?: (colabId: string, availability: Collaborator['availability']) => void;
  onCreateSampleRequest?: (colabId: string) => void;
}

export const TechnicianWorkspace: React.FC<TechnicianWorkspaceProps> = ({
  activeProfile,
  collaborators,
  contracts,
  onOpenChat,
  onOpenTracking,
  onSwitchToClientMode,
  onUpdateAvailability,
  onCreateSampleRequest,
}) => {
  // Find current technician
  const currentTechnician = useMemo(() => {
    if (activeProfile.collaboratorId) {
      const found = collaborators.find((c) => c.id === activeProfile.collaboratorId);
      if (found) return found;
    }
    // Fallback if matched by name or first in list
    const foundByName = collaborators.find((c) => c.name.toLowerCase() === activeProfile.name.toLowerCase());
    return foundByName || collaborators[0];
  }, [collaborators, activeProfile]);

  // Real-time chat summaries for this collaborator
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [showClosedHistory, setShowClosedHistory] = useState(false);
  const [incomingMessageAlert, setIncomingMessageAlert] = useState<{ sender: string; text: string; chatId: string } | null>(null);
  const [activeAvailability, setActiveAvailability] = useState<Collaborator['availability']>(
    currentTechnician?.availability || 'disponible_hoy'
  );

  // Quick Alias Editor Modal State for Technician
  const [editingAliasModalChat, setEditingAliasModalChat] = useState<{ 
    chatId: string; 
    clientId?: string;
    clientName: string; 
    clientPhone?: string;
    currentAlias: string;
  } | null>(null);
  const [aliasInputValue, setAliasInputValue] = useState<string>('');
  const [aliasVersion, setAliasVersion] = useState<number>(0);

  const prevChatsRef = useRef<Record<string, number>>({});
  const isInitialMount = useRef(true);

  // Listen to alias and chat read updates to trigger immediate re-render across the workspace
  useEffect(() => {
    const handleUpdate = () => {
      setAliasVersion((v) => v + 1);
    };
    window.addEventListener('multioficios_alias_updated', handleUpdate);
    window.addEventListener('multioficios_chat_read', handleUpdate);
    return () => {
      window.removeEventListener('multioficios_alias_updated', handleUpdate);
      window.removeEventListener('multioficios_chat_read', handleUpdate);
    };
  }, []);

  const handleSaveAliasModal = async (val?: string) => {
    if (!editingAliasModalChat) return;
    const finalVal = val !== undefined ? val : aliasInputValue;
    await updateChatClientAlias({
      chatId: editingAliasModalChat.chatId,
      clientId: editingAliasModalChat.clientId,
      clientName: editingAliasModalChat.clientName,
      clientPhone: editingAliasModalChat.clientPhone,
    }, finalVal);
    setAliasVersion((v) => v + 1);
    setEditingAliasModalChat(null);
  };

  // Play audio chime when message arrives
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio policy fallback
    }
  };

  useEffect(() => {
    if (currentTechnician) {
      setActiveAvailability(currentTechnician.availability);
      const unsubscribe = subscribeToCollaboratorChats(currentTechnician.id, (remoteChats) => {
        // Detect newly updated messages from clients
        if (!isInitialMount.current) {
          remoteChats.forEach((c) => {
            const prevUpdated = prevChatsRef.current[c.chatId] || 0;
            if (c.updatedAt > prevUpdated && c.lastSenderRole !== 'colaborador' && isChatUnreadForTechnician(c)) {
              playChime();
              setIncomingMessageAlert({
                sender: c.clientAlias || c.lastSenderName || 'Cliente',
                text: c.lastMessage,
                chatId: c.chatId,
              });
            }
          });
        }

        // Update ref
        const newMap: Record<string, number> = {};
        remoteChats.forEach((c) => {
          newMap[c.chatId] = c.updatedAt;
        });
        prevChatsRef.current = newMap;
        isInitialMount.current = false;

        setChats(remoteChats);
      });
      return () => unsubscribe();
    }
  }, [currentTechnician]);

  // 1. FILTER ACTIVE CONTRACTS ONLY (Exclude 'finalizado' and 'cancelado')
  const activeContracts = useMemo(() => {
    if (!currentTechnician) return [];
    return contracts.filter(
      (c) => 
        c.collaboratorId === currentTechnician.id &&
        c.status !== 'finalizado' &&
        c.status !== 'cancelado'
    );
  }, [contracts, currentTechnician]);

  // 2. CLOSED CONTRACTS (for optional backup history view)
  const closedContracts = useMemo(() => {
    if (!currentTechnician) return [];
    return contracts.filter(
      (c) => 
        c.collaboratorId === currentTechnician.id &&
        (c.status === 'finalizado' || c.status === 'cancelado')
    );
  }, [contracts, currentTechnician]);

  // 3. INBOUND CHATS without an active contract (pure chat inquiries)
  const activeChatInquiries = useMemo(() => {
    const activeContractIds = new Set(activeContracts.map((c) => `contract_${c.id}`));
    return chats.filter((chat) => {
      // Exclude chats tied to closed contracts
      const isClosedContractChat = closedContracts.some((c) => chat.chatId.includes(c.id));
      if (isClosedContractChat) return false;
      return !activeContractIds.has(chat.chatId);
    });
  }, [chats, activeContracts, closedContracts]);

  // Total active funds in escrow for this technician
  const escrowTotal = useMemo(() => {
    return activeContracts.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
  }, [activeContracts]);

  const handleToggleStatus = (status: Collaborator['availability']) => {
    setActiveAvailability(status);
    if (currentTechnician && onUpdateAvailability) {
      onUpdateAvailability(currentTechnician.id, status);
    }
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'solicitado':
        return {
          label: 'Solicitud Recibida',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Clock,
        };
      case 'fondos_en_custodia':
        return {
          label: 'Fondos en Custodia Fiduciaria',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: ShieldCheck,
        };
      case 'en_camino':
        return {
          label: 'En Camino con GPS',
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: Truck,
        };
      case 'en_sitio':
        return {
          label: 'En Sitio / Check-in',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          icon: MapPin,
        };
      case 'en_ejecucion':
        return {
          label: 'Obra en Ejecución',
          color: 'bg-amber-100 text-amber-900 border-amber-400 font-bold',
          icon: HardHat,
        };
      case 'revision_calidad':
        return {
          label: 'Revisión y Entrega',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
        };
      default:
        return {
          label: status,
          color: 'bg-stone-100 text-stone-700 border-stone-200',
          icon: Clock,
        };
    }
  };

  if (!currentTechnician) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-stone-600">Cargando perfil del colaborador...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5 animate-in fade-in duration-200">
      
      {/* POP-UP INCOMING MESSAGE ALERT BANNER */}
      {incomingMessageAlert && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 border border-amber-400">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
              <MessageSquare className="w-5 h-5 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-stone-950">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>Nuevo mensaje de {incomingMessageAlert.sender}</span>
              </div>
              <p className="text-xs font-semibold truncate text-stone-900 mt-0.5 max-w-lg">
                "{incomingMessageAlert.text}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const cId = incomingMessageAlert.chatId;
                markChatAsRead(cId);
                setIncomingMessageAlert(null);
                onOpenChat(currentTechnician, undefined, cId);
              }}
              className="px-3.5 py-1.5 bg-stone-950 hover:bg-stone-800 text-amber-400 font-black text-xs rounded-xl transition cursor-pointer shadow-sm active:scale-95"
            >
              Abrir Chat
            </button>
            <button
              onClick={() => {
                markChatAsRead(incomingMessageAlert.chatId);
                setIncomingMessageAlert(null);
              }}
              className="p-1.5 hover:bg-black/10 rounded-lg text-stone-900 cursor-pointer"
              title="Marcar como leído"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. TECHNICIAN CONTROL CARD & PROFILE STRIP */}
      <div className="bg-stone-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-stone-800 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Avatar & Technician Info */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="relative shrink-0">
              <img
                src={currentTechnician.avatar}
                alt={currentTechnician.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-stone-900 rounded-full border border-stone-700">
                <HardHat className="w-3.5 h-3.5 text-amber-400" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-black text-white truncate">
                  {currentTechnician.name}
                </h1>
                {currentTechnician.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>Verificado</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-stone-300 font-medium truncate mt-0.5">
                {currentTechnician.specialtyTitle}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{currentTechnician.location.neighborhood}</span>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                  <span>{currentTechnician.phone}</span>
                </span>
                {currentTechnician.certifications.technicalDegree && (
                  <span className="hidden sm:inline bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md text-[10px]">
                    {currentTechnician.certifications.technicalDegree}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Mode Switcher to Client Mode */}
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-stone-800">
            <button
              onClick={onSwitchToClientMode}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition cursor-pointer active:scale-98"
              title="Cambiar vista para consultar el catálogo o contratar otros servicios"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Catálogo como Cliente</span>
            </button>
          </div>
        </div>

        {/* Status Strip & Quick KPI Counters */}
        <div className="mt-4 pt-4 border-t border-stone-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Availability Toggle */}
          <div className="col-span-2 sm:col-span-1 bg-stone-800/80 rounded-2xl p-2.5 border border-stone-700/60">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
              Disponibilidad:
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleToggleStatus('disponible_hoy')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                  activeAvailability === 'disponible_hoy'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-900/60 text-stone-400 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Disponible</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus('en_obra')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                  activeAvailability === 'en_obra'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-900/60 text-stone-400 hover:text-white'
                }`}
              >
                <span>En Obra</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus('pausado')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                  activeAvailability === 'pausado'
                    ? 'bg-stone-700 text-white shadow-xs'
                    : 'bg-stone-900/60 text-stone-400 hover:text-white'
                }`}
              >
                <span>Pausado</span>
              </button>
            </div>
          </div>

          {/* KPI 1: Active Clients */}
          <div className="bg-stone-800/80 rounded-2xl p-2.5 border border-stone-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-stone-400 font-bold uppercase">Clientes Activos</div>
              <div className="text-base sm:text-lg font-black text-white">
                {activeContracts.length + activeChatInquiries.length}
              </div>
            </div>
          </div>

          {/* KPI 2: Escrow in Custody */}
          <div className="bg-stone-800/80 rounded-2xl p-2.5 border border-stone-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-stone-400 font-bold uppercase truncate">En Custodia Fiduciaria</div>
              <div className="text-sm sm:text-base font-black text-emerald-400 truncate">
                ${escrowTotal.toLocaleString('es-CO')}
              </div>
            </div>
          </div>

          {/* KPI 3: Reputation */}
          <div className="bg-stone-800/80 rounded-2xl p-2.5 border border-stone-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-stone-400 font-bold uppercase">Calificación</div>
              <div className="text-sm sm:text-base font-black text-white flex items-center gap-1">
                <span>⭐ {currentTechnician.rating}</span>
                <span className="text-[10px] text-stone-400 font-normal">({currentTechnician.reviewCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: ACTIVE CLIENTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-stone-900 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              <span>Clientes y Obras Activas</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                {activeContracts.length + activeChatInquiries.length}
              </span>
            </h2>
            <p className="text-xs text-stone-500">
              Clientes en curso o que te han contactado directamente (servicios cerrados quedan archivados).
            </p>
          </div>

          {onCreateSampleRequest && (
            <button
              onClick={() => onCreateSampleRequest(currentTechnician.id)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer"
              title="Crear una solicitud de prueba para simular la atención de un cliente"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>Simular Cliente</span>
            </button>
          )}
        </div>

        {/* EMPTY STATE: When no clients have contacted yet */}
        {activeContracts.length === 0 && activeChatInquiries.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-stone-200 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <User className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                No tienes clientes activos en este momento
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                Tu perfil de técnico está publicado y activo en el mapa y catálogo de Bogotá. Cuando un cliente te escriba por chat o contrate una obra, aparecerá de inmediato en este panel.
              </p>
            </div>

            {onCreateSampleRequest && (
              <div className="pt-2">
                <button
                  onClick={() => onCreateSampleRequest(currentTechnician.id)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generar Solicitud de Demostración</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 1. INBOUND CHAT INQUIRIES (Clients who wrote to the technician) - SHOWN FIRST */}
            {activeChatInquiries.length > 0 && (
              <div className="space-y-3">
                {/* Header distinguishing unread inquiries vs read inquiries */}
                {(() => {
                  const unreadCount = activeChatInquiries.filter(isChatUnreadForTechnician).length;
                  return (
                    <div className="text-xs font-bold text-amber-950 uppercase tracking-wider px-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 ? (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                            <MessageSquare className="w-4 h-4 text-amber-600" />
                            <span>Mensajes Nuevos de Clientes ({unreadCount}):</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4 text-stone-500" />
                            <span className="text-stone-600">Consultas y Conversaciones con Clientes ({activeChatInquiries.length}):</span>
                          </>
                        )}
                      </div>
                      {unreadCount === 0 && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                          <span>Al día</span>
                        </span>
                      )}
                    </div>
                  );
                })()}

                {activeChatInquiries.map((chat) => {
                  const clientAlias = getClientAlias({
                    chatId: chat.chatId,
                    clientName: chat.lastSenderName,
                  }) || chat.clientAlias;
                  const displayName = clientAlias || chat.lastSenderName || 'Cliente Interesado';
                  const isUnread = isChatUnreadForTechnician(chat);

                  return (
                    <div
                      key={chat.chatId}
                      className={`p-4 rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
                        isUnread
                          ? 'bg-gradient-to-r from-amber-50/90 to-white border-2 border-amber-400/90 hover:border-amber-500 ring-2 ring-amber-400/20'
                          : 'bg-white border-2 border-stone-200 hover:border-stone-300 opacity-95'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center font-black text-base shadow-sm shrink-0 ${
                          isUnread ? 'bg-amber-600' : 'bg-stone-700'
                        }`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-stone-900 text-sm sm:text-base">
                              {displayName}
                            </span>

                            {chat.clientAlias && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 text-amber-700" />
                                <span>Alias</span>
                              </span>
                            )}

                            {/* Quick Button to Edit Alias from list */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAliasModalChat({
                                  chatId: chat.chatId,
                                  clientName: chat.lastSenderName || 'Cliente',
                                  currentAlias: chat.clientAlias || '',
                                });
                                setAliasInputValue(chat.clientAlias || '');
                              }}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 transition cursor-pointer flex items-center gap-1"
                              title="Poner o editar alias a este cliente"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>{chat.clientAlias ? 'Editar Alias' : '+ Alias'}</span>
                            </button>

                            {isUnread ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Mensaje Nuevo</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold border border-stone-200 flex items-center gap-1">
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                <span>Leído</span>
                              </span>
                            )}

                            <span className="text-[10px] text-stone-400">
                              {chat.lastMessageTime}
                            </span>
                          </div>

                          {chat.clientAlias && (
                            <div className="text-[10px] text-stone-500 mt-0.5">
                              Nombre cliente: {chat.lastSenderName || 'Cliente'}
                            </div>
                          )}

                          <p className="text-xs sm:text-sm text-stone-700 font-medium truncate mt-1 max-w-lg">
                            "{chat.lastMessage}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            markChatAsRead(chat.chatId);
                            onOpenChat(currentTechnician, undefined, chat.chatId);
                          }}
                          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95 shrink-0 ${
                            isUnread 
                              ? 'bg-amber-600 hover:bg-amber-700' 
                              : 'bg-stone-800 hover:bg-stone-900'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{isUnread ? 'Responder al Cliente Ahora' : 'Abrir Conversación'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. ACTIVE CONTRACTS LIST */}
            {activeContracts.map((contract) => {
              const statusBadge = getStatusBadge(contract.status);
              const StatusIcon = statusBadge.icon;
              const contractChatId = `contract_${contract.id}`;
              const clientAlias = getClientAlias({
                chatId: contractChatId,
                clientId: contract.clientId,
                clientName: contract.clientName,
                clientPhone: contract.clientPhone,
              });
              const displayName = clientAlias || contract.clientName;

              return (
                <div
                  key={contract.id}
                  className="bg-white rounded-3xl border-2 border-stone-200 hover:border-amber-400 p-4 sm:p-6 shadow-sm hover:shadow-md transition space-y-4"
                >
                  {/* Top Bar: Client identity & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 text-amber-400 flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-stone-900 text-sm sm:text-base">
                            {displayName}
                          </h3>

                          {clientAlias && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5 text-amber-700" />
                              <span>Alias</span>
                            </span>
                          )}

                          {/* Quick Alias Edit Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAliasModalChat({
                                chatId: contractChatId,
                                clientId: contract.clientId,
                                clientName: contract.clientName,
                                clientPhone: contract.clientPhone,
                                currentAlias: clientAlias || '',
                              });
                              setAliasInputValue(clientAlias || '');
                            }}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Asignar o editar alias a este cliente para identificarlo entre tus obras"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>{clientAlias ? 'Editar Alias' : '+ Asignar Alias'}</span>
                          </button>

                          <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-bold">
                            {contract.orderNumber}
                          </span>
                        </div>

                        {clientAlias && (
                          <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                            Nombre registrado: {contract.clientName}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <a
                            href={`tel:${contract.clientPhone}`}
                            className="text-stone-700 hover:text-amber-600 font-medium"
                          >
                            {contract.clientPhone}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${statusBadge.color}`}>
                        <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{statusBadge.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Middle: Work details, Address and Scheduled timing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 text-xs">
                    {/* Description */}
                    <div className="md:col-span-2 space-y-1">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Labor o Servicio Contratado:
                      </div>
                      <p className="font-bold text-stone-800 text-xs sm:text-sm">
                        {contract.workDescription}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          <b>{contract.location.neighborhood}</b> • {contract.location.address}
                        </span>
                      </div>
                    </div>

                    {/* Financials & Scheduled Date */}
                    <div className="space-y-2 border-t md:border-t-0 md:border-l border-stone-200 pt-2 md:pt-0 md:pl-3">
                      <div>
                        <div className="text-[10px] font-bold text-stone-400 uppercase">Fecha y Hora:</div>
                        <div className="font-bold text-stone-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{contract.scheduledDate} a las {contract.scheduledTime}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-stone-400 uppercase">Monto Asegurado:</div>
                        <div className="font-black text-emerald-600 text-sm flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>${contract.totalAmount.toLocaleString('es-CO')} COP</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Action buttons for this client */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Pago en custodia garantizado por MultiOficios Escrow.</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Direct Chat Button */}
                      <button
                        onClick={() => {
                          markChatAsRead(`contract_${contract.id}`);
                          onOpenChat(currentTechnician, contract.id, `contract_${contract.id}`);
                        }}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition cursor-pointer active:scale-98"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chatear con Cliente</span>
                      </button>

                      {/* Advance / Track status */}
                      <button
                        onClick={() => onOpenTracking(contract.id)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-sm transition cursor-pointer active:scale-98"
                      >
                        <Truck className="w-4 h-4 text-amber-400" />
                        <span>Gestionar Avance de Obra</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. CLOSED SERVICES (Strictly hidden from main view, optional collapsed history) */}
        {closedContracts.length > 0 && (
          <div className="pt-4 border-t border-stone-200">
            <button
              onClick={() => setShowClosedHistory(!showClosedHistory)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-100 hover:bg-stone-200/70 text-stone-600 text-xs font-bold transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Historial de Servicios Cerrados ({closedContracts.length})</span>
                <span className="text-[10px] font-normal text-stone-500">
                  (Obras finalizadas o liquidadas con acta de entrega)
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showClosedHistory ? 'rotate-180' : ''}`} />
            </button>

            {showClosedHistory && (
              <div className="mt-3 space-y-2.5 animate-in fade-in duration-150">
                {closedContracts.map((c) => {
                  const contractChatId = `contract_${c.id}`;
                  const clientAlias = getClientAlias({
                    chatId: contractChatId,
                    clientId: c.clientId,
                    clientName: c.clientName,
                    clientPhone: c.clientPhone,
                  });
                  const displayName = clientAlias || c.clientName;

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-white border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-stone-600 opacity-90"
                    >
                      <div>
                        <div className="font-bold text-stone-900 flex items-center gap-2 flex-wrap">
                          <span>{displayName}</span>
                          {clientAlias && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Alias ({c.clientName})
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            {c.status === 'finalizado' ? 'Finalizado y Pagado' : 'Cancelado'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">{c.workDescription}</p>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="font-black text-stone-900">${c.totalAmount.toLocaleString('es-CO')} COP</div>
                          <div className="text-[10px] text-stone-400">{c.scheduledDate}</div>
                        </div>
                        <button
                          onClick={() => onOpenTracking(c.id)}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] transition cursor-pointer"
                        >
                          Ver Acta
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL PARA ASIGNAR / EDITAR ALIAS AL CLIENTE */}
      {editingAliasModalChat && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setEditingAliasModalChat(null)}
        >
          <div 
            className="w-full max-w-md bg-stone-900 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-800 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 font-black text-amber-400 text-sm sm:text-base">
                <Tag className="w-4 h-4" />
                <span>Alias para Identificar al Cliente</span>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingAliasModalChat(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-stone-300 space-y-1">
              <p>
                Cliente original: <strong className="text-white">{editingAliasModalChat.clientName}</strong>
              </p>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Asigna un alias, apodo o nota clave (ej: dirección, labor o urgencia) para identificar a este cliente de un vistazo cuando tengas varias conversaciones simultáneas.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Alias o etiqueta personalizada:
              </label>
              <input
                type="text"
                value={aliasInputValue}
                onChange={(e) => setAliasInputValue(e.target.value)}
                placeholder="Ej: Sra. Clara - Fuga Baño Calle 72"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveAliasModal();
                  }
                }}
              />
            </div>

            {/* Sugerencias Rápidas */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Sugerencias rápidas:</span>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {['Urgente 🚨', 'Cotización 📋', 'Visita Hoy 🛠️', 'Norte 📍', 'Sur 📍', 'Chapinero 📍', 'Casa 🏠', 'Apto 🏢'].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      const base = aliasInputValue || editingAliasModalChat.clientName;
                      setAliasInputValue(`${base} - ${sug}`);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 transition cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              {editingAliasModalChat.currentAlias && (
                <button
                  type="button"
                  onClick={() => handleSaveAliasModal('')}
                  className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-400 hover:text-rose-300 text-xs font-bold transition cursor-pointer mr-auto"
                >
                  Quitar Alias
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditingAliasModalChat(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveAliasModal()}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black transition cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Alias</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
