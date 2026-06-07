import { FastifyReply, FastifyRequest } from 'fastify';
import { AiService } from '../services/ai.service';
import { GenerateEventDescriptionInput, SuggestEventTitleInput } from '../schemas/ai.schema';

export class AiController {
  constructor(private aiService: AiService) {}

  generateEventDescription = async (req: FastifyRequest, reply: FastifyReply) => {
    const { title, location, description } = req.body as GenerateEventDescriptionInput;
    const result = await this.aiService.generateEventDescription(title, location, description);
    return reply.send({ description: result });
  };

  suggestEventTitle = async (req: FastifyRequest, reply: FastifyReply) => {
    const { theme } = req.body as SuggestEventTitleInput;
    const result = await this.aiService.suggestEventTitle(theme);
    return reply.send({ title: result });
  };
}
