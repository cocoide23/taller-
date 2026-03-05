import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      login(data.token, data.user);
      
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/mechanic');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-violet-500/30">
            <Lock className="w-6 h-6 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Iniciar Sesión</h2>
          <p className="text-slate-400 mt-2">Accede a tu panel de control</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-900/40 border border-rose-800 rounded-xl flex items-start gap-3 text-rose-400 animate-in fade-in">
            <AlertCircle className="w-5 h-5 mt-0.5 text-rose-500 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}