import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

// Simple in-memory cooldown map to avoid spamming Gemini when quota is low.
// Keyed by requester IP. Value is timestamp (ms) until which requests are blocked.
const cooldowns = new Map<string, number>();

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
}

function handleGeminiError(err: any, res: Response) {
  const raw: string = err?.message || '';
  // Try to extract the structured error payload Gemini embeds in the message
  let code: number | undefined;
  let status: string | undefined;
  try {
    const parsed = JSON.parse(raw);
    code   = parsed?.error?.code;
    status = parsed?.error?.status;
  } catch {
    // message is not JSON — use HTTP status if available
    code = err?.status;
  }

  if (code === 429 || status === 'RESOURCE_EXHAUSTED') {
    // Try to extract retry info (seconds) from error.details
    let retrySeconds: number | undefined;
    try {
      const parsed = JSON.parse(raw);
      const details = parsed?.error?.details || [];
      for (const d of details) {
        if (d?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo') {
          const delay = d?.retryDelay;
          if (typeof delay === 'string') {
            // format like "42.283246563s"
            const m = delay.match(/([0-9]+)(?:\.([0-9]+))?s/);
            if (m) retrySeconds = Math.ceil(parseFloat(m[1] + (m[2] ? '.' + m[2] : '')));
          } else if (delay && typeof delay.seconds !== 'undefined') {
            retrySeconds = Math.ceil(Number(delay.seconds));
          }
        }
      }
    } catch {
      /* ignore */
    }

    const payload: any = {
      error: 'Cuota de la IA agotada. El límite gratuito diario fue alcanzado. Intentá de nuevo más tarde o habilitá facturación en Google AI Studio.',
    };
    if (retrySeconds) payload.retryAfter = retrySeconds;
    return res.status(429).json(payload);
  }
  if (code === 400 || status === 'INVALID_ARGUMENT') {
    return res.status(400).json({
      error: 'La clave de API de Gemini no es válida. Verificá la variable GEMINI_API_KEY en el servidor.',
    });
  }
  // Generic fallback
  return res.status(500).json({ error: 'Error al procesar la solicitud con la IA. Intentá de nuevo.' });
}

// ─────────────────────────────────────────────
// POST /api/ai/parse-input
// Parses informal mechanic text into structured data
// ─────────────────────────────────────────────
router.post('/parse-input', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Analiza el siguiente reporte informal de un mecánico: "${text}"`,
      config: {
        systemInstruction: `Eres un asistente de inteligencia artificial para un taller mecánico. 
        Tu objetivo es extraer datos estructurados de mensajes de texto o transcripciones de voz informales de los mecánicos.
        Debes extraer:
        1. La patente (matrícula) del vehículo.
        2. Los repuestos utilizados o marcas mencionadas.
        3. El tiempo que llevó la tarea (en horas).
        
        Regla crítica: Si no logras identificar la patente de forma clara en el texto, debes dejar el campo 'patente' como null y proporcionar un mensaje de error descriptivo en 'errorPatente'.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patente: { type: Type.STRING, description: 'La patente del vehículo. Null si no se encuentra.' },
            repuestosDetectados: { type: Type.ARRAY, items: { type: Type.STRING } },
            tiempoEstimadoHoras: { type: Type.NUMBER },
            errorPatente: { type: Type.STRING, description: 'Mensaje de error si la patente no fue detectada.' },
          },
          required: ['repuestosDetectados'],
        },
      },
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error('Gemini parse-input error:', err);
    handleGeminiError(err, res);
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/diagnostico
// Generates a professional diagnosis from symptom description
// ─────────────────────────────────────────────
router.post('/diagnostico', async (req: Request, res: Response) => {
  const { sintoma, modelo } = req.body;
  if (!sintoma || !modelo) return res.status(400).json({ error: 'sintoma and modelo are required' });
  // Simple per-requester cooldown to avoid rapid retries when quota is low
  const key = (req.headers['x-forwarded-for'] as string) || req.ip || 'global';
  const blockedUntil = cooldowns.get(key) || 0;
  if (blockedUntil > Date.now()) {
    const retryAfter = Math.ceil((blockedUntil - Date.now()) / 1000);
    return res.status(429).json({ error: 'Rate limitado localmente. Reintentá más tarde.', retryAfter });
  }

  try {
    const ai = getAI();
    const prompt = `Actúa como un mecánico experto y jefe de taller. 
El cliente reporta el siguiente síntoma en su vehículo (${modelo}): "${sintoma}".

Tu tarea es generar:
1. Un diagnóstico presuntivo redactado de forma profesional, empática y clara para el cliente (un párrafo bien redactado, no una lista de datos técnicos).
2. Una alerta de mantenimiento preventivo recomendada para este tipo de vehículo o síntoma.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosticoPresuntivo: { type: Type.STRING },
            alertaMantenimiento: { type: Type.STRING },
          },
          required: ['diagnosticoPresuntivo', 'alertaMantenimiento'],
        },
      },
    });

    // Set a brief cooldown for this requester to avoid rapid repeated calls
    cooldowns.set(key, Date.now() + 15 * 1000);
    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error('Gemini diagnostico error:', err);
    handleGeminiError(err, res);
  }
});

export default router;
