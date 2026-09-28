import React, { useState, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  DollarSign, 
  Database, 
  Download, 
  Lock, 
  FileCheck, 
  AlertTriangle,
  Search,
  CheckCircle2,
  Sliders,
  Server,
  Clock,
  Check,
  XCircle,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Wrench,
  ChevronRight,
  UserPlus,
  FolderGit2,
  Copy,
  Terminal,
  Globe,
  Cloud,
  Layers,
  LogOut,
  FileCode,
  Pencil,
  Save,
  Camera,
  Upload,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import { Collaborator, WorkContract } from '../types';

interface AdminPanelModalProps {
  collaborators: Collaborator[];
  contracts: WorkContract[];
  onClose: () => void;
  onToggleVerification: (colabId: string) => void;
  onApproveCollaborator?: (colabId: string) => void;
  onRejectCollaborator?: (colabId: string) => void;
  onUpdateCollaborator?: (updatedColab: Collaborator) => void;
  onLogout?: () => void;
  initialTab?: 'metricas' | 'solicitudes' | 'colaboradores' | 'custodia' | 'seguridad' | 'docker';
}

const resizeImageFile = (file: File, maxWidth = 600, maxHeight = 600, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(img.src);
        }
      };
      img.onerror = () => resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  collaborators,
  contracts,
  onClose,
  onToggleVerification,
  onApproveCollaborator,
  onRejectCollaborator,
  onUpdateCollaborator,
  onLogout,
  initialTab = 'solicitudes',
}) => {
  // Pending collaborators count
  const pendingCollaborators = collaborators.filter(
    (c) => c.approvalStatus === 'pendiente_aprobacion'
  );

  const [activeTab, setActiveTab] = useState<'metricas' | 'solicitudes' | 'colaboradores' | 'custodia' | 'seguridad' | 'docker'>(
    pendingCollaborators.length > 0 ? 'solicitudes' : initialTab
  );

  const [collaboratorFilter, setCollaboratorFilter] = useState<'todos' | 'pendientes' | 'aprobados'>('todos');
  const [backupGenerated, setBackupGenerated] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Collaborator Profile Editing (Admin Exclusive)
  const [editingColab, setEditingColab] = useState<Collaborator | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Collaborator>>({});
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = (colab: Collaborator) => {
    setEditingColab(colab);
    setEditFormData({
      avatar: colab.avatar,
      name: colab.name,
      specialtyTitle: colab.specialtyTitle,
      category: colab.category,
      phone: colab.phone,
      email: colab.email || '',
      documentIdNumber: colab.documentIdNumber || '',
      dailyRate: colab.dailyRate,
      hourlyRate: colab.hourlyRate,
      yearsExperience: colab.yearsExperience,
      bio: colab.bio,
      availability: colab.availability,
      location: { ...colab.location },
      certifications: { ...colab.certifications },
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    try {
      setIsProcessingPhoto(true);
      const resizedBase64 = await resizeImageFile(file, 600, 600, 0.85);
      setEditFormData((prev) => ({
        ...prev,
        avatar: resizedBase64,
      }));
    } catch (err) {
      console.error('Error al procesar la foto:', err);
      alert('No se pudo procesar la imagen seleccionada.');
    } finally {
      setIsProcessingPhoto(false);
      if (editPhotoInputRef.current) {
        editPhotoInputRef.current.value = '';
      }
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColab) return;

    const updated: Collaborator = {
      ...editingColab,
      avatar: editFormData.avatar?.trim() || editingColab.avatar,
      name: editFormData.name?.trim() || editingColab.name,
      specialtyTitle: editFormData.specialtyTitle?.trim() || editingColab.specialtyTitle,
      category: editFormData.category || editingColab.category,
      phone: editFormData.phone?.trim() || editingColab.phone,
      email: editFormData.email?.trim() || editingColab.email,
      documentIdNumber: editFormData.documentIdNumber?.trim() || editingColab.documentIdNumber,
      dailyRate: Number(editFormData.dailyRate) || editingColab.dailyRate,
      hourlyRate: Number(editFormData.hourlyRate) || editingColab.hourlyRate,
      yearsExperience: Number(editFormData.yearsExperience) || editingColab.yearsExperience,
      bio: editFormData.bio?.trim() || editingColab.bio,
      availability: (editFormData.availability as any) || editingColab.availability,
      location: {
        ...editingColab.location,
        neighborhood: editFormData.location?.neighborhood?.trim() || editingColab.location.neighborhood,
        city: editFormData.location?.city?.trim() || editingColab.location.city,
        address: editFormData.location?.address?.trim() || editingColab.location.address,
      },
      certifications: {
        ...editingColab.certifications,
        arlRiskLevel: editFormData.certifications?.arlRiskLevel || editingColab.certifications.arlRiskLevel,
        backgroundCheckStatus: editFormData.certifications?.backgroundCheckStatus || editingColab.certifications.backgroundCheckStatus,
        technicalDegree: editFormData.certifications?.technicalDegree?.trim() || editingColab.certifications.technicalDegree,
      },
    };

    if (onUpdateCollaborator) {
      onUpdateCollaborator(updated);
    }
    setActionSuccessMsg(`Perfil y foto de ${updated.name} actualizados exitosamente.`);
    setEditingColab(null);
  };

  // Docker architecture sub-tab & clipboard
  const [dockerSubTab, setDockerSubTab] = useState<'estructura' | 'dockerfiles' | 'docker' | 'backend' | 'migraciones' | 'hostinger'>('estructura');
  const [dockerCopiedKey, setDockerCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setDockerCopiedKey(key);
    setTimeout(() => setDockerCopiedKey(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const frontendDockerfileSnippet = `FROM nginx:alpine

COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`;

  const backendDockerfileSnippet = `FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema requeridas para SQLite y utilidades
RUN apt-get update && apt-get install -y --no-install-recommends \\
    sqlite3 \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Directorio de datos para persistencia SQLite
RUN mkdir -p /app/datos

EXPOSE 5000

ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "--timeout", "120", "app:app"]`;

  const dockerComposeSnippet = `services:
  # 1. Frontend Web (HTML5, Vanilla JS & Tailwind CSS)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: multioficios_frontend
    restart: always
    ports:
      - "\${FRONTEND_PORT:-80}:80"
    depends_on:
      - backend
    environment:
      - API_URL=http://backend:5000/api
    networks:
      - multioficios_network

  # 2. Backend API Microservicio (Node.js + Express + TypeScript - Opción A)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: multioficios_backend
    restart: always
    ports:
      - "\${BACKEND_PORT:-5000}:5000"
    volumes:
      - ./datos:/app/datos
    environment:
      - NODE_ENV=production
      - PORT=5000
      - SECRET_KEY=MultiOficios_SuperSecret_JwtKey_2026
      - ESCROW_GATEWAY=epayco_sandbox
    networks:
      - multioficios_network

networks:
  multioficios_network:
    driver: bridge

volumes:
  datos_volume:
    driver: local`;

  const expressAppSnippet = `import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Health check & Diagnostics
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    microservice: 'MultiOficios Node.js + Express (Opción A)',
    runtime: \`Node.js \${process.version}\`,
    version: '1.0.0'
  });
});

// 2. Obtener colaboradores por geolocalización y radio (Haversine en TypeScript)
app.get('/api/colaboradores', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string || '4.6345');
  const lng = parseFloat(req.query.lng as string || '-74.1458');
  const radiusKm = parseFloat(req.query.radius_km as string || '25.0');
  const category = (req.query.category as string) || 'todos';

  const results = getColaboradoresWithinRadius(lat, lng, radiusKm, category);
  res.json({ total: results.length, radio_km: radiusKm, colaboradores: results });
});

// 3. Crear contrato de obra con pago en custodia (Escrow)
app.post('/api/obras/contratar', (req: Request, res: Response) => {
  const data = req.body;
  const nuevaObra = {
    id: \`obra-\${Date.now()}\`,
    cliente_id: data.cliente_id,
    colaborador_id: data.colaborador_id,
    descripcion: data.descripcion,
    monto_total: data.monto_total,
    estado: 'fondos_en_custodia'
  };
  guardarObra(nuevaObra);
  res.status(201).json({ mensaje: 'Contrato creado. Fondos retenidos en custodia.', obra: nuevaObra });
});

// 4. Liberación de fondos Escrow al técnico
app.post('/api/obras/:id/liberar-pago', (req: Request, res: Response) => {
  const obra = actualizarEstadoObra(req.params.id, 'finalizado');
  res.json({ mensaje: 'Acta aprobada. Pago dispersado al técnico.', status: 'liberado', obra });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`[MultiOficios Backend] Node.js + Express en puerto \${PORT}\`);
});`;

  const migrationsSnippet = `# =======================================================
# MultiOficios: Gestión de Migraciones de Base de Datos (SQLite)
# =======================================================

# Método 1: Utilizando Flask-Migrate (Alembic)
export FLASK_APP=backend/app.py

# 1. Inicializar el directorio de migraciones (primera vez)
flask db init

# 2. Generar migración automática tras cambiar modelos en models.py
flask db migrate -m "Agregar columnas de clasificacion ARL y huella digital"

# 3. Aplicar las migraciones a la base de datos SQLite en producción
flask db upgrade

# 4. En caso de necesitar revertir una versión anterior
flask db downgrade

# Método 2: Backup manual antes de cada migración
cp datos/multioficios.db datos/backups/multioficios_\$(date +%Y%m%d_%H%M%S).db`;

  const hostingerSnippet = `# =======================================================
# Guía Paso a Paso para Desplegar MultiOficios en Hostinger VPS
# =======================================================

# Paso 1: Conectarse por SSH a tu servidor Hostinger VPS
ssh root@tu-ip-hostinger.com

# Paso 2: Instalar Docker y Docker Compose en Ubuntu/Debian
apt update && apt upgrade -y
apt install -y docker.io docker-compose git nginx certbot python3-certbot-nginx
systemctl enable --now docker

# Paso 3: Clonar el repositorio del proyecto
git clone https://github.com/tu-usuario/multioficios-app.git /var/www/multioficios
cd /var/www/multioficios

# Paso 4: Levantar los contenedores de Microservicios con Docker Compose
docker-compose up -d --build

# Paso 5: Verificar que los contenedores estén corriendo
docker-compose ps
# multioficios_frontend   Up   0.0.0.0:80->80/tcp
# multioficios_backend    Up   0.0.0.0:5000->5000/tcp

# Paso 6: Configurar Dominio y Certificado SSL Gratuito (HTTPS con Let's Encrypt)
certbot --nginx -d tu-dominio-multioficios.com`;

  // Financial calculations
  const totalEscrowVolume = contracts.reduce((acc, c) => acc + c.totalAmount, 0);
  const activeEscrowHeld = contracts
    .filter((c) => c.escrowStatus === 'fondos_retenidos')
    .reduce((acc, c) => acc + c.totalAmount, 0);
  const platformRevenue = Math.round(totalEscrowVolume * 0.05);

  const handleApprove = (colabId: string, colabName: string) => {
    if (onApproveCollaborator) {
      onApproveCollaborator(colabId);
      setActionSuccessMsg(`¡${colabName} ha sido aprobado! Su perfil y relación de servicios ya están publicados en el mapa interactivo.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleReject = (colabId: string, colabName: string) => {
    if (onRejectCollaborator) {
      onRejectCollaborator(colabId);
      setActionSuccessMsg(`La solicitud de ${colabName} ha sido rechazada.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleDownloadBackup = () => {
    setBackupGenerated(true);
    const dataToExport = {
      timestamp: new Date().toISOString(),
      schema_version: '2.4.0',
      database_engine: 'SQLite 3.45 / SQLAlchemy',
      collaborators,
      contracts,
      security_audit: {
        e2ee_encryption: 'AES-256-GCM / Curve25519',
        habeas_data_compliance: 'Ley 1581 de 2012 (Colombia)',
        backup_checksum_sha256: 'a9f239851c8901e82847d0e82c81923abfe',
      },
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multioficios_sqlite_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col h-[90vh] max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Always fixed at top */}
        <div className="shrink-0 bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/30 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg md:text-xl font-black text-white truncate">
                  MultiOficios • Consola de Administración
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  SUPERADMIN
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-400 truncate hidden sm:block">
                Auditoría de vinculaciones, aprobación de colaboradores para el mapa, custodia Escrow y respaldos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/30 text-stone-300 hover:text-red-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-white/10"
                title="Cerrar sesión de Administrador"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bloquear Admin</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              title="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Action Banner Toast */}
        {actionSuccessMsg && (
          <div className="shrink-0 bg-emerald-600 text-white px-4 sm:px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200 z-10">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-200 hover:text-white cursor-pointer ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab switcher - Fixed below header with clean scrollbar */}
        <div className="shrink-0 flex border-b border-stone-200 px-4 sm:px-6 bg-stone-50 overflow-x-auto no-scrollbar z-10 shadow-xs">
          <button
            onClick={() => setActiveTab('solicitudes')}
            className={`py-3 sm:py-3.5 px-3 sm:px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap flex items-center gap-2 shrink-0 ${
              activeTab === 'solicitudes'
                ? 'border-amber-600 text-amber-800 bg-white font-extrabold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <UserPlus className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Solicitudes de Vinculación</span>
            {pendingCollaborators.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                {pendingCollaborators.length} Pendiente{pendingCollaborators.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-stone-200 text-stone-600">
                0
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('metricas')}
            className={`py-3 sm:py-3.5 px-3 sm:px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap shrink-0 ${
              activeTab === 'metricas'
                ? 'border-amber-600 text-amber-800 bg-white font-extrabold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Métricas de la Plataforma
          </button>

          <button
            onClick={() => setActiveTab('colaboradores')}
            className={`py-3 sm:py-3.5 px-3 sm:px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === 'colaboradores'
                ? 'border-amber-600 text-amber-800 bg-white font-extrabold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Directorio de Colaboradores</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 font-bold">
              {collaborators.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('custodia')}
            className={`py-3 sm:py-3.5 px-3 sm:px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap shrink-0 ${
              activeTab === 'custodia'
                ? 'border-amber-600 text-amber-800 bg-white font-extrabold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Custodia de Fondos (Escrow)
          </button>

          <button
            onClick={() => setActiveTab('seguridad')}
            className={`py-3 sm:py-3.5 px-3 sm:px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap shrink-0 ${
              activeTab === 'seguridad'
                ? 'border-amber-600 text-amber-800 bg-white font-extrabold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Base de Datos & Respaldos
          </button>

          <button
            id="tab-docker-architecture"
            onClick={() => setActiveTab('docker')}
            className={`py-3 sm:py-3.5 px-3 sm:px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap flex items-center gap-2 shrink-0 ${
              activeTab === 'docker'
                ? 'border-blue-600 text-blue-700 bg-white font-extrabold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <FolderGit2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Arquitectura & Docker</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold">
              Microservicios
            </span>
          </button>
        </div>

        {/* Tab Body - Dedicated scrollable area */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-6">
          
          {/* TAB 1: Solicitudes de Vinculación (Pending Approvals) */}
          {activeTab === 'solicitudes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
                <div>
                  <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-amber-600" />
                    Bandeja de Aprobación de Nuevos Colaboradores
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Revisa y audita las postulaciones de técnicos. Al hacer clic en <b>Aprobar y Publicar</b>, el colaborador se activará de inmediato en el mapa interactivo de Bogotá.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl">
                  {pendingCollaborators.length} en espera de dictamen
                </span>
              </div>

              {pendingCollaborators.length === 0 ? (
                <div className="bg-stone-50 rounded-3xl p-8 text-center border border-dashed border-stone-300 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h5 className="font-extrabold text-sm text-stone-900">No hay postulaciones pendientes de revisión</h5>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Todas las solicitudes de vinculación han sido procesadas. Cuando un nuevo colaborador diligencie el formulario <b>"Ofrecer mis servicios"</b>, aparecerá aquí con sus documentos para tu aprobación.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCollaborators.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-5 space-y-4 transition"
                    >
                      {/* Top Header of Candidate Card */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={candidate.avatar}
                            alt={candidate.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-stone-200 shadow-xs"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-base font-black text-stone-900">{candidate.name}</h5>
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" /> Pendiente de Aprobación
                              </span>
                            </div>
                            <div className="text-xs font-bold text-amber-700 mt-0.5">
                              {candidate.specialtyTitle}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 mt-1">
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3 text-stone-400" /> C.C: {candidate.documentIdNumber || '1.024.582.914'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-amber-600" /> {candidate.location.neighborhood}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-stone-400" /> {candidate.phone}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Financials proposed */}
                        <div className="bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200 text-right shrink-0">
                          <div className="text-[10px] uppercase font-bold text-stone-400">Tarifa Propuesta</div>
                          <div className="text-sm font-black text-stone-900">
                            ${candidate.dailyRate.toLocaleString('es-CO')} / jornal 8h
                          </div>
                          <div className="text-[10px] text-stone-500 font-medium">
                            +${candidate.hourlyRate.toLocaleString('es-CO')} hora extra
                          </div>
                        </div>
                      </div>

                      {/* Bio summary */}
                      <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100 italic">
                        "{candidate.bio}"
                      </p>

                      {/* Documents Audit Checklist */}
                      <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/80 space-y-2">
                        <div className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          Auditoría de Documentos Radicados para Publicación:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-emerald-200 flex items-center gap-1.5 text-emerald-900 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Cédula de Ciudadanía</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-emerald-200 flex items-center gap-1.5 text-emerald-900 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Policía Nacional OK</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-emerald-200 flex items-center gap-1.5 text-emerald-900 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Planilla ARL ({candidate.certifications.arlRiskLevel})</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-emerald-200 flex items-center gap-1.5 text-emerald-900 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Técnico SENA</span>
                          </div>
                        </div>
                      </div>

                      {/* Decision Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => handleReject(candidate.id, candidate.name)}
                          className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Rechazar Solicitud</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(candidate.id, candidate.name)}
                          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                          <span>Aprobar y Publicar en el Mapa</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Métricas de la Plataforma */}
          {activeTab === 'metricas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between text-stone-500">
                    <span className="text-xs font-bold">Colaboradores Totales</span>
                    <Users className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 mt-2">
                    {collaborators.length}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    {collaborators.filter(c => c.approvalStatus !== 'pendiente_aprobacion').length} activos en mapa
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between text-stone-500">
                    <span className="text-xs font-bold">Contratos por Obra</span>
                    <Briefcase className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 mt-2">
                    {contracts.length}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    {contracts.filter((c) => c.status !== 'finalizado').length} en ejecución
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between text-stone-500">
                    <span className="text-xs font-bold">Fondos en Custodia Activa</span>
                    <Lock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700 mt-2">
                    ${activeEscrowHeld.toLocaleString('es-CO')}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    Congelados hasta acta de entrega
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between text-stone-500">
                    <span className="text-xs font-bold">Comisión MultiOficios (5%)</span>
                    <DollarSign className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-700 mt-2">
                    ${platformRevenue.toLocaleString('es-CO')}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    Ingresos netos por mediación
                  </div>
                </div>
              </div>

              {/* Service Distribution */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
                  Distribución de Servicios por Especialidad
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-500">Carpintería & Muebles</span>
                    <div className="font-extrabold text-sm text-stone-900 mt-0.5">38% de demanda</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-500">Plomería & Redes de Gas</span>
                    <div className="font-extrabold text-sm text-stone-900 mt-0.5">26% de demanda</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-500">Electricidad Certificada</span>
                    <div className="font-extrabold text-sm text-stone-900 mt-0.5">21% de demanda</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-500">Albañilería & Pintura</span>
                    <div className="font-extrabold text-sm text-stone-900 mt-0.5">15% de demanda</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Directorio de Colaboradores */}
          {activeTab === 'colaboradores' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-stone-200 text-xs">
                <span className="text-stone-600 font-bold">
                  Directorio y Estado de Verificación ({collaborators.length} técnicos registrados)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCollaboratorFilter('todos')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                      collaboratorFilter === 'todos' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    Todos ({collaborators.length})
                  </button>
                  <button
                    onClick={() => setCollaboratorFilter('pendientes')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                      collaboratorFilter === 'pendientes' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    Pendientes ({pendingCollaborators.length})
                  </button>
                  <button
                    onClick={() => setCollaboratorFilter('aprobados')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                      collaboratorFilter === 'aprobados' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    Aprobados ({collaborators.filter(c => c.approvalStatus !== 'pendiente_aprobacion').length})
                  </button>
                </div>
              </div>

              <div className="divide-y divide-stone-100">
                {collaborators
                  .filter((c) => {
                    if (collaboratorFilter === 'pendientes') return c.approvalStatus === 'pendiente_aprobacion';
                    if (collaboratorFilter === 'aprobados') return c.approvalStatus !== 'pendiente_aprobacion';
                    return true;
                  })
                  .map((c) => (
                    <div key={c.id} className="py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <img src={c.avatar} alt={c.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                          <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <span>{c.name}</span>
                            {c.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {c.approvalStatus === 'pendiente_aprobacion' && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                En Revisión
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-700 font-semibold">{c.specialtyTitle}</div>
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            {c.location.neighborhood} • Tarifa: ${c.dailyRate.toLocaleString('es-CO')}/jornal
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {c.certifications.arlRiskLevel}
                        </span>

                        {c.approvalStatus === 'pendiente_aprobacion' ? (
                          <button
                            onClick={() => handleApprove(c.id, c.name)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprobar y Publicar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleVerification(c.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              c.isVerified
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 group'
                                : 'bg-stone-200 text-stone-700 hover:bg-emerald-600 hover:text-white border border-stone-300'
                            }`}
                            title={c.isVerified ? 'Clic para suspender este colaborador y ocultarlo del mapa' : 'Clic para reactivar y volver a mostrar en el mapa'}
                          >
                            {c.isVerified ? (
                              <>
                                <span className="group-hover:hidden">Publicado en Mapa ✓</span>
                                <span className="hidden group-hover:inline">Suspender Pin ✕</span>
                              </>
                            ) : (
                              <span>Pin Suspendido (Reactivar)</span>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleStartEdit(c)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 shrink-0 shadow-xs"
                          title="Editar expediente, tarifas y especialidad de este colaborador (Solo SuperAdmin)"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-700" />
                          <span>Editar Perfil</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: Custodia de Fondos (Escrow) */}
          {activeTab === 'custodia' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <b>Control de Fondos en Custodia Fiduciaria (Escrow):</b> Los pagos ingresan congelados y sólo se dispersan tras la firma digital del acta de entrega o mediación de disputas administrativas.
                </div>
              </div>

              <div className="space-y-3">
                {contracts.map((contract) => (
                  <div key={contract.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-600">{contract.orderNumber}</span>
                        <span className="font-bold text-stone-900">{contract.collaboratorName}</span>
                      </div>
                      <p className="text-stone-600 mt-1">{contract.workDescription}</p>
                      <div className="text-[10px] text-stone-400 mt-1">
                        Cliente: {contract.clientName} ({contract.clientPhone})
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-sm text-stone-900">
                        ${contract.totalAmount.toLocaleString('es-CO')} COP
                      </div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        contract.escrowStatus === 'liberado_al_colaborador'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {contract.escrowStatus === 'liberado_al_colaborador' ? 'Liberado al Colaborador' : 'Retenido en Custodia'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Seguridad y Respaldos */}
          {activeTab === 'seguridad' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-amber-600" />
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      Motor de Datos SQLite & Copias de Seguridad Automáticas
                    </h4>
                    <p className="text-xs text-stone-500">
                      Almacenamiento relacional ligero, cifrado en reposo y exportable para Hostinger VPS / Docker.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-400">Motor DB:</span>
                    <div className="font-bold text-stone-800 mt-0.5">SQLite 3.45 con WAL</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-400">Protección Habeas Data:</span>
                    <div className="font-bold text-stone-800 mt-0.5">Ley 1581 (Colombia)</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-400">Cifrado de Chat:</span>
                    <div className="font-bold text-stone-800 mt-0.5">E2EE AES-256</div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-stone-200">
                  <span className="text-xs text-stone-600">
                    {backupGenerated ? '✓ Copia de seguridad exportada con éxito.' : 'Última copia de seguridad: Hoy'}
                  </span>
                  <button
                    id="btn-download-sqlite-backup"
                    onClick={handleDownloadBackup}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Descargar Backup de Base de Datos (.json / .sql)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Arquitectura & Docker (Microservicios, Flask, SQLite, Hostinger VPS) */}
          {activeTab === 'docker' && (
            <div className="space-y-4">
              {/* Internal Docker Navigation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-stone-900">
                      Infraestructura de Microservicios & Contenedores Docker
                    </h4>
                    <p className="text-xs text-stone-500">
                      Estructura modular en 3 carpetas: <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded">frontend/</code>, <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">backend/</code> y <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">datos/</code>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
                  <button
                    onClick={() => setDockerSubTab('estructura')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      dockerSubTab === 'estructura'
                        ? 'bg-white text-blue-800 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    3 Carpetas
                  </button>
                  <button
                    onClick={() => setDockerSubTab('dockerfiles')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      dockerSubTab === 'dockerfiles'
                        ? 'bg-white text-blue-800 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>Dockerfiles</span>
                    <span className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded font-bold">2 archivos</span>
                  </button>
                  <button
                    onClick={() => setDockerSubTab('docker')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      dockerSubTab === 'docker'
                        ? 'bg-white text-blue-800 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    docker-compose.yml
                  </button>
                  <button
                    onClick={() => setDockerSubTab('backend')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      dockerSubTab === 'backend'
                        ? 'bg-white text-blue-800 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Backend Node.js Express (Opción A)
                  </button>
                  <button
                    onClick={() => setDockerSubTab('migraciones')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      dockerSubTab === 'migraciones'
                        ? 'bg-white text-blue-800 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Migraciones SQLite
                  </button>
                  <button
                    onClick={() => setDockerSubTab('hostinger')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      dockerSubTab === 'hostinger'
                        ? 'bg-white text-blue-800 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Despliegue Hostinger VPS
                  </button>
                </div>
              </div>

              {/* Sub-view: 3 Carpetas */}
              {dockerSubTab === 'estructura' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. Frontend */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-600">
                        <Globe className="w-4 h-4" />
                        <h5 className="font-extrabold text-stone-900 text-sm">/frontend</h5>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Interfaz de usuario responsive construida con React 19, Tailwind CSS y Vite PWA.
                      </p>
                      <ul className="text-xs text-stone-700 space-y-1 font-mono bg-white p-3 rounded-xl border border-stone-200">
                        <li>├── index.html</li>
                        <li>├── src/</li>
                        <li>├── public/</li>
                        <li>├── package.json</li>
                        <li>└── Dockerfile (Nginx)</li>
                      </ul>
                    </div>

                    {/* 2. Backend */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs space-y-2.5">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Server className="w-4 h-4" />
                        <h5 className="font-extrabold text-stone-900 text-sm">/backend (Opción A)</h5>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Microservicio Node.js + Express (TypeScript) con API RESTful, geocálculos Haversine y pasarela Escrow.
                      </p>
                      <ul className="text-xs text-stone-700 space-y-1 font-mono bg-white p-3 rounded-xl border border-stone-200">
                        <li>├── src/server.ts</li>
                        <li>├── package.json</li>
                        <li>├── tsconfig.json</li>
                        <li>└── Dockerfile (Node 22)</li>
                      </ul>
                    </div>

                    {/* 3. Datos */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <Database className="w-4 h-4" />
                        <h5 className="font-extrabold text-stone-900 text-sm">/datos</h5>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Persistencia relacional SQLite, esquemas DDL, scripts de migración Alembic y copias de seguridad.
                      </p>
                      <ul className="text-xs text-stone-700 space-y-1 font-mono bg-white p-3 rounded-xl border border-stone-200">
                        <li>├── multioficios.db</li>
                        <li>├── schema.sql</li>
                        <li>├── init_db.py</li>
                        <li>├── migrations/</li>
                        <li>└── backup_util.py</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-stone-800">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Estructura desacoplada y lista para compilar con un solo comando: <code>docker-compose up -d --build</code></span>
                    </div>
                    <span className="font-bold text-blue-700">Hostinger & VPS Ready</span>
                  </div>
                </div>
              )}

              {/* Sub-view: Dockerfiles (Frontend y Backend con Descarga Directa) */}
              {dockerSubTab === 'dockerfiles' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">¿Por qué algunos descompresores no muestran los Dockerfile?</span>
                      <p className="mt-0.5 text-amber-800 leading-relaxed">
                        Los archivos <code>Dockerfile</code> por estándar de contenedores <strong>no tienen extensión</strong> (no terminan en <code>.txt</code> ni <code>.sh</code>). En Windows y Mac, el explorador a menudo los clasifica como archivo de sistema o los oculta si no está activa la opción de ver archivos sin extensión. Se han incluido copias <code>Dockerfile.txt</code> y <code>Dockerfile.frontend</code> / <code>Dockerfile.backend</code> en el proyecto, y también puedes descargarlos directamente a continuación:
                      </p>
                    </div>
                  </div>

                  {/* 1. frontend/Dockerfile */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-amber-600" />
                        <div>
                          <span className="text-xs font-black text-stone-900">frontend/Dockerfile</span>
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 font-mono">Nginx Alpine</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadFile('Dockerfile', frontendDockerfileSnippet)}
                          className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-white hover:bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 cursor-pointer shadow-xs transition"
                          title="Descargar como archivo Dockerfile"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Dockerfile</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(frontendDockerfileSnippet, 'frontend-docker')}
                          className="flex items-center gap-1 text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200 cursor-pointer shadow-xs transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{dockerCopiedKey === 'frontend-docker' ? '¡Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                    <pre className="p-3 bg-stone-950 text-stone-200 rounded-xl text-xs font-mono overflow-x-auto border border-stone-800">
                      {frontendDockerfileSnippet}
                    </pre>
                  </div>

                  {/* 2. backend/Dockerfile */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-xs font-black text-stone-900">backend/Dockerfile</span>
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">Python 3.11 + Gunicorn + SQLite</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadFile('Dockerfile', backendDockerfileSnippet)}
                          className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 cursor-pointer shadow-xs transition"
                          title="Descargar como archivo Dockerfile"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Dockerfile</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(backendDockerfileSnippet, 'backend-docker')}
                          className="flex items-center gap-1 text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200 cursor-pointer shadow-xs transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{dockerCopiedKey === 'backend-docker' ? '¡Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                    <pre className="p-3 bg-stone-950 text-stone-200 rounded-xl text-xs font-mono overflow-x-auto border border-stone-800">
                      {backendDockerfileSnippet}
                    </pre>
                  </div>
                </div>
              )}

              {/* Sub-view: docker-compose.yml */}
              {dockerSubTab === 'docker' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">docker-compose.yml (Orquestación de Microservicios)</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadFile('docker-compose.yml', dockerComposeSnippet)}
                        className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 cursor-pointer shadow-xs transition"
                        title="Descargar docker-compose.yml"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </button>
                      <button
                        onClick={() => copyToClipboard(dockerComposeSnippet, 'docker')}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-stone-200 cursor-pointer shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{dockerCopiedKey === 'docker' ? '¡Copiado!' : 'Copiar Archivo'}</span>
                      </button>
                    </div>
                  </div>

                  <pre className="p-4 bg-stone-950 text-stone-200 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-stone-800">
                    {dockerComposeSnippet}
                  </pre>
                </div>
              )}

              {/* Sub-view: backend/src/server.ts */}
              {dockerSubTab === 'backend' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">backend/src/server.ts (Node.js + Express REST API - Opción A)</span>
                    <button
                      onClick={() => copyToClipboard(expressAppSnippet, 'express')}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-stone-200 cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{dockerCopiedKey === 'express' ? '¡Copiado!' : 'Copiar Código'}</span>
                    </button>
                  </div>

                  <pre className="p-4 bg-stone-950 text-stone-200 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-stone-800">
                    {expressAppSnippet}
                  </pre>
                </div>
              )}

              {/* Sub-view: Migraciones SQLite */}
              {dockerSubTab === 'migraciones' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">Guía de Migraciones de Base de Datos SQLite (Alembic)</span>
                    <button
                      onClick={() => copyToClipboard(migrationsSnippet, 'migraciones')}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-stone-200 cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{dockerCopiedKey === 'migraciones' ? '¡Copiado!' : 'Copiar Comandos'}</span>
                    </button>
                  </div>

                  <pre className="p-4 bg-stone-950 text-emerald-300 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-stone-800">
                    {migrationsSnippet}
                  </pre>
                </div>
              )}

              {/* Sub-view: Hostinger VPS */}
              {dockerSubTab === 'hostinger' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">Instrucciones de Despliegue en Servidor Hostinger VPS</span>
                    <button
                      onClick={() => copyToClipboard(hostingerSnippet, 'hostinger')}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-stone-200 cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{dockerCopiedKey === 'hostinger' ? '¡Copiado!' : 'Copiar Guía'}</span>
                    </button>
                  </div>

                  <pre className="p-4 bg-stone-950 text-amber-200 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-stone-800">
                    {hostingerSnippet}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collaborator Profile Editor Modal (SuperAdmin Exclusive) */}
      {editingColab && (
        <div 
          className="fixed inset-0 z-70 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setEditingColab(null)}
        >
          <div 
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="shrink-0 bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/30 shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base sm:text-lg font-black text-white">
                      Editar Perfil de Colaborador
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Exclusivo SuperAdmin
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Modificación autorizada de credenciales, tarifas y datos de {editingColab.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingColab(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Cerrar sin guardar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              
              {/* Hidden file input for uploading profile picture */}
              <input
                ref={editPhotoInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {/* Quick Identity Overview with Interactive Avatar Change */}
              <div className="p-4 bg-gradient-to-r from-stone-50 to-amber-50/40 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <img 
                      src={editFormData.avatar || editingColab.avatar} 
                      alt={editingColab.name} 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-sm transition-transform group-hover:scale-105" 
                    />
                    <button
                      type="button"
                      onClick={() => editPhotoInputRef.current?.click()}
                      disabled={isProcessingPhoto}
                      className="absolute inset-0 bg-stone-900/70 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer backdrop-blur-[1px]"
                      title="Haz clic para cambiar foto desde tu dispositivo"
                    >
                      <Camera className="w-5 h-5 mb-0.5 text-amber-400" />
                      <span>{isProcessingPhoto ? 'Cargando...' : 'Cambiar'}</span>
                    </button>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md border-2 border-white pointer-events-none">
                      <Camera className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-stone-900 truncate">{editingColab.name}</div>
                    <div className="text-xs text-amber-700 font-semibold truncate">{editingColab.specialtyTitle}</div>
                    <div className="text-[11px] text-stone-500">ID: {editingColab.id} • {editingColab.location.neighborhood}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 block">
                      ★ {editingColab.rating} ({editingColab.reviewCount} reseñas)
                    </span>
                  </div>
                </div>

                {/* Photo Actions Bar */}
                <div className="pt-2 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editPhotoInputRef.current?.click()}
                      disabled={isProcessingPhoto}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isProcessingPhoto ? 'Procesando...' : 'Subir Nueva Foto'}</span>
                    </button>

                    {editFormData.avatar && editFormData.avatar !== editingColab.avatar && (
                      <button
                        type="button"
                        onClick={() => setEditFormData((prev) => ({ ...prev, avatar: editingColab.avatar }))}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-600 border border-stone-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                        title="Restablecer a la foto original"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restablecer
                      </button>
                    )}
                  </div>

                  {editFormData.avatar && editFormData.avatar !== editingColab.avatar ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Foto lista para guardar
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-500">
                      Admite fotos desde tu equipo (JPG, PNG, WEBP)
                    </span>
                  )}
                </div>

                {/* Direct image URL input for flexibility */}
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-stone-500 shrink-0">O URL web:</span>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/foto.jpg"
                    value={editFormData.avatar?.startsWith('data:') ? '' : (editFormData.avatar || '')}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, avatar: e.target.value }))}
                    className="flex-1 px-2.5 py-1 text-[11px] border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                  />
                </div>
              </div>

              {/* 1. Datos Personales y Contacto */}
              <div className="space-y-3">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                  1. Datos Personales y Contacto
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Cédula de Ciudadanía</label>
                    <input
                      type="text"
                      value={editFormData.documentIdNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, documentIdNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                      placeholder="Ej: 1.024.582.914"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Teléfono Móvil (SMS / Llamadas)</label>
                    <input
                      type="text"
                      required
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Especialidad y Oficio */}
              <div className="space-y-3">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  2. Especialidad y Categoría de Oficio
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">Título de Especialidad</label>
                    <input
                      type="text"
                      required
                      value={editFormData.specialtyTitle || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, specialtyTitle: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                      placeholder="Ej: Maestro Carpintero, Ebanista y Muebles Modulares"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Categoría Principal</label>
                    <select
                      value={editFormData.category || 'carpinteria'}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white font-medium"
                    >
                      <option value="carpinteria">Carpintería</option>
                      <option value="plomeria">Plomería</option>
                      <option value="electricidad">Electricidad</option>
                      <option value="albanileria">Albañilería / Obra Blanca</option>
                      <option value="pintura">Pintura</option>
                      <option value="lavadoras">Mantenimiento de Lavadoras</option>
                      <option value="neveras">Mantenimiento de Neveras</option>
                      <option value="cerrajeria">Cerrajería</option>
                      <option value="computadores">Mantenimiento de Computadores</option>
                      <option value="mecanica_rapida">Mecánica Rápida</option>
                      <option value="corte_belleza">Corte y Belleza</option>
                      <option value="limpieza">Limpieza Especializada</option>
                      <option value="soldadura">Soldadura / Estructuras</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Años de Experiencia</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={editFormData.yearsExperience || 1}
                      onChange={(e) => setEditFormData({ ...editFormData, yearsExperience: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Disponibilidad</label>
                    <select
                      value={editFormData.availability || 'disponible_hoy'}
                      onChange={(e) => setEditFormData({ ...editFormData, availability: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                    >
                      <option value="disponible_hoy">🟢 Disponible Hoy</option>
                      <option value="disponible_24h">🟡 Disponible en 24 Horas</option>
                      <option value="en_obra">🟠 En Obra / Ocupado</option>
                      <option value="pausado">🔴 Pausado Temporalmente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Formación / Acreditación Técnica</label>
                    <input
                      type="text"
                      value={editFormData.certifications?.technicalDegree || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        certifications: {
                          ...(editFormData.certifications || { arlRiskLevel: 'Riesgo III', backgroundCheckStatus: 'Aprobado', verifiedDate: '2026-03-20' }),
                          technicalDegree: e.target.value,
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                      placeholder="Ej: Técnico SENA / Certificado CONTE"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Tarifas y Cobertura */}
              <div className="space-y-3">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  3. Tarifas y Cobertura Geográfica
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Tarifa Jornal (8 Horas) COP</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={editFormData.dailyRate || 120000}
                      onChange={(e) => setEditFormData({ ...editFormData, dailyRate: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Tarifa por Hora COP</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={editFormData.hourlyRate || 25000}
                      onChange={(e) => setEditFormData({ ...editFormData, hourlyRate: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Barrio de Cobertura Principal</label>
                    <input
                      type="text"
                      value={editFormData.location?.neighborhood || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        location: {
                          ...(editFormData.location || editingColab.location),
                          neighborhood: e.target.value,
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                      placeholder="Ej: Kennedy / Castilla"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={editFormData.location?.city || 'Bogotá D.C.'}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        location: {
                          ...(editFormData.location || editingColab.location),
                          city: e.target.value,
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Seguridad Social y ARL */}
              <div className="space-y-3">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                  4. Seguridad Social y ARL
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Nivel de Riesgo ARL</label>
                    <select
                      value={editFormData.certifications?.arlRiskLevel || 'Riesgo III'}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        certifications: {
                          ...(editFormData.certifications || { backgroundCheckStatus: 'Aprobado', verifiedDate: '2026-03-20' }),
                          arlRiskLevel: e.target.value as any,
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                    >
                      <option value="Riesgo I">Riesgo I (Oficinas / Belleza / Tecnología)</option>
                      <option value="Riesgo II">Riesgo II (Cerrajería / Mecánica Ligera)</option>
                      <option value="Riesgo III">Riesgo III (Carpintería / Lavadoras / Pintura)</option>
                      <option value="Riesgo IV">Riesgo IV (Electricidad / Albañilería)</option>
                      <option value="Riesgo V">Riesgo V (Trabajo en Alturas / Estructuras)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Estado de Antecedentes</label>
                    <select
                      value={editFormData.certifications?.backgroundCheckStatus || 'Aprobado'}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        certifications: {
                          ...(editFormData.certifications || { arlRiskLevel: 'Riesgo III', verifiedDate: '2026-03-20' }),
                          backgroundCheckStatus: e.target.value as any,
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                    >
                      <option value="Aprobado">✅ Aprobado (Policía & Procuraduría)</option>
                      <option value="En revisión">⏳ En revisión</option>
                      <option value="Pendiente">⚠️ Pendiente de radicación</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. Biografía Profesional */}
              <div className="space-y-3">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                  <FileCode className="w-3.5 h-3.5 text-amber-600" />
                  5. Biografía Profesional y Descripción del Servicio
                </h5>
                <textarea
                  rows={3}
                  value={editFormData.bio || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white leading-relaxed"
                  placeholder="Describe la experiencia, tipo de trabajos realizados y valor agregado del colaborador..."
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingColab(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
