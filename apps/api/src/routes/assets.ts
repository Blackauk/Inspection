import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createAssetSchema, updateAssetStatusSchema, assetFilterSchema } from '../shared/index.js';
import { requireAuth, canAccessSite, canModifyAsset } from '../utils/permissions.js';
import { generateAssetCode } from '../utils/assetCode.js';
import { createAuditLog } from '../utils/audit.js';

export default async function assetRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
  });

  // List assets (scoped by site)
  fastify.get('/assets', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const query = assetFilterSchema.parse(request.query);
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

    if (query.assetTypeId) {
      where.assetTypeId = query.assetTypeId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.category) {
      where.category = query.category;
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          assetType: true,
          site: true,
          zone: true,
          parentAsset: true,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.asset.count({ where }),
    ]);

    return {
      data: assets,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  });

  // Get asset detail
  fastify.get('/assets/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { id } = request.params as { id: string };
    const prisma = fastify.prisma;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assetType: true,
        site: true,
        zone: true,
        parentAsset: true,
        childAssets: {
          include: {
            assetType: true,
          },
        },
        workOrders: {
          where: {
            status: { not: 'ApprovedClosed' },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!asset) {
      reply.code(404).send({ error: 'Asset not found' });
      return;
    }
    if (!canAccessSite(user, asset.siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }
    return asset;
  });

  // Get asset hierarchy
  fastify.get('/assets/:id/hierarchy', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const { id } = request.params as { id: string };
    const prisma = fastify.prisma;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assetType: true,
        childAssets: {
          include: {
            assetType: true,
            childAssets: {
              include: {
                assetType: true,
              },
            },
          },
        },
      },
    });
    if (!asset) {
      reply.code(404).send({ error: 'Asset not found' });
      return;
    }
    // Build full hierarchy tree
    const buildHierarchy = async (assetId: string): Promise<any> => {
      const a = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
          assetType: true,
          childAssets: {
            include: { assetType: true },
          },
        },
      });
      if (!a) return null;
      return {
        ...a,
        children: await Promise.all(
          a.childAssets.map((child) => buildHierarchy(child.id))
        ),
      };
    };
    return buildHierarchy(id);
  });

  // Create asset
  fastify.post('/assets', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    if (!canModifyAsset(user)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }
    if (!canAccessSite(user, (request.body as any).siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    const body = createAssetSchema.parse(request.body);
    const prisma = fastify.prisma;

    // Get asset type to get prefix
    const assetType = await prisma.assetType.findUnique({
      where: { id: body.assetTypeId },
    });
    if (!assetType) {
      reply.code(404).send({ error: 'Asset type not found' });
      return;
    }

    const code = await generateAssetCode(assetType.prefix);
    const asset = await prisma.asset.create({
      data: {
        ...body,
        code,
      },
      include: {
        assetType: true,
        site: true,
        zone: true,
      },
    });
    await createAuditLog('CREATE', 'Asset', asset.id, user.userId, body);
    return asset;
  });

  // Update asset status
  fastify.patch('/assets/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    if (!canModifyAsset(user)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }
    const { id } = request.params as { id: string };
    const body = updateAssetStatusSchema.parse(request.body);
    const prisma = fastify.prisma;

    const asset = await prisma.asset.findUnique({
      where: { id },
    });
    if (!asset) {
      reply.code(404).send({ error: 'Asset not found' });
      return;
    }
    if (!canAccessSite(user, asset.siteId)) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: { status: body.status },
    });
    await createAuditLog(
      'STATUS_CHANGE',
      'Asset',
      asset.id,
      user.userId,
      { oldStatus: asset.status, newStatus: body.status, reason: body.reason }
    );
    return updated;
  });
}


