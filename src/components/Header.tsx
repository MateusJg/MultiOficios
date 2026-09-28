import React, { useState } from 'react';
import { 
  HardHat, 
  MapPin, 
  Briefcase, 
  ShieldAlert, 
  Bell, 
  Lock, 
  ChevronDown, 
  X, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  User,
  MessageSquare
} from 'lucide-react';
import { LocationCoordinates, NotificationItem, WorkContract, ActiveUserProfile } from '../types';
import { Database, CheckCircle2 as CheckIcon } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  userLocation: LocationCoordinates;
  onChangeLocationClick: () => void;
  onOpenContractsClick: () => void;
  onOpenColaboratorPortalClick: () => void;
  onOpenAdminClick: () => void;
  onOpenDockerDocsClick?: () => void;
  onOpenProfileModal?: () => void;
  onOpenInboxModal?: () => void;
  activeProfile?: ActiveUserProfile;
  isAdminAuthenticated?: boolean;
  activeContractsCount: number;
  notifications: NotificationItem[];
  onMarkNotificationAsRead: (id: string) => void;
  onSelectContractFromNotification: (contractId?: string) => void;
  isFirebaseConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userLocation,
  onChangeLocationClick,
  onOpenContractsClick,
  onOpenColaboratorPortalClick,
  onOpenAdminClick,
  onOpenProfileModal,
  onOpenInboxModal,
  activeProfile = { role: 'cliente', name: 'Cliente' },
  isAdminAuthenticated = false,
  activeContractsCount,
  notifications,
  onMarkNotificationAsRead,
  onSelectContractFromNotification,
  isFirebaseConnected = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-stone-900">
                  Multi<span className="text-amber-600">Oficios</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                  BOGOTÁ D.C.
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 font-medium hidden sm:block">
                Plataforma de Técnicos y Operarios de Oficios Varios con Geolocalización
              </p>
            </div>
          </div>

          {/* Location Chip Selector (Exact match to screenshot) */}
          <div className="hidden lg:flex items-center bg-stone-50 hover:bg-stone-100/80 border border-stone-200 rounded-full px-3.5 py-1.5 transition-colors max-w-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shrink-0 animate-pulse" />
            <MapPin className="w-4 h-4 text-amber-600 mr-1.5 shrink-0" />
            <div className="text-xs truncate mr-2">
              <span className="text-stone-400 font-normal">Obra en Bogotá: </span>
              <span className="font-semibold text-stone-800">{userLocation.neighborhood}</span>
            </div>
            <button
              id="btn-change-location"
              onClick={onChangeLocationClick}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2 ml-auto shrink-0 cursor-pointer"
            >
              Cambiar
            </button>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mobile Location button */}
            <button
              onClick={onChangeLocationClick}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer"
              title="Cambiar Ubicación"
            >
              <MapPin className="w-5 h-5 text-amber-600" />
            </button>

            {/* Cloud Firestore Status Badge */}
            <div 
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
                isFirebaseConnected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-stone-50 text-stone-500 border-stone-200'
              }`}
              title={isFirebaseConnected ? "Conectado a Google Cloud Firestore (Datos persistentes en tiempo real)" : "Conectando a Firestore..."}
            >
              <div className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isFirebaseConnected ? 'Firestore Conectado' : 'Conectando DB'}
              </span>
            </div>

            {/* Profile Mode Switcher (Cliente / Técnico) */}
            {activeProfile.role === 'colaborador' ? (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-active-profile"
                  onClick={onOpenProfileModal}
                  className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 border border-amber-500/50 shadow-xs transition cursor-pointer text-xs"
                  title="Cambiar perfil o rol de la app"
                >
                  <div className="relative shrink-0">
                    <HardHat className="w-3.5 h-3.5 text-amber-400" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[11px] sm:text-xs leading-tight text-white truncate max-w-[90px] sm:max-w-[140px]">
                      {activeProfile.name}
                    </div>
                    <div className="text-[9px] text-amber-400 font-bold leading-tight flex items-center gap-1">
                      <span>Técnico</span>
                      <span className="text-stone-400">• Cambiar</span>
                    </div>
                  </div>
                </button>

                <button
                  id="btn-collaborator-inbox"
                  onClick={onOpenInboxModal}
                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                  title="Bandeja de Mensajes de Clientes en Tiempo Real"
                >
                  <MessageSquare className="w-4 h-4 text-stone-950" />
                  <span className="hidden md:inline text-xs font-black">Chats</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-active-profile"
                onClick={onOpenProfileModal}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold border border-stone-200 transition cursor-pointer"
                title="Cambiar a Modo Técnico o Identificarse"
              >
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Modo Cliente</span>
                <span className="sm:hidden">Cliente</span>
              </button>
            )}

            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Admin Web button (Password Protected) */}
            <button
              id="btn-admin-panel"
              onClick={onOpenAdminClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition cursor-pointer border border-stone-200/60"
              title="Panel Administrativo Web (Acceso protegido por contraseña)"
            >
              {isAdminAuthenticated ? (
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-stone-500" />
              )}
              <span className="hidden sm:inline">Admin Web</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                id="btn-notifications-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 pb-2 border-b border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900">Notificaciones</span>
                      <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} nuevas
                      </span>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onMarkNotificationAsRead(notif.id);
                          if (notif.contractId) {
                            onSelectContractFromNotification(notif.contractId);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3 hover:bg-stone-50 transition cursor-pointer ${
                          !notif.read ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {notif.type === 'contract' && (
                              <Clock className="w-4 h-4 text-amber-600" />
                            )}
                            {notif.type === 'payment' && (
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                            )}
                            {notif.type === 'chat' && (
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 text-xs">
                            <div className="font-semibold text-stone-900 flex justify-between">
                              <span>{notif.title}</span>
                              <span className="text-[10px] text-stone-400 font-normal">{notif.timestamp}</span>
                            </div>
                            <p className="text-stone-600 mt-0.5 line-clamp-2">{notif.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Historial de obras Button (with counter badge) */}
            <button
              id="btn-my-contracts"
              onClick={onOpenContractsClick}
              className="relative inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Historial de obras</span>
              <span className="sm:hidden">Obras</span>
              {activeContractsCount > 0 && (
                <span className="bg-amber-500 text-white font-extrabold text-[11px] px-1.5 py-0.2 rounded-full">
                  {activeContractsCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
