import React, { useState, useMemo } from 'react';
import { 
  X, 
  User, 
  HardHat, 
  ShieldCheck, 
  Check, 
  Smartphone, 
  PlusCircle, 
  HelpCircle, 
  MapPin, 
  ChevronRight, 
  Lock, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  Search,
  ArrowRight
} from 'lucide-react';
import { Collaborator, ActiveUserProfile } from '../types';

interface ProfileSelectModalProps {
  currentProfile: ActiveUserProfile;
  collaborators: Collaborator[];
  onSelectProfile: (profile: ActiveUserProfile) => void;
  onOpenColaboratorRegistration: () => void;
  onClose: () => void;
}

export const ProfileSelectModal: React.FC<ProfileSelectModalProps> = ({
  currentProfile,
  collaborators,
  onSelectProfile,
  onOpenColaboratorRegistration,
  onClose,
}) => {
  const [selectedRole, setSelectedRole] = useState<'cliente' | 'colaborador'>(
    currentProfile.role === 'colaborador' ? 'colaborador' : 'cliente'
  );
  
  // Technician sub-tab: 'registrado' (existing) or 'nuevo' (new registration)
  const [technicianTab, setTechnicianTab] = useState<'registrado' | 'nuevo'>('registrado');

  // Client Name state
  const [clientName, setClientName] = useState(
    currentProfile.role === 'cliente' ? currentProfile.name : 'Cliente'
  );

  // Selected registered collaborator ID
  const [selectedColabId, setSelectedColabId] = useState<string>(
    currentProfile.collaboratorId || collaborators[0]?.id || ''
  );
  const [searchColab, setSearchColab] = useState('');

  // Validation state for registered collaborator
  const [verificationInput, setVerificationInput] = useState('');
  const [hasAttemptedValidation, setHasAttemptedValidation] = useState(false);

  // Filter collaborator list
  const filteredColabs = useMemo(() => {
    return collaborators.filter((c) => 
      c.name.toLowerCase().includes(searchColab.toLowerCase()) ||
      c.specialtyTitle.toLowerCase().includes(searchColab.toLowerCase()) ||
      c.location.neighborhood.toLowerCase().includes(searchColab.toLowerCase())
    );
  }, [collaborators, searchColab]);

  // Current selected collaborator
  const selectedCollaborator = useMemo(() => {
    return collaborators.find((c) => c.id === selectedColabId) || collaborators[0];
  }, [collaborators, selectedColabId]);

  // Check if verification passes
  const isIdentityVerified = useMemo(() => {
    if (!selectedCollaborator || !verificationInput.trim()) return false;
    
    // Clean strings (digits only)
    const inputDigits = verificationInput.replace(/\D/g, '');
    const colabPhoneDigits = (selectedCollaborator.phone || '').replace(/\D/g, '');
    const colabDocDigits = (selectedCollaborator.documentIdNumber || '').replace(/\D/g, '');

    if (inputDigits.length < 4) return false;

    // Matches if input contains or equals registered phone (or last 7-10 digits)
    if (colabPhoneDigits && (colabPhoneDigits.includes(inputDigits) || inputDigits.includes(colabPhoneDigits.slice(-7)))) {
      return true;
    }

    // Matches document ID if recorded
    if (colabDocDigits && colabDocDigits === inputDigits) {
      return true;
    }

    // Generic test pin / master confirmation for smooth demo/testing
    if (inputDigits === '1234' || inputDigits === '2026') {
      return true;
    }

    return false;
  }, [selectedCollaborator, verificationInput]);

  const handleSave = () => {
    if (selectedRole === 'cliente') {
      onSelectProfile({
        role: 'cliente',
        name: clientName.trim() || 'Cliente',
      });
      onClose();
    } else {
      if (technicianTab === 'nuevo') {
        onClose();
        onOpenColaboratorRegistration();
        return;
      }

      // Check validation for registered technician
      if (!isIdentityVerified) {
        setHasAttemptedValidation(true);
        return;
      }

      if (selectedCollaborator) {
        onSelectProfile({
          role: 'colaborador',
          collaboratorId: selectedCollaborator.id,
          name: selectedCollaborator.name,
          phone: selectedCollaborator.phone,
          avatar: selectedCollaborator.avatar,
          specialtyTitle: selectedCollaborator.specialtyTitle,
        });
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/30 shrink-0">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                ¿Cómo deseas usar la App?
              </h3>
              <p className="text-xs text-stone-400">
                Selecciona tu perfil para este celular o dispositivo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Explanation Banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 p-3 text-xs text-amber-950 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Una sola App para todos: </span>
            Clientes y Técnicos instalan la misma aplicación. Al seleccionar tu perfil, este celular queda identificado con tu identidad para enviar solicitudes o responder chats de obras.
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Main Role Selector: Soy Cliente vs Soy Técnico */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('cliente')}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                selectedRole === 'cliente'
                  ? 'border-amber-600 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                {selectedRole === 'cliente' && (
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div>
                <div className="font-extrabold text-stone-900 text-sm">Soy Cliente</div>
                <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  Buscar servicios, contratar y chatear con técnicos.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('colaborador')}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                selectedRole === 'colaborador'
                  ? 'border-amber-600 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center">
                  <HardHat className="w-5 h-5" />
                </div>
                {selectedRole === 'colaborador' && (
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div>
                <div className="font-extrabold text-stone-900 text-sm">Soy Técnico</div>
                <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  Atender clientes, bandeja de mensajes y registro.
                </div>
              </div>
            </button>
          </div>

          {/* Configuration Area */}
          {selectedRole === 'cliente' ? (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
              <label className="block text-xs font-bold text-stone-800">
                Tu nombre o apodo para que los técnicos te reconozcan en el chat:
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej. José Mateus / Cliente"
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
              />
              <p className="text-[11px] text-stone-500">
                Este nombre aparecerá en la cabecera de tus mensajes cuando le escribas a cualquier técnico.
              </p>
            </div>
          ) : (
            /* TECHNICIAN SECTION: REGISTRADO VS NUEVO REGISTRO */
            <div className="space-y-4">
              {/* Technician Sub-Tabs */}
              <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    if (technicianTab !== 'registrado') {
                      setTechnicianTab('registrado');
                      setHasAttemptedValidation(false);
                    }
                  }}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    technicianTab === 'registrado'
                      ? 'bg-white text-stone-900 shadow-xs cursor-default font-extrabold'
                      : 'text-stone-600 hover:text-stone-900 cursor-pointer font-bold'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Técnico Registrado</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (technicianTab !== 'nuevo') {
                      setTechnicianTab('nuevo');
                    }
                  }}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    technicianTab === 'nuevo'
                      ? 'bg-amber-600 text-white shadow-xs cursor-default font-extrabold'
                      : 'text-stone-600 hover:text-stone-900 cursor-pointer font-bold'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Técnico Nuevo (Registro)</span>
                </button>
              </div>

              {/* TAB 1: TÉCNICO REGISTRADO CON VALIDACIÓN */}
              {technicianTab === 'registrado' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800">
                      1. Selecciona tu perfil de la lista:
                    </span>
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchColab}
                      onChange={(e) => setSearchColab(e.target.value)}
                      placeholder="Buscar por nombre, especialidad o barrio..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Collaborator selectable list */}
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 divide-y divide-stone-100 border border-stone-200 rounded-2xl p-2 bg-stone-50/50">
                    {filteredColabs.map((colab) => {
                      const isSelected = selectedColabId === colab.id;
                      return (
                        <div
                          key={colab.id}
                          onClick={() => {
                            setSelectedColabId(colab.id);
                            setVerificationInput('');
                            setHasAttemptedValidation(false);
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
                              : 'bg-white border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={colab.avatar}
                              alt={colab.name}
                              className="w-9 h-9 rounded-xl object-cover border border-stone-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-stone-900 truncate flex items-center gap-1">
                                <span>{colab.name}</span>
                                {colab.isVerified && (
                                  <ShieldCheck className="w-3 h-3 text-amber-500 shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-amber-700 font-medium truncate">
                                {colab.specialtyTitle}
                              </div>
                              <div className="text-[10px] text-stone-400 flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-stone-400" />
                                <span>{colab.location.neighborhood}</span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSelected ? (
                              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
                                <Check className="w-3 h-3" />
                              </span>
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-stone-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. VALIDATION OF IDENTITY BOX */}
                  {selectedCollaborator && (
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                      <div className="flex items-center gap-2 text-stone-900">
                        <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-extrabold text-xs">
                          2. Validación de Seguridad e Identidad:
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-600 leading-snug">
                        Para activar este celular como <b>{selectedCollaborator.name}</b>, confirma tu número de teléfono celular registrado o tu Cédula (C.C.):
                      </p>

                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={verificationInput}
                          onChange={(e) => {
                            setVerificationInput(e.target.value);
                            setHasAttemptedValidation(false);
                          }}
                          placeholder="Ingresa teléfono registrado (ej. 312 458 9210) o Cédula..."
                          className={`w-full bg-white border rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 focus:outline-none ${
                            isIdentityVerified
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                              : hasAttemptedValidation && !isIdentityVerified
                              ? 'border-rose-400 ring-2 ring-rose-400/20'
                              : 'border-stone-300 focus:border-amber-500'
                          }`}
                        />
                      </div>

                      {/* Validation Status message */}
                      {isIdentityVerified ? (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2 font-bold animate-in fade-in duration-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>¡Identidad validada con éxito! Ya puedes activar tu perfil en este celular.</span>
                        </div>
                      ) : hasAttemptedValidation ? (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <b>Los datos no coinciden:</b> El teléfono ingresado no corresponde con {selectedCollaborator.name}. Verifica el número o regístrate si eres un técnico nuevo.
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-stone-500 flex items-center justify-between">
                          <span>Confirmación requerida para recibir chats de clientes.</span>
                          <span className="font-mono text-stone-400">Reg: {selectedCollaborator.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TÉCNICO NUEVO - VINCULACIÓN / REGISTRO */}
              {technicianTab === 'nuevo' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 text-white space-y-4 border border-stone-800 shadow-md">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="font-black text-sm uppercase tracking-wide">
                      Vinculación de Nuevo Colaborador
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">
                    Si eres un profesional o técnico de oficios y no apareces en la lista, postúlate para ofrecer tus servicios en MultiOficios.
                  </p>

                  <div className="space-y-2 text-xs text-stone-200 bg-stone-800/80 p-3 rounded-xl border border-stone-700">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">1</span>
                      <span>Diligencia el formulario de 4 pasos (Datos, Oficio, Tarifas y ARL).</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">2</span>
                      <span>El Administrador audita tus antecedentes y aprueba tu perfil.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">3</span>
                      <span>Tu celular quedará listo para recibir solicitudes y chatear.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            Cancelar
          </button>

          {selectedRole === 'cliente' ? (
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-98"
            >
              Guardar y Activar Modo Cliente
            </button>
          ) : technicianTab === 'registrado' ? (
            <button
              type="button"
              onClick={handleSave}
              className={`px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-98 flex items-center gap-1.5 ${
                isIdentityVerified
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                  : 'bg-stone-800 hover:bg-stone-900 text-stone-200'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isIdentityVerified ? 'Activar Perfil Verificado' : 'Validar y Activar'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenColaboratorRegistration();
              }}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-98 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Abrir Formulario de Nuevo Registro</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
