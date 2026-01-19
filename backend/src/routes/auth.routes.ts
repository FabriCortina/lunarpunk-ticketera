import { FastifyInstance, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/connection';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ORGANIZER', 'EXPLORER']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.post('/register', {
    schema: {
      body: registerSchema
    }
  }, async (req: FastifyRequest<{ Body: z.infer<typeof registerSchema> }>, reply) => {
    const { name, email, password, role } = req.body;

    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db('users').insert({
      name,
      email,
      password: hashedPassword,
      role
    }).returning(['id', 'name', 'email', 'role']);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return reply.status(201).send({ user, token });
  });

  router.post('/login', {
    schema: {
      body: loginSchema
    }
  }, async (req: FastifyRequest<{ Body: z.infer<typeof loginSchema> }>, reply) => {
    const { email, password } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Don't send password back
    const { password: _, ...safeUser } = user;

    return reply.send({ user: safeUser, token });
  });
}