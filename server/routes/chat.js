import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, history, context } = req.body;
    
    // Configura tu API key en el archivo .env
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Falta configurar GEMINI_API_KEY en el servidor." 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // We use gemini-2.5-flash as the user's key supports it natively
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build the system prompt using the metadata passed from the frontend
    const systemPrompt = `
      Eres el Asistente Virtual Oficial de la biblioteca "Ducky University".
      Tu tono debe ser súper amable, profesional, conciso y muy enfocado en resolver dudas sobre libros, biblioteca, préstamos y multas.
      
      Datos del usuario actual:
      Nombre: ${context?.name || 'Usuario'}
      Rol: ${context?.role || 'Desconocido'}
      Préstamos Activos: ${context?.activeLoans || 0}
      Multas Pendientes: ${context?.pendingFines || '$0.00'}
      
      Reglas:
      1. Háblale por su nombre amigablemente.
      2. Si el rol es "Administrador" o "Bibliotecario", puedes ayudar diciéndole cómo realizar gestiones (cómo agregar libros en la sección "Gestión de Libros", revisar multas, etc).
      3. Si el rol es "Alumno" o "Profesor", ayúdale a saber qué libros tiene, fechas de vencimiento y cómo hacer la devolución.
      4. NUNCA inventes información de la base de datos si no la tienes en tu contexto. 
      5. Responde con Markdown para que se vea bien en el chat (usa negritas, listas, etc.). Manten tus respuestas cortas y al grano (máximo 2-3 párrafos).
    `;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "Entendido. Soy el Asistente de Ducky University. Estoy listo para ayudar al usuario con su rol y contexto actual." }]
        },
        ...(history || []).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('Error in chat route:', error);
    res.status(500).json({ error: "Ocurrió un error al contactar al asistente inteligente.", details: error.message });
  }
});

export default router;
