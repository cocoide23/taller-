import { CreditCard, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

// Función de formateo financiero (ARS)
const formatARS = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const webhookCode = `import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import axios from "axios"; // o fetch nativo

// Secreto para la API financiera externa
const financeApiKey = defineSecret("FINANCE_API_KEY");

// Umbral para ofrecer financiación (ej. $100,000)
const UMBRAL_FINANCIACION = 100000;

export const checkFinancingEligibility = onDocumentUpdated(
  {
    document: "ordenes/{ordenId}",
    secrets: [financeApiKey],
    region: "us-central1"
  },
  async (event) => {
    const dataAnterior = event.data?.before.data();
    const dataNueva = event.data?.after.data();

    if (!dataNueva || !dataAnterior) return null;

    // Solo actuamos si el estado cambió a 'Presupuestado'
    if (dataAnterior.estado !== 'Presupuestado' && dataNueva.estado === 'Presupuestado') {
      
      const costoTotal = (dataNueva.costoManoObra || 0) + 
        (dataNueva.repuestos?.reduce((acc: number, r: any) => acc + (r.costo * r.cantidad), 0) || 0);

      // Si el costo supera el umbral, consultamos a la API financiera
      if (costoTotal >= UMBRAL_FINANCIACION) {
        try {
          console.log(\`Presupuesto \${event.params.ordenId} supera el umbral (\$\${costoTotal}). Consultando API...\`);
          
          // Llamada a la API externa (Webhook)
          const response = await axios.post(
            'https://api.financiera-externa.com/v1/pre-aprobacion',
            {
              montoSolicitado: costoTotal,
              clienteId: dataNueva.clienteId, // Asumiendo que tenemos el ID o DNI del cliente
              patente: dataNueva.patente,
              tallerId: "TALLER_DEMO_001"
            },
            {
              headers: {
                'Authorization': \`Bearer \${financeApiKey.value()}\`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.aprobado) {
            // Actualizamos la orden en Firestore con las opciones de financiación
            await event.data?.after.ref.update({
              opcionesFinanciacion: response.data.planes, // ej: [{cuotas: 3, interes: 0}, {cuotas: 6, interes: 15}]
              financiacionPreAprobada: true
            });
            console.log("Financiación pre-aprobada y guardada en la orden.");
          }

        } catch (error) {
          console.error("Error al consultar la API financiera:", error);
          // Opcional: Guardar el error en la orden o en un log de auditoría
        }
      }
    }
    return null;
  }
);`;

export default function Finanzas() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<'idle' | 'success' | 'rejected'>('idle');
  const [monto, setMonto] = useState(150000);

  const handleSimulate = () => {
    setIsSimulating(true);
    setSimulationResult('idle');
    
    setTimeout(() => {
      setIsSimulating(false);
      // Simulamos que si el monto es mayor a 100k, se aprueba
      setSimulationResult(monto >= 100000 ? 'success' : 'rejected');
    }, 1500);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-violet-500" />
          Integración Financiera (Webhook)
        </h2>
        <p className="text-slate-400">
          Trigger de Firestore que consulta automáticamente opciones de financiación en cuotas cuando un presupuesto supera un monto determinado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: Código */}
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900">
              <h3 className="font-semibold text-slate-100">Cloud Function (TypeScript)</h3>
              <p className="text-xs text-slate-400">Trigger: onDocumentUpdated('ordenes/&#123;id&#125;')</p>
            </div>
            
            <div className="bg-slate-950 p-4 overflow-x-auto">
              <pre className="text-blue-400 font-mono text-xs leading-relaxed">
                {webhookCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Simulador */}
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm p-6">
            <h3 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-violet-500" />
              Simulador del Webhook
            </h3>
            
            <p className="text-sm text-slate-400 mb-6">
              Simula el cambio de estado de una orden a "Presupuestado". El umbral configurado es de <strong className="text-slate-200">$100,000</strong>.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Monto Total del Presupuesto ($)</label>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(Number(e.target.value))}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-lg font-mono text-slate-100"
                />
              </div>

              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {isSimulating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
                {isSimulating ? 'Consultando API Financiera...' : 'Simular Cambio de Estado'}
              </button>
            </div>

            {/* Resultados de la simulación */}
            {simulationResult !== 'idle' && (
              <div className="pt-6 border-t border-slate-800 animate-in fade-in">
                {simulationResult === 'success' ? (
                  <div className="p-4 bg-emerald-900/20 border border-emerald-800/50 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Financiación Pre-Aprobada
                    </div>
                    <p className="text-sm text-emerald-300/80 mb-3">
                      El monto supera el umbral. La API externa devolvió los siguientes planes, que se guardarán en el documento de la orden:
                    </p>
                    <div className="space-y-2">
                      <div className="bg-slate-900 p-3 rounded-lg border border-emerald-800/30 flex justify-between items-center shadow-sm">
                        <span className="font-medium text-slate-200">3 Cuotas sin interés</span>
                        <span className="font-mono text-emerald-400">{formatARS(monto / 3)} /mes</span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-emerald-800/30 flex justify-between items-center shadow-sm">
                        <span className="font-medium text-slate-200">6 Cuotas fijas (15% recargo)</span>
                        <span className="font-mono text-slate-400">{formatARS((monto * 1.15) / 6)} /mes</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
                      <AlertCircle className="w-5 h-5" />
                      No aplica para financiación
                    </div>
                    <p className="text-sm text-slate-400">
                      El monto ({formatARS(monto)}) no supera el umbral mínimo de {formatARS(100000)}. El Webhook finalizó sin consultar a la API externa.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
