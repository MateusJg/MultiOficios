import React, { useState, useRef } from 'react';
import { 
  X, 
  UserCheck, 
  Wrench, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Briefcase, 
  Plus,
  Save,
  BellRing,
  MapPin,
  FileText,
  ListChecks,
  Sparkles,
  Phone,
  Mail,
  CreditCard,
  Upload,
  AlertCircle,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Camera,
  HardHat
} from 'lucide-react';
import { Collaborator, LocationCoordinates } from '../types';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  estimatedPrice: number;
  unit: string;
  active: boolean;
}

interface CollaboratorPortalModalProps {
  onClose: () => void;
  onRegisterCollaborator: (newColab: Partial<Collaborator>) => void;
  onOpenAdminPanel?: () => void;
  onOpenProfileLogin?: () => void;
  userLocation: LocationCoordinates;
}

export const CollaboratorPortalModal: React.FC<CollaboratorPortalModalProps> = ({
  onClose,
  onRegisterCollaborator,
  onOpenAdminPanel,
  onOpenProfileLogin,
  userLocation,
}) => {
  // Step navigation: 1 (Datos Personales), 2 (Oficio y Localidad), 3 (Relación de Servicios), 4 (Documentos y ARL)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Profile data
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [specialtyTitle, setSpecialtyTitle] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number | ''>('');
  const [bio, setBio] = useState('');
  const [dailyRate, setDailyRate] = useState<number | ''>('');
  const [hourlyRate, setHourlyRate] = useState<number | ''>('');
  const [availability, setAvailability] = useState<'disponible_hoy' | 'disponible_24h' | 'en_obra'>('disponible_hoy');
  const [arlLevel, setArlLevel] = useState<'Riesgo I' | 'Riesgo II' | 'Riesgo III' | 'Riesgo IV' | 'Riesgo V'>('Riesgo III');

  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return;
    }

    setIsProcessingPhoto(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 500;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setAvatar(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          setAvatar(img.src);
        }
        setIsProcessingPhoto(false);
      };
      img.onerror = () => {
        setAvatar(reader.result as string);
        setIsProcessingPhoto(false);
      };
    };
    reader.onerror = () => setIsProcessingPhoto(false);
  };

  // Relación de Servicios que ofrece (Inicia en blanco para que el nuevo colaborador registre los suyos)
  const [servicesRelation, setServicesRelation] = useState<ServiceItem[]>([]);

  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number | ''>('');

  // Documents uploaded (empiezan sin marcar)
  const [docCedula, setDocCedula] = useState(false);
  const [docAntecedentes, setDocAntecedentes] = useState(false);
  const [docArl, setDocArl] = useState(false);
  const [docDiploma, setDocDiploma] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Submission state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  const toggleServiceActive = (id: string) => {
    setServicesRelation((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const parsedPrice = typeof newServicePrice === 'number' ? newServicePrice : Number(newServicePrice) || 0;
    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: newServiceName.trim(),
      description: 'Servicio propuesto por el colaborador.',
      estimatedPrice: parsedPrice,
      unit: 'por labor',
      active: true,
    };
    setServicesRelation([...servicesRelation, newService]);
    setNewServiceName('');
    setNewServicePrice('');
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        alert('Por favor ingresa el nombre completo del técnico.');
        return;
      }
      if (!documentId.trim()) {
        alert('Por favor ingresa el número de Cédula de Ciudadanía.');
        return;
      }
      if (!phone.trim()) {
        alert('Por favor ingresa el número de teléfono móvil de contacto.');
        return;
      }
      if (!email.trim()) {
        alert('Por favor ingresa el correo electrónico.');
        return;
      }
    } else if (currentStep === 2) {
      if (!category) {
        alert('Por favor selecciona el oficio principal.');
        return;
      }
      if (!neighborhood.trim()) {
        alert('Por favor indica tu localidad o barrio base en Bogotá.');
        return;
      }
      if (!specialtyTitle.trim()) {
        alert('Por favor ingresa el título de tu especialidad o perfil.');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      alert('Debes aceptar la declaración juramentada para enviar tu solicitud.');
      return;
    }

    const generatedId = `VINC-${Math.floor(1000 + Math.random() * 9000)}`;
    setApplicationId(generatedId);

    const activeServices = servicesRelation.filter((s) => s.active);
    const parsedDaily = typeof dailyRate === 'number' && dailyRate > 0 ? dailyRate : 120000;
    const parsedHourly = typeof hourlyRate === 'number' && hourlyRate > 0 ? hourlyRate : 25000;
    const parsedExp = typeof yearsExperience === 'number' && yearsExperience > 0 ? yearsExperience : 1;

    // Register with PENDIENTE DE APROBACION status
    onRegisterCollaborator({
      name: name.trim() || 'Colaborador Postulante',
      avatar: avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=300&auto=format&fit=crop&q=80',
      documentIdNumber: documentId.trim() || 'Pendiente',
      email: email.trim() || 'colaborador@multioficios.co',
      phone: phone.trim() || '+57 300 000 0000',
      category: category || 'otros',
      specialtyTitle: specialtyTitle.trim() || 'Especialista Técnico',
      dailyRate: parsedDaily,
      hourlyRate: parsedHourly,
      yearsExperience: parsedExp,
      bio: bio.trim() || 'Información de perfil enviada en proceso de vinculación.',
      availability,
      approvalStatus: 'pendiente_aprobacion', // Pending administrator approval
      isVerified: false,
      appliedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      location: {
        lat: userLocation.lat + (Math.random() * 0.01 - 0.005),
        lng: userLocation.lng + (Math.random() * 0.01 - 0.005),
        address: 'Cobertura de Servicios Bogotá',
        neighborhood: neighborhood.trim() || 'Bogotá D.C.',
        city: userLocation.city || 'Bogotá D.C.',
      },
      certifications: {
        arlRiskLevel: arlLevel,
        backgroundCheckStatus: 'En revisión',
        technicalDegree: docDiploma ? 'Certificación Técnica Adjunta' : 'En proceso de validación',
        verifiedDate: new Date().toISOString().split('T')[0],
      },
      documentsSubmitted: {
        cedulaUploaded: docCedula,
        policeCertificateUploaded: docAntecedentes,
        arlPlanillaUploaded: docArl,
        technicalDegreeUploaded: docDiploma,
      },
      badges: [
        `ARL ${arlLevel}`,
        'En Auditoría',
        activeServices.length > 0 ? `${activeServices.length} servicios` : 'Tarifa Jornal',
      ],
    });

    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30 shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Vinculación de Nuevo Colaborador</h3>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Postulación de Oficios
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Diligencia el formulario. Tu solicitud será auditada y aprobada por el Administrador antes de publicarse en el mapa
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

        {/* Informative Workflow Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <b>Flujo de Aprobación Obligatorio:</b> 1. Registro de datos → 2. Verificación de ARL y antecedentes → 3. Aprobación del Administrador → 4. Publicación en el mapa y catálogo.
            </span>
          </div>
          <span className="bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full text-[10px] shrink-0">
            Filtro de Calidad
          </span>
        </div>

        {/* If successfully submitted: Confirmation Screen */}
        {isSubmitted ? (
          <div className="p-6 sm:p-10 flex-1 flex flex-col items-center text-center justify-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-lg shadow-amber-100">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            <div className="max-w-lg space-y-2">
              <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Solicitud Radicada #{applicationId}
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-stone-900">
                ¡Tu postulación ha sido enviada para revisión!
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                El <b>Administrador de MultiOficios</b> ha recibido tu expediente con tu cédula <b>{documentId}</b>, soporte de <b>ARL {arlLevel}</b> y relación de <b>{servicesRelation.filter(s => s.active).length} servicios</b>.
              </p>
            </div>

            {/* Checklist of what happens next */}
            <div className="w-full max-w-md bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left space-y-2.5 text-xs text-stone-700">
              <div className="font-extrabold text-stone-900 text-xs flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Etapas de Auditoría en Curso:
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Formulario y relación de tarifas radicadas.</span>
              </div>
              <div className="flex items-center gap-2 text-amber-800 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>En cola de revisión administrativa (Cédula, Policía, ARL).</span>
              </div>
              <div className="flex items-center gap-2 text-stone-400">
                <span className="w-3.5 h-3.5 rounded-full border border-stone-300 flex items-center justify-center text-[9px]">4</span>
                <span>Activación automática y publicación de pin en el mapa de Bogotá.</span>
              </div>
            </div>

            {/* Actions for demo user: Close or test admin approval immediately */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 w-full max-w-md">
              {onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminPanel();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Ir a Consola del Administrador para Aprobar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmitApplication} className="flex-1 flex flex-col overflow-hidden">
            {/* Step navigation tabs */}
            <div className="flex border-b border-stone-200 bg-stone-50 px-4 sm:px-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  currentStep === 1
                    ? 'border-amber-600 text-amber-800 bg-white shadow-xs'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>1. Datos Personales</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  currentStep === 2
                    ? 'border-amber-600 text-amber-800 bg-white shadow-xs'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>2. Oficio y Localidad</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  currentStep === 3
                    ? 'border-amber-600 text-amber-800 bg-white shadow-xs'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <ListChecks className="w-4 h-4 text-amber-600" />
                <span>3. Relación de Servicios</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-extrabold">
                  {servicesRelation.filter(s => s.active).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  currentStep === 4
                    ? 'border-amber-600 text-amber-800 bg-white shadow-xs'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileCheck className="w-4 h-4 text-amber-600" />
                <span>4. Documentos y ARL</span>
              </button>
            </div>

            {/* Step 1: Datos Personales */}
            {currentStep === 1 && (
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {/* Banner for already registered technicians */}
                <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-4 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0">
                      <HardHat className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                        <span>¿Ya estás registrado como Técnico?</span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-0.5">
                        No necesitas volver a llenar este formulario. Identifica tu perfil en este celular en 1 clic.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenProfileLogin) onOpenProfileLogin();
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl transition cursor-pointer shadow-xs whitespace-nowrap active:scale-95 shrink-0"
                  >
                    Identificar mi Perfil Aquí
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-black text-stone-900">Datos de Identificación del Postulante</h4>
                  <p className="text-xs text-stone-500">
                    Información oficial para verificación ante bases de datos judiciales y seguridad social.
                  </p>
                </div>

                {/* Fotografía de Perfil */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-4 p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl">
                  <div className="relative group shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name || 'Colaborador'}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-sm transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-amber-100/70 border-2 border-dashed border-amber-400 flex flex-col items-center justify-center text-amber-700">
                        <UserCheck className="w-7 h-7 text-amber-600 opacity-60" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isProcessingPhoto}
                      className="absolute inset-0 bg-stone-900/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                      title="Subir foto de perfil"
                    >
                      <Camera className="w-5 h-5 text-amber-400" />
                    </button>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md border-2 border-white pointer-events-none">
                      <Camera className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-stone-900 block">Foto de Perfil Profesional</span>
                    <span className="text-[11px] text-stone-500 block mb-2">
                      {avatar ? 'Foto seleccionada. Puedes cambiarla si lo requieres.' : 'Sube una fotografía clara de tu rostro para que los clientes te identifiquen con confianza.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isProcessingPhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isProcessingPhoto ? 'Cargando foto...' : avatar ? 'Cambiar Foto' : 'Subir Foto desde Dispositivo'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Completo del Técnico:</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Carlos Alberto Méndez"
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                      Cédula de Ciudadanía (C.C.):
                    </label>
                    <input
                      type="text"
                      required
                      value={documentId}
                      onChange={(e) => setDocumentId(e.target.value)}
                      placeholder="Ej. 1.024.582.914"
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono font-bold focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      Teléfono Celular de Contacto (Llamadas / SMS):
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. +57 312 456 7890"
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      Correo Electrónico:
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ej. correo@ejemplo.com"
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-3 text-xs text-stone-600">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <b>Protección de Datos Personales (Ley 1581 de 2012):</b> Tus datos serán procesados exclusivamente con fines de validación técnica y contratación por obra o labor dentro de la plataforma.
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Oficio y Localidad */}
            {currentStep === 2 && (
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <h4 className="text-sm font-black text-stone-900">Especialidad y Cobertura Geográfica</h4>
                  <p className="text-xs text-stone-500">
                    Define tu oficio principal y la localidad de Bogotá donde prestarás tus servicios.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Oficio Principal:</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-bold focus:bg-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="" disabled>-- Selecciona un oficio principal --</option>
                      <option value="lavadoras">Mantenimiento/Reparación de Lavadoras</option>
                      <option value="neveras">Mantenimiento/Reparación de Neveras</option>
                      <option value="mecanica_rapida">Mecánica Rápida</option>
                      <option value="corte_belleza">Corte y Belleza</option>
                      <option value="plomeria">Plomería y Redes de Gas</option>
                      <option value="electricidad">Electricidad e Iluminación</option>
                      <option value="albanileria">Albañilería y Acabados</option>
                      <option value="pintura">Pintura y Estuco</option>
                      <option value="carpinteria">Carpintería y Ebanistería</option>
                      <option value="cerrajeria">Cerrajería de Seguridad</option>
                      <option value="limpieza">Aseo Post-Obra y Desinfección</option>
                      <option value="computadores">Mantenimiento de Computadores</option>
                      <option value="soldadura">Soldadura y Estructuras Metálicas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      Localidad / Barrio Base en Bogotá:
                    </label>
                    <input
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Ej. Kennedy, Chapinero, Suba, Usaquén..."
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-bold focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Título de Especialidad / Perfil Público:</label>
                  <input
                    type="text"
                    required
                    value={specialtyTitle}
                    onChange={(e) => setSpecialtyTitle(e.target.value)}
                    placeholder="Ej. Maestro Plomero e Instalador de Redes de Gas Certificado"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Años de Experiencia Comprobables:</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ej. 5"
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Disponibilidad Habitual:</label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value as any)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="disponible_hoy">Inmediata (Disponible Hoy)</option>
                      <option value="disponible_24h">Programada (Dentro de 24 horas)</option>
                      <option value="en_obra">Actualmente en Obra</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Resumen de Experiencia & Trabajos Realizados:</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe tu trayectoria técnica, herramientas que posees, certificaciones y tipos de trabajos o proyectos que atiendes..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Relación de Servicios y Tarifas */}
            {currentStep === 3 && (
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-stone-900">Relación de Servicios y Tarifas Propuestas</h4>
                    <p className="text-xs text-stone-500">
                      Define los valores sugeridos por jornal y trabajos específicos para aprobación del Administrador.
                    </p>
                  </div>
                </div>

                {/* Base rates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Tarifa Propuesta Jornal 8 Horas (COP):</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ej. 130000"
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs font-black text-stone-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Tarifa Propuesta Hora Extra (COP):</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ej. 26000"
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Services list */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700">Relación de Trabajos Específicos que Ofreces:</label>
                  
                  {servicesRelation.length === 0 ? (
                    <div className="p-4 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-stone-500 text-xs">
                      Aún no has agregado servicios específicos. Utiliza el formulario a continuación para registrar tus trabajos y precios sugeridos.
                    </div>
                  ) : (
                    servicesRelation.map((service) => (
                      <div
                        key={service.id}
                        className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                          service.active
                            ? 'bg-white border-amber-300 shadow-xs'
                            : 'bg-stone-50 border-stone-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={service.active}
                            onChange={() => toggleServiceActive(service.id)}
                            className="mt-1 w-4 h-4 accent-amber-600 rounded cursor-pointer"
                          />
                          <div>
                            <div className="text-xs font-bold text-stone-900">{service.name}</div>
                            <div className="text-[11px] text-stone-500">{service.description}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-stone-900">
                            ${service.estimatedPrice.toLocaleString('es-CO')} COP
                          </div>
                          <div className="text-[10px] text-stone-400 font-bold">{service.unit}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add new service */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="text-xs font-bold text-stone-800 mb-2 block">Agregar Otro Servicio a tu Relación:</span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Nombre del servicio (ej. Instalación de sanitario)"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="flex-1 p-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Precio COP (ej. 85000)"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full sm:w-36 p-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documentos de Soporte y ARL */}
            {currentStep === 4 && (
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <h4 className="text-sm font-black text-stone-900">Documentos de Soporte para Auditoría del Administrador</h4>
                  <p className="text-xs text-stone-500">
                    Marca los documentos que tienes disponibles para verificación del Administrador antes de publicar tu perfil en el mapa.
                  </p>
                </div>

                {/* ARL Risk level selector */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    Nivel de Riesgo en ARL (Administradora de Riesgos Laborales):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['Riesgo I', 'Riesgo II', 'Riesgo III', 'Riesgo IV', 'Riesgo V'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setArlLevel(lvl)}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                          arlLevel === lvl
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document attachments upload checklist */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-stone-800">Checklist de Documentos Adjuntos Requeridos:</label>

                  {/* Cedula */}
                  <div 
                    onClick={() => setDocCedula(!docCedula)}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between cursor-pointer hover:bg-stone-100/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={docCedula}
                        onChange={(e) => setDocCedula(e.target.checked)}
                        className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-stone-900">Fotocopia de Cédula de Ciudadanía (150%)</div>
                        <div className="text-[11px] text-stone-500">Documento de identidad legible por ambas caras.</div>
                      </div>
                    </div>
                    {docCedula ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Adjuntado
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                        Pendiente
                      </span>
                    )}
                  </div>

                  {/* Antecedentes */}
                  <div 
                    onClick={() => setDocAntecedentes(!docAntecedentes)}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between cursor-pointer hover:bg-stone-100/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={docAntecedentes}
                        onChange={(e) => setDocAntecedentes(e.target.checked)}
                        className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-stone-900">Certificado de Antecedentes de Policía Nacional</div>
                        <div className="text-[11px] text-stone-500">Vigencia no mayor a 30 días calendario.</div>
                      </div>
                    </div>
                    {docAntecedentes ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Adjuntado
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                        Pendiente
                      </span>
                    )}
                  </div>

                  {/* ARL Planilla */}
                  <div 
                    onClick={() => setDocArl(!docArl)}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between cursor-pointer hover:bg-stone-100/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={docArl}
                        onChange={(e) => setDocArl(e.target.checked)}
                        className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-stone-900">Planilla de Pago ARL / Seguridad Social del Mes</div>
                        <div className="text-[11px] text-stone-500">Comprobante PILA como trabajador independiente.</div>
                      </div>
                    </div>
                    {docArl ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Adjuntado
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                        Pendiente
                      </span>
                    )}
                  </div>

                  {/* Technical Degree SENA */}
                  <div 
                    onClick={() => setDocDiploma(!docDiploma)}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between cursor-pointer hover:bg-stone-100/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={docDiploma}
                        onChange={(e) => setDocDiploma(e.target.checked)}
                        className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-stone-900">Diploma Técnico SENA o Matrícula Profesional</div>
                        <div className="text-[11px] text-stone-500">Certificación en competencias laborales del oficio.</div>
                      </div>
                    </div>
                    {docDiploma ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Adjuntado
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Juramentada terms */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="terms-check"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                  <label htmlFor="terms-check" className="text-xs text-amber-950 cursor-pointer">
                    <b>Declaración Juramentada de Veracidad:</b> Declaro que la información y documentos aportados son fidedignos. Entiendo que mi perfil permanecerá en <u>estado pendiente</u> hasta que el Administrador de la web verifique los antecedentes y autorice su publicación en el mapa de Bogotá.
                  </label>
                </div>
              </div>
            )}

            {/* Footer Navigation Buttons */}
            <div className="bg-stone-50 p-4 sm:p-5 border-t border-stone-200 flex items-center justify-between gap-3">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
                  >
                    ← Anterior
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>Siguiente Paso</span>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-amber-600/30 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-white" />
                    <span>Enviar para Revisión del Administrador</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
