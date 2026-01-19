import 'fastify';
import { UserRole } from '../middlewares/auth.middleware';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      role: UserRole;
    };
  }
}
