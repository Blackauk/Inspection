import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createCompanySchema, updateCompanySchema } from '../shared/index.js';
import { requireRole } from '../utils/permissions.js';
import { createAuditLog } from '../utils/audit.js';

export default async function companyRoutes(fastify: FastifyInstance) {
  // Register auth middleware
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
  });

  // List companies (admin only)
  fastify.get('/companies', async (request: FastifyRequest, reply: FastifyReply) => {
    requireRole(request, ['Admin']);
    const prisma = fastify.prisma;
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return companies;
  });

  // Get company
  fastify.get('/companies/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    requireRole(request, ['Admin']);
    const prisma = fastify.prisma;
    const { id } = request.params as { id: string };
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });
    if (!company) {
      reply.code(404).send({ error: 'Company not found' });
      return;
    }
    return company;
  });

  // Create company
  fastify.post('/companies', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const body = createCompanySchema.parse(request.body);
    const prisma = fastify.prisma;
    const company = await prisma.company.create({
      data: body,
    });
    await createAuditLog('CREATE', 'Company', company.id, user.userId, body);
    return company;
  });

  // Update company
  fastify.put('/companies/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const { id } = request.params as { id: string };
    const body = updateCompanySchema.parse(request.body);
    const prisma = fastify.prisma;
    const company = await prisma.company.update({
      where: { id },
      data: body,
    });
    await createAuditLog('UPDATE', 'Company', company.id, user.userId, body);
    return company;
  });

  // Delete company
  fastify.delete('/companies/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireRole(request, ['Admin']);
    const { id } = request.params as { id: string };
    const prisma = fastify.prisma;
    await prisma.company.delete({
      where: { id },
    });
    await createAuditLog('DELETE', 'Company', id, user.userId);
    return { message: 'Company deleted' };
  });
}


