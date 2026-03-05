import { CheckCircle2, ShieldCheck, Lock, Search, Database } from 'lucide-react';

export default function QAReport() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
          Reporte de Auditoría Técnica (QA & Arquitectura)
        </h2>
        <p className="text-slate-400">
          Resultados de la auditoría de reglas de negocio y refactorización final para el despliegue a producción.
        </p>
      </div>

      <div className="space-y-6">
        {/* Inmutabilidad */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-sm flex gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              Inmutabilidad de Órdenes Cerradas
              <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 border border-emerald-800 text-xs font-bold rounded uppercase tracking-wider">Pass</span>
            </h3>
            <p className="text-slate-400 mt-1 text-sm">
              Se verificó que las reglas de Firestore (<code className="bg-slate-900 px-1 rounded text-slate-300">firestore.rules</code>) bloquean explícitamente cualquier actualización si el estado de la orden es 'Cerrado'. A nivel de UI, el Dashboard deshabilita el selector de estado para órdenes cerradas.
            </p>
          </div>
        </div>

        {/* Congelamiento de Costos */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-sm flex gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              Congelamiento de Costos (Presupuestos)
              <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 border border-emerald-800 text-xs font-bold rounded uppercase tracking-wider">Pass</span>
            </h3>
            <p className="text-slate-400 mt-1 text-sm">
              El módulo de Presupuestos bloquea los campos de diagnóstico y costo de mano de obra una vez que el presupuesto es aprobado. Se implementó la validación visual y lógica en el componente <code className="bg-slate-900 px-1 rounded text-slate-300">Presupuestos.tsx</code>.
            </p>
          </div>
        </div>

        {/* Trazabilidad Total */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-sm flex gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              Trazabilidad Total de Repuestos
              <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 border border-emerald-800 text-xs font-bold rounded uppercase tracking-wider">Pass (Refactorizado)</span>
            </h3>
            <p className="text-slate-400 mt-1 text-sm">
              Se refactorizó la interfaz <code className="bg-slate-900 px-1 rounded text-slate-300">Part</code> y el servicio de base de datos para garantizar que cada repuesto cargado incluya obligatoriamente: <code className="bg-slate-900 px-1 rounded text-slate-300">ordenId</code>, <code className="bg-slate-900 px-1 rounded text-slate-300">patente</code> y <code className="bg-slate-900 px-1 rounded text-slate-300">mecanicoId</code>. La UI ahora muestra estas etiquetas de trazabilidad en la lista de repuestos.
            </p>
          </div>
        </div>

        {/* Persistencia */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-sm flex gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              Persistencia y Prevención de Borrado
              <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 border border-emerald-800 text-xs font-bold rounded uppercase tracking-wider">Pass</span>
            </h3>
            <p className="text-slate-400 mt-1 text-sm">
              Se confirmó que no existen funciones de borrado (delete) en la interfaz de usuario. Además, las reglas de Firestore imponen <code className="bg-slate-900 px-1 rounded text-slate-300">allow delete: if false;</code> de manera estricta en todas las colecciones críticas (vehículos, historial y órdenes).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
