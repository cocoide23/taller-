import { useEffect, useState } from 'react';
import { mockDbService, Order } from '../services/mockDb';
import { Clock, Wrench, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

const statusColors = {
  'Ingresado': 'bg-slate-100 text-slate-700 border-slate-200',
  'Presupuestado': 'bg-blue-50 text-blue-700 border-blue-200',
  'En Reparación': 'bg-amber-50 text-amber-700 border-amber-200',
  'Finalizado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Cerrado': 'bg-slate-800 text-slate-300 border-slate-700',
};

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Simula onSnapshot de Firestore
    const unsubscribe = mockDbService.subscribeToOrders(setOrders);
    return () => unsubscribe();
  }, []);

  const updateStatus = (id: string, newStatus: Order['estado']) => {
    mockDbService.updateOrder(id, { estado: newStatus });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard de Órdenes</h2>
        <p className="text-slate-500">Vista en tiempo real del estado de los vehículos en el taller.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className={`px-4 py-3 border-b flex justify-between items-center ${statusColors[order.estado]}`}>
              <span className="font-mono font-bold text-lg">{order.patente}</span>
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-white/50">
                {order.estado}
              </span>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Síntoma</p>
                <p className="text-sm text-slate-700 line-clamp-2">{order.sintomaCliente}</p>
              </div>
              
              {order.diagnostico && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Diagnóstico</p>
                  <p className="text-sm text-slate-700 line-clamp-2">{order.diagnostico}</p>
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Wrench className="w-4 h-4" />
                  <span className="truncate">{order.mecanicoResponsable?.nombre || 'Sin asignar'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 justify-end">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(order.fechaIngreso).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
              <select 
                value={order.estado}
                onChange={(e) => updateStatus(order.id, e.target.value as Order['estado'])}
                disabled={order.estado === 'Cerrado'}
                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex-1 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
              >
                <option value="Ingresado">Ingresado</option>
                <option value="Presupuestado">Presupuestado</option>
                <option value="En Reparación">En Reparación</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cerrado">Cerrado</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
