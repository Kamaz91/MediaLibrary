import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { authMiddleware } from './middleware/auth';
import filesRouter from './routes/files';
import uploadRouter from './routes/upload';

const app = express();

app.use(cors({
  origin: '*',
  exposedHeaders: ['X-Upload-Id'],
}));
app.use(express.json());

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.post('/api/auth/login', (req, res) => {
  const password = req.headers['x-password'] as string | undefined;
  if (!password || password !== config.password) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ ok: true });
});

app.use('/api/files', authMiddleware, filesRouter);
app.use('/api/upload', authMiddleware, uploadRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Public endpoint – exposes non-sensitive config to the frontend
app.get('/api/info', (_req, res) => {
  res.json({
    cdnUrl: config.serveFilesLocally ? '' : (config.cdnUrl ?? ''),
    serveFilesLocally: config.serveFilesLocally ?? false,
  });
});

app.listen(config.port, () => {
  console.log(`[${new Date().toISOString()}] MediaLibrary API running on port ${config.port}`);
  console.log(`[${new Date().toISOString()}] Root path: ${config.rootPath}`);
  console.log(`[${new Date().toISOString()}] CDN URL: ${config.cdnUrl || '(none)'}`);
  console.log(`[${new Date().toISOString()}] serveFilesLocally: ${config.serveFilesLocally ?? false}`);
});

// Global error handler – always respond with JSON, never HTML
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(`[${new Date().toISOString()}] [API error]`, message);
  if (stack) console.error(stack);
  if (!res.headersSent) {
    res.status(500).json({ error: message });
  }
});
