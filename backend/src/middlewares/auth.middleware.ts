import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

type JwtPayload = {
  id: string;
  email: string;
  role: 'ORGANIZER' | 'EXPLORER';
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
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('Forbidden', 403);
    }
  };
};
