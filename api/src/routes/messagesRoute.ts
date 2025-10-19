import { Router } from 'express';
import { z } from 'zod';

import { createChatCompletion } from '../services/openaiService';
import { sendWhatsAppTextMessage } from '../services/whatsappService';
import { findContactById, upsertContact } from '../repositories/contactRepository';
import { createMessage, listMessagesByContact } from '../repositories/messageRepository';

const router = Router();

const sendMessageSchema = z.object({
  contactId: z.string().optional(),
  phoneNumber: z.string().optional(),
  message: z.string().min(1),
  useAI: z.boolean().default(false),
  context: z.string().optional(),
});

router.get('/', async (req, res, next) => {
  const schema = z.object({ contactId: z.string() });

  try {
    const { contactId } = schema.parse(req.query);
    const messages = await listMessagesByContact(contactId);
    res.json(messages);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request payload', issues: error.issues });
    }
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { contactId, phoneNumber, message, useAI, context } = sendMessageSchema.parse(req.body);

    let targetContactId = contactId ?? null;
    let toPhoneNumber = phoneNumber ?? null;

    if (!targetContactId && !toPhoneNumber) {
      return res.status(400).json({ message: 'Either contactId or phoneNumber must be provided' });
    }

    if (!targetContactId && toPhoneNumber) {
      const contact = await upsertContact(toPhoneNumber);
      targetContactId = contact.id;
    }

    if (!toPhoneNumber && targetContactId) {
      const contact = await findContactById(targetContactId);
      toPhoneNumber = contact?.phoneNumber ?? null;
    }

    if (!targetContactId || !toPhoneNumber) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    let outboundMessage = message;
    let aiModel: string | null = null;

    if (useAI) {
      const chatResponse = await createChatCompletion([
        {
          role: 'system',
          content:
            'Você é um assistente da ContrataMais e deve responder com mensagens curtas e objetivas para clientes de uma empresa de consultoria de contratação.',
        },
        context
          ? { role: 'user', content: context }
          : undefined,
        { role: 'user', content: message },
      ].filter(Boolean) as { role: 'system' | 'user' | 'assistant'; content: string }[]);

      outboundMessage = chatResponse.message;
      aiModel = chatResponse.model;
    }

    await sendWhatsAppTextMessage(toPhoneNumber, outboundMessage);

    const storedMessage = await createMessage({
      contactId: targetContactId,
      direction: 'OUTBOUND',
      content: outboundMessage,
      status: 'SENT',
      aiModel,
    });

    res.status(201).json(storedMessage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request payload', issues: error.issues });
    }
    next(error);
  }
});

export default router;
