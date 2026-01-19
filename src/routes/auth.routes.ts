import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function authRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.post(
    '/login',
    {
      schema: {
        body: z.object({
          email: z.string().email().optional(),
          password: z.string().optional()
        })
      }
    },
    async () => {
      return {
        message: 'Auth not implemented. Use x-user-id/x-user-role headers in dev.'
      };
    }
  );
}
