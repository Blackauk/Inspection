import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createZoneSchema, updateZoneSchema } from '../shared/index.js';
import { requireRole, canAccessSite, requireAuth } from '../utils/permissions.js';
import { createAuditLog } from '../utils/audit.js';

export default async function zoneRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
  });

  fastify.get('/zones', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { siteId } = request.query as { siteId?: string };
    const prisma = fastify.prisma;

    if (siteId && !canAccessSite(user, siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    const where: any = {};
    if (siteId) {
      where.siteId = siteId;
    } else if (user.role !== 'Admin' && user.role !== 'Manager') {
      where.siteId = { in: user.siteIds };
    }

    const zones = await prisma.zone.findMany({
      where,
      include: { site: true },
      orderBy: { createdAt: 'desc' },
    });
    return zones;
  });

  fastify.get('/zones/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { id } = request.params as { id: string };
    const prisma = fastify.prisma;
    const zone = await prisma.zone.findUnique({
      where: { id },
      include: { site: true },
    });
    if (!zone) {
      reply.code(404).send({ error: 'Zone not found' });
      return;
    }
    if (!canAccessSite(user, zone.siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }
    return zone;
  });

  fastify.post('/zones', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const body = createZoneSchema.parse(request.body);
    const prisma = fastify.prisma;
    const zone = await prisma.zone.create({
      data: body,
    });
    await createAuditLog('CREATE', 'Zone', zone.id, user.userId, body);
    return zone;
  });

  fastify.put('/zones/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const { id } = request.params as { id: string };
    const body = updateZoneSchema.parse(request.body);
    const prisma = fastify.prisma;
    const zone = await prisma.zone.update({
      where: { id },
      data: body,
    });
    await createAuditLog('UPDATE', 'Zone', zone.id, user.userId, body);
    return zone;
  });

  fastify.delete('/zones/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const { id } = request.params as { id: string };
    const prisma = fastify.prisma;
    await prisma.zone.delete({
      where: { id },
    });
    await createAuditLog('DELETE', 'Zone', id, user.userId);
    return { message: 'Zone deleted' };
  });
}

function requireAuth(request: FastifyRequest) {
  const user = (request as any).user;
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

