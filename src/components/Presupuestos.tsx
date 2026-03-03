import React, { useEffect, useState } from 'react';
import { mockDbService, Order } from '../services/mockDb';
import { Calculator, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Presupuestos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  useEffect(() => {
    const unsubscribe = mockDbService.subscribeToOrders(setOrders);
    return () => unsubscribe();
  }, []);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const formData = new FormData(e.currentTarget);
    const diagnostico = formData.get('diagnostico') as string;
    const costoManoObra = Number(formData.get('costoManoObra'));

    mockDbService.updateOrder(selectedOrder.id, {
      diagnostico,
      costoManoObra,
      estado: 'Presupuestado'
    });
  };

  const handleApprove = () => {
    if (!selectedOrder) return;
    mockDbService.updateOrder(selectedOrder.id, {
      presupuestoAprobado: true,
      estado: 'En Reparación'
    });
  };

  const totalRepuestos = selectedOrder?.repuestos.reduce((acc, r) => acc + (r.costo * r.cantidad), 0) || 0;
  const totalGeneral = (selectedOrder?.costoManoObra || 0) + totalRepuestos;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-indigo-500" />
          Módulo de Presupuestos
        </h2>
        <p className="text-slate-500">Genera presupuestos. Al aprobarse, los precios quedan congelados.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <label className="block text-sm font-medium text-slate-700 mb-2">Seleccionar Orden</label>
          <select 
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Seleccione un vehículo --</option>
            {orders.filter(o => o.estado !== 'Cerrado').map(o => (
              <option key={o.id} value={o.id}>{o.patente} - {o.sintomaCliente}</option>
            ))}
          </select>
        </div>

        {selectedOrder && (
          <div className="p-6">
            {selectedOrder.presupuestoAprobado && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800">
                <Lock className="w-5 h-5 mt-0.5 text-emerald-600" />
                <div>
                  <h4 className="font-semibold">Presupuesto Aprobado y Congelado</h4>
                  <p className="text-sm text-emerald-600/80">Los campos de precio y diagnóstico ya no pueden ser modificados por reglas de negocio.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Diagnóstico Técnico</label>
                <textarea
                  name="diagnostico"
                  defaultValue={selectedOrder.diagnostico}
                  disabled={selectedOrder.presupuestoAprobado}
                  className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:bg-slate-100 resize-none"
                  placeholder="Detalle el problema encontrado..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Costo Mano de Obra ($)</label>
                  <input
                    type="number"
                    name="costoManoObra"
                    defaultValue={selectedOrder.costoManoObra || ''}
                    disabled={selectedOrder.presupuestoAprobado}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:bg-slate-100"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Costo Repuestos Cargados ($)</label>
                  <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono">
                    ${totalRepuestos.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Los repuestos se cargan en el módulo "Repuestos".</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="text-2xl font-bold text-slate-900">
                  Total: <span className="text-indigo-600">${totalGeneral.toLocaleString()}</span>
                </div>
                
                <div className="flex gap-3">
                  {!selectedOrder.presupuestoAprobado && (
                    <>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                      >
                        Guardar Borrador
                      </button>
                      <button
                        type="button"
                        onClick={handleApprove}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprobar y Congelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
