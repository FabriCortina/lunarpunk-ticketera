import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

// Extend FastifyRequest definition locally
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Missing authorization header', 401);
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    throw new AppError('Invalid token format', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }
};

export const authorize = (roles: string[]) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Forbidden: Insufficient permissions', 403);
    }
  };
};