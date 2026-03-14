import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerPw = req.headers['x-password'] as string | undefined;
  const queryPw = req.query.pass as string | undefined;
  const password = headerPw ?? queryPw;
  if (!password || password !== config.password) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
