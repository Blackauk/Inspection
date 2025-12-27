import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createWorkOrderSchema, updateWorkOrderStatusSchema, assignWorkOrderSchema, workOrderFilterSchema } from '../shared/index.js';
import { requireAuth, canAccessSite, canCreateWorkOrder, canApproveWorkOrder } from '../utils/permissions.js';
import { generateWorkOrderNumber } from '../utils/workOrderNumber.js';
import { createAuditLog } from '../utils/audit.js';

export default async function workOrderRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
  });

  // List work orders (scoped)
  fastify.get('/work-orders', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const query = workOrderFilterSchema.parse(request.query);
    const prisma = fastify.prisma;

    const where: any = {};

    // Site filtering
    if (query.siteId) {
      if (!canAccessSite(user, query.siteId)) {
        reply.code(403).send({ error: 'Forbidden' });
        return;
      }
      where.siteId = query.siteId;
    } else if (user.role !== 'Admin' && user.role !== 'Manager') {
      where.siteId = { in: user.siteIds };
    }

    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          asset: {
            include: { assetType: true },
          },
          site: true,
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workOrder.count({ where }),
    ]);

    return {
      data: workOrders,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  });

  // Get work order detail
  fastify.get('/work-orders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { id } = request.params as { id: string };
    const prisma = fastify.prisma;
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        asset: {
          include: { assetType: true },
        },
        site: true,
        assignedTo: true,
        createdBy: true,
        approvedBy: true,
        parts: true,
        attachments: true,
        notes: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!workOrder) {
      reply.code(404).send({ error: 'Work order not found' });
      return;
    }
    if (!canAccessSite(user, workOrder.siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }
    return workOrder;
  });

  // Create work order
  fastify.post('/work-orders', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    if (!canCreateWorkOrder(user)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }
    const body = createWorkOrderSchema.parse(request.body);
    if (!canAccessSite(user, body.siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    const prisma = fastify.prisma;
    const number = await generateWorkOrderNumber();
    const workOrder = await prisma.workOrder.create({
      data: {
        ...body,
        number,
        createdById: user.userId,
        status: 'Open',
      },
      include: {
        asset: true,
        site: true,
        createdBy: true,
      },
    });
    await createAuditLog('CREATE', 'WorkOrder', workOrder.id, user.userId, body);
    return workOrder;
  });

  // Update work order status
  fastify.patch('/work-orders/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { id } = request.params as { id: string };
    const body = updateWorkOrderStatusSchema.parse(request.body);
    const prisma = fastify.prisma;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });
    if (!workOrder) {
      reply.code(404).send({ error: 'Work order not found' });
      return;
    }
    if (!canAccessSite(user, workOrder.siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    // Check permissions for status changes
    if (body.status === 'Completed') {
      if (!canCreateWorkOrder(user)) {
        reply.code(403).send({ error: 'Forbidden' });
        return;
      }
    } else if (body.status === 'ApprovedClosed') {
      if (!canApproveWorkOrder(user)) {
        reply.code(403).send({ error: 'Forbidden' });
        return;
      }
    }

    const updateData: any = {
      status: body.status,
    };

    if (body.status === 'Completed') {
      updateData.completedAt = new Date();
    }
    if (body.status === 'ApprovedClosed') {
      updateData.closedAt = new Date();
      updateData.approvedById = user.userId;
    }

    if (body.notes) {
      await prisma.workOrderNote.create({
        data: {
          workOrderId: id,
          note: body.notes,
          createdById: user.userId,
        },
      });
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        asset: true,
        site: true,
      },
    });

    await createAuditLog(
      body.status === 'ApprovedClosed' ? 'APPROVE' : 'UPDATE',
      'WorkOrder',
      workOrder.id,
      user.userId,
      { oldStatus: workOrder.status, newStatus: body.status }
    );

    return updated;
  });

  // Assign work order
  fastify.post('/work-orders/:id/assign', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    if (!canApproveWorkOrder(user)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }
    const { id } = request.params as { id: string };
    const body = assignWorkOrderSchema.parse(request.body);
    const prisma = fastify.prisma;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });
    if (!workOrder) {
      reply.code(404).send({ error: 'Work order not found' });
      return;
    }
    if (!canAccessSite(user, workOrder.siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        assignedToId: body.assignedToId,
        status: 'Assigned',
      },
      include: {
        assignedTo: true,
      },
    });

    await createAuditLog('ASSIGN', 'WorkOrder', workOrder.id, user.userId, {
      assignedToId: body.assignedToId,
    });

    return updated;
  });

  // Add note to work order
  fastify.post('/work-orders/:id/notes', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { id } = request.params as { id: string };
    const { note } = request.body as { note: string };
    const prisma = fastify.prisma;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });
    if (!workOrder) {
      reply.code(404).send({ error: 'Work order not found' });
      return;
    }
    if (!canAccessSite(user, workOrder.siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    const workOrderNote = await prisma.workOrderNote.create({
      data: {
        workOrderId: id,
        note,
        createdById: user.userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return workOrderNote;
  });
}


