import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';
import { env } from './config/env';
import { userRoutes } from './routes/user.routes';
import { authRoutes } from './routes/auth.routes';
import { eventRoutes } from './routes/event.routes';
import { ticketRoutes } from './routes/ticket.routes';
import { paymentRoutes } from './routes/payment.routes';
import { webhookRoutes } from './routes/webhook.routes';
import { AppError } from './utils/errors';
import { ZodError } from 'zod';
import db from './database/connection';

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined
  }
});

app.register(cors, {
  origin: env.ALLOWED_ORIGINS === '*' ? '*' : env.ALLOWED_ORIGINS.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.get('/health', async (req, reply) => {
  try {
    await db.raw('SELECT 1');
    return { status: 'ok', db: 'connected', uptime: process.uptime() };
  } catch (error) {
    req.log.error(error, 'Health check failed');
    return reply.status(503).send({ status: 'error', db: 'disconnected' });
  }
});

app.register(authRoutes, { prefix: '/api/auth' });
app.register(userRoutes, { prefix: '/api/users' });
app.register(eventRoutes, { prefix: '/api/events' });
app.register(ticketRoutes, { prefix: '/api/tickets' });
app.register(paymentRoutes, { prefix: '/api/payments' });
app.register(webhookRoutes, { prefix: '/webhooks' });

const frontendDist = path.resolve(process.cwd(), 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.register(fastifyStatic, {
    root: frontendDist,
    prefix: '/'
  });
}

app.setNotFoundHandler((req, reply) => {
  if (
    req.method === 'GET' &&
    !req.url.startsWith('/api') &&
    !req.url.startsWith('/webhooks') &&
    req.url !== '/health' &&
    fs.existsSync(frontendDist)
  ) {
    return reply.sendFile('index.html');
  }

  return reply.status(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: 'Route not found'
  });
});

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      issues: (error as ZodError).issues
    });
  }

  if (error instanceof AppError) {
    return reply.status((error as AppError).statusCode).send({
      statusCode: (error as AppError).statusCode,
      error: 'Business Error',
      message: (error as AppError).message
    });
  }

  request.log.error(error);
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
});

const start = async () => {
  try {
    await app.listen({ port: Number(env.PORT), host: '0.0.0.0' });
    console.log(`🚀 Server running at http://0.0.0.0:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
