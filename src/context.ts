// import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { PrismaClient } from '../generated/prisma'
import { verifyToken } from './utils/jwt';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  user?: { id : string; email: string }; 
}

export const context: Context = {
  prisma,
};

export const createContext = ({ req }: { req: Request }): Context => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = verifyToken(token); 
    return { prisma, user: decoded };
  } catch {
    return { prisma };
  }
};