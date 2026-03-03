// Mock DB para que la aplicación sea funcional en la vista previa sin credenciales de Firebase
// Simula el comportamiento de onSnapshot de Firestore

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
  accion: 'Aprobado' | 'Desbloqueado';
  usuario: string;
  fecha: string;
}

export interface Order {
  id: string;
  patente: string;
  modelo: string;
  cliente: {
    nombre: string;
    apellido: string;
    telefono: string;
  };
  estado: OrderStatus;
  fechaIngreso: string;
  sintomaCliente: string;
  diagnostico: string;
  costoManoObra: number;
  repuestos: Part[];
  mecanicoResponsable: { id: string; nombre: string } | null;
  presupuestoAprobado: boolean;
  evidenciaFotografica?: string[];
  auditLog?: {
    aprobadoPor: string;
    fechaAprobacion: string;
  };
  auditHistory?: AuditEvent[];
}

export interface HistoryEntry {
  id: string;
  fecha: string;
  descripcion: string;
  kilometraje: number;
  ordenId: string;
  mecanicoResponsable: string;
  evidenciaFotografica?: string[];
}

let mockOrders: Order[] = [
  {
    id: 'ord_1',
    patente: 'ABC 123',
    modelo: 'Ford Focus',
    cliente: { nombre: 'Juan', apellido: 'Pérez', telefono: '1123456789' },
    estado: 'Ingresado',
    fechaIngreso: new Date().toISOString(),
    sintomaCliente: 'Frenos largos y ruido al pisar el pedal',
    diagnostico: '',
    costoManoObra: 0,
    repuestos: [],
    mecanicoResponsable: null,
    presupuestoAprobado: false,
    evidenciaFotografica: ['https://picsum.photos/seed/brakes1/400/300']
  },
  {
    id: 'ord_2',
    patente: 'XYZ 789',
    modelo: 'Toyota Corolla',
    cliente: { nombre: 'María', apellido: 'Gómez', telefono: '1198765432' },
    estado: 'Presupuestado',
    fechaIngreso: new Date(Date.now() - 86400000).toISOString(),
    sintomaCliente: 'Ruido en motor al arrancar en frío',
    diagnostico: 'Cambio de correa de distribución y tensores',
    costoManoObra: 85000,
    repuestos: [
      { id: 'r1', nombre: 'Kit Correa Distribución', costo: 120000, cantidad: 1, ordenId: 'ord_2', patente: 'XYZ 789', mecanicoId: 'mec_1' },
      { id: 'r2', nombre: 'Bomba de agua', costo: 45000, cantidad: 1, ordenId: 'ord_2', patente: 'XYZ 789', mecanicoId: 'mec_1' }
    ],
    mecanicoResponsable: { id: 'mec_1', nombre: 'Carlos Gómez' },
    presupuestoAprobado: true,
    evidenciaFotografica: ['https://picsum.photos/seed/engine1/400/300', 'https://picsum.photos/seed/belt1/400/300'],
    auditLog: { aprobadoPor: 'Admin', fechaAprobacion: new Date(Date.now() - 43200000).toISOString() }
  },
  {
    id: 'ord_3',
    patente: 'DEF 456',
    modelo: 'Volkswagen Golf',
    cliente: { nombre: 'Lucas', apellido: 'Rodríguez', telefono: '1155554444' },
    estado: 'En Reparación',
    fechaIngreso: new Date(Date.now() - 172800000).toISOString(),
    sintomaCliente: 'Pierde aceite por abajo',
    diagnostico: 'Junta de cárter rota',
    costoManoObra: 35000,
    repuestos: [
      { id: 'r3', nombre: 'Junta de cárter', costo: 15000, cantidad: 1, ordenId: 'ord_3', patente: 'DEF 456', mecanicoId: 'mec_2' },
      { id: 'r4', nombre: 'Aceite 10W40 4L', costo: 28000, cantidad: 1, ordenId: 'ord_3', patente: 'DEF 456', mecanicoId: 'mec_2' }
    ],
    mecanicoResponsable: { id: 'mec_2', nombre: 'Ana Martínez' },
    presupuestoAprobado: true,
    evidenciaFotografica: ['https://picsum.photos/seed/oil1/400/300'],
    auditLog: { aprobadoPor: 'Admin', fechaAprobacion: new Date(Date.now() - 86400000).toISOString() }
  }
];

let mockHistory: Record<string, HistoryEntry[]> = {
  'ABC 123': [
    {
      id: 'h_1',
      fecha: new Date(Date.now() - 30 * 86400000).toISOString(),
      descripcion: 'Cambio de aceite y filtros',
      kilometraje: 45000,
      ordenId: 'ord_prev_1',
      mecanicoResponsable: 'Carlos Gómez',
      evidenciaFotografica: ['https://picsum.photos/seed/filter1/400/300']
    },
    {
      id: 'h_2',
      fecha: new Date(Date.now() - 180 * 86400000).toISOString(),
      descripcion: 'Alineación y balanceo',
      kilometraje: 38000,
      ordenId: 'ord_prev_2',
      mecanicoResponsable: 'Ana Martínez'
    }
  ]
};

