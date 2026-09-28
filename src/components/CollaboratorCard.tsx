import React from 'react';
import { 
  Star, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { Collaborator } from '../types';

interface CollaboratorCardProps {
  collaborator: Collaborator;
  isSelected: boolean;
  onSelect: () => void;
  onViewProfile: () => void;
  onHire: () => void;
  onStartChat: () => void;
}

export const CollaboratorCard: React.FC<CollaboratorCardProps> = ({
  collaborator,
  isSelected,
  onSelect,
  onViewProfile,
  onHire,
  onStartChat,
}) => {
  return (
    <div
      id={`card-colab-${collaborator.id}`}
      onClick={onSelect}
      className={`bg-white rounded-2xl p-5 border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer ${
        isSelected 
          ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/5' 
          : 'border-stone-200/90 hover:border-amber-300'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start gap-3.5">
        {/* Avatar with Verified Badge */}
        <div className="relative shrink-0">
          <img
            src={collaborator.avatar}
            alt={collaborator.name}
            className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shadow-xs"
          />
          {collaborator.isVerified && (
            <div 
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow-xs"
              title="Identidad y Antecedentes Verificados"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Name and Availability */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-stone-900 truncate">
              {collaborator.name}
            </h3>

            {/* Availability Pill (Matches screenshot) */}
            {collaborator.availability === 'disponible_hoy' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Disponible Hoy
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                <Clock className="w-3 h-3 text-sky-600" />
                Disponible en 24h
              </span>
            )}
          </div>

          {/* Specialty Subtitle (Warm amber/brown tone) */}
          <div className="text-xs sm:text-sm font-bold text-amber-700 mt-0.5 line-clamp-1">
            {collaborator.specialtyTitle}
          </div>

          {/* Distance and Locality */}
          <div className="flex items-center gap-1 text-xs text-stone-500 mt-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="font-bold text-stone-700">{collaborator.distanceKm} km</span>
            <span>({collaborator.location.neighborhood})</span>
          </div>
        </div>
      </div>

      {/* Ratings and Experience Row */}
      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-3.5 pt-2.5 border-t border-stone-100 text-xs">
        {/* Rating */}
        <div className="flex items-center gap-1 font-bold text-stone-900">
          <div className="flex text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-sm">{collaborator.rating}</span>
          <span className="text-stone-400 font-normal">({collaborator.reviewCount} valoraciones)</span>
        </div>

        <span className="text-stone-300 hidden sm:inline">•</span>

        {/* Experience & completed works */}
        <div className="flex items-center gap-1.5 text-stone-600 font-medium">
          <Briefcase className="w-3.5 h-3.5 text-stone-400" />
          <span>{collaborator.yearsExperience} años exp.</span>
          <span className="text-stone-300">•</span>
          <span>{collaborator.completedJobsCount} obras</span>
        </div>
      </div>

      {/* Trust & Security Badges */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          {collaborator.certifications.arlRiskLevel}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Antecedentes OK
        </span>
      </div>

      {/* Bio text excerpt */}
      <p className="text-xs text-stone-600 mt-3 line-clamp-2 leading-relaxed">
        {collaborator.bio}
      </p>

      {/* Pricing and Action Buttons (Exact layout of screenshot) */}
      <div className="flex items-end justify-between gap-3 mt-4 pt-3 border-t border-stone-100">
        <div>
          <div className="text-[11px] text-stone-500 font-medium">Tarifa por Jornal (8h)</div>
          <div className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
            $ {collaborator.dailyRate.toLocaleString('es-CO')} <span className="text-xs font-normal text-stone-500">/ día</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct chat button */}
          <button
            id={`btn-chat-${collaborator.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onStartChat();
            }}
            className="p-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer"
            title="Chat Privado Cifrado"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Ver Perfil */}
          <button
            id={`btn-profile-${collaborator.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 transition cursor-pointer"
          >
            Ver Perfil
          </button>

          {/* Contratar (Orange CTA) */}
          <button
            id={`btn-hire-${collaborator.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onHire();
            }}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-600/20 active:scale-98 transition cursor-pointer"
          >
            Contratar
          </button>
        </div>
      </div>
    </div>
  );
};
