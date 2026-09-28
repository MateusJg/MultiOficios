/**
 * MultiOficios Frontend REST Client
 * Interacts directly with the verified server-side microservices in server.ts
 */

import { Collaborator, WorkContract, ServiceStatus } from '../types';

export interface PaymentInitiationPayload {
  method: 'pse' | 'nequi' | 'daviplata' | 'tarjeta_credito' | 'tarjeta' | 'billetera';
  bankEntity: string;
  amount: number;
  collaboratorId: string;
  workDescription: string;
}

export interface PaymentReceipt {
  ok: boolean;
  transactionId: string;
  authorizationCode: string;
  fiduciaryStamp: string;
  paymentMethod: string;
  bankEntity: string;
  amount: number;
  status: string;
  fiduciaryEntity: string;
  timestamp: string;
  guarantee: string;
}

export interface EscrowReleaseResponse {
  ok: boolean;
  mensaje: string;
  contract: WorkContract;
  dispersalReceipt?: {
    stampId: string;
    amount: number;
    dispersedAt: string;
  };
}

export interface AdminLoginResponse {
  ok: boolean;
  token?: string;
  role?: string;
  mensaje?: string;
  error?: string;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (data && typeof data === 'object' && 'error' in data) {
      const errVal = (data as { error?: unknown }).error;
      if (typeof errVal === 'string' && errVal.length > 0) {
        return errVal;
      }
    }
  } catch {
    // ignore
  }
  return fallback;
}

export const api = {
  // 1. Diagnostics
  async getHealth() {
    const res = await fetch('/api/health');
    return res.json();
  },

  // 2. Colaboradores
  async getCollaborators(params?: {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    category?: string;
    query?: string;
  }): Promise<{ total: number; radio_km: number; colaboradores: Collaborator[] }> {
    const query = new URLSearchParams();
    if (params?.lat !== undefined) query.set('lat', String(params.lat));
    if (params?.lng !== undefined) query.set('lng', String(params.lng));
    if (params?.radiusKm !== undefined) query.set('radius_km', String(params.radiusKm));
    if (params?.category) query.set('category', params.category);
    if (params?.query) query.set('q', params.query);

    const res = await fetch(`/api/colaboradores?${query.toString()}`);
    if (!res.ok) throw new Error('Error al obtener colaboradores del servidor');
    return res.json();
  },

  async getCollaborator(id: string): Promise<Collaborator> {
    const res = await fetch(`/api/colaboradores/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Colaborador no encontrado');
    return res.json();
  },

  async updateAvailability(id: string, availability: string) {
    const res = await fetch(`/api/colaboradores/${encodeURIComponent(id)}/disponibilidad`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability }),
    });
    if (!res.ok) throw new Error('Error al actualizar disponibilidad');
    return res.json();
  },

  async approveCollaborator(
    id: string,
    payload: { approvalStatus: string; isVerified: boolean },
    adminToken?: string,
  ) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;

    const res = await fetch(`/api/colaboradores/${encodeURIComponent(id)}/aprobacion`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errMsg = await parseErrorMessage(res, 'Error al actualizar aprobación');
      throw new Error(errMsg);
    }
    return res.json();
  },

  // 3. Contratos & Fideicomiso Escrow
  async getContracts(params?: { collaboratorId?: string; clientId?: string }): Promise<WorkContract[]> {
    const query = new URLSearchParams();
    if (params?.collaboratorId) query.set('colaborador_id', params.collaboratorId);
    if (params?.clientId) query.set('cliente_id', params.clientId);

    const res = await fetch(`/api/obras?${query.toString()}`);
    if (!res.ok) throw new Error('Error al consultar contratos del servidor');
    return res.json();
  },

  async createContract(data: Partial<WorkContract>): Promise<{
    mensaje: string;
    contract: WorkContract;
    escrowCertificate?: any;
  }> {
    const res = await fetch('/api/obras/contratar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errMsg = await parseErrorMessage(res, 'Error al generar contrato con custodia');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async updateContractStatus(
    id: string,
    payload: { status: ServiceStatus; note?: string; photoUrl?: string },
  ): Promise<{ mensaje: string; contract: WorkContract }> {
    const res = await fetch(`/api/obras/${encodeURIComponent(id)}/actualizar-estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errMsg = await parseErrorMessage(res, 'Error al actualizar estado del contrato');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async releaseEscrow(
    id: string,
    clientId?: string,
    adminToken?: string,
  ): Promise<EscrowReleaseResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;

    const res = await fetch(`/api/obras/${encodeURIComponent(id)}/liberar-fondos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ clientId }),
    });

    if (!res.ok) {
      const errMsg = await parseErrorMessage(res, 'Error al liberar fondos en custodia');
      throw new Error(errMsg);
    }
    return res.json();
  },

  // 4. Pasarela de Pagos (Payment Gateway Simulation)
  async initiatePayment(payload: PaymentInitiationPayload): Promise<PaymentReceipt> {
    const res = await fetch('/api/pagos/iniciar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errMsg = await parseErrorMessage(res, 'Fallo en la pasarela de pagos');
      throw new Error(errMsg);
    }
    return res.json();
  },

  // 5. Autenticación Administrativa
  async adminLogin(password: string): Promise<AdminLoginResponse> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    return res.json();
  },

  async adminVerify(token: string): Promise<{ valid: boolean; role?: string }> {
    const res = await fetch('/api/admin/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getEscrowLedger(adminToken: string) {
    const res = await fetch('/api/admin/escrow-ledger', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error('No autorizado para ver el libro fiduciario');
    return res.json();
  },

  // 6. Chat REST
  async getChatMessages(chatId: string) {
    const res = await fetch(`/api/chat/${encodeURIComponent(chatId)}/mensajes`);
    if (!res.ok) return [];
    return res.json();
  },

  async sendChatMessage(
    chatId: string,
    message: { senderId: string; senderRole: string; senderName: string; text: string },
  ) {
    const res = await fetch(`/api/chat/${encodeURIComponent(chatId)}/mensajes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!res.ok) throw new Error('Error al enviar mensaje');
    return res.json();
  },
};
