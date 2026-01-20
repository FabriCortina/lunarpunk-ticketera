import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/auth.middleware';

export async function userRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: authenticate }, async (request) => {
    return { user: request.user };
  });
}
