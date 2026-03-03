import { GoogleGenAI, Type } from "@google/genai";

export interface DiagnosisResult {
  diagnosticoPresuntivo: string;
  alertaMantenimiento: string;
}

export const generateDiagnosis = async (sintoma: string, modelo: string): Promise<DiagnosisResult> => {
  // Inicializamos Gemini usando la variable de entorno inyectada por el sistema
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `Actúa como un mecánico experto y jefe de taller. 
  El cliente reporta el siguiente síntoma en su vehículo (${modelo}): "${sintoma}".
  
  Tu tarea es generar:
  1. Un diagnóstico presuntivo redactado de forma profesional, empática y clara para el cliente (un párrafo bien redactado, no una lista de datos técnicos).
  2. Una alerta de mantenimiento preventivo recomendada para este tipo de vehículo o síntoma (ej: "Sugerimos revisar también...").`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diagnosticoPresuntivo: { 
            type: Type.STRING, 
            description: "Diagnóstico técnico detallado del problema." 
          },
          alertaMantenimiento: { 
            type: Type.STRING, 
            description: "Alerta de mantenimiento preventivo a recomendar al cliente." 
          }
        },
        required: ["diagnosticoPresuntivo", "alertaMantenimiento"]
      }
    }
  });

  if (!response.text) {
    throw new Error("La IA no devolvió una respuesta válida.");
  }

  return JSON.parse(response.text) as DiagnosisResult;
};
