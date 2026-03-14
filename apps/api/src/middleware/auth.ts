import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const password = req.headers['x-password'] as string | undefined;
  if (!password || password !== config.password) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
