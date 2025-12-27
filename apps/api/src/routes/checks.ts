import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createCheckTemplateSchema, updateCheckTemplateSchema, submitCheckSchema } from '../shared/index.js';
import { requireAuth, canAccessSite, canManageCheckTemplates } from '../utils/permissions.js';
import { createAuditLog } from '../utils/audit.js';

export default async function checkRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
  });

  // List check templates
  fastify.get('/check-templates', async (request: FastifyRequest, reply: FastifyReply) => {
    requireAuth(request);
    const prisma = fastify.prisma;
    const templates = await prisma.checkTemplate.findMany({
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return templates;
  });

  // Get check template
  fastify.get('/check-templates/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    requireAuth(request);
    const prisma = fastify.prisma;
    const { id } = request.params as { id: string };
    const template = await prisma.checkTemplate.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!template) {
      reply.code(404).send({ error: 'Check template not found' });
      return;
    }
    return template;
  });

  // Create check template
  fastify.post('/check-templates', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    if (!canManageCheckTemplates(user)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }
    const body = createCheckTemplateSchema.parse(request.body);
    const prisma = fastify.prisma;

    const template = await prisma.checkTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        questions: {
          create: body.questions.map((q) => ({
            question: q.question,
            type: q.type,
            unit: q.unit,
            minValue: q.minValue,
            maxValue: q.maxValue,
            required: q.required,
            order: q.order,
          })),
        },
      },
      include: {
        questions: true,
      },
    });
    await createAuditLog('CREATE', 'CheckTemplate', template.id, user.userId, body);
    return template;
  });

  // Update check template
  fastify.put('/check-templates/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    if (!canManageCheckTemplates(user)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }
    const { id } = request.params as { id: string };
    const body = updateCheckTemplateSchema.parse(request.body);
    const prisma = fastify.prisma;

    // Update template
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;

    if (Object.keys(updateData).length > 0) {
      await prisma.checkTemplate.update({
        where: { id },
        data: updateData,
      });
    }

    // Update questions if provided
    if (body.questions) {
      // Delete existing questions
      await prisma.checkQuestion.deleteMany({
        where: { templateId: id },
      });
      // Create new questions
      await prisma.checkQuestion.createMany({
        data: body.questions.map((q) => ({
          templateId: id,
          question: q.question,
          type: q.type,
          unit: q.unit,
          minValue: q.minValue,
          maxValue: q.maxValue,
          required: q.required,
          order: q.order,
        })),
      });
    }

    const template = await prisma.checkTemplate.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });
    await createAuditLog('UPDATE', 'CheckTemplate', id, user.userId, body);
    return template;
  });

  // List due occurrences
  fastify.get('/check-occurrences/due', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { days = 7 } = request.query as { days?: number };
    const prisma = fastify.prisma;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(days));

    const where: any = {
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
      isCompleted: false,
    };

    // Filter by accessible sites
    if (user.role !== 'Admin' && user.role !== 'Manager') {
      const schedules = await prisma.schedule.findMany({
        where: {
          siteId: { in: user.siteIds },
        },
        select: { id: true },
      });
      where.scheduleId = {
        in: schedules.map((s) => s.id),
      };
    }

    const occurrences = await prisma.scheduleOccurrence.findMany({
      where,
      include: {
        schedule: {
          include: {
            asset: {
              include: { assetType: true },
            },
            site: true,
            checkTemplate: {
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        checkSubmissions: {
          take: 1,
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return occurrences;
  });

  // Submit check
  fastify.post('/check-submissions', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const body = submitCheckSchema.parse(request.body);
    const prisma = fastify.prisma;

    const occurrence = await prisma.scheduleOccurrence.findUnique({
      where: { id: body.occurrenceId },
      include: {
        schedule: {
          include: {
            asset: true,
            checkTemplate: {
              include: { questions: true },
            },
          },
        },
      },
    });

    if (!occurrence) {
      reply.code(404).send({ error: 'Occurrence not found' });
      return;
    }

    if (!canAccessSite(user, occurrence.schedule.siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    // Create submission
    const submission = await prisma.checkSubmission.create({
      data: {
        occurrenceId: body.occurrenceId,
        assetId: occurrence.schedule.assetId,
        submittedById: user.userId,
        answers: {
          create: body.answers.map((a) => ({
            questionId: a.questionId,
            answer: JSON.stringify(a.answer),
            comment: a.comment,
          })),
        },
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    // Mark occurrence as completed
    await prisma.scheduleOccurrence.update({
      where: { id: body.occurrenceId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    await createAuditLog('CREATE', 'CheckSubmission', submission.id, user.userId);
    return submission;
  });

  // Get check submission
  fastify.get('/check-submissions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { id } = request.params as { id: string };
    const prisma = fastify.prisma;
    const submission = await prisma.checkSubmission.findUnique({
      where: { id },
      include: {
        occurrence: {
          include: {
            schedule: {
              include: {
                asset: true,
                site: true,
                checkTemplate: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        attachments: true,
      },
    });
    if (!submission) {
      reply.code(404).send({ error: 'Submission not found' });
      return;
    }
    if (!canAccessSite(user, submission.occurrence.schedule.siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }
    return submission;
  });
}


