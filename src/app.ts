
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './config/env';
import { userRoutes } from './routes/user.routes';
import { authRoutes } from './routes/auth.routes';
import { eventRoutes } from './routes/event.routes';
import { ticketRoutes } from './routes/ticket.routes';
import { paymentRoutes } from './routes/payment.routes';
import { webhookRoutes } from './routes/webhook.routes'; // Import webhook routes
import { AppError } from './utils/errors';
import { ZodError } from 'zod';

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' 
      ? { target: 'pino-pretty' } 
      : undefined,
  },
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.get('/health', async () => {
  return { status: 'ok', uptime: (process as any).uptime() };
});

// Register Routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(userRoutes, { prefix: '/api/users' });
app.register(eventRoutes, { prefix: '/api/events' });
app.register(ticketRoutes, { prefix: '/api/tickets' });
app.register(paymentRoutes, { prefix: '/api/payments' });
app.register(webhookRoutes, { prefix: '/webhooks' }); // Register public webhooks

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      issues: error.issues,
    });
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: 'Business Error',
      message: error.message,
    });
  }

  request.log.error(error);
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Something went wrong',
  });
});

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    (process as any).exit(1);
  }
};

start();
