import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Lock, 
  ShieldCheck, 
  Image as ImageIcon, 
  CheckCheck,
  Bell,
  BellRing,
  Smartphone,
  Phone,
  Radio,
  User,
  HardHat,
  RefreshCw,
  AlertCircle,
  Tag,
  Edit3,
  Check
} from 'lucide-react';
import { Collaborator, ChatMessage, ActiveUserProfile } from '../types';
import { 
  subscribeToChatMessages, 
  sendChatMessageToFirestore,
  getClientAlias,
  getChatClientAlias,
  updateChatClientAlias,
  markChatAsRead
} from '../services/firebase';

interface PrivateChatModalProps {
  collaborator: Collaborator;
  contractId?: string;
  directChatId?: string;
  onClose: () => void;
  activeProfile?: ActiveUserProfile;
}

export const PrivateChatModal: React.FC<PrivateChatModalProps> = ({
  collaborator,
  contractId,
  directChatId,
  onClose,
  activeProfile,
}) => {
  const chatId = directChatId || (contractId ? `contract_${contractId}` : `colab_${collaborator.id}`);
  
  // Detect if current user is this collaborator
  const isThisCollaborator = activeProfile?.role === 'colaborador' && (
    activeProfile.collaboratorId === collaborator.id ||
    activeProfile.name.toLowerCase() === collaborator.name.toLowerCase()
  );
  
  // Local role override for easy testing or explicit response role
  const [chatRole, setChatRole] = useState<'cliente' | 'colaborador'>(() => {
    return isThisCollaborator ? 'colaborador' : 'cliente';
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<string>('default');
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  // Client Alias State
  const clientParticipant = messages.slice().reverse().find((m) => m.senderRole === 'cliente')?.senderName || 'Cliente';

  const [clientAlias, setClientAlias] = useState<string>(() => {
    return getClientAlias({ chatId, clientName: clientParticipant }) || '';
  });
  const [isEditingAlias, setIsEditingAlias] = useState<boolean>(false);
  const [aliasInputValue, setAliasInputValue] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMessagesCountRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);
  const chatRoleRef = useRef(chatRole);
  chatRoleRef.current = chatRole;

  // Listen to alias updates across tabs or windows
  useEffect(() => {
    const handleAliasUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ chatId: string; alias: string; keys?: string[] }>;
      if (custom.detail) {
        if (
          custom.detail.chatId === chatId ||
          (custom.detail.keys && custom.detail.keys.some((k) => k === chatId || k.toLowerCase() === clientParticipant.toLowerCase()))
        ) {
          setClientAlias(custom.detail.alias || '');
        }
      }
    };
    window.addEventListener('multioficios_alias_updated', handleAliasUpdated);
    return () => window.removeEventListener('multioficios_alias_updated', handleAliasUpdated);
  }, [chatId, clientParticipant]);

  const handleSaveAlias = async (overrideVal?: string) => {
    const finalVal = overrideVal !== undefined ? overrideVal : aliasInputValue;
    await updateChatClientAlias({
      chatId,
      clientName: clientParticipant,
      clientId: contractId,
    }, finalVal);
    setClientAlias(finalVal.trim());
    setIsEditingAlias(false);
  };

  // Subscribe to real-time messages via BroadcastChannel, LocalStorage, and Google Cloud Firestore
  useEffect(() => {
    setIsSyncing(true);
    // Mark as read immediately when user opens the chat
    markChatAsRead(chatId);

    const unsubscribe = subscribeToChatMessages(
      chatId,
      (remoteMessages) => {
        setIsSyncing(false);
        if (remoteMessages && remoteMessages.length > 0) {
          // Detect if a new incoming message arrived from another device or tab
          if (hasInitializedRef.current && remoteMessages.length > prevMessagesCountRef.current) {
            const lastMsg = remoteMessages[remoteMessages.length - 1];
            // If the message was sent by the opposite role
            if (lastMsg.senderRole !== chatRoleRef.current) {
              playNotificationChime();
              triggerScreenNotification(
                `Mensaje de ${lastMsg.senderName}`,
                lastMsg.text
              );
            }
          }
          prevMessagesCountRef.current = remoteMessages.length;
          setMessages(remoteMessages);
          hasInitializedRef.current = true;
          // Mark as read while the modal is open and active
          markChatAsRead(chatId);
        } else {
          // Default initial welcome message if no history exists yet
          const defaultWelcome: ChatMessage = {
            id: `welcome-${collaborator.id}`,
            chatId,
            collaboratorId: collaborator.id,
            senderId: collaborator.id,
            senderName: collaborator.name,
            senderRole: 'colaborador',
            text: `¡Hola! Con mucho gusto te colaboro con cualquier labor o requerimiento de ${collaborator.specialtyTitle.toLowerCase()}. ¿En qué te puedo colaborar hoy?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isEncrypted: true,
            createdAt: 1,
          };
          setMessages([defaultWelcome]);
          prevMessagesCountRef.current = 1;
          hasInitializedRef.current = true;
          markChatAsRead(chatId);
        }
      },
      () => {
        setIsSyncing(false);
      }
    );

    return () => {
      markChatAsRead(chatId);
      unsubscribe();
    };
  }, [chatId, collaborator.id]);

  // Check browser Notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  // Chime sound generator using Web Audio API
  const playNotificationChime = () => {
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
      // Audio autoplay policy fallback
    }
  };

  // Dispatch Native Screen / Mobile System Notification
  const triggerScreenNotification = async (title: string, bodyText: string) => {
    setNotificationBanner(`${title}: "${bodyText.slice(0, 45)}..."`);
    setTimeout(() => {
      setNotificationBanner(null);
    }, 5000);

    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, {
            body: bodyText,
            icon: collaborator.avatar || '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'multioficios-chat',
            vibrate: [200, 100, 200],
          } as NotificationOptions);
          return;
        } catch {
          // fallback
        }
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: bodyText,
            icon: collaborator.avatar || '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
          });
        } catch {
          // Handled
        }
      }
    }
  };

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
        if (perm === 'granted') {
          playNotificationChime();
          triggerScreenNotification(
            'MultiOficios: Alertas Activas',
            `Notificaciones activadas para los chats de ${collaborator.name}.`
          );
        }
      } catch {
        // Handled
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentText = inputMessage.trim();
    const isSendingAsTechnician = chatRole === 'colaborador';
    
    const senderName = isSendingAsTechnician 
      ? collaborator.name 
      : (activeProfile?.name || 'Cliente');

    const senderId = isSendingAsTechnician
      ? collaborator.id
      : 'cliente-user';

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      chatId,
      contractId: contractId || undefined,
      collaboratorId: collaborator.id,
      senderId,
      senderName,
      senderRole: chatRole,
      text: currentText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      isEncrypted: true,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    // Broadcast to Firestore across all devices
    await sendChatMessageToFirestore(chatId, newMsg);
  };

  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isSendingAsTechnician = chatRole === 'colaborador';
    const senderName = isSendingAsTechnician 
      ? collaborator.name 
      : (activeProfile?.name || 'Cliente');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      chatId,
      contractId: contractId || undefined,
      collaboratorId: collaborator.id,
      senderId: isSendingAsTechnician ? collaborator.id : 'cliente-user',
      senderName,
      senderRole: chatRole,
      text: `📷 [Fotografía adjunta: ${file.name}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      isEncrypted: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    await sendChatMessageToFirestore(chatId, newMsg);
    e.target.value = '';
  };

  // Direct SMS link (as secondary carrier fallback)
  const smsText = `Hola ${collaborator.name}, te contacto desde MultiOficios para una labor de ${collaborator.specialtyTitle}.`;
  const smsUrl = `sms:${collaborator.phone}?body=${encodeURIComponent(smsText)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col h-[650px] max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Collaborator / Client info */}
        <div className="p-3.5 sm:p-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          {isThisCollaborator ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                {(clientAlias || clientParticipant).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-extrabold text-white truncate max-w-[180px] sm:max-w-[240px]">
                    {clientAlias || clientParticipant}
                  </span>
                  
                  {/* Alias Edit Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setAliasInputValue(clientAlias || '');
                      setIsEditingAlias(!isEditingAlias);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer shadow-xs ${
                      clientAlias
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-stone-800 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                    title="Asignar o editar un alias para identificar a este cliente entre tus chats"
                  >
                    <Tag className="w-3 h-3 text-amber-400" />
                    <span>{clientAlias ? 'Alias Activo ✎' : '+ Asignar Alias'}</span>
                  </button>
                </div>

                {clientAlias && (
                  <div className="text-[10px] text-stone-400 truncate">
                    Nombre real: {clientParticipant}
                  </div>
                )}

                <div className="text-[11px] text-amber-400 font-semibold truncate max-w-[220px]">
                  Respondiendo como {collaborator.name}
                </div>
                <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                  <HardHat className="w-3 h-3 text-amber-400" />
                  <span>{collaborator.specialtyTitle}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={collaborator.avatar}
                  alt={collaborator.name}
                  className="w-11 h-11 rounded-xl object-cover border border-stone-700"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-stone-900 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{collaborator.name}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-[11px] text-amber-400 font-semibold truncate max-w-[170px] sm:max-w-[220px]">
                  {collaborator.specialtyTitle}
                </div>
                <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5 font-mono">
                  <Phone className="w-3 h-3 text-stone-400" />
                  <span>{collaborator.phone}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {/* Direct Phone Call for Client */}
            {!isThisCollaborator && (
              <a
                href={`tel:${collaborator.phone}`}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition cursor-pointer"
                title="Llamar directamente por teléfono"
              >
                <Phone className="w-4 h-4 text-amber-400" />
              </a>
            )}

            {/* Notification Permission */}
            <button
              onClick={handleRequestPermission}
              className={`p-2 rounded-xl transition cursor-pointer ${
                permissionState === 'granted'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-amber-600 text-white animate-pulse'
              }`}
              title="Activar alertas sonoras y en pantalla"
            >
              <BellRing className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ALIAS EDITOR DRAWER / POPDOWN FOR TECHNICIAN */}
        {isThisCollaborator && isEditingAlias && (
          <div className="bg-stone-950 border-b border-amber-500/30 p-3.5 space-y-2.5 text-xs animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-400 flex items-center gap-1.5 text-xs">
                <Tag className="w-3.5 h-3.5" />
                <span>Asignar Alias o Etiqueta al Cliente</span>
              </span>
              <button 
                type="button"
                onClick={() => setIsEditingAlias(false)} 
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <p className="text-[11px] text-stone-300">
              Personaliza el nombre de este chat para identificarlo fácilmente si tienes varias conversaciones abiertas.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aliasInputValue}
                onChange={(e) => setAliasInputValue(e.target.value)}
                placeholder="Ej: Sra. María - Calle 72 / Fuga Baño"
                className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveAlias();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleSaveAlias()}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-sm active:scale-95 shrink-0"
              >
                Guardar Alias
              </button>
              {clientAlias && (
                <button
                  type="button"
                  onClick={() => handleSaveAlias('')}
                  className="px-2.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-rose-400 rounded-xl text-xs transition cursor-pointer shrink-0"
                  title="Eliminar alias personalizado"
                >
                  Quitar
                </button>
              )}
            </div>

            {/* Quick chips suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="text-stone-400 font-medium">Sugerencias rápidas:</span>
              {['Urgente 🚨', 'Cotización 📋', 'Visita Hoy 🛠️', 'Chapinero 📍', 'Kennedy 📍', 'Casa 🏠', 'Apto 🏢'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    const base = aliasInputValue ? aliasInputValue : (clientAlias || clientParticipant);
                    setAliasInputValue(`${base} - ${suggestion}`);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 transition cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Sync Status & Role Switcher Banner */}
        <div className="bg-stone-100 border-b border-stone-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chat en Tiempo Real MultiDispositivo</span>
          </div>

          {/* Quick Role Switcher (Allows testing two-way chat on 1 or multiple phones) */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-stone-200 text-[11px]">
            <span className="text-stone-500 text-[10px] px-1 font-medium">Chatear como:</span>
            <button
              type="button"
              onClick={() => setChatRole('cliente')}
              className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                chatRole === 'cliente'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Cliente
              </span>
            </button>
            <button
              type="button"
              onClick={() => setChatRole('colaborador')}
              className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                chatRole === 'colaborador'
                  ? 'bg-stone-900 text-amber-400 shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span className="flex items-center gap-1">
                <HardHat className="w-3 h-3" />
                Técnico
              </span>
            </button>
          </div>
        </div>

        {/* Pop-up Screen Notification Alert Banner */}
        {notificationBanner && (
          <div className="bg-amber-500 text-stone-950 px-3.5 py-2 flex items-center justify-between gap-2 text-xs font-bold shadow-xs animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 truncate">
              <Bell className="w-4 h-4 text-stone-950 shrink-0 animate-bounce" />
              <span className="truncate">{notificationBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotificationBanner(null)}
              className="p-1 hover:bg-black/10 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/70">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-[11px] text-emerald-950 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Chat Sincronizado en la Nube (Google Cloud): </span>
              Los mensajes se transmiten en vivo entre teléfonos en tiempo real. Escribe aquí y el otro teléfono lo recibirá al instante.
            </div>
          </div>

          {messages.map((msg) => {
            // Is this message sent by the user viewing the screen right now?
            const isMe = msg.senderRole === chatRole;
            const isColab = msg.senderRole === 'colaborador';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender label */}
                <div className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${
                  isMe ? 'text-amber-700' : 'text-stone-600'
                }`}>
                  {isColab ? (
                    <>
                      <HardHat className="w-3 h-3 text-amber-600" />
                      <span>{msg.senderName} (Técnico)</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 text-blue-600" />
                      <span>
                        {clientAlias ? `${clientAlias} (${msg.senderName})` : msg.senderName} (Cliente)
                      </span>
                    </>
                  )}
                </div>

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-amber-600 text-white rounded-br-xs'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? 'text-amber-200' : 'text-stone-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-amber-200" />}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAttachImage}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            title="Adjuntar foto de la labor o zona de trabajo"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              chatRole === 'colaborador'
                ? `Responder como ${collaborator.name} (Técnico)...`
                : 'Escribe tu mensaje al técnico aquí...'
            }
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />

          <button
            type="submit"
            className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition cursor-pointer shadow-xs active:scale-95"
            title="Enviar mensaje en tiempo real"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Optional Carrier SMS Link at the bottom for SMS fallback */}
        <div className="bg-stone-50 border-t border-stone-200 px-3 py-1.5 flex items-center justify-between text-[10px] text-stone-500">
          <span>Opción secundaria de operador móvil:</span>
          <a
            href={smsUrl}
            className="inline-flex items-center gap-1 text-stone-700 hover:text-stone-900 font-bold hover:underline"
            title="Abrir aplicación de SMS de la SIM card"
          >
            <Smartphone className="w-3 h-3 text-amber-600" />
            <span>Abrir app SMS celular</span>
          </a>
        </div>
      </div>
    </div>
  );
};
