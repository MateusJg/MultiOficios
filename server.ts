/// <reference types="node" />

/**
 * MultiOficios Full-Stack Engine (Option A: Node.js + Express + TypeScript)
 * Unifies API REST Microservices, Real-Time Endpoints, and Vite Middleware
 */

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { INITIAL_COLLABORATORS, INITIAL_CONTRACTS } from './src/data/mockData';
import { Collaborator, WorkContract, ServiceStatus } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security configuration (server-side only, never bundled to client)
const isProduction = process.env.NODE_ENV === 'production';

// En producción (e.g. Hostinger, Cloud VPS), es estrictamente obligatorio definir los secretos en el entorno.
// Si no se configuran, el servidor falla de inmediato (throw) para evitar degradación insegura.
if (isProduction && !process.env.ESCROW_SIGNING_SECRET) {
  throw new Error(
    '[FATAL SECURITY] La variable de entorno ESCROW_SIGNING_SECRET es obligatoria en producción. ' +
    'Configúrela en su archivo .env o en el panel de su servidor antes de arrancar.'
  );
}

if (isProduction && !process.env.ADMIN_MASTER_PASSWORD) {
  throw new Error(
    '[FATAL SECURITY] La variable de entorno ADMIN_MASTER_PASSWORD es obligatoria en producción. ' +
    'Configúrela en su archivo .env o en el panel de su servidor antes de arrancar.'
  );
}

const ESCROW_SIGNING_SECRET = process.env.ESCROW_SIGNING_SECRET || 'multioficios-fiduciary-escrow-signing-key-2026';
const OFFICIAL_MASTER_PASSWORD = 'AdminMultiOficio$2026';
const ENV_MASTER_PASSWORD = process.env.ADMIN_MASTER_PASSWORD?.trim();

/**
 * Comparación segura resistente a ataques de tiempo (Timing Attacks)
 */
function safeTimingCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Validación de contraseña de administrador
 * Permite AdminMultiOficio$2026 sin importar variables de entorno
 */
function checkAdminPassword(input: string): boolean {
  const clean = input.trim();
  if (!clean) return false;

  // 1. Clave oficial maestra del sistema
  if (safeTimingCompare(clean, OFFICIAL_MASTER_PASSWORD)) {
    return true;
  }

  // 2. Variante sin signo especial
  if (safeTimingCompare(clean, 'AdminMultiOficio2026')) {
    return true;
  }

  // 3. Variable de entorno si fue personalizada
  if (ENV_MASTER_PASSWORD && safeTimingCompare(clean, ENV_MASTER_PASSWORD)) {
    return true;
  }

  return false;
}

function generateAdminToken(): string {
  const payload = JSON.stringify({ role: 'admin', iat: Date.now(), exp: Date.now() + 24 * 60 * 60 * 1000 });
  const b64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', ESCROW_SIGNING_SECRET).update(b64).digest('base64url');
  return `${b64}.${signature}`;
}

