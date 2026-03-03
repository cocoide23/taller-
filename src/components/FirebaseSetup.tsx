import React from 'react';
import { FileCode2, Terminal, ShieldAlert, CloudLightning, Database, Code2, MessageCircle } from 'lucide-react';

export default function FirebaseSetup() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CloudLightning className="w-6 h-6 text-indigo-500" />
          Deploy & Configuración Firebase
        </h2>
        <p className="text-slate-500 mt-2">
          Entregables de código y guía paso a paso para desplegar Taller Manager en producción con Next.js 14 y Firebase v10.
        </p>
      </div>

      {/* Guía de Fixes */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-white">1. Guía de Fixes y Setup Inicial</h3>
        </div>
        <div className="p-6 prose prose-slate max-w-none">
          <h4>Comandos de Instalación (Next.js + Firebase + Gemini)</h4>
          <pre className="bg-slate-100 p-4 rounded-xl overflow-x-auto text-sm">
            <code>npm install firebase @google/genai lucide-react tailwindcss postcss autoprefixer</code>
          </pre>
          
          <h4>Pasos en Firebase Console:</h4>
          <ol className="list-decimal pl-5 space-y-2 text-slate-700">
            <li>Crea un proyecto en <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600">Firebase Console</a>.</li>
            <li>Habilita <strong>Firestore Database</strong> en modo producción.</li>
            <li>Habilita <strong>Storage</strong> para la evidencia fotográfica.</li>
            <li>Ve a <em>Project Settings &gt; Service Accounts</em> y genera una nueva clave privada para el entorno de Node.js (si usas Functions).</li>
            <li>Para la API Key de Gemini, ve a Google AI Studio, genera una clave y configúrala en Firebase Functions:
              <pre className="bg-slate-100 p-2 rounded-lg mt-2 text-xs"><code>firebase functions:secrets:set GEMINI_API_KEY</code></pre>
            </li>
          </ol>
        </div>
      </section>

      {/* firebaseConfig.ts */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">2. firebaseConfig.ts</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">Configuración modular con manejo de errores para evitar el fallo de "Servicio no disponible".</p>
          <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed">
{`import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Singleton pattern to prevent re-initialization in Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Helper para verificar conexión
export const checkConnection = async () => {
  if (!db) throw new Error("Service Unavailable: Firestore no inicializado.");
  return true;
};`}
          </pre>
        </div>
      </section>

      {/* firestore.rules */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h3 className="font-semibold text-white">3. firestore.rules & storage.rules</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">Reglas blindadas que prohíben delete y bloquean update en órdenes cerradas.</p>
          <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regla global: Nadie puede borrar documentos (Inmutabilidad)
    match /{document=**} {
      allow delete: if false;
    }

    match /ordenes/{ordenId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      
      // Bloquear updates si la orden ya está Cerrada o Anulada
      allow update: if request.auth != null 
                    && resource.data.estado != 'Cerrado' 
                    && resource.data.estado != 'Anulado'
                    // Si se está intentando cambiar a Cerrado, permitirlo una única vez
                    || (request.resource.data.estado == 'Cerrado' && resource.data.estado != 'Cerrado');
    }

    match /vehiculos/{patente}/historial_tecnico/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      // El historial técnico es 100% inmutable una vez creado
      allow update: if false;
    }
  }
}

// storage.rules
service firebase.storage {
  match /b/{bucket}/o {
    match /evidencias/{patente}/{allPaths=**} {
      allow read: if request.auth != null;
      // Solo permitir subir imágenes menores a 5MB
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024 
                   && request.resource.contentType.matches('image/.*');
    }
  }
}`}
          </pre>
        </div>
      </section>

      {/* functions/diagnostico.ts */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-white">4. functions/diagnostico.ts (Cloud Function v2)</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">Cloud Function que llama a Gemini para el diagnóstico técnico y preventivo de forma segura.</p>
          <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed">
{`import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI, Type } from "@google/genai";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const generarDiagnosticoIA = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes estar autenticado.");
    }

    const { sintoma, modelo } = request.data;
    if (!sintoma || !modelo) {
      throw new HttpsError("invalid-argument", "Faltan datos requeridos.");
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    
    const prompt = \`Actúa como un mecánico experto. Vehículo: \${modelo}. Síntoma: "\${sintoma}".
    Genera: 1. Diagnóstico presuntivo. 2. Repuestos sugeridos (SIN PRECIOS). 3. Alerta de mantenimiento preventivo.\`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnosticoPresuntivo: { type: Type.STRING },
              repuestosSugeridos: { type: Type.ARRAY, items: { type: Type.STRING } },
              alertaMantenimiento: { type: Type.STRING }
            },
            required: ["diagnosticoPresuntivo", "repuestosSugeridos", "alertaMantenimiento"]
          }
        }
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Error Gemini:", error);
      throw new HttpsError("internal", "Error al procesar con IA.");
    }
  }
);`}
          </pre>
        </div>
      </section>
      {/* WhatsApp Engine */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-white">5. WhatsApp Engine (Frontend)</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">Función para construir y enviar el mensaje dinámico por WhatsApp al cliente.</p>
          <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed">
{`export const handleWhatsApp = (cliente, vehiculo, totalARS, linkApp) => {
  if (!cliente || !cliente.telefono) return;
  
  const { nombre, telefono } = cliente;
  
  const mensaje = \`Hola \${nombre}, el diagnóstico de tu \${vehiculo} ya está listo. El presupuesto total es de \${totalARS}. Podés ver el detalle técnico y las fotos de los repuestos aquí: \${linkApp}\`;
  
  // Limpiamos el teléfono de caracteres no numéricos
  const telefonoLimpio = telefono.replace(/\\D/g, '');
  const url = \`https://wa.me/\${telefonoLimpio}?text=\${encodeURIComponent(mensaje)}\`;
  
  window.open(url, '_blank');
};`}
          </pre>
        </div>
      </section>
    </div>
  );
}
