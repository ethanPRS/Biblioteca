import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import supabase from '../db/supabase.js';

const router = express.Router();

// Helper: fetch real-time book catalog from Supabase
async function fetchBookCatalog() {
  const { data: libros, error } = await supabase
    .from('libro')
    .select(`titulo, autor, editorial_clave, edicion, formato, estatus_catalogo, isbn, ejemplar ( estatus )`);

  if (error || !libros) return 'No se pudo obtener el catálogo de libros.';

  const lines = libros.map(l => {
    const copies = l.ejemplar || [];
    const total = copies.length;
    const available = copies.filter(e => e.estatus === 'Disponible').length;

    let statusTag = '';
    if (l.estatus_catalogo === 'Dado de baja') {
      statusTag = '🚫 Dado de baja';
    } else if (available > 0) {
      statusTag = `✅ Disponible (${available}/${total} ejemplares)`;
    } else {
      statusTag = `❌ No disponible (0/${total} ejemplares)`;
    }

    return `• "${l.titulo}" — ${l.autor} | ${l.editorial_clave}, ${l.edicion} | Formato: ${l.formato} | ${statusTag}`;
  });

  return lines.join('\n');
}

// Models to try in order — fallback if one is overloaded
const MODEL_CHAIN = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];

router.post('/', async (req, res) => {
  try {
    const { message, history, context } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en el servidor.' });
    }

    const bookCatalog = await fetchBookCatalog();
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `
Eres el Asistente Virtual Oficial de la biblioteca "Ducky University".
Tu tono debe ser súper amable, profesional, conciso y muy enfocado en resolver dudas sobre libros, biblioteca, préstamos y multas.

Datos del usuario actual:
Nombre: ${context?.name || 'Usuario'}
Rol: ${context?.role || 'Desconocido'}
Préstamos Activos: ${context?.activeLoans || 0}
Multas Pendientes: ${context?.pendingFines || '$0.00'}

=== CATÁLOGO ACTUAL DE LIBROS EN LA BIBLIOTECA ===
${bookCatalog}
===================================================

Reglas:
1. Háblale por su nombre amigablemente.
2. Usa el catálogo de arriba para responder preguntas sobre disponibilidad de libros. Es información en tiempo real.
3. Si preguntan por un libro específico, busca en el catálogo y responde con precisión (disponible, prestado, dado de baja, etc.).
4. Si el rol es "Administrador" o "Bibliotecario", puedes ayudar diciéndole cómo realizar gestiones.
5. Si el rol es "Alumno" o "Profesor", ayúdale a saber qué libros tiene, fechas de vencimiento y cómo devolver.
6. NUNCA inventes información que no esté en el catálogo o en el contexto del usuario.
7. Responde con Markdown. Mantén tus respuestas cortas y al grano (máximo 2-3 párrafos).
    `;

    const chatHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Entendido. Soy Ducky, el Asistente de la Biblioteca Ducky University. Tengo acceso al catálogo actualizado y estoy listo para ayudar.' }] },
      ...(history || []).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    ];

    const generationConfig = { maxOutputTokens: 1000, temperature: 0.7 };

    // Try each model in the chain until one works
    let lastError = null;
    for (const modelName of MODEL_CHAIN) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({ history: chatHistory, generationConfig });
        const result = await chat.sendMessage(message);
        const text = result.response.text();
        return res.json({ reply: text });
      } catch (modelError) {
        console.warn(`Model ${modelName} failed: ${modelError.message}`);
        lastError = modelError;
        const isRetryable = modelError.message?.includes('503') ||
                            modelError.message?.includes('429') ||
                            modelError.message?.includes('overloaded') ||
                            modelError.message?.includes('quota');
        if (!isRetryable) break;
        // Small delay before trying next model
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    throw lastError;

  } catch (error) {
    console.error('Error in chat route:', error);
    res.status(500).json({ error: 'Ocurrió un error al contactar al asistente inteligente.', details: error.message });
  }
});

export default router;
