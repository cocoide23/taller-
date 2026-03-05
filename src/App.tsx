import { useState } from 'react';
import { Database, Shield, List, Code2, ChevronRight, FileJson, Lock, Search, Bot, Send, AlertCircle, CheckCircle2, Clock, Wrench, LayoutDashboard, Calculator, Package, Server, CreditCard, ShieldCheck, Menu, X, Camera } from 'lucide-react';
import { processMechanicInput, MechanicReport } from './services/geminiService';
import Dashboard from './components/Dashboard';
import Presupuestos from './components/Presupuestos';
import Trazabilidad from './components/Trazabilidad';
import Repuestos from './components/Repuestos';
import DevOps from './components/DevOps';
import FirebaseSetup from './components/FirebaseSetup';
import Finanzas from './components/Finanzas';
import SecurityRules from './components/SecurityRules';
import QAReport from './components/QAReport';
import Evidencias from './components/Evidencias';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'presupuestos' | 'trazabilidad' | 'repuestos' | 'evidencias' | 'ai' | 'devops' | 'finanzas' | 'security' | 'qa'>('qa');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // AI State
  const [mechanicInput, setMechanicInput] = useState("Le cambié las pastillas de freno al Ford Focus patente ABC 123, me llevó 2 horas y usé repuestos marca Bosch");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<MechanicReport | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleProcessInput = async () => {
    if (!mechanicInput.trim()) return;
    
    setIsProcessing(true);
    setAiError(null);
    setAiResult(null);
    
    try {
      const result = await processMechanicInput(mechanicInput);
      setAiResult(result);
    } catch (err: any) {
      setAiError(err.message || "Ocurrió un error al procesar el texto con Gemini.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-900 text-slate-100 font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-950 text-white p-4 flex items-center justify-between z-20 sticky top-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            <Wrench className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-100">Taller Manager</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-0 z-10 bg-slate-950 text-slate-300 
        w-full md:w-64 flex-shrink-0 flex flex-col gap-2
        transition-transform duration-300 ease-in-out border-r border-slate-800
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        pt-20 md:pt-4 p-4 md:min-h-[100dvh] overflow-y-auto
      `}>
        <div className="hidden md:flex items-center gap-3 mb-8 px-2 pt-4">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            <Wrench className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Taller Manager</h1>
        </div>

        <nav className="flex flex-col gap-1 pb-24 md:pb-0">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'dashboard' 
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          
          <button
            onClick={() => handleTabChange('presupuestos')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'presupuestos' 
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calculator className="w-5 h-5" />
            Presupuestos
          </button>

          <button
            onClick={() => handleTabChange('repuestos')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'repuestos' 
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package className="w-5 h-5" />
            Repuestos
          </button>

          <button
            onClick={() => handleTabChange('evidencias')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'evidencias' 
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Camera className="w-5 h-5" />
            Evidencias
          </button>

          <button
            onClick={() => handleTabChange('trazabilidad')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'trazabilidad' 
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Search className="w-5 h-5" />
            Trazabilidad
          </button>

          <div className="mt-8 pt-4 border-t border-slate-800 space-y-1">
            <button
              onClick={() => handleTabChange('qa')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full ${
                activeTab === 'qa' 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'text-emerald-400 hover:bg-slate-800 hover:text-emerald-300'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              Auditoría QA
            </button>

            <button
              onClick={() => handleTabChange('finanzas')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full ${
                activeTab === 'finanzas' 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'text-amber-400 hover:bg-slate-800 hover:text-amber-300'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Webhook Finanzas
            </button>

            <button
              onClick={() => handleTabChange('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full ${
                activeTab === 'security' 
                  ? 'bg-rose-500 text-white shadow-md' 
                  : 'text-rose-400 hover:bg-slate-800 hover:text-rose-300'
              }`}
            >
              <Shield className="w-5 h-5" />
              Security Rules
            </button>

            <button
              onClick={() => handleTabChange('ai')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full ${
                activeTab === 'ai' 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'text-emerald-400 hover:bg-slate-800 hover:text-emerald-300'
              }`}
            >
              <Bot className="w-5 h-5" />
              Asistente IA
            </button>
            
            <button
              onClick={() => handleTabChange('devops')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full ${
                activeTab === 'devops' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-blue-400 hover:bg-slate-800 hover:text-blue-300'
              }`}
            >
              <Server className="w-5 h-5" />
              Deploy & Firebase
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100dvh-72px)] md:h-[100dvh] pb-safe bg-slate-900">
        <div className="max-w-6xl mx-auto animate-in fade-in">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'presupuestos' && <Presupuestos />}
          {activeTab === 'trazabilidad' && <Trazabilidad />}
          {activeTab === 'repuestos' && <Repuestos aiResult={aiResult} />}
          {activeTab === 'evidencias' && <Evidencias />}
          {activeTab === 'devops' && <FirebaseSetup />}
          {activeTab === 'finanzas' && <Finanzas />}
          {activeTab === 'security' && <SecurityRules />}
          {activeTab === 'qa' && <QAReport />}
          
          {activeTab === 'ai' && (
            <div className="p-6 max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Bot className="w-6 h-6 text-emerald-500" />
                  Asistente IA (Gemini)
                </h2>
                <p className="text-slate-400">
                  Procesa reportes informales de mecánicos y extrae datos estructurados.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-300">
                    Mensaje del Mecánico (Input)
                  </label>
                  <textarea
                    value={mechanicInput}
                    onChange={(e) => setMechanicInput(e.target.value)}
                    className="w-full h-32 p-4 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none text-slate-200 shadow-sm outline-none"
                    placeholder="Ej: Le cambié el aceite al auto..."
                  />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleProcessInput}
                      disabled={isProcessing || !mechanicInput.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {isProcessing ? 'Procesando...' : 'Procesar con Gemini'}
                    </button>
                    
                    <button
                      onClick={() => setMechanicInput("Revisé los frenos pero me olvidé de anotar a qué auto fue, me llevó 1 hora y media.")}
                      className="px-4 py-3 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      Probar sin patente
                    </button>
                  </div>
                </div>

                {/* Output Section */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col h-full min-h-[300px] shadow-sm">
                  <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Datos Extraídos (Estructurados)
                  </h3>
                  
                  {isProcessing ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
                      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                      <p className="text-sm animate-pulse">Analizando reporte con Gemini...</p>
                    </div>
                  ) : aiError ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-rose-400 text-center p-4">
                      <AlertCircle className="w-8 h-8 mb-2" />
                      <p className="text-sm">{aiError}</p>
                    </div>
                  ) : aiResult ? (
                    <div className="flex-1 flex flex-col">
                      {/* Visual Cards for extracted data */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className={`p-3 rounded-lg border ${aiResult.patente ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                          <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Patente</div>
                          <div className="font-mono font-medium flex items-center gap-2">
                            {aiResult.patente ? (
                              <><CheckCircle2 className="w-4 h-4" /> {aiResult.patente}</>
                            ) : (
                              <><AlertCircle className="w-4 h-4" /> No detectada</>
                            )}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                          <div className="text-xs uppercase tracking-wider opacity-70 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Tiempo
                          </div>
                          <div className="font-mono font-medium">
                            {aiResult.tiempoEstimadoHoras ? `${aiResult.tiempoEstimadoHoras} hrs` : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {aiResult.repuestosDetectados.length > 0 && (
                        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <div className="text-xs uppercase tracking-wider opacity-70 mb-1 flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Repuestos
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {aiResult.repuestosDetectados.map((r, i) => (
                              <span key={i} className="px-2 py-1 bg-amber-500/20 rounded text-xs font-medium">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-600 text-sm text-center">
                      Ingresa un mensaje y presiona "Procesar" para ver el resultado estructurado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
