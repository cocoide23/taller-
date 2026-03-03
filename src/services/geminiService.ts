/**
 * geminiService.ts — client-side wrapper
 * Calls the backend /api/ai/parse-input endpoint (Gemini key stays server-side).
 */

export interface MechanicReport {
  patente: string | null;
  repuestosDetectados: string[];
  tiempoEstimadoHoras: number | null;
  errorPatente: string | null;
}

export async function processMechanicInput(text: string): Promise<MechanicReport> {
  const res = await fetch('/api/ai/parse-input', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  const result: MechanicReport = await res.json();

  if (!result.patente) {
    console.warn('Validación fallida: Patente no detectada.', result.errorPatente);
  }

  return result;
}