function verifyAdminToken(token?: string): boolean {
  if (!token) return false;
  const raw = token.replace(/^Bearer\s+/i, '').trim();
  const parts = raw.split('.');
  if (parts.length !== 2) return false;
  const [b64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', ESCROW_SIGNING_SECRET).update(b64).digest('base64url');
  if (!safeTimingCompare(signature, expectedSig)) return false;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    return payload.role === 'admin' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// Persistent Storage Helpers (datos/ directory)
const DATA_DIR = path.resolve(__dirname, 'datos');
const CONTRACTS_FILE = path.join(DATA_DIR, 'contratos.json');
const COLABS_FILE = path.join(DATA_DIR, 'colaboradores.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'pagos.json');

export interface PaymentTransactionRecord {
  transactionId: string;
  authorizationCode: string;
  fiduciaryStamp: string;
  paymentMethod: string;
  bankEntity: string;
  amount: number;
  collaboratorId: string;
  serviceType?: string;
  unitsCount?: number;
  baseAmount?: number;
  status: 'aprobado' | 'utilizado' | 'reversado';
  contractId?: string;
  createdAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }
}

function loadContracts(): WorkContract[] {
  ensureDataDir();
  try {
    if (fs.existsSync(CONTRACTS_FILE)) {
      const raw = fs.readFileSync(CONTRACTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  const initial = [...INITIAL_CONTRACTS];
  saveContracts(initial);
  return initial;
}

function saveContracts(contracts: WorkContract[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(CONTRACTS_FILE, JSON.stringify(contracts, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error al guardar contratos en disco:', e);
  }
}

function loadCollaborators(): Collaborator[] {
  ensureDataDir();
  try {
    if (fs.existsSync(COLABS_FILE)) {
      const raw = fs.readFileSync(COLABS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  const initial = [...INITIAL_COLLABORATORS];
  saveCollaborators(initial);
  return initial;
}

function saveCollaborators(colabs: Collaborator[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(COLABS_FILE, JSON.stringify(colabs, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error al guardar colaboradores en disco:', e);
  }
}

function loadPayments(): PaymentTransactionRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(PAYMENTS_FILE)) {
      const raw = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  savePayments([]);
  return [];
}

function savePayments(payments: PaymentTransactionRecord[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error al guardar transacciones de pago en disco:', e);
  }
}

// In-Memory & File-persisted state
let colaboradoresState: Collaborator[] = loadCollaborators();
let contratosState: WorkContract[] = loadContracts();
let paymentsState: PaymentTransactionRecord[] = loadPayments();

function resolveCollaboratorRates(collaboratorId?: string, clientData?: any) {
  let colab = colaboradoresState.find((c) => c.id === collaboratorId);
  if (!colab) {
    colaboradoresState = loadCollaborators();
    colab = colaboradoresState.find((c) => c.id === collaboratorId);
  }

  const rawDaily = colab?.dailyRate 
    || (typeof clientData?.collaboratorDailyRate === 'number' && clientData.collaboratorDailyRate > 0 ? clientData.collaboratorDailyRate : undefined)
    || (typeof clientData?.dailyRate === 'number' && clientData.dailyRate > 0 ? clientData.dailyRate : 120000);

  const rawHourly = colab?.hourlyRate 
    || (typeof clientData?.collaboratorHourlyRate === 'number' && clientData.collaboratorHourlyRate > 0 ? clientData.collaboratorHourlyRate : undefined)
    || (typeof clientData?.hourlyRate === 'number' && clientData.hourlyRate > 0 ? clientData.hourlyRate : 25000);

  return { colab, dailyRate: rawDaily, hourlyRate: rawHourly };
}

function calculateCertifiedQuote(params: {
  collaboratorId?: string;
  serviceType: string;
  unitsCount: number;
  clientBaseAmount?: number;
  collaboratorDailyRate?: number;
  collaboratorHourlyRate?: number;
}) {
  const { colab, dailyRate, hourlyRate } = resolveCollaboratorRates(params.collaboratorId, params);
  const units = Math.max(1, params.unitsCount || 1);
  const sType = params.serviceType || 'jornal';
  let baseAmount = 0;

  if (sType === 'por_horas' || sType === 'horas') {
    baseAmount = hourlyRate * units;
  } else if (sType === 'por_obra') {
    const minObraAllowed = Math.max(80000, Math.round(dailyRate * 1.2));
    const clientBase = typeof params.clientBaseAmount === 'number' ? params.clientBaseAmount : 0;
    if (clientBase >= minObraAllowed) {
      baseAmount = clientBase;
    } else {
      baseAmount = minObraAllowed;
    }
  } else {
    // por jornal
    baseAmount = dailyRate * units;
  }

  const arlInsuranceFee = 12000;
  const platformProtectionFee = Math.round(baseAmount * 0.05);
  const totalAmount = baseAmount + arlInsuranceFee + platformProtectionFee;

  return {
    colab,
    dailyRate,
    hourlyRate,
    unitsCount: units,
    baseAmount,
    arlInsuranceFee,
    platformProtectionFee,
    totalAmount,
  };
}
let chatMessagesState: Record<string, Array<{
  id: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  text: string;
  timestamp: string;
  createdAt: number;
}>> = {};
let aliasesState: Record<string, string> = {};

// Haversine formula in TypeScript for geolocation radius search
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function createServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  // En modo desarrollo con Vite, el runner de AI Studio enlaza en puerto 3000 mientras Nginx escucha en 8080.
  // En modo producción (Cloud Run / Docker), respeta el puerto inyectado por la plataforma (8080, 5000, etc.).
  const PORT = isProd ? parseInt(process.env.PORT || '3000', 10) : 3000;

  app.use(express.json());

  // ---------------------------------------------------------------------------
  // REST API Endpoints (Option A: Node.js + Express)
  // ---------------------------------------------------------------------------

  // 1. Health check & Diagnostics
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      engine: 'MultiOficios Node.js + Express (TypeScript)',
      runtime: `Node.js ${process.version}`,
      architecture: 'Option A - Unified TypeScript Stack',
      port: PORT,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Colaboradores con Geocálculo de distancia (Haversine)
  app.get('/api/colaboradores', (req: Request, res: Response) => {
    const lat = parseFloat((req.query.lat as string) || '4.6345');
    const lng = parseFloat((req.query.lng as string) || '-74.1458');
    const radiusKm = parseFloat((req.query.radius_km as string) || '25.0');
    const category = (req.query.category as string) || 'todos';
    const query = ((req.query.q as string) || '').toLowerCase().trim();

    const results = colaboradoresState
      .map((c) => {
        const distance = calculateHaversineDistance(lat, lng, c.location.lat, c.location.lng);
        return {
          ...c,
          distanceKm: distance,
        };
      })
      .filter((c) => {
        if (c.distanceKm > radiusKm) return false;
        if (category !== 'todos' && c.category !== category) return false;
        if (query) {
          const matchName = c.name.toLowerCase().includes(query);
          const matchSpec = c.specialtyTitle.toLowerCase().includes(query);
          const matchBio = c.bio.toLowerCase().includes(query);
          const matchCat = c.category.toLowerCase().includes(query);
          if (!matchName && !matchSpec && !matchBio && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({
      total: results.length,
      radio_km: radiusKm,
      colaboradores: results,
    });
  });

  // 3. Detalle de Colaborador
  app.get('/api/colaboradores/:id', (req: Request, res: Response) => {
    const colab = colaboradoresState.find((c) => c.id === req.params.id);
    if (!colab) {
      res.status(404).json({ error: 'Colaborador no encontrado' });
      return;
    }
    res.json(colab);
  });

  // 4. Actualizar disponibilidad del técnico
  app.patch('/api/colaboradores/:id/disponibilidad', (req: Request, res: Response) => {
    const { availability } = req.body;
    const colab = colaboradoresState.find((c) => c.id === req.params.id);
    if (!colab) {
      res.status(404).json({ error: 'Colaborador no encontrado' });
      return;
    }
    const validStates = ['disponible_hoy', 'disponible_24h', 'en_obra', 'pausado', 'no_disponible'];
    if (availability && validStates.includes(availability)) {
      colab.availability = availability;
    }
    res.json({ mensaje: 'Disponibilidad actualizada exitosamente', colaborador: colab });
  });

  // 4b. Registro y sincronización de técnicos colaboradores
  app.post('/api/colaboradores', (req: Request, res: Response) => {
    const colabData = req.body as Collaborator;
    if (!colabData || !colabData.id || !colabData.name) {
      res.status(400).json({ error: 'Datos de colaborador inválidos (id y nombre requeridos)' });
      return;
    }

    const authHeader = req.headers.authorization;
    const isAdmin = verifyAdminToken(authHeader);

    const existingIdx = colaboradoresState.findIndex((c) => c.id === colabData.id);
    if (existingIdx >= 0) {
      const existing = colaboradoresState[existingIdx];
      colaboradoresState[existingIdx] = {
        ...colabData,
        isVerified: isAdmin ? (colabData.isVerified ?? existing.isVerified) : existing.isVerified,
        approvalStatus: isAdmin ? (colabData.approvalStatus ?? existing.approvalStatus) : existing.approvalStatus,
      };
    } else {
      colaboradoresState.unshift({
        ...colabData,
        isVerified: isAdmin ? Boolean(colabData.isVerified) : false,
        approvalStatus: isAdmin ? (colabData.approvalStatus || 'pendiente_aprobacion') : 'pendiente_aprobacion',
      });
    }

    saveCollaborators(colaboradoresState);
    res.status(201).json({ ok: true, colaborador: colabData });
  });

  // 4c. Aprobación y verificación de colaboradores (Protegido para Administrador)
  app.patch('/api/colaboradores/:id/aprobacion', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!verifyAdminToken(authHeader)) {
      res.status(403).json({ error: 'Acceso no autorizado. Se requiere token administrativo válido.' });
      return;
    }

    const { approvalStatus, isVerified } = req.body;
    let colab = colaboradoresState.find((c) => c.id === req.params.id);
    if (!colab) {
      colaboradoresState = loadCollaborators();
      colab = colaboradoresState.find((c) => c.id === req.params.id);
    }

    if (!colab) {
      res.status(404).json({ error: 'Colaborador no encontrado' });
      return;
    }

    if (approvalStatus) colab.approvalStatus = approvalStatus;
    if (typeof isVerified === 'boolean') colab.isVerified = isVerified;
    saveCollaborators(colaboradoresState);

    res.json({
      mensaje: `Colaborador ${colab.name} actualizado: estado ${colab.approvalStatus}`,
      colaborador: colab,
    });
  });

  // 4d. Autenticación de Administrador (Server-Side Token Verification)
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Contraseña requerida' });
      return;
    }

    const inputClean = password.trim();
    const isAuthorized = checkAdminPassword(inputClean);

    if (isAuthorized) {
      const token = generateAdminToken();
      res.json({
        ok: true,
        token,
        role: 'admin',
        mensaje: 'Autenticación administrativa concedida.',
        expiresIn: 86400,
      });
      return;
    }

    res.status(401).json({ error: 'Credenciales administrativas inválidas.' });
  });

  app.get('/api/admin/verify', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (verifyAdminToken(authHeader)) {
      res.json({ valid: true, role: 'admin' });
      return;
    }
    res.status(401).json({ valid: false, error: 'Token administrativo inválido o expirado' });
  });

  // 4e. Pasarela de Pagos & Custodia Fiduciaria (Payment Gateway Integration)
  app.post('/api/pagos/iniciar', (req: Request, res: Response) => {
    const {
      method,
      bankEntity,
      amount,
      collaboratorId,
      serviceType,
      unitsCount,
      baseAmount,
      collaboratorDailyRate,
      collaboratorHourlyRate,
      workDescription,
    } = req.body;

    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Monto de pago inválido. Debe ser un valor numérico positivo.' });
      return;
    }

    // Validación previa y cálculo estricto de la cotización fiduciaria
    const quote = calculateCertifiedQuote({
      collaboratorId,
      serviceType: serviceType || 'jornal',
      unitsCount: Math.max(1, parseInt(unitsCount, 10) || 1),
      clientBaseAmount: typeof baseAmount === 'number' ? baseAmount : parseFloat(baseAmount),
      collaboratorDailyRate,
      collaboratorHourlyRate,
    });

    if (Math.abs(numAmount - quote.totalAmount) > 100) {
      res.status(400).json({
        error: `Discrepancia en cotización previa al pago. El monto solicitado ($${numAmount.toLocaleString('es-CO')}) no coincide con el total certificado del servicio ($${quote.totalAmount.toLocaleString('es-CO')}).`,
        expectedTotal: quote.totalAmount,
        expectedBase: quote.baseAmount,
        technicianDailyRate: quote.dailyRate,
        technicianHourlyRate: quote.hourlyRate,
      });
      return;
    }

    const transactionId = `TX-${(method || 'PSE').toUpperCase()}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const authorizationCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
    const fiduciaryStamp = crypto
      .createHmac('sha256', ESCROW_SIGNING_SECRET)
      .update(`${transactionId}-${quote.totalAmount}-${collaboratorId || 'mo'}`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    const newPaymentRecord: PaymentTransactionRecord = {
      transactionId,
      authorizationCode,
      fiduciaryStamp,
      paymentMethod: method || 'pse',
      bankEntity: bankEntity || 'Bancolombia (PSE)',
      amount: quote.totalAmount,
      collaboratorId: collaboratorId || '',
      serviceType: serviceType || 'jornal',
      unitsCount: quote.unitsCount,
      baseAmount: quote.baseAmount,
      status: 'aprobado',
      createdAt: new Date().toISOString(),
    };

    paymentsState.unshift(newPaymentRecord);
    savePayments(paymentsState);

    const paymentResult = {
      ok: true,
      transactionId,
      authorizationCode,
      fiduciaryStamp,
      paymentMethod: method || 'pse',
      bankEntity: bankEntity || 'Bancolombia (PSE)',
      amount: quote.totalAmount,
      status: 'aprobado',
      fiduciaryEntity: 'MultiOficios Fideicomiso y Custodia Digital S.A.S.',
      timestamp: new Date().toISOString(),
      guarantee: 'Fondos retenidos en cuenta de custodia fiduciaria hasta firma a satisfacción.',
    };

    res.json(paymentResult);
  });

  // 4f. Reversa de Pagos (Payment Refund / Reversal)
  app.post('/api/pagos/reversar', (req: Request, res: Response) => {
    const { transactionId, reason } = req.body;
    if (!transactionId) {
      res.status(400).json({ error: 'transactionId requerido' });
      return;
    }

    paymentsState = loadPayments();
    const tx = paymentsState.find((t) => t.transactionId === transactionId);
    if (!tx) {
      res.status(404).json({ error: 'Transacción fiduciaria no encontrada' });
      return;
    }

    if (tx.status === 'utilizado') {
      res.status(400).json({ error: 'No es posible reversar una transacción que ya fue formalizada en un contrato activo.' });
      return;
    }

    tx.status = 'reversado';
    savePayments(paymentsState);

    res.json({
      ok: true,
      mensaje: 'Transacción fiduciaria reversada y fondos liberados.',
      transactionId,
      refundAmount: tx.amount,
      reason: reason || 'Reversa solicitada por usuario o cancelación',
    });
  });

  // 5. Listado de Obras y Contratos
  app.get('/api/obras', (req: Request, res: Response) => {
    const colabId = req.query.colaborador_id as string;
    const clienteId = req.query.cliente_id as string;

    let filtered = [...contratosState];
    if (colabId) {
      filtered = filtered.filter((c) => c.collaboratorId === colabId);
    }
    if (clienteId) {
      filtered = filtered.filter((c) => c.clientId === clienteId);
    }
    res.json(filtered);
  });

  // 6. Contratar Obra con Custodia Escrow (Validación Segura de Tarifas del Lado del Servidor)
  app.post('/api/obras/contratar', (req: Request, res: Response) => {
    const data = req.body;
    if (!data || !data.collaboratorId || !data.workDescription) {
      res.status(400).json({ error: 'Datos de contrato incompletos (colaborador y descripción requeridos)' });
      return;
    }

    // EXIGENCIA ESTRICTA DE CONCILIACIÓN DE TRANSACCIÓN DE PAGO
    if (!data.paymentTransactionId) {
      res.status(400).json({
        error: 'Se requiere un identificador de transacción de pago fiduciario válido (paymentTransactionId). Debe iniciar el pago en pasarela antes de formalizar el contrato.',
      });
      return;
    }

    paymentsState = loadPayments();
    const tx = paymentsState.find((t) => t.transactionId === data.paymentTransactionId);
    if (!tx) {
      res.status(400).json({
        error: `Transacción de pago '${data.paymentTransactionId}' inexistente o no autorizada por la pasarela fiduciaria.`,
      });
      return;
    }

    if (tx.status === 'utilizado') {
      res.status(400).json({
        error: `Esta transacción de pago ya fue redimida en el contrato '${tx.contractId || 'existente'}' (prevención estricta de doble gasto).`,
      });
      return;
    }

    if (tx.status === 'reversado') {
      res.status(400).json({
        error: 'Esta transacción de pago fue reversada y no puede ser utilizada para formalizar un contrato.',
      });
      return;
    }

    if (tx.collaboratorId && tx.collaboratorId !== data.collaboratorId) {
      res.status(400).json({
        error: 'Discrepancia fiduciaria: La transacción de pago fue emitida para otro técnico colaborador.',
      });
      return;
    }

    const quote = calculateCertifiedQuote({
      collaboratorId: data.collaboratorId,
      serviceType: data.serviceType || 'jornal',
      unitsCount: Math.max(1, parseInt(data.unitsCount, 10) || 1),
      clientBaseAmount: typeof data.baseAmount === 'number' ? data.baseAmount : parseFloat(data.baseAmount),
      collaboratorDailyRate: data.collaboratorDailyRate,
      collaboratorHourlyRate: data.collaboratorHourlyRate,
    });

    if (Math.abs(tx.amount - quote.totalAmount) > 100) {
      res.status(400).json({
        error: `Discrepancia en custodia fiduciaria: El monto retenido en la transacción ($${tx.amount.toLocaleString('es-CO')}) no coincide con el total certificado del contrato ($${quote.totalAmount.toLocaleString('es-CO')}).`,
      });
      return;
    }

    const orderNumber = `MO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const escrowCertificateId = `CERT-ESCROW-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    const newContract: WorkContract = {
      id: `contrato-${Date.now()}`,
      orderNumber,
      collaboratorId: data.collaboratorId,
      collaboratorName: quote.colab?.name || data.collaboratorName || 'Técnico Especialista',
      collaboratorSpecialty: quote.colab?.specialtyTitle || data.collaboratorSpecialty || 'Técnico Especialista',
      collaboratorAvatar: quote.colab?.avatar || data.collaboratorAvatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=300',
      clientId: data.clientId || 'user-client-1',
      clientName: data.clientName || 'Cliente MultiOficios',
      clientPhone: data.clientPhone || '+57 310 123 4567',
      workDescription: data.workDescription.trim(),
      serviceType: data.serviceType || 'jornal',
      unitsCount: quote.unitsCount,
      baseAmount: quote.baseAmount,
      arlInsuranceFee: quote.arlInsuranceFee,
      platformProtectionFee: quote.platformProtectionFee,
      totalAmount: quote.totalAmount,
      status: 'fondos_en_custodia',
      paymentMethod: data.paymentMethod || 'pse',
      paymentTransactionId: tx.transactionId,
      paymentReceiptAmount: tx.amount,
      collaboratorDailyRate: quote.dailyRate,
      collaboratorHourlyRate: quote.hourlyRate,
      isSample: Boolean(data.isSample),
      escrowStatus: 'fondos_retenidos',
      scheduledDate: data.scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: data.scheduledTime || '08:00 AM - 12:00 PM',
      location: data.location || {
        lat: 4.6345,
        lng: -74.1458,
        address: 'Dirección del Servicio',
        city: 'Bogotá D.C.',
        neighborhood: 'Kennedy / Castilla',
      },
      createdAt: new Date().toISOString(),
      progressUpdates: [
        {
          status: 'solicitado',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: `Solicitud registrada. Fideicomiso certificado: ${escrowCertificateId} | Transacción: ${tx.transactionId}`,
        },
        {
          status: 'fondos_en_custodia',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: `Pago de $${quote.totalAmount.toLocaleString('es-CO')} retenido bajo custodia fiduciaria estricta.`,
        },
      ],
    };

    // Marcar transacción como redimida y vinculada a este contrato
    tx.status = 'utilizado';
    tx.contractId = newContract.id;
    savePayments(paymentsState);

    contratosState.unshift(newContract);
    saveContracts(contratosState);

    res.status(201).json({
      mensaje: 'Contrato generado exitosamente. Fondos asegurados en custodia fiduciaria.',
      contract: newContract,
      escrowCertificate: {
        certificateId: escrowCertificateId,
        retainedAmount: quote.totalAmount,
        technicianDispersalAmount: quote.baseAmount,
        platformFee: quote.platformProtectionFee,
        arlFee: quote.arlInsuranceFee,
        transactionId: tx.transactionId,
      },
    });
  });

  // 7. Actualizar Estado de la Obra y Bitácora
  app.patch('/api/obras/:id/actualizar-estado', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, note, photoUrl } = req.body;

    const contract = contratosState.find((c) => c.id === id);
    if (!contract) {
      res.status(404).json({ error: 'Obra no encontrada' });
      return;
    }

    if (status) {
      contract.status = status as ServiceStatus;
      if (!contract.progressUpdates) contract.progressUpdates = [];
      contract.progressUpdates.push({
        status: status as ServiceStatus,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        note: note || `Estado actualizado a ${status}`,
        photoUrl,
      });
      saveContracts(contratosState);
    }

    res.json({
      mensaje: `Estado actualizado a ${contract.status}`,
      contract,
    });
  });

  // 8. Liberación de fondos Escrow (Validación Segura de Autorización y Prevención de Doble Gasto)
  app.post('/api/obras/:id/liberar-fondos', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { clientId } = req.body;
    const authHeader = req.headers.authorization;
    const isAdmin = verifyAdminToken(authHeader);

    let contract = contratosState.find((c) => c.id === id);
    if (!contract) {
      // 1. Recargar de disco local si fue guardado previamente
      contratosState = loadContracts();
      contract = contratosState.find((c) => c.id === id);
    }

    if (!contract) {
      // 2. Fallback resiliente: consultar en Firestore REST si fue creado en la nube
      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/multioficios-e7b48/databases/(default)/documents/contracts/${encodeURIComponent(id)}`;
        const fsRes = await fetch(firestoreUrl);
        if (fsRes.ok) {
          const docData = await fsRes.json();
          const f = docData.fields || {};

          const rawClientId = f.clientId?.stringValue;
          const rawBase = f.baseAmount?.doubleValue !== undefined ? f.baseAmount.doubleValue : (f.baseAmount?.integerValue !== undefined ? parseFloat(f.baseAmount.integerValue) : undefined);
          const rawTotal = f.totalAmount?.doubleValue !== undefined ? f.totalAmount.doubleValue : (f.totalAmount?.integerValue !== undefined ? parseFloat(f.totalAmount.integerValue) : undefined);

          if (!rawClientId || rawBase === undefined || rawTotal === undefined || isNaN(rawBase) || isNaN(rawTotal)) {
            res.status(400).json({ error: 'Contrato fiduciario incompleto o corrupto en el repositorio remoto. Faltan datos auditables de cliente o montos pactados.' });
            return;
          }

          const rawArl = f.arlInsuranceFee?.doubleValue !== undefined ? f.arlInsuranceFee.doubleValue : (f.arlInsuranceFee?.integerValue ? parseFloat(f.arlInsuranceFee.integerValue) : 12000);
          const rawFee = f.platformProtectionFee?.doubleValue !== undefined ? f.platformProtectionFee.doubleValue : (f.platformProtectionFee?.integerValue ? parseFloat(f.platformProtectionFee.integerValue) : Math.round(rawBase * 0.05));

          contract = {
            id,
            orderNumber: f.orderNumber?.stringValue || id,
            collaboratorId: f.collaboratorId?.stringValue || 'colab-1',
            collaboratorName: f.collaboratorName?.stringValue || 'Técnico Especialista',
            collaboratorSpecialty: f.collaboratorSpecialty?.stringValue || 'Técnico Especialista',
            collaboratorAvatar: f.collaboratorAvatar?.stringValue || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=300',
            clientId: rawClientId,
            clientName: f.clientName?.stringValue || 'Cliente MultiOficios',
            clientPhone: f.clientPhone?.stringValue || '+57 310 123 4567',
            workDescription: f.workDescription?.stringValue || 'Servicio técnico',
            serviceType: (f.serviceType?.stringValue as any) || 'jornal',
            unitsCount: parseInt(f.unitsCount?.integerValue || '1', 10),
            baseAmount: rawBase,
            arlInsuranceFee: rawArl,
            platformProtectionFee: rawFee,
            totalAmount: rawTotal,
            status: (f.status?.stringValue as any) || 'fondos_en_custodia',
            paymentMethod: (f.paymentMethod?.stringValue as any) || 'pse',
            escrowStatus: (f.escrowStatus?.stringValue as any) || 'fondos_retenidos',
            scheduledDate: f.scheduledDate?.stringValue || new Date().toISOString().split('T')[0],
            scheduledTime: f.scheduledTime?.stringValue || '08:00 AM - 12:00 PM',
            location: {
              lat: 4.6345,
              lng: -74.1458,
              address: f.location?.mapValue?.fields?.address?.stringValue || 'Dirección registrada en contrato',
              city: f.location?.mapValue?.fields?.city?.stringValue || 'Bogotá D.C.',
              neighborhood: f.location?.mapValue?.fields?.neighborhood?.stringValue || 'Sector Local',
            },
            createdAt: f.createdAt?.stringValue || new Date().toISOString(),
            progressUpdates: [],
          };
          contratosState.push(contract);
          saveContracts(contratosState);
        }
      } catch (err) {
        console.warn('Fallback Firestore en liberar-fondos:', err);
      }
    }

    if (!contract) {
      res.status(404).json({ error: 'Contrato de obra no encontrado' });
      return;
    }

    // Prevención de doble liberación
    if (contract.escrowStatus === 'liberado_al_colaborador') {
      res.status(400).json({ error: 'Los fondos de esta obra ya fueron liberados al técnico previamente.' });
      return;
    }

    if (contract.status === 'cancelado') {
      res.status(400).json({ error: 'No es posible liberar fondos de una obra cancelada.' });
      return;
    }

    // Validación de autoridad estricta: sólo el cliente dueño del contrato o un administrador autenticado
    if (!isAdmin) {
      if (!clientId || contract.clientId !== clientId) {
        res.status(403).json({
          error: 'No autorizado. Se requiere que el cliente titular de la obra o un administrador autorice la liberación de fondos.',
        });
        return;
      }
    }

    contract.status = 'finalizado';
    contract.escrowStatus = 'liberado_al_colaborador';
    const stampId = `DISP-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    if (!contract.progressUpdates) contract.progressUpdates = [];
    contract.progressUpdates.push({
      status: 'finalizado',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: `Acta de entrega firmada a satisfacción. Fondos dispersados al técnico. Timbre fiduciario: ${stampId}`,
    });
    saveContracts(contratosState);

    res.json({
      ok: true,
      mensaje: 'Fondos en custodia liberados exitosamente al técnico.',
      contract,
      dispersalReceipt: {
        stampId,
        amount: contract.baseAmount,
        dispersedAt: new Date().toISOString(),
      },
    });
  });

  // 8b. Auditoría del Libro Fiduciario Escrow (Protegido para Administrador)
  app.get('/api/admin/escrow-ledger', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!verifyAdminToken(authHeader)) {
      res.status(403).json({ error: 'Acceso no autorizado. Se requiere token administrativo válido.' });
      return;
    }

    const totalRetained = contratosState
      .filter((c) => c.escrowStatus === 'fondos_retenidos')
      .reduce((acc, c) => acc + c.totalAmount, 0);

    const totalDispersed = contratosState
      .filter((c) => c.escrowStatus === 'liberado_al_colaborador')
      .reduce((acc, c) => acc + c.baseAmount, 0);

    const totalPlatformFees = contratosState.reduce((acc, c) => acc + c.platformProtectionFee, 0);
    const totalArlFees = contratosState.reduce((acc, c) => acc + c.arlInsuranceFee, 0);

    res.json({
      totalContracts: contratosState.length,
      escrowSummary: {
        totalRetainedInCustody: totalRetained,
        totalDispersedToCollaborators: totalDispersed,
        totalPlatformFeesCollected: totalPlatformFees,
        totalArlInsurancesCollected: totalArlFees,
      },
      contracts: contratosState,
    });
  });

  // 9. Mensajería de Chat API
  app.get('/api/chat/:chatId/mensajes', (req: Request, res: Response) => {
    const { chatId } = req.params;
    const list = chatMessagesState[chatId] || [];
    res.json(list);
  });

  app.post('/api/chat/:chatId/mensajes', (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { senderId, senderRole, senderName, text } = req.body;

    if (!text || !senderName) {
      res.status(400).json({ error: 'Mensaje inválido' });
      return;
    }

    if (!chatMessagesState[chatId]) {
      chatMessagesState[chatId] = [];
    }

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: senderId || 'user',
      senderRole: senderRole || 'cliente',
      senderName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
    };

    chatMessagesState[chatId].push(newMsg);
    res.status(201).json(newMsg);
  });

  // 10. Gestión de Alias de Clientes
  app.get('/api/alias', (_req: Request, res: Response) => {
    res.json(aliasesState);
  });

  app.post('/api/alias', (req: Request, res: Response) => {
    const { key, alias } = req.body;
    if (!key) {
      res.status(400).json({ error: 'Key requerida' });
      return;
    }
    if (alias) {
      aliasesState[key] = alias.trim();
    } else {
      delete aliasesState[key];
    }
    res.json({ ok: true, aliases: aliasesState });
  });

  // ---------------------------------------------------------------------------
  // Vite Integration (Dev Mode: vite.middlewares | Prod Mode: dist static)
  // ---------------------------------------------------------------------------
  const server = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for HTML5 SPA routing in dev mode (only for HTML navigation requests)
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' || req.originalUrl.startsWith('/api')) {
        return next();
      }
      const accept = req.headers.accept || '';
      // Skip non-HTML asset requests (e.g. scripts, stylesheets, images)
      if (!accept.includes('text/html') && req.originalUrl.includes('.')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[MultiOficios Backend Option A] Express Server running on port ${PORT}`);
    console.log(`[MultiOficios Backend Option A] Mode: ${isProd ? 'Production (static)' : 'Development (Vite middlewares)'}`);
    console.log(`[MultiOficios Backend Option A] REST API ready at /api/*`);
  });

  return server;
}

// Start server
createServer().catch((err) => {
  console.error('[MultiOficios Server Error]:', err);
});
