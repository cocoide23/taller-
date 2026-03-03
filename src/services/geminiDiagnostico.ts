/**
 * geminiDiagnostico.ts — client-side wrapper
 * Calls the backend /api/ai/diagnostico endpoint (Gemini key stays server-side).
 */

export interface DiagnosisResult {
  diagnosticoPresuntivo: string;
  alertaMantenimiento: string;
}

export const generateDiagnosis = async (sintoma: string, modelo: string): Promise<DiagnosisResult> => {
  const res = await fetch('/api/ai/diagnostico', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sintoma, modelo }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<DiagnosisResult>;
};

