import React, { useState } from 'react';
import { 
  X, 
  FolderGit2, 
  Server, 
  Database, 
  FileCode, 
  Terminal, 
  Globe, 
  CheckCircle2, 
  Copy, 
  Download,
  Layers,
  Cloud
} from 'lucide-react';

interface DockerArchitectureModalProps {
  onClose: () => void;
}

export const DockerArchitectureModal: React.FC<DockerArchitectureModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'estructura' | 'docker' | 'backend' | 'migraciones' | 'hostinger'>('estructura');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dockerComposeSnippet = `version: '3.8'

services:
  # 1. Frontend Web (React + Vite + Tailwind CSS / Nginx)
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: multioficios_frontend
    restart: always
    ports:
      - "80:80"
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
      - "5000:5000"
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

// 3. Crear contrato de obra o labor con pago en custodia (Escrow)
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
  res.status(201).json({ mensaje: 'Contrato creado con éxito. Fondos en custodia.', obra: nuevaObra });
});

// 4. Acta de entrega y liberación de fondos al técnico
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
# -------------------------------------------------------
export FLASK_APP=backend/app.py

# 1. Inicializar el directorio de migraciones (primera vez)
flask db init

# 2. Generar migración automática tras cambiar modelos en models.py
flask db migrate -m "Agregar columnas de clasificacion ARL y huella digital"

# 3. Aplicar las migraciones a la base de datos SQLite en producción
flask db upgrade

# 4. En caso de necesitar revertir una versión anterior
flask db downgrade

# -------------------------------------------------------
# Método 2: Backup manual antes de cada migración
# -------------------------------------------------------
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Arquitectura Docker • Microservicios & Hostinger
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  DOCKER READY
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Estructura modular en 3 carpetas: <code className="text-amber-400">frontend/</code>, <code className="text-blue-400">backend/</code> y <code className="text-emerald-400">datos/</code> (Node.js + Express TS)
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

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200 px-6 bg-stone-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('estructura')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
              activeTab === 'estructura'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Estructura de 3 Carpetas
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
              activeTab === 'docker'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            docker-compose.yml
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
              activeTab === 'backend'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Backend Node.js Express (Opción A)
          </button>
          <button
            onClick={() => setActiveTab('migraciones')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
              activeTab === 'migraciones'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Migraciones SQLite
          </button>
          <button
            onClick={() => setActiveTab('hostinger')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
              activeTab === 'hostinger'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Despliegue en Hostinger VPS
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-stone-50/50">
          {activeTab === 'estructura' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Frontend */}
                <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2.5 text-amber-600">
                    <Globe className="w-5 h-5" />
                    <h4 className="font-extrabold text-stone-900 text-sm">/frontend</h4>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Interfaz de usuario responsive construida con React 19, Tailwind CSS y Vite PWA.
                  </p>
                  <ul className="text-xs text-stone-700 space-y-1 font-mono bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <li>├── index.html</li>
                    <li>├── src/</li>
                    <li>├── public/</li>
                    <li>├── package.json</li>
                    <li>└── Dockerfile (Nginx)</li>
                  </ul>
                </div>

                {/* 2. Backend */}
                <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2.5 text-blue-600">
                    <Server className="w-5 h-5" />
                    <h4 className="font-extrabold text-stone-900 text-sm">/backend (Opción A)</h4>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Microservicio en Node.js + Express (TypeScript) con API RESTful, geocálculos Haversine y pasarela Escrow.
                  </p>
                  <ul className="text-xs text-stone-700 space-y-1 font-mono bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <li>├── src/server.ts</li>
                    <li>├── package.json</li>
                    <li>├── tsconfig.json</li>
                    <li>└── Dockerfile (Node 22)</li>
                  </ul>
                </div>

                {/* 3. Datos */}
                <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-600">
                    <Database className="w-5 h-5" />
                    <h4 className="font-extrabold text-stone-900 text-sm">/datos</h4>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Persistencia relacional en SQLite, esquemas DDL, scripts de migración de versiones y utilitarios de backup.
                  </p>
                  <ul className="text-xs text-stone-700 space-y-1 font-mono bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <li>├── multioficios.db</li>
                    <li>├── schema.sql</li>
                    <li>├── init_db.py</li>
                    <li>├── migrations/</li>
                    <li>└── backup_util.py</li>
                  </ul>
                </div>
              </div>

              {/* Architecture benefits */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-stone-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Separación limpia de responsabilidades, listo para empaquetado en contenedores Docker estándar.</span>
                </div>
                <span className="font-bold text-blue-600">Hostinger & VPS Ready</span>
              </div>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">docker-compose.yml (Orquestación de Microservicios)</span>
                <button
                  onClick={() => copyToClipboard(dockerComposeSnippet, 'docker')}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-stone-200 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'docker' ? '¡Copiado!' : 'Copiar Archivo'}</span>
                </button>
              </div>

              <pre className="p-4 bg-stone-950 text-stone-200 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-stone-800">
                {dockerComposeSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'backend' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">backend/src/server.ts (Node.js + Express REST API - Opción A)</span>
                <button
                  onClick={() => copyToClipboard(expressAppSnippet, 'express')}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-stone-200 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'express' ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <pre className="p-4 bg-stone-950 text-stone-200 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-stone-800">
                {expressAppSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'migraciones' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Guía de Migraciones de Base de Datos SQLite</span>
                <button
                  onClick={() => copyToClipboard(migrationsSnippet, 'migraciones')}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-stone-200 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'migraciones' ? '¡Copiado!' : 'Copiar Comandos'}</span>
                </button>
              </div>

              <pre className="p-4 bg-stone-950 text-emerald-300 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-stone-800">
                {migrationsSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'hostinger' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Instrucciones de Despliegue en Hostinger VPS</span>
                <button
                  onClick={() => copyToClipboard(hostingerSnippet, 'hostinger')}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-stone-200 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'hostinger' ? '¡Copiado!' : 'Copiar Guía'}</span>
                </button>
              </div>

              <pre className="p-4 bg-stone-950 text-amber-200 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-stone-800">
                {hostingerSnippet}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
