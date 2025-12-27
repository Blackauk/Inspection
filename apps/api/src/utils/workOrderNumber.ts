import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generates the next sequential work order number.
 * Format: WO-YYYYMMDD-000001
 */
export async function generateWorkOrderNumber(): Promise<string> {
  const today = new Date();
  const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const prefix = `WO-${datePrefix}`;

  // Find the highest number for today's prefix
  const lastOrder = await prisma.workOrder.findFirst({
    where: {
      number: {
        startsWith: prefix,
      },
    },
    orderBy: {
      number: 'desc',
    },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.number.split('-').pop() || '0', 10);
    sequence = lastSequence + 1;
  }

  const paddedSequence = String(sequence).padStart(6, '0');
  return `${prefix}-${paddedSequence}`;
}


