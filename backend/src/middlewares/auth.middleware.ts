import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import db from '../database/connection';

type JwtPayload = {
  id: string;
  email: string;
  role: 'ORGANIZER' | 'EXPLORER' | 'ADMIN';
};

export const authenticate = async (req: FastifyRequest, _reply: FastifyReply) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Unauthorized', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
  } catch {
    throw new AppError('Invalid token', 401);
  }
};

export const authorize = (roles: Array<JwtPayload['role']>) => {
  return async (req: FastifyRequest, _reply: FastifyReply) => {
    if (!req.user) {
      throw new AppError('Forbidden', 403);
    }

    if (req.user.role === 'ADMIN') {
      return;
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Forbidden', 403);
    }

    if (req.user.role === 'ORGANIZER') {
      const organizer = await db('users')
        .where({ id: req.user.id })
        .select('status')
        .first();

      if (!organizer || organizer.status !== 'APPROVED') {
        throw new AppError('Organizer not approved', 403);
      }
    }
  };
};
