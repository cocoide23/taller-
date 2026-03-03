import { useState, useEffect } from 'react';
import { mockDbService, HistoryEntry } from '../services/mockDb';
import { Search, History, Wrench, Calendar, Camera } from 'lucide-react';

export default function Trazabilidad() {
  const [patente, setPatente] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!patente || patente.length < 6) {
      setHistory([]);
      return;
    }

    // Simula onSnapshot a la subcolección historial_tecnico
    const unsubscribe = mockDbService.subscribeToHistorial(patente, (data) => {
      setHistory(data);
      setHasSearched(true);
    });

    return () => unsubscribe();
  }, [patente]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-500" />
          Buscador de Trazabilidad
        </h2>
        <p className="text-slate-500">Consulta el historial técnico inmutable de cualquier vehículo por su patente.</p>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={patente}
          onChange={(e) => setPatente(e.target.value)}
          className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-lg font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-shadow"
          placeholder="INGRESE PATENTE (EJ: ABC 123)"
        />
      </div>

      {hasSearched && history.length === 0 && patente.length >= 6 && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <p className="text-slate-500">No se encontraron registros históricos para la patente <span className="font-mono font-bold">{patente.toUpperCase()}</span></p>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {history.map((entry, index) => (
            <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Wrench className="w-4 h-4" />
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(entry.fecha).toLocaleDateString()}
                  </div>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg border border-slate-200">
                    {entry.kilometraje.toLocaleString()} km
                  </span>
                </div>
                
                <p className="text-slate-700 mb-4 text-sm leading-relaxed">{entry.descripcion}</p>
                
                {/* Evidencia Fotográfica */}
                {entry.evidenciaFotografica && entry.evidenciaFotografica.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-2">
                      <Camera className="w-3.5 h-3.5" />
                      Evidencia Fotográfica
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                      {entry.evidenciaFotografica.map((url, i) => (
                        <img 
                          key={i} 
                          src={url} 
                          alt={`Evidencia ${i + 1}`} 
                          className="w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0 snap-start"
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span className="font-medium">Mecánico: {entry.mecanicoResponsable}</span>
                  <span className="font-mono opacity-60">ID: {entry.ordenId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
