import { Router } from 'express';

import { listContactsWithStats } from '../repositories/contactRepository';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const contacts = await listContactsWithStats();
    res.json(
      contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        messagesCount: contact._count.messages,
        lastMessageAt: contact.messages[0]?.createdAt ?? null,
        lastMessagePreview: contact.messages[0]?.content ?? null,
      })),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
