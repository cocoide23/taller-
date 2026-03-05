import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, Wrench, User as UserIcon, Clock, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

interface Job {
  id: string;
  descripcion: string;
  estado: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  vehicle: {
    patente: string;
    modelo: string;
    cliente_nombre: string;
  };
  mechanic?: {
    id: string;
    name: string;
  } | null;
}

interface Mechanic {
  id: string;
  name: string;
}

export default function JobsDashboard() {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar trabajos');
      const data = await res.json();
      setJobs(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchMechanics = async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const res = await fetch('/api/mechanics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMechanics(data);
      }
    } catch (err) {
      console.error("Error fetching mechanics", err);
    }
  };

  useEffect(() => {
    if (token) {
      Promise.all([fetchJobs(), fetchMechanics()]).finally(() => setIsLoading(false));
    }
  }, [token, user]);

  const handleAssignMechanic = async (jobId: string, mechanicId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ mechanicId })
      });
      if (res.ok) {
        fetchJobs(); // Refresh
      }
    } catch (err) {
      console.error("Error assigning mechanic", err);
    }
  };

  const handleStatusChange = async (jobId: string, status: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchJobs(); // Refresh
      }
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Terminado</span>;
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit"><Wrench className="w-3 h-3" /> En Curso</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pendiente</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Trabajos Asignados</h1>
          <p className="text-slate-400 mt-1">
            {user?.role === 'ADMIN' ? 'Vista global de todos los trabajos del taller.' : 'Tus trabajos asignados.'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
          <UserIcon className="w-5 h-5 text-violet-400" />
          <span className="font-medium text-slate-200">{user?.name}</span>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-violet-500/20 text-violet-300 ml-2">
            {user?.role}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-900/40 border border-rose-800 rounded-xl flex items-center gap-3 text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm">
                <th className="p-4 font-medium">Vehículo</th>
                <th className="p-4 font-medium">Descripción</th>
                <th className="p-4 font-medium">Estado</th>
                {user?.role === 'ADMIN' && <th className="p-4 font-medium">Mecánico</th>}
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No hay trabajos registrados.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-200">{job.vehicle.patente}</div>
                      <div className="text-sm text-slate-500">{job.vehicle.modelo}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300 max-w-xs truncate" title={job.descripcion}>
                        {job.descripcion}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(job.estado)}
                    </td>
                    
                    {user?.role === 'ADMIN' && (
                      <td className="p-4">
                        <div className="relative">
                          <select
                            value={job.mechanic?.id || ''}
                            onChange={(e) => handleAssignMechanic(job.id, e.target.value)}
                            className="appearance-none w-full bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none cursor-pointer"
                          >
                            <option value="">Sin asignar</option>
                            {mechanics.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </td>
                    )}

                    <td className="p-4 text-right">
                      {/* Acciones para cambiar estado */}
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={job.estado}
                          onChange={(e) => handleStatusChange(job.id, e.target.value)}
                          className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                          <option value="PENDING">Pendiente</option>
                          <option value="IN_PROGRESS">En Curso</option>
                          <option value="COMPLETED">Terminado</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
