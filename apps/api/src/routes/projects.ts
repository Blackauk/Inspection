import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createProjectSchema, updateProjectSchema } from '../shared/index.js';
import { requireRole } from '../utils/permissions.js';
import { createAuditLog } from '../utils/audit.js';

export default async function projectRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
  });

  fastify.get('/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    requireRole(request, ['Admin']);
    const prisma = fastify.prisma;
    const projects = await prisma.project.findMany({
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
    return projects;
  });

  fastify.get('/projects/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    requireRole(request, ['Admin']);
    const prisma = fastify.prisma;
    const { id } = request.params as { id: string };
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        company: true,
        sites: true,
      },
    });
    if (!project) {
      reply.code(404).send({ error: 'Project not found' });
      return;
    }
    return project;
  });

  fastify.post('/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const body = createProjectSchema.parse(request.body);
    const prisma = fastify.prisma;
    const project = await prisma.project.create({
      data: body,
    });
    await createAuditLog('CREATE', 'Project', project.id, user.userId, body);
    return project;
  });

  fastify.put('/projects/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const { id } = request.params as { id: string };
    const body = updateProjectSchema.parse(request.body);
    const prisma = fastify.prisma;
    const project = await prisma.project.update({
      where: { id },
      data: body,
    });
    await createAuditLog('UPDATE', 'Project', project.id, user.userId, body);
    return project;
  });

  fastify.delete('/projects/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const { id } = request.params as { id: string };
    const prisma = fastify.prisma;
    await prisma.project.delete({
      where: { id },
    });
    await createAuditLog('DELETE', 'Project', id, user.userId);
    return { message: 'Project deleted' };
  });
}


