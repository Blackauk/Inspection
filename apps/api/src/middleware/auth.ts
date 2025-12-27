import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/auth.js';
import { getUserFromRequest } from '../utils/permissions.js';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    (request as any).user = payload;
  } catch (error) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}

export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      (request as any).user = payload;
    }
  } catch (error) {
    // Optional auth, so we don't throw
  }
}


