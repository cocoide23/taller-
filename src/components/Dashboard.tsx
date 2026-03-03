import { useEffect, useState } from 'react';
import { mockDbService, Order } from '../services/apiService';
import { Clock, Wrench, CheckCircle2, AlertCircle, Lock, Plus, X, Trash2, ShieldAlert } from 'lucide-react';

const statusColors = {
  'Ingresado': 'bg-slate-100 text-slate-700 border-slate-200',
  'Presupuestado': 'bg-blue-50 text-blue-700 border-blue-200',
  'En Reparación': 'bg-amber-50 text-amber-700 border-amber-200',
  'Finalizado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Cerrado': 'bg-slate-800 text-slate-300 border-slate-700',
  'Anulado': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Simula onSnapshot de Firestore
    const unsubscribe = mockDbService.subscribeToOrders(setOrders);
    return () => unsubscribe();
  }, []);

  const updateStatus = (id: string, newStatus: Order['estado']) => {
    mockDbService.updateOrder(id, { estado: newStatus });
  };

  const handleAddOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mockDbService.addOrder({
      patente: formData.get('patente') as string,
      modelo: formData.get('modelo') as string,
      sintomaCliente: formData.get('sintoma') as string,
      cliente: {
        nombre: formData.get('nombre') as string,
        apellido: formData.get('apellido') as string,
        telefono: formData.get('telefono') as string,
      }
    });
    setShowAddForm(false);
  };

  const handleCancelOrder = (id: string, estado: Order['estado']) => {
    if (estado === 'Cerrado') {
      alert("No se puede anular una orden que ya está cerrada.");
      return;
    }
    if (confirm('Por reglas de auditoría (Inmutabilidad), el registro no se eliminará de la base de datos, solo pasará a estado "Anulado". ¿Desea continuar?')) {
      mockDbService.updateOrder(id, { estado: 'Anulado' });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard de Órdenes</h2>
          <p className="text-slate-500">Vista en tiempo real del estado de los vehículos en el taller.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancelar' : 'Nuevo Ingreso'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-500" />
            Ingresar Nuevo Vehículo
          </h3>
          <form onSubmit={handleAddOrder} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Nombre Cliente</label>
              <input 
                type="text" 
                name="nombre"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: Juan"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Apellido Cliente</label>
              <input 
                type="text" 
                name="apellido"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: Pérez"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Teléfono (WhatsApp)</label>
              <input 
                type="tel" 
                name="telefono"
                required
                pattern="^\+[1-9]\d{1,14}$"
                title="Debe incluir el código de país, ej: +5491123456789"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: +5491123456789"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Patente</label>
              <input 
                type="text" 
                name="patente"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                placeholder="Ej: ABC 123"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Modelo de Auto</label>
              <input 
                type="text" 
                name="modelo"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: Ford Focus 2018"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Síntoma / Motivo de Ingreso</label>
              <textarea 
                name="sintoma"
                required
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Ej: Hace ruido al frenar y pierde líquido..."
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button 
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                Guardar Ingreso
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <div key={order.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${order.estado === 'Anulado' ? 'opacity-60 grayscale' : ''}`}>
            <div className={`px-4 py-3 border-b flex justify-between items-center ${statusColors[order.estado]}`}>
              <div className="flex flex-col">
                <span className="font-mono font-bold text-lg leading-tight">{order.patente}</span>
                <span className="text-xs font-medium opacity-80">{order.modelo}</span>
              </div>
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
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2 items-center">
              <select 
                value={order.estado}
                onChange={(e) => updateStatus(order.id, e.target.value as Order['estado'])}
                disabled={order.estado === 'Cerrado' || order.estado === 'Anulado'}
                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex-1 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
              >
                <option value="Ingresado">Ingresado</option>
                <option value="Presupuestado">Presupuestado</option>
                <option value="En Reparación">En Reparación</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cerrado">Cerrado</option>
                <option value="Anulado" disabled>Anulado</option>
              </select>

              <button
                onClick={() => handleCancelOrder(order.id, order.estado)}
                disabled={order.estado === 'Cerrado' || order.estado === 'Anulado'}
                title="Anular Orden"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
