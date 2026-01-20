import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
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
      : undefined,
  },
});

// Setup CORS
app.register(cors, {
  origin: env.ALLOWED_ORIGINS === '*' ? '*' : env.ALLOWED_ORIGINS.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Enhanced Health Check
app.get('/health', async (req, reply) => {
  try {
    // Ping DB
    await db.raw('SELECT 1');
    return { status: 'ok', db: 'connected', uptime: process.uptime() };
  } catch (error) {
    req.log.error(error, 'Health check failed');
    return reply.status(503).send({ status: 'error', db: 'disconnected' });
  }
});

// Register Routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(userRoutes, { prefix: '/api/users' });
app.register(eventRoutes, { prefix: '/api/events' });
app.register(ticketRoutes, { prefix: '/api/tickets' });
app.register(paymentRoutes, { prefix: '/api/payments' });
app.register(webhookRoutes, { prefix: '/webhooks' });

// Serve frontend build on Railway (single service)
const clientDistPath = path.join(process.cwd(), 'dist/client');
if (env.NODE_ENV === 'production' && fs.existsSync(clientDistPath)) {
  app.register(fastifyStatic, {
    root: clientDistPath,
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api') || request.url.startsWith('/webhooks')) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Route not found',
      });
    }

    return reply.sendFile('index.html');
  });
}

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      issues: (error as ZodError).issues,
    });
  }

  if (error instanceof AppError) {
    return reply.status((error as AppError).statusCode).send({
      statusCode: (error as AppError).statusCode,
      error: 'Business Error',
      message: (error as AppError).message,
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
    // Railway requires binding to 0.0.0.0 to expose the port outside the container
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://0.0.0.0:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();