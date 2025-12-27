import { PrismaClient } from '@prisma/client';
import type { AuditAction } from '../shared/index.js';

const prisma = new PrismaClient();

export async function createAuditLog(
  action: AuditAction,
  entityType: string,
  entityId: string,
  userId: string,
  changes?: Record<string, unknown>,
  description?: string
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      changes: changes ? JSON.stringify(changes) : null,
      description,
    },
  });
}


