import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Camera, 
  Star, 
  MessageSquare,
  Lock,
  DollarSign,
  FileCheck,
  ChevronRight,
  Send
} from 'lucide-react';
import { WorkContract, ServiceStatus } from '../types';

interface TrackingModalProps {
  contracts: WorkContract[];
  selectedContractId?: string;
  onClose: () => void;
  onUpdateStatus: (contractId: string, nextStatus: ServiceStatus, note: string, photoUrl?: string) => void;
  onReleaseEscrow: (contractId: string) => void;
  onSubmitReview: (contractId: string, stars: number, feedback: string) => void;
  onOpenChat: (contract: WorkContract) => void;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({
  contracts,
  selectedContractId,
  onClose,
  onUpdateStatus,
  onReleaseEscrow,
  onSubmitReview,
  onOpenChat,
}) => {
  const [activeContractId, setActiveContractId] = useState<string>(
    selectedContractId || (contracts[0]?.id ?? '')
  );
  const [reviewStars, setReviewStars] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [isAddingPhoto, setIsAddingPhoto] = useState<boolean>(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
  );
  const [photoNote, setPhotoNote] = useState<string>('Avance fotográfico de la labor');

  const contract = contracts.find((c) => c.id === activeContractId) || contracts[0];

  const STATUS_STEPS: { key: ServiceStatus; label: string; desc: string }[] = [
    { key: 'solicitado', label: '1. Solicitud', desc: 'Labor enviada' },
    { key: 'fondos_en_custodia', label: '2. Custodia Escrow', desc: 'Pago congelado y seguro' },
    { key: 'en_camino', label: '3. En Camino', desc: 'Desplazamiento con GPS' },
    { key: 'en_sitio', label: '4. En Sitio', desc: 'Check-in verificado' },
    { key: 'en_ejecucion', label: '5. En Ejecución', desc: 'Obra y bitácora de fotos' },
    { key: 'revision_calidad', label: '6. Calidad & Acta', desc: 'Aprobación del cliente' },
    { key: 'finalizado', label: '7. Finalizado', desc: 'Pago liberado al técnico' },
  ];

  const getStepIndex = (status: ServiceStatus) => {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  const currentStepIndex = contract ? getStepIndex(contract.status) : 0;

  const handleSimulateNextStep = () => {
    if (!contract) return;
    const flow: ServiceStatus[] = [
      'fondos_en_custodia',
      'en_camino',
      'en_sitio',
      'en_ejecucion',
      'revision_calidad',
      'finalizado',
    ];
    const currentIndex = flow.indexOf(contract.status);
    if (currentIndex < flow.length - 1) {
      const next = flow[currentIndex + 1];
      let note = '';
      if (next === 'en_camino') note = 'Colaborador en trayecto hacia el lugar de la obra.';
      else if (next === 'en_sitio') note = 'Llegada y check-in GPS confirmado en la ubicación.';
      else if (next === 'en_ejecucion') note = 'Comenzando labores técnicas y adecuaciones.';
      else if (next === 'revision_calidad') note = 'Trabajo terminado. Listo para inspección del cliente.';
      else if (next === 'finalizado') note = 'Acta de entrega aprobada. Fondos transferidos.';
      onUpdateStatus(contract.id, next, note);
    }
  };

  const handleUploadProgressPhoto = () => {
    if (!contract || !photoNote.trim()) return;
    onUpdateStatus(contract.id, contract.status, photoNote, newPhotoUrl);
    setIsAddingPhoto(false);
    setPhotoNote('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar: Contracts List */}
        <div className="w-full md:w-80 bg-stone-50 border-r border-stone-200 p-4 shrink-0 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">Mis Obras y Contratos</h3>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              {contracts.length}
            </span>
          </div>

          <div className="mt-3 space-y-2 overflow-y-auto flex-1 pr-1">
            {contracts.map((c) => {
              const isSelected = c.id === activeContractId;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveContractId(c.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-stone-100/60 hover:bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-stone-500">{c.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'finalizado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status === 'finalizado' ? 'Finalizada' : 'En Curso'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-stone-900 mt-1 truncate">
                    {c.collaboratorName}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate mt-0.5">
                    {c.workDescription}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-[11px]">
                    <span className="font-bold text-stone-800">${c.totalAmount.toLocaleString('es-CO')}</span>
                    <span className="text-stone-400">{c.scheduledDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Main Panel: Real-Time Tracking Details */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto">
          {/* Top Bar */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-stone-900 text-white font-mono">
                  {contract.orderNumber}
                </span>
                <h2 className="text-base sm:text-lg font-black text-stone-900">
                  Seguimiento de Obra en Tiempo Real
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Dirección de obra: <b>{contract.location.address}</b> ({contract.location.neighborhood})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenChat(contract)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-xs font-bold text-stone-800 cursor-pointer"
                title="Chat con el colaborador"
              >
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Chat Privado</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 flex-1">
            {/* Collaborator Card & Escrow Info */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={contract.collaboratorAvatar}
                  alt={contract.collaboratorName}
                  className="w-14 h-14 rounded-2xl object-cover border border-stone-200"
                />
                <div>
                  <div className="text-sm font-bold text-stone-900">{contract.collaboratorName}</div>
                  <div className="text-xs font-semibold text-amber-700">{contract.collaboratorSpecialty}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{contract.clientPhone} • ARL Vigente</div>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-stone-200 sm:pl-4">
                <div className="text-xs text-stone-500">Fondos en Custodia (Escrow)</div>
                <div className="text-lg font-black text-emerald-700">
                  ${contract.totalAmount.toLocaleString('es-CO')} COP
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                  contract.escrowStatus === 'liberado_al_colaborador'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <Lock className="w-3 h-3" />
                  {contract.escrowStatus === 'liberado_al_colaborador'
                    ? 'Fondos Liberados al Técnico'
                    : 'Fondos Retenidos Seguros'}
                </span>
              </div>
            </div>

            {/* Visual Timeline Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Progreso del Servicio
                </h4>

                {/* Simulator button for fast demonstration */}
                {contract.status !== 'finalizado' && (
                  <button
                    id="btn-simulate-next-status"
                    onClick={handleSimulateNextStep}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl transition cursor-pointer border border-amber-200"
                  >
                    ⚡ Simular Siguiente Estado
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div
                      key={step.key}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : isDone
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-stone-50 text-stone-400 border-stone-200'
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate">{step.label}</div>
                      <div className={`text-[10px] mt-0.5 truncate ${isCurrent ? 'text-amber-100' : ''}`}>
                        {step.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Updates & Photo Log */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Bitácora de Obra & Evidencias Fotográficas
                </h4>
                <button
                  id="btn-add-progress-photo"
                  onClick={() => setIsAddingPhoto(!isAddingPhoto)}
                  className="text-xs font-bold text-stone-700 hover:text-stone-900 flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Subir Foto de Avance</span>
                </button>
              </div>

              {isAddingPhoto && (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 mb-4 space-y-3">
                  <div className="text-xs font-bold text-stone-800">Registrar avance de obra en la bitácora:</div>
                  <input
                    type="text"
                    value={photoNote}
                    onChange={(e) => setPhotoNote(e.target.value)}
                    placeholder="Descripción del avance (ej: Fijación de muebles terminada)"
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddingPhoto(false)}
                      className="px-3 py-1.5 text-xs text-stone-600 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUploadProgressPhoto}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Guardar en Bitácora
                    </button>
                  </div>
                </div>
              )}

              {/* Log items */}
              <div className="space-y-3">
                {contract.progressUpdates.map((update, index) => (
                  <div key={index} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      ✓
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 uppercase tracking-wide text-[10px]">
                          Estado: {update.status.replace('_', ' ')}
                        </span>
                        <span className="text-stone-400 font-medium">{update.timestamp}</span>
                      </div>
                      <p className="text-stone-700 mt-1 leading-relaxed">{update.note}</p>
                      {update.photoUrl && (
                        <div className="mt-2.5">
                          <img
                            src={update.photoUrl}
                            alt="Evidencia fotográfica"
                            className="w-48 h-32 object-cover rounded-xl border border-stone-200 shadow-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Release Escrow / Acta de Entrega Action */}
            {contract.escrowStatus === 'fondos_retenidos' ? (
              <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <FileCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                  <div>
                    <div className="text-sm font-bold text-emerald-950">
                      Acta de Entrega Digital & Liberación de Pago
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      ¿La labor fue completada a satisfacción? Al hacer clic en el botón, apruebas la entrega del trabajo y liberas inmediatamente los ${contract.totalAmount.toLocaleString('es-CO')} COP en custodia al técnico.
                    </p>
                  </div>
                </div>

                <button
                  id="btn-release-escrow"
                  onClick={() => onReleaseEscrow(contract.id)}
                  className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 whitespace-nowrap cursor-pointer"
                >
                  Firmar Acta & Liberar Pago
                </button>
              </div>
            ) : (
              /* Review & Rating Form once finished */
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-stone-900">
                    Valoración y Reseña del Servicio
                  </div>
                  {contract.clientRating && (
                    <span className="text-xs font-bold text-emerald-700">✓ Calificación Registrada</span>
                  )}
                </div>

                {contract.clientRating ? (
                  <div className="text-xs text-stone-700 bg-white p-3 rounded-xl border border-stone-200">
                    <div className="flex text-amber-400 mb-1">
                      {[...Array(contract.clientRating.stars)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="italic">"{contract.clientRating.feedback}"</p>
                    <div className="text-[10px] text-stone-400 mt-1">{contract.clientRating.date}</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-600">Calificación:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewStars(star)}
                            className="cursor-pointer"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= reviewStars ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Escribe tu opinión sobre la puntualidad, calidad y servicio del colaborador..."
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800"
                    />

                    <button
                      id="btn-submit-review"
                      onClick={() => {
                        if (!reviewText.trim()) return;
                        onSubmitReview(contract.id, reviewStars, reviewText);
                        setReviewText('');
                      }}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Publicar Calificación Verificada
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
