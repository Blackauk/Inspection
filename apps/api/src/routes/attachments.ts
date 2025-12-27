import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth, canAccessSite } from '../utils/permissions.js';
import { createAuditLog } from '../utils/audit.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function attachmentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
  });

  // Upload attachment
  fastify.post('/attachments', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { entityType, entityId } = request.query as { entityType: string; entityId: string };

    if (!entityType || !entityId) {
      reply.code(400).send({ error: 'entityType and entityId are required' });
      return;
    }

    const data = await request.file();
    if (!data) {
      reply.code(400).send({ error: 'No file uploaded' });
      return;
    }

    const prisma = fastify.prisma;

    // Verify entity exists and user has access
    if (entityType === 'Asset') {
      const asset = await prisma.asset.findUnique({
        where: { id: entityId },
      });
      if (!asset) {
        reply.code(404).send({ error: 'Asset not found' });
        return;
      }
      if (!canAccessSite(user, asset.siteId)) {
        reply.code(403).send({ error: 'Forbidden' });
        return;
      }
    } else if (entityType === 'WorkOrder') {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: entityId },
      });
      if (!workOrder) {
        reply.code(404).send({ error: 'Work order not found' });
        return;
      }
      if (!canAccessSite(user, workOrder.siteId)) {
        reply.code(403).send({ error: 'Forbidden' });
        return;
      }
    } else if (entityType === 'CheckSubmission') {
      const submission = await prisma.checkSubmission.findUnique({
        where: { id: entityId },
        include: {
          occurrence: {
            include: {
              schedule: true,
            },
          },
        },
      });
      if (!submission) {
        reply.code(404).send({ error: 'Check submission not found' });
        return;
      }
      if (!canAccessSite(user, submission.occurrence.schedule.siteId)) {
        reply.code(403).send({ error: 'Forbidden' });
        return;
      }
    }

    // Save file
    const uploadsDir = path.join(__dirname, '../uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const fileExt = path.extname(data.filename);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    const buffer = await data.toBuffer();
    await fs.writeFile(filePath, buffer);

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        fileName: data.filename,
        filePath: `/uploads/${fileName}`,
        mimeType: data.mimetype,
        fileSize: buffer.length,
        entityType,
        entityId,
        uploadedById: user.userId,
      },
    });

    await createAuditLog('CREATE', 'Attachment', attachment.id, user.userId);
    return attachment;
  });

  // Get attachments for entity
  fastify.get('/attachments', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { entityType, entityId } = request.query as { entityType: string; entityId: string };

    if (!entityType || !entityId) {
      reply.code(400).send({ error: 'entityType and entityId are required' });
      return;
    }

    const prisma = fastify.prisma;

    // Verify access
    if (entityType === 'Asset') {
      const asset = await prisma.asset.findUnique({
        where: { id: entityId },
      });
      if (!asset || !canAccessSite(user, asset.siteId)) {
        reply.code(403).send({ error: 'Forbidden' });
        return;
      }
    } else if (entityType === 'WorkOrder') {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: entityId },
      });
      if (!workOrder || !canAccessSite(user, workOrder.siteId)) {
        reply.code(403).send({ error: 'Forbidden' });
        return;
      }
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return attachments;
  });

  // Delete attachment
  fastify.delete('/attachments/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { id } = request.params as { id: string };
    const prisma = fastify.prisma;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });
    if (!attachment) {
      reply.code(404).send({ error: 'Attachment not found' });
      return;
    }

    // Verify access
    if (attachment.entityType === 'Asset') {
      const asset = await prisma.asset.findUnique({
        where: { id: attachment.entityId },
      });
      if (!asset || !canAccessSite(user, asset.siteId)) {
        reply.code(403).send({ error: 'Forbidden' });
        return;
      }
    }

    // Delete file
    const filePath = path.join(__dirname, '../uploads', path.basename(attachment.filePath));
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, continue
    }

    await prisma.attachment.delete({
      where: { id },
    });

    await createAuditLog('DELETE', 'Attachment', id, user.userId);
    return { message: 'Attachment deleted' };
  });
}


