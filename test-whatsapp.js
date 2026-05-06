import 'dotenv/config';
import axios from 'axios';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// Reemplaza esto con tu número verificado (con código de país, ej. 528112345678)
const TEST_PHONE_NUMBER = '528126217157'; 

async function testWhatsApp() {
  if (!WHATSAPP_TOKEN || !WHATSAPP_API_URL) {
    console.error('Faltan variables de entorno WHATSAPP_TOKEN o WHATSAPP_API_URL en el archivo .env');
    return;
  }

  console.log(`Intentando enviar plantilla de prueba 'hello_world' a ${TEST_PHONE_NUMBER}...`);

  try {
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        to: TEST_PHONE_NUMBER,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('¡ÉXITO! Mensaje enviado correctamente:');
    console.dir(response.data, { depth: null });
    console.log('\nRevisa tu WhatsApp. Debería haber llegado el mensaje de "Welcome and congratulations!!".');
  } catch (error) {
    console.error('\nERROR enviando el mensaje:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testWhatsApp();
