import prisma from '../utils/prisma';

export function findContactByPhoneNumber(phoneNumber: string) {
  return prisma.contact.findUnique({
    where: {
      phoneNumber,
    },
  });
}

export function findContactById(id: string) {
  return prisma.contact.findUnique({
    where: { id },
  });
}

export function upsertContact(phoneNumber: string, name?: string | null) {
  return prisma.contact.upsert({
    where: { phoneNumber },
    update: {
      name: name ?? undefined,
    },
    create: {
      phoneNumber,
      name: name ?? undefined,
    },
  });
}

export function listContactsWithStats() {
  return prisma.contact.findMany({
    include: {
      _count: {
        select: { messages: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}
