import axios from 'axios';

// La URL base de la API de Graph de Meta para WhatsApp
// Reemplaza <VERSION> con la versión de la API (ej. v17.0)
// Reemplaza <PHONE_NUMBER_ID> con tu ID de número de teléfono de WhatsApp Business
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0/<PHONE_NUMBER_ID>/messages';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

/**
 * Envía un mensaje de plantilla a través de la API de WhatsApp de Meta
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} templateName - El nombre de la plantilla aprobada en Meta
 * @param {Array} parameters - Arreglo de strings con las variables de la plantilla [{type: "text", text: "valor"}]
 */
export const sendWhatsAppTemplate = async (to, templateName, parameters = []) => {
  const cleanTo = to.replace(/\D/g, '');

  if (!WHATSAPP_TOKEN) {
    console.log(`[SIMULACIÓN WHATSAPP] Plantilla '${templateName}' enviada a ${cleanTo} con params:`, parameters);
    return { success: true, simulated: true };
  }

  try {
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'es_MX' // Asegúrate de que este código coincida con el idioma en el que creaste la plantilla
          },
          components: parameters.length > 0 ? [
            {
              type: 'body',
              parameters: parameters
            }
          ] : []
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
