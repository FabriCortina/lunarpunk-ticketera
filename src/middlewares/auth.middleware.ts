import { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config/env';

export type UserRole = 'ORGANIZER' | 'EXPLORER';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      role: UserRole;
    };
  }
}

const normalizeRole = (role?: string): UserRole | undefined => {
  const upper = role?.toUpperCase();
  if (upper === 'ORGANIZER' || upper === 'EXPLORER') {
    return upper;
  }
  return undefined;
};

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const headerUserId = request.headers['x-user-id'];
  const headerUserRole = request.headers['x-user-role'];

  const userId = typeof headerUserId === 'string' ? headerUserId : undefined;
  const userRole = typeof headerUserRole === 'string' ? normalizeRole(headerUserRole) : undefined;

  if (!userId && env.NODE_ENV !== 'development') {
    return reply.status(401).send({ error: 'Unauthorized: missing x-user-id' });
  }

  request.user = {
    id: userId ?? 'dev-user',
    role: userRole ?? 'ORGANIZER'
  };
}

export function authorize(allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const headerUserRole = request.headers['x-user-role'];
    const roleHeaderMissing = typeof headerUserRole !== 'string' || !normalizeRole(headerUserRole);

    if (env.NODE_ENV === 'development' && roleHeaderMissing) {
      return;
    }

    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  };
}
