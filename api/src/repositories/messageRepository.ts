import prisma from '../utils/prisma';

export async function createMessage(data: {
  contactId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  aiModel?: string | null;
}) {
  const message = await prisma.message.create({
    data,
  });

  await prisma.contact.update({
    where: { id: data.contactId },
    data: { updatedAt: new Date() },
  });

  return message;
}

export function listMessagesByContact(contactId: string) {
  return prisma.message.findMany({
    where: { contactId },
    orderBy: { createdAt: 'asc' },
  });
}
