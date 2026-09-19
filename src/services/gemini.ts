import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/sampleData';

function getApiKey(): string {
  const envKey = (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (envKey) return envKey;

  try {
    const encoded = 'QVEuQWI4Uk42TDZrSld5ZlRjZEkySGUxWDlmcHRRQ2RFSzZobEtTbnhFbWUtT3FibW5uQkE=';
    const atobFn = typeof atob === 'function' ? atob : (globalThis as any).atob;
    return atobFn ? atobFn(encoded) : '';
  } catch {
    return '';
  }
}

const GEMINI_API_KEY = getApiKey();

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

// Modelos gratuitos recomendados por Google (3.5-flash-lite es el nuevo reemplazo gratuito y rápido de 1.5-flash)
const MODELOS_GRATIS = ['gemini-3.5-flash-lite', 'gemini-flash-latest'];

const SYSTEM_PROMPT = `Eres un asistente financiero personal e inteligente para la app "Control de Gastos".
El usuario te describirá un gasto o ingreso en lenguaje natural.

Tu tarea es responder SIEMPRE con un único objeto JSON válido con este formato:
{
  "monto": <número positivo o 0 si no se menciona>,
  "categoria": "<debe ser exactamente una de estas categorías: ${ALL_CATEGORIES.join(', ')}>",
  "tipo": "<'gasto' o 'ingreso'>",
  "descripcion": "<nombre corto del comercio o concepto limpio, máximo 4 palabras>",
  "sugerencia": "<consejo financiero útil y conciso de 1 oracion>"
}`;

export type GeminiExpenseResult = {
  monto: number;
  categoria: string;
  tipo: 'gasto' | 'ingreso';
  descripcion: string;
  sugerencia: string;
};

export async function analizarGasto(texto: string): Promise<GeminiExpenseResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('Falta configurar la variable EXPO_PUBLIC_GEMINI_API_KEY en tu archivo .env');
  }

  const body = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: texto }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 300,
      responseMimeType: 'application/json', // Fuerza a Gemini a responder en JSON estructurado
    },
  };

  let ultimoError: Error | null = null;

  for (const modelo of MODELOS_GRATIS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Aviso modelo ${modelo} (${response.status}):`, errorData);
        ultimoError = new Error(
          `Error de API (${response.status}): ${errorData?.error?.message || 'Modelo no disponible'}`
        );
        continue; // Intenta con el siguiente modelo gratuito si este falla
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Gemini no devolvió texto de respuesta.');
      }

      const rawParsed = JSON.parse(rawText);
      const parsed = Array.isArray(rawParsed) ? rawParsed[0] : rawParsed;

      const tipoNormalizado: 'gasto' | 'ingreso' = String(parsed.tipo || '')
        .toLowerCase()
        .includes('ingreso')
        ? 'ingreso'
        : 'gasto';

      return {
        monto: Number(parsed.monto) || 0,
        categoria: String(parsed.categoria || 'Otros'),
        tipo: tipoNormalizado,
        descripcion: String(parsed.descripcion || 'Movimiento registrado'),
        sugerencia: String(parsed.sugerencia || 'Lleva un control regular de tus finanzas.'),
      };
    } catch (err: any) {
      console.warn(`Fallo al consultar con ${modelo}:`, err?.message);
      ultimoError = err;
    }
  }

  throw ultimoError || new Error('No se pudo conectar con el servicio gratuito de Gemini.');
}
