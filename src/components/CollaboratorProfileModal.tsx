import React, { useState } from 'react';
import { 
  X, 
  Star, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Phone, 
  MessageSquare, 
  Calendar,
  Layers,
  Image,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Collaborator } from '../types';

interface CollaboratorProfileModalProps {
  collaborator: Collaborator;
  onClose: () => void;
  onHire: (colab: Collaborator) => void;
  onStartChat: (colab: Collaborator) => void;
}

export const CollaboratorProfileModal: React.FC<CollaboratorProfileModalProps> = ({
  collaborator,
  onClose,
  onHire,
  onStartChat,
}) => {
  const [activeTab, setActiveTab] = useState<'sobre_mi' | 'portafolio' | 'opiniones'>('sobre_mi');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with cover and profile info */}
        <div className="relative bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-6 sm:p-8">
          <button
            id="btn-close-profile-modal"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
            <div className="relative">
              <img
                src={collaborator.avatar}
                alt={collaborator.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-3 border-white/80 shadow-xl"
              />
              {collaborator.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-black text-white">{collaborator.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {collaborator.availability === 'disponible_hoy' ? 'Disponible Hoy' : 'Disponible en 24h'}
                </span>
              </div>

              <p className="text-amber-400 font-bold text-sm sm:text-base mt-1">
                {collaborator.specialtyTitle}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-stone-300 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  {collaborator.location.neighborhood}, {collaborator.location.city} ({collaborator.distanceKm} km)
                </span>
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {collaborator.rating} ({collaborator.reviewCount} valoraciones)
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-stone-400" />
                  {collaborator.completedJobsCount} obras completadas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-stone-200 px-6 bg-stone-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sobre_mi')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
              activeTab === 'sobre_mi'
                ? 'border-amber-600 text-amber-600 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Información & Certificados
          </button>
          <button
            onClick={() => setActiveTab('portafolio')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
              activeTab === 'portafolio'
                ? 'border-amber-600 text-amber-600 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Portafolio de Obras ({collaborator.portfolio.length})
          </button>
          <button
            onClick={() => setActiveTab('opiniones')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
              activeTab === 'opiniones'
                ? 'border-amber-600 text-amber-600 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Reseñas de Clientes ({collaborator.reviews.length})
          </button>
        </div>

        {/* Content Tabs */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {activeTab === 'sobre_mi' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Acerca del Colaborador
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {collaborator.bio}
                </p>
              </div>

              {/* Verified Credentials */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                  Verificación de Seguridad y Salud Ocupacional
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">
                        Póliza ARL Obligatoria Vigente
                      </div>
                      <div className="text-xs text-emerald-800 mt-0.5">
                        Clasificación: <b>{collaborator.certifications.arlRiskLevel}</b>
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-1">
                        Verificado por MultiOficios el {collaborator.certifications.verifiedDate}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">
                        Certificado de Antecedentes Judiciales
                      </div>
                      <div className="text-xs text-emerald-800 mt-0.5">
                        Policía Nacional & Procuraduría: <b>Aprobado sin novedades</b>
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-1">
                        Cédula de Ciudadanía verificada con Biometría
                      </div>
                    </div>
                  </div>

                  {collaborator.certifications.technicalDegree && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3 sm:col-span-2">
                      <Award className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-amber-950">
                          Formación Técnica Certificada
                        </div>
                        <div className="text-xs text-amber-900 mt-0.5">
                          {collaborator.certifications.technicalDegree}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rates breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Estructura de Tarifas
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[11px] text-stone-500 font-medium">Jornal Completo (8h)</span>
                    <div className="text-base font-extrabold text-stone-900 mt-0.5">
                      ${collaborator.dailyRate.toLocaleString('es-CO')}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[11px] text-stone-500 font-medium">Valor Hora Adicional</span>
                    <div className="text-base font-extrabold text-stone-900 mt-0.5">
                      ${collaborator.hourlyRate.toLocaleString('es-CO')}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-stone-500 font-medium">Contratación por Obra</span>
                    <div className="text-xs font-bold text-stone-900 mt-1">
                      Cotización según m² o labor
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portafolio' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {collaborator.portfolio.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-44 object-cover" />
                    <div className="p-3.5 bg-white">
                      <div className="text-xs font-bold text-stone-900">{item.title}</div>
                      <p className="text-xs text-stone-600 mt-1">{item.description}</p>
                      <div className="text-[10px] text-stone-400 mt-2 flex items-center justify-between">
                        <span>Obra finalizada: {item.completionDate}</span>
                        <span className="text-emerald-600 font-bold">✓ Verificada</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'opiniones' && (
            <div className="space-y-4">
              {collaborator.reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={rev.clientAvatar} alt={rev.clientName} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-bold text-stone-900">{rev.clientName}</div>
                        <div className="text-[10px] text-stone-500">{rev.serviceTitle}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">{rev.date}</div>
                    </div>
                  </div>
                  <p className="text-xs text-stone-700 mt-2.5 italic">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-stone-500">Tarifa Jornal diario</div>
            <div className="text-xl font-black text-stone-900">
              ${collaborator.dailyRate.toLocaleString('es-CO')} <span className="text-xs font-normal text-stone-500">/ día</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="btn-modal-chat"
              onClick={() => {
                onClose();
                onStartChat(collaborator);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-xs font-bold text-stone-800 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-stone-600" />
              <span>Chat Privado</span>
            </button>

            <button
              id="btn-modal-hire"
              onClick={() => {
                onClose();
                onHire(collaborator);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-extrabold text-white shadow-md shadow-amber-600/20 transition cursor-pointer"
            >
              <span>Contratar Ahora</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
