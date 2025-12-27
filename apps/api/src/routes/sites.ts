import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createSiteSchema, updateSiteSchema } from '../shared/index.js';
import { requireRole, canAccessSite } from '../utils/permissions.js';
import { createAuditLog } from '../utils/audit.js';

export default async function siteRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
  });

  fastify.get('/sites', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const prisma = fastify.prisma;

    if (user.role === 'Admin' || user.role === 'Manager') {
      const sites = await prisma.site.findMany({
        include: { project: true },
        orderBy: { createdAt: 'desc' },
      });
      return sites;
    }

    // Supervisor and others see only assigned sites
    const sites = await prisma.site.findMany({
      where: {
        id: { in: user.siteIds },
      },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
    return sites;
  });

  fastify.get('/sites/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { id } = request.params as { id: string };

    if (!canAccessSite(user, id)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    const prisma = fastify.prisma;
    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        project: true,
        zones: true,
      },
    });
    if (!site) {
      reply.code(404).send({ error: 'Site not found' });
      return;
    }
    return site;
  });

  fastify.post('/sites', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const body = createSiteSchema.parse(request.body);
    const prisma = fastify.prisma;
    const site = await prisma.site.create({
      data: body,
    });
    await createAuditLog('CREATE', 'Site', site.id, user.userId, body);
    return site;
  });

  fastify.put('/sites/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const { id } = request.params as { id: string };
    const body = updateSiteSchema.parse(request.body);
    const prisma = fastify.prisma;
    const site = await prisma.site.update({
      where: { id },
      data: body,
    });
    await createAuditLog('UPDATE', 'Site', site.id, user.userId, body);
    return site;
  });

  fastify.delete('/sites/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const { id } = request.params as { id: string };
    const prisma = fastify.prisma;
    await prisma.site.delete({
      where: { id },
    });
    await createAuditLog('DELETE', 'Site', id, user.userId);
    return { message: 'Site deleted' };
  });
}

function requireAuth(request: FastifyRequest) {
  const user = (request as any).user;
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}


