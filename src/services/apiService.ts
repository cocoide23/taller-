/**
 * apiService.ts
 * Replaces mockDb.ts — same interface, but backed by the Express/PostgreSQL API.
 * Subscriptions are simulated via polling (3-second interval).
 */

const BASE = '/api';

// ── Types (re-exported so components don't need to change) ──
export type OrderStatus = 'Ingresado' | 'Presupuestado' | 'En Reparación' | 'Finalizado' | 'Cerrado' | 'Anulado';

export interface Part {
  id: string;
  nombre: string;
  costo: number;
  cantidad: number;
  ordenId: string;
  patente: string;
  mecanicoId: string;
}

export interface AuditEvent {
  accion: string;
  usuario: string;
  fecha: string;
}

export interface PresupuestoVersion {
  version: number;
  diagnostico: string;
  costoManoObra: number;
  totalRepuestos: number;
  fecha: string;
  aprobadoPor: string;
  motivoCambio?: string;
}

export interface Vehicle {
  patente: string;
  modelo: string;
  cliente: { nombre: string; apellido: string; telefono: string };
  fechaCreacion: string;
}

export interface Order {
  id: string;
  patente: string;
  modelo: string;
  cliente: { nombre: string; apellido: string; telefono: string };
  estado: OrderStatus;
  fechaIngreso: string;
  sintomaCliente: string;
  diagnostico: string;
  costoManoObra: number;
  repuestos: Part[];
  mecanicoResponsable: { id: string; nombre: string } | null;
  presupuestoAprobado: boolean;
  versionPresupuesto?: number;
  historialPresupuestos?: PresupuestoVersion[];
  evidenciaFotografica?: string[];
  auditLog?: { aprobadoPor: string; fechaAprobacion: string };
  auditHistory?: AuditEvent[];
}

// ── Helpers ─────────────────────────────────────────────────
export const normalizePatente = (p: string) => p.toUpperCase().replace(/[\s-]/g, '');

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Service ─────────────────────────────────────────────────
export const mockDbService = {
  // ── Subscriptions (polling every 3 s) ──────────────────
  subscribeToOrders(callback: (orders: Order[]) => void) {
    let active = true;

    const poll = async () => {
      try {
        const orders = await apiFetch<Order[]>(`${BASE}/orders`);
        if (active) callback(orders);
      } catch (err) {
        console.error('subscribeToOrders poll error:', err);
      }
    };

    poll(); // immediate
    const id = setInterval(poll, 3000);

    return () => {
      active = false;
      clearInterval(id);
    };
  },

  subscribeToHistorial(patente: string, callback: (orders: Order[]) => void) {
    if (!patente || patente.length < 3) return () => {};

    const normalized = normalizePatente(patente);
    let active = true;

    const poll = async () => {
      try {
        const orders = await apiFetch<Order[]>(`${BASE}/orders/historial/${normalized}`);
        if (active) callback(orders);
      } catch (err) {
        console.error('subscribeToHistorial poll error:', err);
      }
    };

    poll();
    const id = setInterval(poll, 3000);

    return () => {
      active = false;
      clearInterval(id);
    };
  },

  // ── Mutations ───────────────────────────────────────────
  async updateOrder(id: string, data: Partial<Order>) {
    await apiFetch(`${BASE}/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async congelarPresupuesto(ordenId: string, diagnostico: string, costoManoObra: number) {
    await apiFetch(`${BASE}/orders/${ordenId}/congelar`, {
      method: 'POST',
      body: JSON.stringify({ diagnostico, costoManoObra }),
    });
  },

  async generarNuevaVersionPresupuesto(
    ordenId: string,
    diagnostico: string,
    costoManoObra: number,
    motivo: string,
  ) {
    await apiFetch(`${BASE}/orders/${ordenId}/nueva-version`, {
      method: 'POST',
      body: JSON.stringify({ diagnostico, costoManoObra, motivo }),
    });
  },

  async descongelarPresupuesto(ordenId: string, mecanicoId: string) {
    await apiFetch(`${BASE}/orders/${ordenId}/descongelar`, {
      method: 'POST',
      body: JSON.stringify({ mecanicoId }),
    });
  },

  async addOrder(data: {
    patente: string;
    modelo: string;
    sintomaCliente: string;
    cliente: { nombre: string; apellido: string; telefono: string };
  }) {
    await apiFetch(`${BASE}/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async checkVehicleExists(patente: string): Promise<boolean> {
    const normalized = normalizePatente(patente);
    const data = await apiFetch<{ exists: boolean }>(
      `${BASE}/vehicles/${normalized}/exists`,
    );
    return data.exists;
  },

  async addVehicle(data: {
    patente: string;
    modelo: string;
    cliente: { nombre: string; apellido: string; telefono: string };
  }) {
    await apiFetch(`${BASE}/vehicles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async addRepuestoToOrden(
    ordenId: string,
    repuesto: Omit<Part, 'id' | 'ordenId' | 'patente' | 'mecanicoId'>,
    mecanico: { id: string; nombre: string },
  ) {
    await apiFetch(`${BASE}/orders/${ordenId}/repuestos`, {
      method: 'POST',
      body: JSON.stringify({ ...repuesto, mecanico }),
    });
  },

  async addEvidencia(ordenId: string, photoUrl: string) {
    await apiFetch(`${BASE}/orders/${ordenId}/evidencias`, {
      method: 'POST',
      body: JSON.stringify({ photoUrl }),
    });
  },
};
