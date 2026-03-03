import React, { useState, useEffect } from 'react';
import { mockDbService, Order } from '../services/apiService';
import { Camera, Upload, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function Evidencias() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = mockDbService.subscribeToOrders(setOrders);
    return () => unsubscribe();
  }, []);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrderId) return;

    setIsUploading(true);
    setUploadSuccess(false);

    // Simulate Firebase Storage upload
    setTimeout(() => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        mockDbService.addEvidencia(selectedOrderId, base64String);
        setIsUploading(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Camera className="w-6 h-6 text-indigo-500" />
          Evidencias Fotográficas
        </h2>
        <p className="text-slate-500">Sube fotos de los vehículos y repuestos vinculadas a la Orden de Trabajo (Firebase Storage).</p>
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
          <div className="p-6 md:p-8 space-y-8">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center justify-center gap-3">
                {isUploading ? (
                  <>
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-sm font-medium text-slate-600">Subiendo a Storage...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-2">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-medium text-slate-900">Haz clic o arrastra una foto aquí</p>
                    <p className="text-sm text-slate-500">Soporta JPG, PNG (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>

            {uploadSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-sm font-medium">Foto subida y vinculada correctamente a la orden.</p>
              </div>
            )}

            {/* Gallery Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-slate-500" />
                Galería de la Orden
              </h3>
              
              {selectedOrder.evidenciaFotografica && selectedOrder.evidenciaFotografica.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {selectedOrder.evidenciaFotografica.map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
                      <img src={photo} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium px-2 py-1 bg-black/50 rounded-lg">Ver foto</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-slate-200 rounded-2xl bg-slate-50">
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No hay fotos vinculadas a esta orden todavía.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
