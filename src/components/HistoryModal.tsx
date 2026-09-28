import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  ChevronRight, 
  DollarSign, 
  Lock,
  Calendar,
  Filter
} from 'lucide-react';
import { WorkContract } from '../types';

interface HistoryModalProps {
  contracts: WorkContract[];
  onClose: () => void;
  onSelectContract: (contractId: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  contracts,
  onClose,
  onSelectContract,
}) => {
  const [filter, setFilter] = useState<'todas' | 'activas' | 'finalizadas'>('todas');

  const filtered = contracts.filter((c) => {
    if (filter === 'activas') return c.status !== 'finalizado' && c.status !== 'cancelado';
    if (filter === 'finalizadas') return c.status === 'finalizado';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fondos_en_custodia':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Fondos en Custodia</span>;
      case 'en_camino':
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Técnico en Camino</span>;
      case 'en_ejecucion':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">En Ejecución</span>;
      case 'revision_calidad':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Revisión de Calidad</span>;
      case 'finalizado':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Labor Finalizada ✓</span>;
      default:
        return <span className="bg-stone-100 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Historial de Obras y Servicios</h3>
              <p className="text-xs text-stone-400">
                Registro de contratos por jornal o labor con trazabilidad de fondos y actas de entrega
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 p-3.5 bg-stone-50 border-b border-stone-200 px-6">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-xs font-bold text-stone-500 mr-2">Filtrar:</span>
          <button
            onClick={() => setFilter('todas')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
              filter === 'todas'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Todas ({contracts.length})
          </button>
          <button
            onClick={() => setFilter('activas')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
              filter === 'activas'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            En Curso ({contracts.filter((c) => c.status !== 'finalizado').length})
          </button>
          <button
            onClick={() => setFilter('finalizadas')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
              filter === 'finalizadas'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Finalizadas ({contracts.filter((c) => c.status === 'finalizado').length})
          </button>
        </div>

        {/* Contracts List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No hay contratos registrados en esta categoría.</p>
            </div>
          ) : (
            filtered.map((contract) => (
              <div
                key={contract.id}
                onClick={() => onSelectContract(contract.id)}
                className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-600">
                      {contract.orderNumber}
                    </span>
                    <span className="text-xs font-bold text-stone-900">
                      {contract.collaboratorName}
                    </span>
                    {getStatusBadge(contract.status)}
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-1">
                    {contract.workDescription}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-stone-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {contract.scheduledDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {contract.location?.address || 'Bogotá D.C.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-sm font-black text-stone-900">
                      ${contract.totalAmount.toLocaleString('es-CO')}
                    </div>
                    <div className="text-[10px] text-stone-400 flex items-center gap-1 justify-end">
                      <Lock className="w-2.5 h-2.5 text-amber-600" />
                      <span>{contract.escrowStatus === 'liberado_al_colaborador' ? 'Pago dispersado' : 'En custodia'}</span>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
