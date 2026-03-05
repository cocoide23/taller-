import React, { useEffect, useState } from 'react';
import { mockDbService, Order } from '../services/mockDb';
import { Calculator, Lock, CheckCircle2, AlertCircle, Loader2, Wand2, MessageCircle, FileText, Unlock, CheckSquare, Square, History, AlertTriangle } from 'lucide-react';
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
  
  // Nuevos estados para versionado y alerta preventiva
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false);
  const [motivoCambio, setMotivoCambio] = useState('');
  const [alertaPreventiva, setAlertaPreventiva] = useState<string>('');
  const [includePreventiveAlert, setIncludePreventiveAlert] = useState(false);

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
      setIsCreatingNewVersion(false);
      setMotivoCambio('');
      setAlertaPreventiva('');
      setIncludePreventiveAlert(false);
    } else {
      setCostoManoObraInput('0');
      setDiagnosticoInput('');
      setIsCreatingNewVersion(false);
      setMotivoCambio('');
      setAlertaPreventiva('');
      setIncludePreventiveAlert(false);
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
      setAlertaPreventiva(result.alertaMantenimiento);
      setIncludePreventiveAlert(true);
      const newText = `[DIAGNÓSTICO IA]\n${result.diagnosticoPresuntivo}`;
      setDiagnosticoInput(newText);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al generar diagnóstico con IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDraft = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const costoManoObra = parseFloat(costoManoObraInput) || 0;
    const finalDiagnostico = diagnosticoInput;

    mockDbService.updateOrder(selectedOrder.id, {
      diagnostico: finalDiagnostico,
      costoManoObra,
      estado: 'Presupuestado'
    });
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;
    
    const costoManoObra = parseFloat(costoManoObraInput) || 0;
    const finalDiagnostico = diagnosticoInput;
    
    if (!finalDiagnostico.trim()) {
      setError("El diagnóstico es obligatorio para aprobar el presupuesto.");
      return;
    }
    
    if (isCreatingNewVersion && !motivoCambio.trim()) {
      setError("Debe indicar el motivo del cambio para generar una nueva versión.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreatingNewVersion) {
        await mockDbService.generarNuevaVersionPresupuesto(selectedOrder.id, finalDiagnostico, costoManoObra, motivoCambio);
        setIsCreatingNewVersion(false);
        setMotivoCambio('');
      } else {
        await mockDbService.congelarPresupuesto(selectedOrder.id, finalDiagnostico, costoManoObra);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Service Unavailable: Ocurrió un error al procesar la transacción.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartNewVersion = () => {
    setIsCreatingNewVersion(true);
  };

  const handleCancelNewVersion = () => {
    setIsCreatingNewVersion(false);
    setMotivoCambio('');
    if (selectedOrder) {
      setCostoManoObraInput(selectedOrder.costoManoObra ? selectedOrder.costoManoObra.toString() : '0');
      setDiagnosticoInput(selectedOrder.diagnostico || '');
    }
  };

  const handleWhatsApp = () => {
    if (!selectedOrder || !selectedOrder.cliente) return;
    
    const { nombre, telefono } = selectedOrder.cliente;
    const vehiculo = `${selectedOrder.modelo} (${selectedOrder.patente})`;
    const totalARS = formatARS(totalGeneral);
    const linkApp = window.location.origin; // O un link específico
    const versionStr = selectedOrder.versionPresupuesto ? ` V${selectedOrder.versionPresupuesto}` : '';

    let mensaje = `Hola ${nombre}, el presupuesto${versionStr} de tu ${vehiculo} está listo. Total: ${totalARS}. Podés revisarlo aquí: ${linkApp}`;
    
    if (includePreventiveAlert && alertaPreventiva) {
      mensaje += `\n\n💡 Mantenimiento Sugerido: ${alertaPreventiva}`;
    }
    
    const url = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const totalRepuestos = selectedOrder?.repuestos.reduce((acc, r) => acc + (r.costo * r.cantidad), 0) || 0;
  const costoManoObraParsed = parseFloat(costoManoObraInput) || 0;
  const totalGeneral = costoManoObraParsed + totalRepuestos;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-violet-500" />
          Módulo de Presupuestos Pro
        </h2>
        <p className="text-slate-400">Genera presupuestos precisos. Al aprobarse, los precios quedan congelados (Inmutabilidad).</p>
      </div>

      <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-lg overflow-hidden transition-all">
        <div className="p-6 border-b border-slate-800 bg-slate-900/80">
          <label className="block text-sm font-medium text-slate-300 mb-2">Seleccionar Orden Activa</label>
          <select 
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full p-3.5 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none shadow-sm transition-shadow"
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
              <div className="mb-6 p-4 bg-rose-900/40 border border-rose-800 rounded-xl flex items-start gap-3 text-rose-400 animate-in fade-in">
                <AlertCircle className="w-5 h-5 mt-0.5 text-rose-500 shrink-0" />
                <div>
                  <h4 className="font-semibold">Error en la Transacción</h4>
                  <p className="text-sm text-rose-400/80">{error}</p>
                </div>
              </div>
            )}

            {selectedOrder.presupuestoAprobado && !isCreatingNewVersion && (
              <div className="mb-8 space-y-4">
                <div className="p-5 bg-emerald-900/20 border border-emerald-800/50 rounded-2xl flex items-start gap-3 text-emerald-400 animate-in fade-in">
                  <Lock className="w-5 h-5 mt-0.5 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-emerald-400">Presupuesto Aprobado (v{selectedOrder.versionPresupuesto || 1})</h4>
                    <p className="text-sm text-emerald-500/80 mt-1">Los campos de precio y diagnóstico están bloqueados. Puedes generar una nueva versión si necesitas hacer cambios.</p>
                  </div>
                </div>
                
                {selectedOrder.auditHistory && selectedOrder.auditHistory.length > 0 && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2 text-sm text-slate-400 animate-in fade-in">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-slate-300">Historial de Auditoría:</span>
                    </div>
                    {selectedOrder.auditHistory.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-800 last:border-0">
                        <span>{entry.accion} por {entry.usuario}</span>
                        <span className="font-mono text-xs text-slate-500">{new Date(entry.fecha).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSaveDraft} className="space-y-8">
              {isCreatingNewVersion && (
                <div className="p-5 bg-amber-900/20 border border-amber-800/50 rounded-2xl animate-in fade-in mb-6">
                  <h4 className="font-semibold text-amber-500 flex items-center gap-2 mb-3">
                    <History className="w-5 h-5 text-amber-500" />
                    Generando Nueva Versión (v{(selectedOrder.versionPresupuesto || 1) + 1})
                  </h4>
                  <label className="block text-sm font-medium text-amber-400 mb-2">Motivo del Cambio *</label>
                  <input
                    type="text"
                    value={motivoCambio}
                    onChange={(e) => setMotivoCambio(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-amber-800/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
                    placeholder="Ej: Se agregó repuesto faltante, ajuste de mano de obra..."
                    required={isCreatingNewVersion}
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">Diagnóstico Técnico</label>
                  {(!selectedOrder.presupuestoAprobado || isCreatingNewVersion) && (
                    <button
                      type="button"
                      onClick={handleMagicWand}
                      disabled={isAnalyzing || isSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 border border-violet-500/20"
                    >
                      {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      {isAnalyzing ? 'Analizando...' : 'Varita Mágica (IA)'}
                    </button>
                  )}
                </div>
                <textarea
                  value={diagnosticoInput}
                  onChange={(e) => setDiagnosticoInput(e.target.value)}
                  disabled={(selectedOrder.presupuestoAprobado && !isCreatingNewVersion) || isSaving || isAnalyzing}
                  className="w-full h-40 p-4 bg-slate-900 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none disabled:opacity-60 disabled:bg-slate-950 resize-none shadow-inner transition-all text-slate-200"
                  placeholder="Detalle el problema encontrado y los trabajos a realizar..."
                  required
                />
                
                {alertaPreventiva && (!selectedOrder.presupuestoAprobado || isCreatingNewVersion) && (
                  <div className="mt-4 p-4 bg-amber-900/20 border border-amber-800/50 rounded-xl animate-in fade-in">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={includePreventiveAlert}
                          onChange={(e) => setIncludePreventiveAlert(e.target.checked)}
                          className="w-4 h-4 text-violet-600 rounded border-slate-700 focus:ring-violet-500 bg-slate-900"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-amber-500 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Mantenimiento Sugerido (IA)
                        </h4>
                        <p className="text-sm text-amber-400/90 mt-1">{alertaPreventiva}</p>
                        <p className="text-xs text-amber-500/70 mt-1 italic">Si marcas esta opción, se incluirá como nota en el mensaje de WhatsApp al cliente.</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Costo Mano de Obra</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatARS(parseFloat(costoManoObraInput) || 0)}
                      onChange={handleCostoChange}
                      disabled={(selectedOrder.presupuestoAprobado && !isCreatingNewVersion) || isSaving}
                      className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none disabled:opacity-60 disabled:bg-slate-900 shadow-sm transition-all text-slate-100 font-medium"
                      placeholder="$ 0,00"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Costo Repuestos Cargados</label>
                  <div className="w-full p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 font-mono font-medium shadow-inner cursor-not-allowed flex items-center justify-between">
                    <span>{formatARS(totalRepuestos)}</span>
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    Solo lectura (proviene del módulo Repuestos)
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Presupuesto</p>
                  <div className="text-4xl font-bold text-slate-100 tracking-tight">
                    {formatARS(totalGeneral)}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {selectedOrder.presupuestoAprobado && !isCreatingNewVersion ? (
                    <>
                      <button
                        type="button"
                        onClick={handleStartNewVersion}
                        disabled={isSaving}
                        className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg w-full sm:w-auto disabled:opacity-70 active:scale-95"
                      >
                        <History className="w-5 h-5" />
                        Modificar Presupuesto
                      </button>
                      <button
                        type="button"
                        onClick={handleWhatsApp}
                        className="px-6 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg w-full sm:w-auto active:scale-95"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Enviar por WhatsApp
                      </button>
                    </>
                  ) : (
                    <>
                      {isCreatingNewVersion && (
                        <button
                          type="button"
                          onClick={handleCancelNewVersion}
                          disabled={isSaving}
                          className="px-6 py-3.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto active:scale-95"
                        >
                          Cancelar
                        </button>
                      )}
                      {!isCreatingNewVersion && (
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-6 py-3.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto active:scale-95"
                        >
                          Guardar Borrador
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={isSaving}
                        className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto active:scale-95"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            {isCreatingNewVersion ? 'Generar Nueva Versión' : 'Aprobar y Congelar'}
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
