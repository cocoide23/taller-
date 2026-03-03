import { Terminal, Server, Key, ShieldCheck, GitBranch, FileCode2 } from 'lucide-react';

const yamlContent = `name: Deploy to Firebase Hosting and Functions
on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Frontend Dependencies
        run: npm ci

      - name: Build Frontend (React/Vite)
        run: npm run build

      - name: Install Cloud Functions Dependencies
        run: cd functions && npm ci

      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting,functions
        env:
          FIREBASE_TOKEN: \${{ secrets.FIREBASE_TOKEN }}
`;

const secretFunctionCode = `import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";

// 1. Definimos el secreto (Firebase Secret Manager)
const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const processMechanicReport = onCall(
  { 
    // 2. Inyectamos el secreto en la función
    secrets: [geminiApiKey],
    region: "us-central1"
  },
  async (request) => {
    // 3. Accedemos al valor de forma segura en tiempo de ejecución
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    
    const text = request.data.text;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: text,
      // ... configuración del schema ...
    });
    
    return JSON.parse(response.text);
  }
);`;

export default function DevOps() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-6 h-6 text-indigo-500" />
          Estrategia de Deploy y CI/CD
        </h2>
        <p className="text-slate-500">
          Configuración de despliegue continuo con GitHub Actions y gestión segura de secretos en Firebase.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: GitHub Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">GitHub Actions (CI/CD)</h3>
                <p className="text-xs text-slate-500">.github/workflows/firebase-deploy.yml</p>
              </div>
            </div>
            
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-4">
                Este workflow automatiza el despliegue del Frontend (Hosting) y el Backend (Cloud Functions) cada vez que se hace push a la rama <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-xs">main</code>.
              </p>
              
              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
                  {yamlContent}
                </pre>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                <Terminal className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Configuración requerida:</p>
                  <ol className="list-decimal ml-4 space-y-1 opacity-90">
                    <li>Ejecutar <code className="font-mono bg-blue-100 px-1 rounded">firebase login:ci</code> para obtener el token.</li>
                    <li>Ir a GitHub &gt; Settings &gt; Secrets and variables &gt; Actions.</li>
                    <li>Crear el secreto <code className="font-mono bg-blue-100 px-1 rounded">FIREBASE_TOKEN</code>.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Secretos y Gemini */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Seguridad: API Key de Gemini</h3>
                <p className="text-xs text-slate-500">Google Cloud Secret Manager + Firebase</p>
              </div>
            </div>
            
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-4">
                Nunca debes guardar la API Key de Google AI Studio en el código fuente ni en variables de entorno planas. Utilizaremos <strong>Firebase Secret Manager</strong>.
              </p>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  1. Guardar el secreto en la CLI
                </h4>
                <div className="bg-slate-900 rounded-lg p-3">
                  <code className="text-emerald-400 font-mono text-xs">
                    firebase functions:secrets:set GEMINI_API_KEY
                  </code>
                </div>
                <p className="text-xs text-slate-500 mt-1 ml-1">Te pedirá que ingreses el valor de la API Key de forma segura.</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-slate-400" />
                  2. Uso en Cloud Functions (v2)
                </h4>
                <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-blue-300 font-mono text-xs leading-relaxed">
                    {secretFunctionCode}
                  </pre>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800">
                <Key className="w-5 h-5 shrink-0" />
                <p className="text-sm">
                  <strong>Ventaja de seguridad:</strong> El secreto <code className="font-mono bg-amber-100 px-1 rounded">GEMINI_API_KEY</code> solo se desencripta en la memoria del servidor en el momento exacto en que la Cloud Function se ejecuta. No es visible en la consola de Firebase ni en el código fuente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
