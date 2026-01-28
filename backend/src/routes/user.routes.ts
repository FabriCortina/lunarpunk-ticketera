import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authenticate } from '../middlewares/auth.middleware';
import db from '../database/connection';
import { AppError } from '../utils/errors';

export async function userRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.get('/me', {
    preHandler: authenticate
  }, async (req, reply) => {
    const user = await db('users')
      .where({ id: req.user!.id })
      .select('id', 'name', 'email', 'role', 'avatar', 'created_at', 'status', 'limits')
      .first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return reply.send(user);
  });
}
