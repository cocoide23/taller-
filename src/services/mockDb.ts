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

export interface Order {
  id: string;
  patente: string;
  modelo: string;
  estado: OrderStatus;
  fechaIngreso: string;
  sintomaCliente: string;
  diagnostico: string;
  costoManoObra: number;
  repuestos: Part[];
  mecanicoResponsable: { id: string; nombre: string } | null;
  presupuestoAprobado: boolean;
}

export interface HistoryEntry {
  id: string;
  fecha: string;
  descripcion: string;
  kilometraje: number;
  ordenId: string;
  mecanicoResponsable: string;
}

let mockOrders: Order[] = [
  {
    id: 'ord_1',
    patente: 'ABC 123',
    modelo: 'Ford Focus',
    estado: 'Ingresado',
    fechaIngreso: new Date().toISOString(),
    sintomaCliente: 'Frenos largos y ruido al pisar el pedal',
    diagnostico: '',
    costoManoObra: 0,
    repuestos: [],
    mecanicoResponsable: null,
    presupuestoAprobado: false,
  },
  {
    id: 'ord_2',
    patente: 'XYZ 789',
    modelo: 'Toyota Corolla',
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
  },
  {
    id: 'ord_3',
    patente: 'DEF 456',
    modelo: 'Volkswagen Golf',
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
      mecanicoResponsable: 'Carlos Gómez'
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

  addOrder: (data: { patente: string, modelo: string, sintomaCliente: string }) => {
    const newOrder: Order = {
      id: 'ord_' + Math.random().toString(36).substr(2, 9),
      patente: data.patente.toUpperCase(),
      modelo: data.modelo,
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
  }
};
