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
  cuitCuil: z.string().min(8).optional()
}).superRefine((data, ctx) => {
  if ((data.role === 'EXPLORER' || data.role === 'ORGANIZER') && !data.cuitCuil) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CUIT/CUIL is required',
      path: ['cuitCuil']
    });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const AUTH_COOKIE_NAME = 'token';
const AUTH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7d, igual que expiresIn del JWT

const authCookieOptions = {
  httpOnly: true,
  // 'none' + secure es necesario porque en desarrollo el frontend (puerto 3000)
  // y el backend (puerto 3100) son orígenes distintos; los navegadores modernos
  // tratan a localhost como contexto seguro, y en producción Railway sirve
  // todo por HTTPS, así que esta combinación funciona en ambos casos.
  secure: true,
  sameSite: 'none' as const,
  path: '/',
  maxAge: AUTH_COOKIE_MAX_AGE_SECONDS
};

export async function authRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.post('/register', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    },
    schema: {
      body: registerSchema
    }
  }, async (req: FastifyRequest<{ Body: z.infer<typeof registerSchema> }>, reply) => {
    const { name, email, password, role, cuitCuil } = req.body;

    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
        status: role === 'ORGANIZER' ? 'PENDING_APPROVAL' : null,
        cuit_cuil: cuitCuil?.trim() || null
      })
      .returning(['id', 'name', 'email', 'role', 'status']);

    if (user.role === 'ORGANIZER' && user.status !== 'APPROVED') {
      return reply.status(201).send({
        user,
        pendingApproval: true
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    reply.setCookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    return reply.status(201).send({ user });
  });

  router.post('/login', {
    config: {
      rateLimit: {
        max: 15,
        timeWindow: '1 minute'
      }
    },
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

    if (user.role === 'ORGANIZER' && user.status !== 'APPROVED') {
      throw new AppError('Organizer not approved', 403);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...safeUser } = user;

    reply.setCookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    return reply.send({ user: safeUser });
  });

  router.post('/logout', async (_req, reply) => {
    reply.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return reply.send({ ok: true });
  });
}