type Listener = () => void;
const listeners: Record<string, Listener[]> = {
  orders: [],
  history: []
};

function notify(collection: string) {
  listeners[collection]?.forEach(l => l());
}

export const mockDbService = {
  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    const listener = () => callback([...mockOrders]);
    listeners.orders.push(listener);
    listener(); // Initial call
    return () => {
      listeners.orders = listeners.orders.filter(l => l !== listener);
    };
  },

  updateOrder: (id: string, data: Partial<Order>) => {
    mockOrders = mockOrders.map(o => o.id === id ? { ...o, ...data } : o);
    notify('orders');
  },

  congelarPresupuesto: async (ordenId: string, diagnostico: string, costoManoObra: number) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const order = mockOrders.find(o => o.id === ordenId);
        if (!order) {
          reject(new Error("La orden no existe."));
          return;
        }
        if (order.estado === 'Cerrado' || order.presupuestoAprobado) {
          reject(new Error("La orden ya está cerrada o el presupuesto ya fue aprobado."));
          return;
        }
        
        mockOrders = mockOrders.map(o => {
          if (o.id === ordenId) {
            const newEvent: AuditEvent = {
              accion: 'Aprobado',
              usuario: 'Usuario Actual (Admin)',
              fecha: new Date().toISOString()
            };
            return {
              ...o,
              diagnostico,
              costoManoObra,
              presupuestoAprobado: true,
              estado: 'Presupuestado',
              auditLog: {
                aprobadoPor: newEvent.usuario,
                fechaAprobacion: newEvent.fecha
              },
              auditHistory: [...(o.auditHistory || []), newEvent]
            };
          }
          return o;
        });
        notify('orders');
        resolve();
      }, 1500); // Simulate network delay
    });
  },

  descongelarPresupuesto: async (ordenId: string, mecanicoId: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const order = mockOrders.find(o => o.id === ordenId);
        if (!order) {
          reject(new Error("La orden no existe."));
          return;
        }
        if (!order.presupuestoAprobado) {
          reject(new Error("El presupuesto no está congelado."));
          return;
        }
        
        mockOrders = mockOrders.map(o => {
          if (o.id === ordenId) {
            const newEvent: AuditEvent = {
              accion: 'Desbloqueado',
              usuario: mecanicoId,
              fecha: new Date().toISOString()
            };
            return {
              ...o,
              presupuestoAprobado: false,
              estado: 'Ingresado', // Vuelve a estado inicial o se mantiene en Presupuestado? Mejor Ingresado para re-presupuestar
              auditHistory: [...(o.auditHistory || []), newEvent]
            };
          }
          return o;
        });
        notify('orders');
        resolve();
      }, 1000);
    });
  },

  addOrder: (data: { patente: string, modelo: string, sintomaCliente: string, cliente: { nombre: string, apellido: string, telefono: string } }) => {
    const newOrder: Order = {
      id: 'ord_' + Math.random().toString(36).substr(2, 9),
      patente: data.patente.toUpperCase(),
      modelo: data.modelo,
      cliente: data.cliente,
      estado: 'Ingresado',
      fechaIngreso: new Date().toISOString(),
      sintomaCliente: data.sintomaCliente,
      diagnostico: '',
      costoManoObra: 0,
      repuestos: [],
      mecanicoResponsable: null,
      presupuestoAprobado: false,
    };
    mockOrders = [newOrder, ...mockOrders];
    notify('orders');
  },

  subscribeToHistorial: (patente: string, callback: (history: HistoryEntry[]) => void) => {
    const listener = () => {
      const history = mockHistory[patente.toUpperCase()] || [];
      callback([...history]);
    };
    listeners.history.push(listener);
    listener(); // Initial call
    return () => {
      listeners.history = listeners.history.filter(l => l !== listener);
    };
  },

  addRepuestoToOrden: (ordenId: string, repuesto: Omit<Part, 'id' | 'ordenId' | 'patente' | 'mecanicoId'>, mecanico: { id: string, nombre: string }) => {
    mockOrders = mockOrders.map(o => {
      if (o.id === ordenId) {
        return {
          ...o,
          mecanicoResponsable: mecanico,
          repuestos: [...o.repuestos, { 
            ...repuesto, 
            id: Math.random().toString(36).substr(2, 9),
            ordenId: o.id,
            patente: o.patente,
            mecanicoId: mecanico.id
          }]
        };
      }
      return o;
    });
    notify('orders');
  },

  addEvidencia: (ordenId: string, photoUrl: string) => {
    mockOrders = mockOrders.map(o => {
      if (o.id === ordenId) {
        return {
          ...o,
          evidenciaFotografica: [...(o.evidenciaFotografica || []), photoUrl]
        };
      }
      return o;
    });
    notify('orders');
  }
};
