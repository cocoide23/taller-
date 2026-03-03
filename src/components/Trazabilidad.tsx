import { useState, useEffect } from 'react';
import { mockDbService, Order, normalizePatente } from '../services/apiService';
import { Search, History, Wrench, Calendar, Camera, PlusCircle, Car, User, CheckCircle2, Package } from 'lucide-react';

export default function Trazabilidad() {
  const [patente, setPatente] = useState('');
  const [history, setHistory] = useState<Order[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [vehicleExists, setVehicleExists] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!patente || patente.length < 6) {
      setHistory([]);
      setHasSearched(false);
      setVehicleExists(true);
      return;
    }

    const normalizedPatente = normalizePatente(patente);
    let active = true;

    // Check vehicle existence asynchronously
    mockDbService.checkVehicleExists(normalizedPatente).then(exists => {
      if (active) setVehicleExists(exists);
    });

    // Subscribe to order history for this license plate
    const unsubscribe = mockDbService.subscribeToHistorial(normalizedPatente, (data) => {
      if (active) {
        setHistory(data);
        setHasSearched(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [patente]);

  const handleRegisterVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const modelo = formData.get('modelo') as string;
    const nombre = formData.get('nombre') as string;
    const apellido = formData.get('apellido') as string;
    const telefono = formData.get('telefono') as string;

    await mockDbService.addVehicle({
      patente: normalizePatente(patente),
      modelo,
      cliente: { nombre, apellido, telefono }
    });
    
    setVehicleExists(true);
    setIsRegistering(false);
  };

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

      {hasSearched && patente.length >= 6 && !vehicleExists && !isRegistering && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed animate-in fade-in">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Vehículo no encontrado</h3>
          <p className="text-slate-500 mb-6">La patente <span className="font-mono font-bold text-slate-700">{normalizePatente(patente)}</span> no está registrada en el sistema.</p>
          <button
            onClick={() => setIsRegistering(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            Registrar Nuevo Vehículo
          </button>
        </div>
      )}

      {isRegistering && (
        <form onSubmit={handleRegisterVehicle} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-500" />
            Registro Rápido de Vehículo
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Patente</label>
              <input 
                type="text" 
                value={normalizePatente(patente)} 
                disabled 
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Modelo del Vehículo</label>
              <input 
                type="text" 
                name="modelo" 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: Ford Focus 2.0"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 mb-6">
            <h4 className="text-sm font-medium text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Datos del Cliente
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <input type="text" name="nombre" required placeholder="Nombre" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <input type="text" name="apellido" required placeholder="Apellido" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <input type="tel" name="telefono" required placeholder="Teléfono" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRegistering(false)}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm"
            >
              Guardar Vehículo
            </button>
          </div>
        </form>
      )}

      {hasSearched && history.length === 0 && vehicleExists && patente.length >= 6 && !isRegistering && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <p className="text-slate-500">El vehículo <span className="font-mono font-bold">{normalizePatente(patente)}</span> está registrado pero no tiene historial de órdenes.</p>
        </div>
      )}

      {history.length > 0 && !isRegistering && (
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
                    {new Date(entry.fechaIngreso).toLocaleDateString()}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                    entry.estado === 'Finalizado' || entry.estado === 'Cerrado' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {entry.estado}
                  </span>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">Síntoma Reportado</h4>
                  <p className="text-slate-600 text-sm italic">"{entry.sintomaCliente}"</p>
                </div>

                {entry.diagnostico && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                      Diagnóstico Técnico
                    </h4>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{entry.diagnostico}</p>
                  </div>
                )}

                {entry.repuestos && entry.repuestos.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      Repuestos Utilizados
                    </h4>
                    <ul className="space-y-1">
                      {entry.repuestos.map(r => (
                        <li key={r.id} className="text-sm text-slate-600 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                          {r.cantidad}x {r.nombre}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
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
                  <span className="font-medium">Mecánico: {entry.mecanicoResponsable?.nombre || 'No asignado'}</span>
                  <span className="font-mono opacity-60">ID: {entry.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
