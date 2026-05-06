import axios from 'axios';

// La URL base de la API de Graph de Meta para WhatsApp
// Reemplaza <VERSION> con la versión de la API (ej. v17.0)
// Reemplaza <PHONE_NUMBER_ID> con tu ID de número de teléfono de WhatsApp Business
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0/<PHONE_NUMBER_ID>/messages';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

/**
 * Envía un mensaje de texto a través de la API de WhatsApp de Meta
 * @param {string} to - Número de teléfono del destinatario con código de país (ej. 521XXXXXXXXXX para México)
 * @param {string} message - El mensaje a enviar
 */
export const sendWhatsAppMessage = async (to, message) => {
  // Limpiar el número para asegurar que solo tenga dígitos
  const cleanTo = to.replace(/\D/g, '');

  if (!WHATSAPP_TOKEN) {
    console.log(`[SIMULACIÓN WHATSAPP] Mensaje para ${cleanTo}: ${message}`);
    return { success: true, simulated: true };
  }

  try {
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error enviando mensaje de WhatsApp:', error?.response?.data || error.message);
    return { success: false, error: error?.response?.data || error.message };
  }
};
