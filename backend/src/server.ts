/**
 * MultiOficios Microservice Backend
 * Framework: Node.js + Express (TypeScript) - Option A
 * Port: 5000 (Standard Microservice Port)
 */

import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// Seed data: Bogotá technicians
interface Colaborador {
  id: string;
  nombre: string;
  avatar_url: string;
  especialidad: string;
  categoria: string;
  lat: number;
  lng: number;
  barrio: string;
  ciudad: string;
  calificacion: number;
  total_resenas: number;
  anos_experiencia: number;
  obras_completadas: number;
  es_verificado: boolean;
  disponibilidad: string;
  tarifa_jornal: number;
  tarifa_hora: number;
  bio: string;
  arl_nivel: string;
  herramientas: string[];
  telefono: string;
  distancia_km?: number;
}

const COLABORADORES_SEED: Colaborador[] = [
  {
    id: 'colab-1',
    nombre: 'Hernán Darío Velásquez',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    especialidad: 'Maestro Carpintero, Ebanista y Muebles Modulares',
    categoria: 'carpinteria',
    lat: 4.6295,
    lng: -74.152,
    barrio: 'Kennedy / Castilla',
    ciudad: 'Bogotá D.C.',
    calificacion: 4.9,
    total_resenas: 31,
    anos_experiencia: 14,
    obras_completadas: 39,
    es_verificado: true,
    disponibilidad: 'disponible_hoy',
    tarifa_jornal: 125000,
    tarifa_hora: 25000,
    bio: '14 años de experiencia fabricando, armando e instalando cocinas integrales, closets empotrados y cerraduras de seguridad.',
    arl_nivel: 'Riesgo III',
    herramientas: ['Sierra circular DeWalt', 'Taladro percutor', 'Router', 'Nivel láser autonivelante'],
    telefono: '3124567890',
  },
  {
    id: 'colab-2',
    nombre: 'Carlos Eduardo Pineda',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    especialidad: 'Técnico Plomero Hidrosanitario y Destapes',
    categoria: 'plomeria',
    lat: 4.641,
    lng: -74.135,
    barrio: 'Américas Occidental',
    ciudad: 'Bogotá D.C.',
    calificacion: 4.95,
    total_resenas: 53,
    anos_experiencia: 11,
    obras_completadas: 74,
    es_verificado: true,
    disponibilidad: 'disponible_hoy',
    tarifa_jornal: 130000,
    tarifa_hora: 26000,
    bio: 'Especialista en termofusión PPR, detección de fugas no visibles con geófono ultrasónico y destapes sin romper.',
    arl_nivel: 'Riesgo III',
    herramientas: ['Termofusora digital', 'Sonda eléctrica Ridgid K-45', 'Detector geófono de fugas'],
    telefono: '3102345678',
  },
  {
    id: 'colab-3',
    nombre: 'Nelson Enrique Fajardo',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    especialidad: 'Técnico Electricista Certificado Contec / Retie',
    categoria: 'electricidad',
    lat: 4.649,
    lng: -74.12,
    barrio: 'Puente Aranda / Ciudad Montes',
    ciudad: 'Bogotá D.C.',
    calificacion: 4.9,
    total_resenas: 29,
    anos_experiencia: 9,
    obras_completadas: 41,
    es_verificado: true,
    disponibilidad: 'disponible_hoy',
    tarifa_jornal: 135000,
    tarifa_hora: 27000,
    bio: 'Instalaciones eléctricas residenciales y comerciales bajo norma RETIE. Cuadros de breakers, balanceo de cargas y cableado estructurado.',
    arl_nivel: 'Riesgo IV',
    herramientas: ['Multímetro Fluke profesional', 'Pinza voltiamperimétrica', 'Probador de aislamiento Megger'],
    telefono: '3158765432',
  },
];

let colaboradores = [...COLABORADORES_SEED];
let obras: any[] = [];
let mensajes: Record<string, any[]> = {};

