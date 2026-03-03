import React, { useEffect, useState } from 'react';
import { mockDbService, Order } from '../services/mockDb';
import { Calculator, Lock, CheckCircle2, AlertCircle, Loader2, Wand2, MessageCircle, FileText, Unlock, CheckSquare, Square } from 'lucide-react';
import { generateDiagnosis } from '../services/geminiDiagnostico';

// Función de formateo financiero (ARS)
const formatARS = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function Presupuestos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado local para manejar el input de costo con decimales en tiempo real
  const [costoManoObraInput, setCostoManoObraInput] = useState<string>('0');
  const [diagnosticoInput, setDiagnosticoInput] = useState<string>('');
  const [aiSuggestedItems, setAiSuggestedItems] = useState<string[]>([]);
  const [selectedAiItems, setSelectedAiItems] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = mockDbService.subscribeToOrders(setOrders);
    return () => unsubscribe();
  }, []);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Sincronizar estado local cuando cambia la orden seleccionada
  useEffect(() => {
    if (selectedOrder) {
      setCostoManoObraInput(selectedOrder.costoManoObra ? selectedOrder.costoManoObra.toString() : '0');
      setDiagnosticoInput(selectedOrder.diagnostico || '');
      setAiSuggestedItems([]);
      setSelectedAiItems([]);
    } else {
      setCostoManoObraInput('0');
      setDiagnosticoInput('');
      setAiSuggestedItems([]);
      setSelectedAiItems([]);
    }
    setError(null);
  }, [selectedOrderId, selectedOrder?.id]);

  const handleCostoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setCostoManoObraInput('0');
      return;
    }
    const numericValue = parseInt(rawValue, 10) / 100;
    setCostoManoObraInput(numericValue.toString());
  };

  const handleMagicWand = async () => {
    if (!selectedOrder) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await generateDiagnosis(selectedOrder.sintomaCliente, selectedOrder.modelo);
      setAiSuggestedItems(result.repuestosSugeridos);
      setSelectedAiItems(result.repuestosSugeridos);
      const newText = `[DIAGNÓSTICO IA]\n${result.diagnosticoPresuntivo}\n\n[ALERTA PREVENTIVA]\n${result.alertaMantenimiento}`;
      setDiagnosticoInput(newText);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al generar diagnóstico con IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleAiItem = (item: string) => {
    setSelectedAiItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSaveDraft = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const costoManoObra = parseFloat(costoManoObraInput) || 0;
    const finalDiagnostico = aiSuggestedItems.length > 0 
      ? `${diagnosticoInput}\n\n[REPUESTOS SUGERIDOS SELECCIONADOS]\n- ${selectedAiItems.join('\n- ')}`
      : diagnosticoInput;

    mockDbService.updateOrder(selectedOrder.id, {
      diagnostico: finalDiagnostico,
      costoManoObra,
      estado: 'Presupuestado'
    });
    
    // Limpiar sugerencias después de guardar
    setAiSuggestedItems([]);
    setSelectedAiItems([]);
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;
    
    const costoManoObra = parseFloat(costoManoObraInput) || 0;
    const finalDiagnostico = aiSuggestedItems.length > 0 
      ? `${diagnosticoInput}\n\n[REPUESTOS SUGERIDOS SELECCIONADOS]\n- ${selectedAiItems.join('\n- ')}`
      : diagnosticoInput;
    
    if (!finalDiagnostico.trim()) {
      setError("El diagnóstico es obligatorio para aprobar el presupuesto.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await mockDbService.congelarPresupuesto(selectedOrder.id, finalDiagnostico, costoManoObra);
      setAiSuggestedItems([]);
      setSelectedAiItems([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Service Unavailable: Ocurrió un error al procesar la transacción.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestUnlock = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    setError(null);
    try {
      await mockDbService.descongelarPresupuesto(selectedOrder.id, "Mecánico Autorizado");
    } catch (err: any) {
      setError(err.message || "Error al solicitar modificación.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsApp = () => {
    if (!selectedOrder || !selectedOrder.cliente) return;
    
    const { nombre, telefono } = selectedOrder.cliente;
    const vehiculo = `${selectedOrder.modelo} (${selectedOrder.patente})`;
    const totalARS = formatARS(totalGeneral);
    const linkApp = window.location.origin; // O un link específico

    const mensaje = `Hola ${nombre}, el diagnóstico de tu ${vehiculo} ya está listo. El presupuesto total es de ${totalARS}. Podés ver el detalle técnico y las fotos de los repuestos aquí: ${linkApp}`;
    
    const url = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const totalRepuestos = selectedOrder?.repuestos.reduce((acc, r) => acc + (r.costo * r.cantidad), 0) || 0;
  const costoManoObraParsed = parseFloat(costoManoObraInput) || 0;
  const totalGeneral = costoManoObraParsed + totalRepuestos;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-indigo-500" />
          Módulo de Presupuestos Pro
        </h2>
        <p className="text-slate-500">Genera presupuestos precisos. Al aprobarse, los precios quedan congelados (Inmutabilidad).</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden transition-all">
        <div className="p-6 border-b border-slate-100 bg-slate-50/80">
          <label className="block text-sm font-medium text-slate-700 mb-2">Seleccionar Orden Activa</label>
          <select 
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-shadow"
          >
            <option value="">-- Seleccione un vehículo --</option>
            {orders.filter(o => o.estado !== 'Cerrado' && o.estado !== 'Anulado').map(o => (
              <option key={o.id} value={o.id}>{o.patente} - {o.modelo} ({o.sintomaCliente})</option>
            ))}
          </select>
        </div>

        {selectedOrder && (
          <div className="p-6 md:p-8">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 animate-in fade-in">
                <AlertCircle className="w-5 h-5 mt-0.5 text-rose-600 shrink-0" />
                <div>
                  <h4 className="font-semibold">Error en la Transacción</h4>
                  <p className="text-sm text-rose-600/80">{error}</p>
                </div>
              </div>
            )}

            {selectedOrder.presupuestoAprobado && (
              <div className="mb-8 space-y-4">
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 animate-in fade-in">
                  <Lock className="w-5 h-5 mt-0.5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-emerald-900">Presupuesto Aprobado y Congelado</h4>
                    <p className="text-sm text-emerald-700 mt-1">Los campos de precio y diagnóstico están bloqueados por reglas de inmutabilidad (Firestore Rules).</p>
                  </div>
                </div>
                
                {selectedOrder.auditHistory && selectedOrder.auditHistory.length > 0 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2 text-sm text-slate-600 animate-in fade-in">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold">Historial de Auditoría:</span>
                    </div>
                    {selectedOrder.auditHistory.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                        <span>{entry.accion} por {entry.usuario}</span>
                        <span className="font-mono text-xs text-slate-400">{new Date(entry.fecha).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSaveDraft} className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Diagnóstico Técnico</label>
                  {!selectedOrder.presupuestoAprobado && (
                    <button
                      type="button"
                      onClick={handleMagicWand}
                      disabled={isAnalyzing || isSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      {isAnalyzing ? 'Analizando...' : 'Varita Mágica (IA)'}
                    </button>
                  )}
                </div>
                <textarea
                  value={diagnosticoInput}
                  onChange={(e) => setDiagnosticoInput(e.target.value)}
                  disabled={selectedOrder.presupuestoAprobado || isSaving || isAnalyzing}
                  className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:bg-slate-100 resize-none shadow-inner transition-all text-slate-700"
                  placeholder="Detalle el problema encontrado y los trabajos a realizar..."
                  required
                />
                
                {aiSuggestedItems.length > 0 && !selectedOrder.presupuestoAprobado && (
                  <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-in fade-in">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-indigo-500" />
                      Repuestos Sugeridos por IA (Selecciona para incluir)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {aiSuggestedItems.map((item, idx) => {
                        const isSelected = selectedAiItems.includes(item);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleToggleAiItem(item)}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                              isSelected 
                                ? 'bg-white border-indigo-300 shadow-sm' 
                                : 'bg-white/50 border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400 shrink-0" />
                            )}
                            <span className={`text-sm ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                              {item}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Costo Mano de Obra</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatARS(parseFloat(costoManoObraInput) || 0)}
                      onChange={handleCostoChange}
                      disabled={selectedOrder.presupuestoAprobado || isSaving}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:bg-slate-100 shadow-sm transition-all text-slate-900 font-medium"
                      placeholder="$ 0,00"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Costo Repuestos Cargados</label>
                  <div className="w-full p-3.5 bg-slate-200/70 border border-slate-300 rounded-xl text-slate-600 font-mono font-medium shadow-inner cursor-not-allowed flex items-center justify-between">
                    <span>{formatARS(totalRepuestos)}</span>
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    Solo lectura (proviene del módulo Repuestos)
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Presupuesto</p>
                  <div className="text-4xl font-bold text-slate-900 tracking-tight">
                    {formatARS(totalGeneral)}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {selectedOrder.presupuestoAprobado ? (
                    <>
                      <button
                        type="button"
                        onClick={handleRequestUnlock}
                        disabled={isSaving}
                        className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg w-full sm:w-auto disabled:opacity-70"
                      >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
                        Solicitar Modificación
                      </button>
                      <button
                        type="button"
                        onClick={handleWhatsApp}
                        className="px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg w-full sm:w-auto"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Enviar por WhatsApp
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto"
                      >
                        Guardar Borrador
                      </button>
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={isSaving}
                        className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Procesando Transacción...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Aprobar y Congelar
                          </>
                        )}
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
