import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loginSchema } from '../shared/index.js';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/auth.js';
import { getUserFromRequest } from '../utils/permissions.js';

export default async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.parse(request.body);
    const prisma = fastify.prisma;

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: {
        siteAssignments: {
          include: { site: true },
        },
      },
    });

    if (!user) {
      reply.code(401).send({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await verifyPassword(body.password, user.password);
    if (!isValid) {
      reply.code(401).send({ error: 'Invalid credentials' });
      return;
    }

    const siteIds = user.siteAssignments.map((a) => a.siteId);
    const payload = {
      userId: user.id,
      role: user.role as any,
      siteIds,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        siteIds,
      },
    };
  });

  // Refresh token
  fastify.post('/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      reply.code(401).send({ error: 'No refresh token' });
      return;
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      const prisma = fastify.prisma;

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          siteAssignments: true,
        },
      });

      if (!user) {
        reply.code(401).send({ error: 'User not found' });
        return;
      }

      const siteIds = user.siteAssignments.map((a) => a.siteId);
      const newPayload = {
        userId: user.id,
        role: user.role as any,
        siteIds,
      };

      const accessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return { accessToken };
    } catch (error) {
      reply.code(401).send({ error: 'Invalid refresh token' });
    }
  });

  // Logout
  fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('refreshToken', { path: '/' });
    return { message: 'Logged out' };
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    if (!user) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }

    const prisma = fastify.prisma;
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        siteAssignments: {
          include: { site: true },
        },
        company: true,
      },
    });

    if (!dbUser) {
      reply.code(404).send({ error: 'User not found' });
      return;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role,
      siteIds: dbUser.siteAssignments.map((a) => a.siteId),
      company: {
        id: dbUser.company.id,
        name: dbUser.company.name,
      },
    };
  });
}


