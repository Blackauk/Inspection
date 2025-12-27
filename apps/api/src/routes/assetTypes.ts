import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createAssetTypeSchema, updateAssetTypeSchema } from '../shared/index.js';
import { requireAuth, requireRole } from '../utils/permissions.js';
import { createAuditLog } from '../utils/audit.js';

export default async function assetTypeRoutes(fastify: FastifyInstance) {
  // List asset types (all authenticated users)
  fastify.get('/asset-types', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    requireAuth(request);
    const prisma = fastify.prisma;
    const assetTypes = await prisma.assetType.findMany({
      orderBy: { name: 'asc' },
    });
    return assetTypes;
  });

  // Get asset type
  fastify.get('/asset-types/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    requireAuth(request);
    const prisma = fastify.prisma;
    const { id } = request.params as { id: string };
    const assetType = await prisma.assetType.findUnique({
      where: { id },
    });
    if (!assetType) {
      reply.code(404).send({ error: 'Asset type not found' });
      return;
    }
    return assetType;
  });

  // Create asset type (admin only)
  fastify.post('/asset-types', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const body = createAssetTypeSchema.parse(request.body);
    const prisma = fastify.prisma;
    const assetType = await prisma.assetType.create({
      data: body,
    });
    // Create counter for this asset type
    await prisma.assetCounter.create({
      data: {
        assetTypeId: assetType.id,
        counter: 0,
      },
    });
    await createAuditLog('CREATE', 'AssetType', assetType.id, user.userId, body);
    return assetType;
  });

  // Update asset type (admin only)
  fastify.put('/asset-types/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const { id } = request.params as { id: string };
    const body = updateAssetTypeSchema.parse(request.body);
    const prisma = fastify.prisma;
    const assetType = await prisma.assetType.update({
      where: { id },
      data: body,
    });
    await createAuditLog('UPDATE', 'AssetType', assetType.id, user.userId, body);
    return assetType;
  });

  // Delete asset type (admin only)
  fastify.delete('/asset-types/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const { id } = request.params as { id: string };
    const prisma = fastify.prisma;
    await prisma.assetType.delete({
      where: { id },
    });
    await createAuditLog('DELETE', 'AssetType', id, user.userId);
    return { message: 'Asset type deleted' };
  });
}

