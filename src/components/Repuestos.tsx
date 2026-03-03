import React, { useState, useEffect } from 'react';
import { mockDbService, Order } from '../services/mockDb';
import { Wrench, Plus, Package } from 'lucide-react';

const mecanicos = [
  { id: 'mec_1', nombre: 'Carlos Gómez' },
  { id: 'mec_2', nombre: 'Ana Martínez' },
  { id: 'mec_3', nombre: 'Juan Pérez' },
];

export default function Repuestos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedMecanicoId, setSelectedMecanicoId] = useState<string>('');

  useEffect(() => {
    const unsubscribe = mockDbService.subscribeToOrders(setOrders);
    return () => unsubscribe();
  }, []);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleAddRepuesto = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder || !selectedMecanicoId) return;

    const formData = new FormData(e.currentTarget);
    const nombre = formData.get('nombre') as string;
    const costo = Number(formData.get('costo'));
    const cantidad = Number(formData.get('cantidad'));

    const mecanico = mecanicos.find(m => m.id === selectedMecanicoId)!;

    mockDbService.addRepuestoToOrden(selectedOrder.id, { nombre, costo, cantidad }, mecanico);
    e.currentTarget.reset();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-indigo-500" />
          Carga de Repuestos
        </h2>
        <p className="text-slate-500">Asocia repuestos a una orden específica y asigna el mecánico responsable.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Contexto de la Orden</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Orden Abierta</label>
                <select 
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Seleccione orden...</option>
                  {orders.filter(o => !o.presupuestoAprobado && o.estado !== 'Cerrado').map(o => (
                    <option key={o.id} value={o.id}>{o.patente}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Mecánico Responsable</label>
                <select 
                  value={selectedMecanicoId}
                  onChange={(e) => setSelectedMecanicoId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Seleccione mecánico...</option>
                  {mecanicos.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddRepuesto} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Añadir Repuesto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Nombre / Marca</label>
                <input 
                  type="text" 
                  name="nombre"
                  required
                  disabled={!selectedOrderId || !selectedMecanicoId}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                  placeholder="Ej: Pastillas freno Bosch"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Costo ($)</label>
                  <input 
                    type="number" 
                    name="costo"
                    required
                    min="0"
                    disabled={!selectedOrderId || !selectedMecanicoId}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Cantidad</label>
                  <input 
                    type="number" 
                    name="cantidad"
                    required
                    min="1"
                    defaultValue="1"
                    disabled={!selectedOrderId || !selectedMecanicoId}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={!selectedOrderId || !selectedMecanicoId}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                <Plus className="w-4 h-4" />
                Agregar a la Orden
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Repuestos Actuales */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                Repuestos en Orden {selectedOrder ? <span className="font-mono text-indigo-600 ml-2">{selectedOrder.patente}</span> : ''}
              </h3>
            </div>
            
            <div className="p-5 flex-1">
              {!selectedOrder ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <Package className="w-12 h-12 opacity-20" />
                  <p>Seleccione una orden para ver sus repuestos</p>
                </div>
              ) : selectedOrder.repuestos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <p>No hay repuestos cargados en esta orden.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedOrder.repuestos.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-medium text-slate-900">{r.nombre}</p>
                        <p className="text-xs text-slate-500">Cant: {r.cantidad} x ${r.costo.toLocaleString()}</p>
                      </div>
                      <div className="font-mono font-medium text-slate-700">
                        ${(r.costo * r.cantidad).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-medium text-slate-600">Total Repuestos:</span>
                    <span className="text-xl font-bold text-indigo-600">
                      ${selectedOrder.repuestos.reduce((acc, r) => acc + (r.costo * r.cantidad), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
