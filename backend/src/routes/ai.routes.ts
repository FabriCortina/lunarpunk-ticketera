import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { AiService } from '../services/ai.service';
import { AiController } from '../controllers/ai.controller';
import { generateEventDescriptionSchema, suggestEventTitleSchema } from '../schemas/ai.schema';

export async function aiRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();
  const aiService = new AiService();
  const aiController = new AiController(aiService);

  router.addHook('preHandler', authenticate);
  router.addHook('preHandler', authorize(['ORGANIZER']));

  router.post(
    '/event-description',
    { schema: { body: generateEventDescriptionSchema } },
    aiController.generateEventDescription
  );

  router.post(
    '/event-title',
    { schema: { body: suggestEventTitleSchema } },
    aiController.suggestEventTitle
  );
}
