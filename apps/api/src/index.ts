import express from 'express';
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

app.post('/api/auth/login', (req, res) => {
  const password = req.headers['x-password'] as string | undefined;
  if (!password || password !== config.password) {
    res.status(401).json({ error: 'Nieprawidlowe haslo' });
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
  console.log(`Galeria API running on port ${config.port}`);
  console.log(`Root path: ${config.rootPath}`);
});
