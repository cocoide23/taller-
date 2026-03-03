import { GoogleGenAI, Type } from "@google/genai";

// Inicializamos el cliente de Gemini. 
// En un entorno real de Firebase Cloud Functions, la API Key se obtendría de Secret Manager o functions.config()
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MechanicReport {
  patente: string | null;
  repuestosDetectados: string[];
  tiempoEstimadoHoras: number | null;
  errorPatente: string | null;
}

/**
 * Simulación de una Firebase Cloud Function (Node.js)
 * Recibe un texto informal y devuelve un JSON estructurado para actualizar la OrdenTrabajo.
 */
export async function processMechanicInput(text: string): Promise<MechanicReport> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza el siguiente reporte informal de un mecánico: "${text}"`,
      config: {
        systemInstruction: `Eres un asistente de inteligencia artificial para un taller mecánico. 
        Tu objetivo es extraer datos estructurados de mensajes de texto o transcripciones de voz informales de los mecánicos.
        Debes extraer:
        1. La patente (matrícula) del vehículo.
        2. Los repuestos utilizados o marcas mencionadas.
        3. El tiempo que llevó la tarea (en horas).
        
        Regla crítica: Si no logras identificar la patente de forma clara en el texto, debes dejar el campo 'patente' como null y proporcionar un mensaje de error descriptivo en 'errorPatente'.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patente: {
              type: Type.STRING,
              description: "La patente del vehículo (ej. ABC 123, AB 123 CD). Null si no se encuentra en el texto."
            },
            repuestosDetectados: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de repuestos y marcas mencionadas en el reporte."
            },
            tiempoEstimadoHoras: {
              type: Type.NUMBER,
              description: "Tiempo que llevó la reparación en horas. Usa decimales si es necesario (ej. 1.5 para una hora y media)."
            },
            errorPatente: {
              type: Type.STRING,
              description: "Mensaje explicando que falta la patente si no se encontró. Null si la patente fue detectada correctamente."
            }
          },
          required: ["repuestosDetectados"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No se recibió respuesta de Gemini.");
    }

    const result = JSON.parse(response.text) as MechanicReport;
    
    // Manejo de errores requerido: Si la patente no se detecta correctamente
    if (!result.patente) {
      // En una Cloud Function real, aquí podríamos lanzar un error HTTP (ej. functions.https.HttpsError)
      // throw new functions.https.HttpsError('invalid-argument', result.errorPatente || 'Patente no detectada');
      console.warn("Validación fallida: Patente no detectada.", result.errorPatente);
    }

    return result;
  } catch (error) {
    console.error("Error procesando el input del mecánico con Gemini:", error);
    throw error;
  }
}
