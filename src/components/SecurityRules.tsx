import { Shield, Lock, FileCode2, CheckCircle2, AlertTriangle } from 'lucide-react';

const rulesCode = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar para verificar si el usuario está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }

    // Colección Vehículos
    match /vehiculos/{patente} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if false; // La información nunca se borra
      
      // Subcolección Historial Técnico
      match /historial_tecnico/{historialId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated();
        allow update: if isAuthenticated();
        allow delete: if false; // La información nunca se borra
      }
    }

    // Colección Órdenes
    match /ordenes/{ordenId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      
      // Regla principal: No permitir edición si el estado actual es 'Cerrado'
      allow update: if isAuthenticated() 
                    && resource.data.estado != 'Cerrado';
                    
      allow delete: if false; // La información nunca se borra
    }
  }
}`;

export default function SecurityRules() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-rose-500" />
          Reglas de Seguridad (Firestore Rules)
        </h2>
        <p className="text-slate-400">
          Políticas de acceso y reglas de negocio implementadas a nivel de base de datos para garantizar la integridad de la información.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Código */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-slate-500" />
              <h3 className="font-semibold text-slate-100">firestore.rules</h3>
            </div>
            
            <div className="bg-slate-950 p-4 overflow-x-auto">
              <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
                {rulesCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Explicación */}
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm p-6">
            <h3 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-500" />
              Políticas Clave
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-rose-900/20 border border-rose-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-rose-400 font-semibold mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Inmutabilidad de Datos
                </div>
                <p className="text-sm text-rose-300/80">
                  <code className="bg-rose-900/50 px-1 rounded font-mono text-xs text-rose-400">allow delete: if false;</code><br/>
                  Ningún documento puede ser eliminado de la base de datos. Esto garantiza la trazabilidad absoluta del historial técnico y las órdenes.
                </p>
              </div>

              <div className="p-4 bg-violet-900/20 border border-violet-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-violet-400 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Bloqueo de Órdenes Cerradas
                </div>
                <p className="text-sm text-violet-300/80">
                  <code className="bg-violet-900/50 px-1 rounded font-mono text-xs text-violet-400">resource.data.estado != 'Cerrado'</code><br/>
                  Una vez que una orden pasa a estado "Cerrado", se vuelve de solo lectura. Nadie, ni siquiera los administradores desde la app, pueden modificarla.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
                  <Shield className="w-4 h-4" />
                  Autenticación Requerida
                </div>
                <p className="text-sm text-slate-400">
                  <code className="bg-slate-800 px-1 rounded font-mono text-xs text-slate-300">request.auth != null</code><br/>
                  Todas las operaciones de lectura, creación y actualización requieren que el usuario haya iniciado sesión en el sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
