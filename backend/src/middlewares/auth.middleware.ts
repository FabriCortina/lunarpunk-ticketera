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

const extractToken = (req: FastifyRequest): string | null => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};

export const authenticate = async (req: FastifyRequest, _reply: FastifyReply) => {
  const token = extractToken(req);
  if (!token) {
    throw new AppError('Unauthorized', 401);
  }

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
