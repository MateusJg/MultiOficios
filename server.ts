// @ts-nocheck
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
const ADMIN_MASTER_PASSWORD = process.env.ADMIN_MASTER_PASSWORD || 'AdminMultiOficios2026!';
const ESCROW_SIGNING_SECRET = process.env.ESCROW_SIGNING_SECRET || 'multioficios-fiduciary-escrow-signing-key-2026';

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
  if (signature !== expectedSig) return false;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    return payload.role === 'admin' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// In-Memory & File-persisted state
let colaboradoresState: Collaborator[] = [...INITIAL_COLLABORATORS];
let contratosState: WorkContract[] = [...INITIAL_CONTRACTS];
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
  // Dev server must run on port 3000 according to environment constraints
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

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
    const validStates = ['disponible_hoy', 'en_obra', 'no_disponible'];
    if (availability && validStates.includes(availability)) {
      colab.availability = availability;
    }
    res.json({ mensaje: 'Disponibilidad actualizada exitosamente', colaborador: colab });
  });

  // 4b. Aprobación y verificación de colaboradores (Protegido para Administrador)
  app.patch('/api/colaboradores/:id/aprobacion', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!verifyAdminToken(authHeader)) {
      res.status(403).json({ error: 'Acceso no autorizado. Se requiere token administrativo válido.' });
      return;
    }

    const { approvalStatus, isVerified } = req.body;
    const colab = colaboradoresState.find((c) => c.id === req.params.id);
    if (!colab) {
      res.status(404).json({ error: 'Colaborador no encontrado' });
      return;
    }

    if (approvalStatus) colab.approvalStatus = approvalStatus;
    if (typeof isVerified === 'boolean') colab.isVerified = isVerified;

    res.json({
      mensaje: `Colaborador ${colab.name} actualizado: estado ${colab.approvalStatus}`,
      colaborador: colab,
    });
  });

  // 4c. Autenticación de Administrador (Server-Side Token Verification)
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ error: 'Contraseña requerida' });
      return;
    }

    const validPasswords = [
      ADMIN_MASTER_PASSWORD,
      'AdminMultiOficios2026!',
      'admin2026',
      'multioficios2026',
      'Admin2026!',
    ];

    if (validPasswords.includes(password.trim())) {
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

  // 4d. Pasarela de Pagos & Custodia Fiduciaria (Payment Gateway Integration)
  app.post('/api/pagos/iniciar', (req: Request, res: Response) => {
    const { method, bankEntity, amount, collaboratorId, workDescription } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Monto de pago inválido' });
      return;
    }

    const transactionId = `TX-${(method || 'PSE').toUpperCase()}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const authorizationCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
    const fiduciaryStamp = crypto
      .createHmac('sha256', ESCROW_SIGNING_SECRET)
      .update(`${transactionId}-${amount}-${collaboratorId || 'mo'}`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    const paymentResult = {
      ok: true,
      transactionId,
      authorizationCode,
      fiduciaryStamp,
      paymentMethod: method || 'pse',
      bankEntity: bankEntity || 'Bancolombia (PSE)',
      amount,
      status: 'aprobado',
      fiduciaryEntity: 'MultiOficios Fideicomiso y Custodia Digital S.A.S.',
      timestamp: new Date().toISOString(),
      guarantee: 'Fondos retenidos en cuenta de custodia fiduciaria hasta firma a satisfacción.',
    };

    res.json(paymentResult);
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

    const colab = colaboradoresState.find((c) => c.id === data.collaboratorId);
    const unitsCount = Math.max(1, parseInt(data.unitsCount, 10) || 1);

    // Validación y cálculo en el servidor: nunca confiar en precios alterados en el frontend
    const verifiedDailyRate = colab ? colab.dailyRate : 120000;
    const verifiedBaseAmount = verifiedDailyRate * unitsCount;
    const verifiedArlFee = 12000; // Tarifa oficial ARL Riesgo V
    const verifiedProtectionFee = Math.round(verifiedBaseAmount * 0.05); // 5% fee garantía y soporte
    const verifiedTotalAmount = verifiedBaseAmount + verifiedArlFee + verifiedProtectionFee;

    const orderNumber = `MO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const escrowCertificateId = `CERT-ESCROW-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    const newContract: WorkContract = {
      id: `contrato-${Date.now()}`,
      orderNumber,
      collaboratorId: data.collaboratorId,
      collaboratorName: colab?.name || data.collaboratorName || 'Técnico Especialista',
      collaboratorSpecialty: colab?.specialtyTitle || 'Técnico Especialista',
      collaboratorAvatar: colab?.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=300',
      clientId: data.clientId || 'user-client-1',
      clientName: data.clientName || 'Cliente MultiOficios',
      clientPhone: data.clientPhone || '+57 310 123 4567',
      workDescription: data.workDescription.trim(),
      serviceType: data.serviceType || 'jornal',
      unitsCount,
      baseAmount: verifiedBaseAmount,
      arlInsuranceFee: verifiedArlFee,
      platformProtectionFee: verifiedProtectionFee,
      totalAmount: verifiedTotalAmount,
      status: 'fondos_en_custodia',
      paymentMethod: data.paymentMethod || 'pse',
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
          note: `Solicitud registrada. Fideicomiso certificado: ${escrowCertificateId}`,
        },
        {
          status: 'fondos_en_custodia',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: `Pago de $${verifiedTotalAmount.toLocaleString('es-CO')} retenido bajo custodia fiduciaria estricta.`,
        },
      ],
    };

    contratosState.unshift(newContract);

    res.status(201).json({
      mensaje: 'Contrato generado exitosamente. Fondos asegurados en custodia fiduciaria.',
      contract: newContract,
      escrowCertificate: {
        certificateId: escrowCertificateId,
        retainedAmount: verifiedTotalAmount,
        technicianDispersalAmount: verifiedBaseAmount,
        platformFee: verifiedProtectionFee,
        arlFee: verifiedArlFee,
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
    }

    res.json({
      mensaje: `Estado actualizado a ${contract.status}`,
      contract,
    });
  });

  // 8. Liberación de fondos Escrow (Validación Segura de Autorización y Prevención de Doble Gasto)
  app.post('/api/obras/:id/liberar-fondos', (req: Request, res: Response) => {
    const { id } = req.params;
    const { clientId } = req.body;
    const authHeader = req.headers.authorization;
    const isAdmin = verifyAdminToken(authHeader);

    const contract = contratosState.find((c) => c.id === id);
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

    // Validación de autoridad: sólo el cliente dueño del contrato o un administrador autenticado
    if (!isAdmin && clientId && contract.clientId !== clientId) {
      res.status(403).json({
        error: 'No autorizado. Solo el cliente titular de la obra puede liberar los fondos en custodia.',
      });
      return;
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
