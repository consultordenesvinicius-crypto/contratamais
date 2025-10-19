const { log, logError } = require('../utils/logger');

const GRAPH_BASE_URL = 'https://graph.facebook.com/v20.0';

function getCredentials() {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    log('Credenciais do WhatsApp Cloud API não configuradas. Ativando modo simulado.');
  }

  return { phoneId, token };
}

async function sendTextMessage({ to, body }) {
  const { phoneId, token } = getCredentials();

  if (!phoneId || !token) {
    log('Mensagem enviada em modo simulado para o WhatsApp.', { to, body });
    return {
      success: true,
      simulated: true,
    };
  }

  try {
    const response = await fetch(`${GRAPH_BASE_URL}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na API do WhatsApp: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    log('Mensagem enviada para o WhatsApp com sucesso.', { to });
    return {
      success: true,
      simulated: false,
      data,
    };
  } catch (error) {
    logError('Falha ao enviar mensagem pelo WhatsApp', error, { to });
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  sendTextMessage,
};