// Haversine formula calculation
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ---------------------------------------------------------------------------
// REST API Routes
// ---------------------------------------------------------------------------

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    microservice: 'MultiOficios Backend (Option A: Node.js + Express)',
    runtime: `Node.js ${process.version}`,
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Colaboradores con geolocalización
app.get('/api/colaboradores', (req: Request, res: Response) => {
  const lat = parseFloat((req.query.lat as string) || '4.6345');
  const lng = parseFloat((req.query.lng as string) || '-74.1458');
  const radiusKm = parseFloat((req.query.radius_km as string) || '25.0');
  const category = (req.query.category as string) || 'todos';
  const query = ((req.query.q as string) || '').toLowerCase().trim();

  const results = colaboradores
    .map((c) => ({
      ...c,
      distancia_km: haversineKm(lat, lng, c.lat, c.lng),
    }))
    .filter((c) => {
      if (c.distancia_km > radiusKm) return false;
      if (category !== 'todos' && c.categoria !== category) return false;
      if (query && !c.nombre.toLowerCase().includes(query) && !c.especialidad.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.distancia_km - b.distancia_km);

  res.json({
    total: results.length,
    radio_km: radiusKm,
    colaboradores: results,
  });
});

// Detalle colaborador
app.get('/api/colaboradores/:id', (req: Request, res: Response) => {
  const colab = colaboradores.find((c) => c.id === req.params.id);
  if (!colab) {
    res.status(404).json({ error: 'Colaborador no encontrado' });
    return;
  }
  res.json(colab);
});

// Obras
app.get('/api/obras', (req: Request, res: Response) => {
  const clienteId = req.query.cliente_id as string;
  if (clienteId) {
    res.json(obras.filter((o) => o.cliente_id === clienteId));
    return;
  }
  res.json(obras);
});

// Contratar obra con custodia Escrow
app.post('/api/obras/contratar', (req: Request, res: Response) => {
  const data = req.body;
  const nuevaObra = {
    id: `obra-${Date.now()}`,
    cliente_id: data.cliente_id || 'user-me',
    cliente_nombre: data.cliente_nombre || 'Cliente MultiOficios',
    colaborador_id: data.colaborador_id,
    descripcion: data.descripcion,
    direccion: data.direccion || 'Bogotá D.C.',
    lat: data.lat || 4.6345,
    lng: data.lng || -74.1458,
    monto_total: data.monto_total,
    estado: 'fondos_en_custodia',
    pago_custodia: {
      monto: data.monto_total,
      estado: 'fondos_retenidos_fiduciaria',
      fecha: new Date().toISOString(),
    },
    fecha_creacion: new Date().toISOString(),
  };

  obras.unshift(nuevaObra);
  res.status(201).json({
    mensaje: 'Contrato creado con éxito en Node.js Express. Fondos retenidos bajo custodia fiduciaria.',
    obra: nuevaObra,
  });
});

// Liberar fondos
app.post('/api/obras/:id/liberar-fondos', (req: Request, res: Response) => {
  const obra = obras.find((o) => o.id === req.params.id);
  if (!obra) {
    res.status(404).json({ error: 'Obra no encontrada' });
    return;
  }
  obra.estado = 'finalizado';
  if (obra.pago_custodia) {
    obra.pago_custodia.estado = 'liberado_al_colaborador';
    obra.pago_custodia.fecha_liberacion = new Date().toISOString();
  }
  res.json({
    mensaje: 'Fondos en custodia liberados exitosamente al técnico.',
    obra,
  });
});

// Chat
app.get('/api/chat/:obraId/mensajes', (req: Request, res: Response) => {
  res.json(mensajes[req.params.obraId] || []);
});

app.post('/api/chat/:obraId/mensajes', (req: Request, res: Response) => {
  const { obraId } = req.params;
  const { remitente_id, remitente_rol, texto } = req.body;
  if (!mensajes[obraId]) mensajes[obraId] = [];

  const msg = {
    id: `msg-${Date.now()}`,
    obra_id: obraId,
    remitente_id,
    remitente_rol,
    texto,
    timestamp: new Date().toISOString(),
  };
  mensajes[obraId].push(msg);
  res.status(201).json(msg);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[MultiOficios Backend Microservice] Node.js + Express (TypeScript) running on port ${PORT}`);
});
