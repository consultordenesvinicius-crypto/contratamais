const db = require('../database');
const { parseRequestBody, sendJson } = require('../utils/http');
const { generateResponse } = require('../services/openai');
const { sendTextMessage } = require('../services/whatsapp');
const { log } = require('../utils/logger');

async function handleApiRequest(req, res, parsedUrl) {
  const { pathname, query } = parsedUrl;

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === '/api/messages' && req.method === 'GET') {
    const { conversationId, limit } = query;
    const limitNumber = Number(limit) || 50;
    const messages = conversationId
      ? db.listMessagesByConversation(conversationId)
      : db.listMessages(limitNumber);

    sendJson(res, 200, { messages });
    return;
  }

  if (pathname === '/api/conversations' && req.method === 'GET') {
    const conversations = db.listConversations();
    sendJson(res, 200, { conversations });
    return;
  }

  if (pathname === '/api/status' && req.method === 'GET') {
    const status = {
      hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
      hasWhatsApp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    };
    sendJson(res, 200, status);
    return;
  }

  if (pathname === '/api/messages/send' && req.method === 'POST') {
    try {
      const body = (await parseRequestBody(req)) || {};
      const { phone, prompt } = body;

      if (!phone || !prompt) {
        sendJson(res, 400, { error: 'Os campos phone e prompt são obrigatórios.' });
        return;
      }

      const conversation =
        db.findConversationByPhone(phone) ||
        db.upsertConversation({ id: undefined, phone, title: `Contato ${phone}` });

      const aiResponse = await generateResponse({
        prompt,
        context: db.listMessagesByConversation(conversation.id)
          .slice(0, 10)
          .reverse()
          .map((message) => ({
            role: message.direction === 'inbound' ? 'user' : 'assistant',
            content: message.body,
          })),
      });

      const inboundRecord = db.createMessage({
        conversationId: conversation.id,
        phone,
        direction: 'inbound',
        body: prompt,
        status: 'received',
        metadata: {},
      });

      const outboundMessage = aiResponse.content;
      const whatsappResult = await sendTextMessage({ to: phone, body: outboundMessage });

      db.createMessage({
        conversationId: conversation.id,
        phone,
        direction: 'outbound',
        body: outboundMessage,
        status: whatsappResult.success ? 'sent' : 'error',
        metadata: {
          simulated: whatsappResult.simulated || false,
          error: whatsappResult.error,
          aiMock: aiResponse.isMock,
        },
        replyTo: inboundRecord.id,
      });

      db.upsertConversation({
        id: conversation.id,
        phone,
        title: conversation.title,
        lastMessage: outboundMessage,
      });

      sendJson(res, 200, {
        success: true,
        aiResponse: outboundMessage,
        whatsappResult,
      });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (pathname === '/api/messages/manual' && req.method === 'POST') {
    try {
      const body = (await parseRequestBody(req)) || {};
      const { phone, message } = body;
      if (!phone || !message) {
        sendJson(res, 400, { error: 'Os campos phone e message são obrigatórios.' });
        return;
      }

      const conversation =
        db.findConversationByPhone(phone) ||
        db.upsertConversation({ id: undefined, phone, title: `Contato ${phone}` });

      const whatsappResult = await sendTextMessage({ to: phone, body: message });

      db.createMessage({
        conversationId: conversation.id,
        phone,
        direction: 'outbound',
        body: message,
        status: whatsappResult.success ? 'sent' : 'error',
        metadata: {
          simulated: whatsappResult.simulated || false,
          error: whatsappResult.error,
        },
      });

      db.upsertConversation({
        id: conversation.id,
        phone,
        title: conversation.title,
        lastMessage: message,
      });

      sendJson(res, 200, {
        success: whatsappResult.success,
        whatsappResult,
      });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  sendJson(res, 404, { error: 'Rota não encontrada.' });
}

async function handleWhatsappWebhook(req, res, parsedUrl) {
  const { pathname, query } = parsedUrl;

  if (pathname !== '/webhooks/whatsapp') {
    return false;
  }

  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': verifyToken, 'hub.challenge': challenge } = query;
    if (mode === 'subscribe' && verifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(challenge);
    } else {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Verificação não autorizada.');
    }
    return true;
  }

  if (req.method === 'POST') {
    try {
      const body = (await parseRequestBody(req)) || {};
      const entries = body.entry || [];
      entries.forEach((entry) => {
        const changes = entry.changes || [];
        changes.forEach((change) => {
          const messages = change.value?.messages || [];
          messages.forEach((message) => {
            const phone = message.from;
            const text = message.text?.body;
            if (!phone || !text) {
              return;
            }

            const conversation =
              db.findConversationByPhone(phone) ||
              db.upsertConversation({ id: undefined, phone, title: `Contato ${phone}` });

            db.createMessage({
              conversationId: conversation.id,
              phone,
              direction: 'inbound',
              body: text,
              status: 'received',
              metadata: { messageId: message.id },
            });

            db.upsertConversation({
              id: conversation.id,
              phone,
              title: conversation.title,
              lastMessage: text,
            });
          });
        });
      });

      log('Webhook do WhatsApp processado com sucesso.');
      sendJson(res, 200, { success: true });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return true;
  }

  sendJson(res, 404, { error: 'Não suportado.' });
  return true;
}

module.exports = {
  handleApiRequest,
  handleWhatsappWebhook,
};
