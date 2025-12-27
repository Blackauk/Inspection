import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import projectRoutes from './routes/projects.js';
import siteRoutes from './routes/sites.js';
import zoneRoutes from './routes/zones.js';
import assetTypeRoutes from './routes/assetTypes.js';
import assetRoutes from './routes/assets.js';
import workOrderRoutes from './routes/workOrders.js';
import scheduleRoutes from './routes/schedules.js';
import checkRoutes from './routes/checks.js';
import attachmentRoutes from './routes/attachments.js';
import { authMiddleware } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: true,
});

// Initialize Fastify app
async function buildApp() {
  // Register plugins
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.WEB_URL 
      : ['http://localhost:5173', 'http://127.0.0.1:5173', /^http:\/\/192\.168\.\d+\.\d+:5173$/],
    credentials: true,
  });

  await fastify.register(cookie, {
    secret: process.env.JWT_REFRESH_SECRET || 'your-secret-key',
  });

  await fastify.register(multipart);

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, '../uploads');
  await fastify.register(staticFiles, {
    root: uploadsDir,
    prefix: '/uploads/',
  });

  // Make prisma available to routes
  fastify.decorate('prisma', prisma);

  // Register auth middleware as decorator
  fastify.decorate('authenticate', authMiddleware);

  // Register routes
  await fastify.register(authRoutes);
  await fastify.register(companyRoutes);
  await fastify.register(projectRoutes);
  await fastify.register(siteRoutes);
  await fastify.register(zoneRoutes);
  await fastify.register(assetTypeRoutes);
  await fastify.register(assetRoutes);
  await fastify.register(workOrderRoutes);
  await fastify.register(scheduleRoutes);
  await fastify.register(checkRoutes);
  await fastify.register(attachmentRoutes);

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  return fastify;
}

// Add type declaration for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authMiddleware;
    prisma: PrismaClient;
  }
}

// Initialize app
const app = await buildApp();

// Export fastify instance for Vercel serverless
export default app;

// Only start server if not in serverless environment
if (process.env.VERCEL !== '1') {
  const start = async () => {
    try {
      const port = Number(process.env.PORT) || 3001;
      await app.listen({ port, host: '0.0.0.0' });
      console.log(`Server listening on port ${port}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };

  start();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await app.close();
    await prisma.$disconnect();
  });
}

