import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
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
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/diagnostico
// Generates a professional diagnosis from symptom description
// ─────────────────────────────────────────────
router.post('/diagnostico', async (req: Request, res: Response) => {
  const { sintoma, modelo } = req.body;
  if (!sintoma || !modelo) return res.status(400).json({ error: 'sintoma and modelo are required' });

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

    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error('Gemini diagnostico error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
