import axios from 'axios';

import env from '../config/env';
import logger from '../utils/logger';

interface WhatsAppMessagePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

export async function sendWhatsAppTextMessage(to: string, message: string) {
  const payload: WhatsAppMessagePayload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      body: message,
    },
  };

  try {
    await axios.post(`https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_ID}/messages`, payload, {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to send WhatsApp message');
    throw error;
  }
}
