import { Router } from 'express';
import { z } from 'zod';

import env from '../config/env';
import { upsertContact } from '../repositories/contactRepository';
import { createMessage } from '../repositories/messageRepository';
import logger from '../utils/logger';

const router = Router();

const webhookEntrySchema = z.object({
  changes: z.array(
    z.object({
      value: z.object({
        messages: z
          .array(
            z.object({
              from: z.string(),
              id: z.string(),
              timestamp: z.string(),
              text: z.object({ body: z.string() }).optional(),
              type: z.literal('text'),
            }),
          )
          .optional(),
        contacts: z
          .array(
            z.object({
              wa_id: z.string(),
              profile: z.object({ name: z.string().optional() }).optional(),
            }),
          )
          .optional(),
      }),
    }),
  ),
});

router.get('/', (req, res) => {
  const verifyToken = env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/', async (req, res) => {
  const parseResult = webhookEntrySchema.safeParse(req.body.entry?.[0]);

  if (!parseResult.success) {
    logger.warn({ body: req.body }, 'Invalid webhook payload');
    return res.sendStatus(204);
  }

  const entry = parseResult.data;

  const message = entry.changes[0]?.value.messages?.[0];
  const contact = entry.changes[0]?.value.contacts?.[0];

  if (message && contact) {
    const storedContact = await upsertContact(contact.wa_id, contact.profile?.name);

    if (message.text?.body) {
      await createMessage({
        contactId: storedContact.id,
        direction: 'INBOUND',
        content: message.text.body,
        status: 'DELIVERED',
      });
    }
  }

  res.sendStatus(200);
});

export default router;
