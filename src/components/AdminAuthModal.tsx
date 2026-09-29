import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, X, AlertCircle, KeyRound } from 'lucide-react';
import { api } from '../services/api';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Por favor ingresa la contraseña de administrador.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.adminLogin(password.trim());
      if (res.ok && res.token) {
        sessionStorage.setItem('multioficios_admin_token', res.token);
        setIsSubmitting(false);
        setPassword('');
        setError(null);
        onSuccess();
      } else {
        setIsSubmitting(false);
        setError(res.error || 'Contraseña incorrecta. Verifica la clave maestra de administración.');
      }
    } catch {
      setIsSubmitting(false);
      setError('Error al conectar con el servidor de autenticación.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="bg-stone-900 text-white p-6 pb-5 relative border-b border-stone-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/30 mb-3">
            <Lock className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-white">
              Acceso a Consola Admin Web
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              PROTEGIDO
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Ingreso restringido para la administración del portal, aprobación de técnicos y arquitectura Docker del sistema.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
              <span>Contraseña de Administrador</span>
              <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-amber-600" />
                Clave de seguridad
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa AdminMultiOficio$2026"
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white text-stone-900 transition"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick autofill helper */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] bg-amber-50/80 border border-amber-200/80 rounded-xl p-2 px-3 text-amber-900">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                Clave de acceso: <strong className="font-mono font-bold text-stone-900 bg-white px-1.5 py-0.5 rounded border border-amber-300">AdminMultiOficio$2026</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPassword('AdminMultiOficio$2026');
                  setError(null);
                }}
                className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer text-[10px] ml-2"
              >
                Autocompletar
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-black shadow-md shadow-stone-900/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'Verificando...' : 'Ingresar al Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
