import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  BadgePercent,
  Building2
} from 'lucide-react';
import { Collaborator, LocationCoordinates, WorkContract } from '../types';
import { PSE_BANKS_COLOMBIA } from '../data/pseBanks';
import { api } from '../services/api';

interface HireModalProps {
  collaborator: Collaborator;
  userLocation: LocationCoordinates;
  onClose: () => void;
  onSuccess: (newContract: WorkContract) => void;
  clientProfile?: { id?: string; name?: string; phone?: string };
}

export const HireModal: React.FC<HireModalProps> = ({
  collaborator,
  userLocation,
  onClose,
  onSuccess,
  clientProfile,
}) => {
  const [serviceType, setServiceType] = useState<'jornal' | 'por_obra' | 'horas'>('jornal');
  const [unitsCount, setUnitsCount] = useState<number>(1);
  const [workDescription, setWorkDescription] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('Hoy, jornada inmediata');
  const [scheduledTime, setScheduledTime] = useState<string>('08:00 AM');
  const [workAddress, setWorkAddress] = useState<string>(userLocation.address || 'Calle 8 # 78-45');
  const [paymentMethod, setPaymentMethod] = useState<'pse' | 'tarjeta' | 'billetera'>('pse');
  const [bankSelected, setBankSelected] = useState<string>('Bancolombia');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');

  // Pricing math
  const baseRate = serviceType === 'jornal' 
    ? collaborator.dailyRate * unitsCount 
    : serviceType === 'horas' 
      ? collaborator.hourlyRate * unitsCount 
      : 180000; // precio estimado por obra

  const arlInsuranceFee = 12000; // Póliza ARL Riesgo III/IV por día
  const platformProtectionFee = Math.round(baseRate * 0.05); // 5% Custodia Escrow y Garantía
  const totalAmount = baseRate + arlInsuranceFee + platformProtectionFee;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDescription.trim()) {
      alert('Por favor describe brevemente la labor a realizar.');
      return;
    }
    setStep('payment');
  };

  const handleExecutePayment = async () => {
    setPaymentError(null);
    setIsProcessing(true);
    let issuedReceipt: any = null;
    try {
      // 0. Sincronizar colaborador en el backend por si fue registrado o actualizado recientemente
      api.syncCollaborator(collaborator).catch(() => {});

      // 1. Iniciar transacción en pasarela de pagos con custodia fiduciaria
      const selectedBankName = bankSelected || 'Bancolombia';
      const normalizedServiceType = serviceType === 'horas' ? 'por_horas' : serviceType;

      const paymentReceipt = await api.initiatePayment({
        method: paymentMethod,
        bankEntity: selectedBankName,
        amount: totalAmount,
        collaboratorId: collaborator.id,
        serviceType: normalizedServiceType,
        unitsCount,
        baseAmount: baseRate,
        collaboratorDailyRate: collaborator.dailyRate,
        collaboratorHourlyRate: collaborator.hourlyRate,
        workDescription,
      });

      if (!paymentReceipt || !paymentReceipt.ok) {
        throw new Error('La pasarela de pagos no pudo procesar la transacción.');
      }
      issuedReceipt = paymentReceipt;

      // 2. Crear y validar contrato en el servidor Express con tarifas verificadas
      const res = await api.createContract({
        collaboratorId: collaborator.id,
        collaboratorName: collaborator.name,
        collaboratorSpecialty: collaborator.specialtyTitle,
        collaboratorAvatar: collaborator.avatar,
        serviceType: normalizedServiceType,
        unitsCount,
        baseAmount: baseRate,
        arlInsuranceFee,
        platformProtectionFee,
        totalAmount,
        workDescription,
        scheduledDate,
        scheduledTime,
        paymentMethod,
        paymentTransactionId: paymentReceipt.transactionId,
        paymentReceiptAmount: paymentReceipt.amount,
        collaboratorDailyRate: collaborator.dailyRate,
        collaboratorHourlyRate: collaborator.hourlyRate,
        clientId: clientProfile?.id || 'client-me',
        clientName: clientProfile?.name || 'Cliente MultiOficios',
        clientPhone: clientProfile?.phone || '+57 300 123 4567',
        location: {
          ...userLocation,
          address: workAddress,
        },
      });

      setIsProcessing(false);
      if (res && res.contract) {
        onSuccess(res.contract);
      } else {
        throw new Error('El servidor no retornó el contrato formalizado.');
      }
    } catch (e) {
      console.error('Error al procesar con el servidor REST:', e);
      // Mecanismo automático de reversa si el pago fue aprobado pero el contrato falló
      if (issuedReceipt && issuedReceipt.transactionId) {
        api.reversePayment(issuedReceipt.transactionId, 'Contrato no formalizado').catch(() => {});
      }
      setIsProcessing(false);
      setPaymentError(
        (e as Error).message ||
          'No se pudo procesar el pago o generar el contrato fiduciario. Por favor verifique sus datos o intente nuevamente.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Contrato de Prestación de Servicios por Obra o Labor
              </h3>
              <p className="text-xs text-stone-400">
                Contratando a: <b className="text-amber-400">{collaborator.name}</b> ({collaborator.specialtyTitle})
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

        {/* Banner Informativo de Modo Prueba / Sandbox */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-5 py-2.5 flex items-center gap-2.5 text-xs text-amber-950">
          <span className="text-sm">⚠️</span>
          <div>
            <span className="font-bold text-amber-900">MODO PRUEBA (Sandbox):</span>
            <span className="text-amber-800 ml-1">
              La pasarela y la custodia fiduciaria operan en entorno simulado para pruebas. No se debitan fondos bancarios reales.
            </span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-2.5 flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center gap-1.5 ${step === 'details' ? 'text-amber-600 font-bold' : 'text-stone-500'}`}>
            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px]">1</span>
            <span>Detalles de la Obra</span>
          </div>
          <div className="w-8 h-px bg-stone-300"></div>
          <div className={`flex items-center gap-1.5 ${step === 'payment' ? 'text-amber-600 font-bold' : 'text-stone-500'}`}>
            <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-[11px]">2</span>
            <span>Pago Seguro en Custodia (Escrow)</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {step === 'details' ? (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              {/* Modalidad de Contratación */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Modalidad de Contratación Legal
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setServiceType('jornal')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      serviceType === 'jornal'
                        ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-600/20'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-900">Por Jornal (8h)</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">Día completo de labor</div>
                    <div className="text-xs font-extrabold text-amber-700 mt-1">
                      ${collaborator.dailyRate.toLocaleString('es-CO')} /día
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('por_obra')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      serviceType === 'por_obra'
                        ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-600/20'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-900">Por Obra o Labor</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">Trabajo específico</div>
                    <div className="text-xs font-extrabold text-amber-700 mt-1">
                      Cotización base
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('horas')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      serviceType === 'horas'
                        ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-600/20'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-900">Por Horas</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">Arreglos puntuales</div>
                    <div className="text-xs font-extrabold text-amber-700 mt-1">
                      ${collaborator.hourlyRate.toLocaleString('es-CO')} /h
                    </div>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              {serviceType !== 'por_obra' && (
                <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-700">
                    {serviceType === 'jornal' ? 'Número de Jornales (días):' : 'Número de Horas:'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setUnitsCount(Math.max(1, unitsCount - 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-stone-300 font-bold text-stone-800 flex items-center justify-center cursor-pointer hover:bg-stone-100"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm text-stone-900 w-6 text-center">
                      {unitsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setUnitsCount(unitsCount + 1)}
                      className="w-8 h-8 rounded-xl bg-white border border-stone-300 font-bold text-stone-800 flex items-center justify-center cursor-pointer hover:bg-stone-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Descripción Detallada de la Labor
                </label>
                <textarea
                  required
                  rows={3}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Ej: Instalación de mueble superior de cocina, ajuste de 2 puertas y colocación de cerradura de seguridad..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              {/* Schedule and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" /> Fecha Programada
                  </label>
                  <input
                    type="text"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" /> Hora de Inicio
                  </label>
                  <input
                    type="text"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" /> Dirección Exacta de la Obra
                  </label>
                  <input
                    type="text"
                    required
                    value={workAddress}
                    onChange={(e) => setWorkAddress(e.target.value)}
                    placeholder="Dirección, Edificio, Apartamento o Manzana"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
                  />
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <b>Cobertura de Seguridad Integral MultiOficios:</b> Incluye cobertura ARL temporal durante la jornada de trabajo, verificación de antecedentes y garantía de satisfacción con retención de pago en custodia.
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-amber-600/20 transition cursor-pointer"
                >
                  Continuar al Pago Seguro en Custodia →
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Payment Error Alert */}
              {paymentError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <b className="font-bold text-rose-900">No se pudo procesar la transacción fiduciaria:</b>
                    <p className="mt-0.5 text-rose-700">{paymentError}</p>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
                <div className="font-bold text-stone-800 pb-2 border-b border-stone-200">
                  Desglose de Pago & Custodia (Escrow)
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Mano de obra ({serviceType === 'jornal' ? `${unitsCount} Jornal(es)` : 'Labor contratada'}):</span>
                  <span className="font-bold text-stone-800">${baseRate.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Póliza de Seguridad y ARL Riesgo Laboral:</span>
                  <span className="font-bold text-stone-800">${arlInsuranceFee.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Tarifa de Custodia y Garantía MultiOficios (5%):</span>
                  <span className="font-bold text-stone-800">${platformProtectionFee.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-stone-950 pt-2 border-t border-stone-200">
                  <span>Total a Depositar en Custodia:</span>
                  <span className="text-amber-600">${totalAmount.toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              {/* Escrow Guarantee Callout */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <b>¿Cómo funciona la Custodia Segura (Escrow)?</b><br />
                  Tu dinero NO se entrega de inmediato al técnico. Permanece protegido y congelado en una cuenta fiduciaria segura. Solo se transferirá a {collaborator.name} cuando verifiques que la obra o labor fue completada satisfactoriamente y firmes digitalmente el acta de entrega.
                </div>
              </div>

              {/* Payment Gateway Options */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Selecciona Medio de Pago Seguro
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pse')}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                      paymentMethod === 'pse'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-black text-xs text-stone-900">PSE</div>
                    <div className="text-[10px] text-stone-500">Cuentas débito / Nequi</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tarjeta')}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                      paymentMethod === 'tarjeta'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-black text-xs text-stone-900">Tarjeta</div>
                    <div className="text-[10px] text-stone-500">Visa / Mastercard / AMEX</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('billetera')}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                      paymentMethod === 'billetera'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-black text-xs text-stone-900">Wompi / ePayco</div>
                    <div className="text-[10px] text-stone-500">Billeteras digitales</div>
                  </button>
                </div>
              </div>

              {paymentMethod === 'pse' && (
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      Selecciona tu Banco o Entidad Financiera:
                    </label>
                    <span className="text-[10px] font-semibold text-stone-500">
                      {PSE_BANKS_COLOMBIA.length} entidades disponibles
                    </span>
                  </div>
                  <select
                    value={bankSelected}
                    onChange={(e) => setBankSelected(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                  >
                    <optgroup label="Más Utilizados">
                      {PSE_BANKS_COLOMBIA.filter(b => b.popular).map(b => (
                        <option key={b.code} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Todos los Bancos y Entidades Financieras">
                      {PSE_BANKS_COLOMBIA.filter(b => !b.popular).map(b => (
                        <option key={b.code} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-stone-500">
                    Red ACH Colombia / PSE oficial con débito seguro a tu cuenta de ahorros, corriente o depósito de bajo monto (Nequi, Daviplata, Dale, RappiPay).
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  ← Modificar Detalles
                </button>

                <button
                  type="button"
                  onClick={handleExecutePayment}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isProcessing ? 'Procesando Custodia Segura...' : `Depositar $${totalAmount.toLocaleString('es-CO')} en Custodia`}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
