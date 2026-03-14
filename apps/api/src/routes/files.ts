import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { config } from '../config';

// Bypass TypeScript's import()-to-require() transform so ESM-only exifr works in CJS
const esmImport = new Function('id', 'return import(id)') as (id: string) => Promise<{ default: { parse: (src: string, opts: object) => Promise<Record<string, unknown> | null> } }>;

const router = Router();

function resolveSafe(requestedPath: string): string | null {
  const root = path.resolve(config.rootPath);
  const normalized = requestedPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const resolved = path.resolve(root, normalized);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

router.get('/', (req: Request, res: Response): void => {
  const reqPath = (req.query.path as string) || '/';
  const fullPath = resolveSafe(reqPath);
  if (!fullPath) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Path not found' });
    return;
  }
  const stat = fs.statSync(fullPath);
  if (!stat.isDirectory()) {
    res.status(400).json({ error: 'Path is not a directory' });
    return;
  }
  const entries = fs.readdirSync(fullPath);
  const items = entries.map(name => {
    const itemPath = path.join(fullPath, name);
    const s = fs.statSync(itemPath);
    const relativePath = path.relative(path.resolve(config.rootPath), itemPath).replace(/\\/g, '/');
    return {
      name,
      isDirectory: s.isDirectory(),
      size: s.isFile() ? s.size : null,
      modifiedAt: s.mtime.toISOString(),
      path: '/' + relativePath,
    };
  });
  items.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
  res.json({ items, currentPath: reqPath });
});

router.post('/folder', (req: Request, res: Response): void => {
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'Request body is required' });
    return;
  }
  const { path: reqPath, name } = req.body as { path: string; name: string };
  if (!reqPath || !name) {
    res.status(400).json({ error: 'path and name are required' });
    return;
  }
  if (/[<>:"|?*\\]/.test(name)) {
    res.status(400).json({ error: 'Invalid folder name' });
    return;
  }
  const fullPath = resolveSafe(path.join(reqPath, name));
  if (!fullPath) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  if (fs.existsSync(fullPath)) {
    res.status(409).json({ error: 'Already exists' });
    return;
  }
  try {
    fs.mkdirSync(fullPath, { recursive: true });
    res.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: `Failed to create folder: ${msg}` });
  }
});

router.delete('/', (req: Request, res: Response): void => {
  const reqPath = req.query.path as string;
  if (!reqPath) {
    res.status(400).json({ error: 'path is required' });
    return;
  }
  const fullPath = resolveSafe(reqPath);
  if (!fullPath) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  try {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    res.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: `Failed to delete: ${msg}` });
  }
});

router.patch('/rename', (req: Request, res: Response): void => {
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'Request body is required' });
    return;
  }
  const { path: reqPath, newName } = req.body as { path: string; newName: string };
  if (!reqPath || !newName) {
    res.status(400).json({ error: 'path and newName are required' });
    return;
  }
  if (/[<>:"|?*\\]/.test(newName)) {
    res.status(400).json({ error: 'Invalid name' });
    return;
  }
  const fullPath = resolveSafe(reqPath);
  if (!fullPath) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const dir = path.dirname(fullPath);
  const newFullPath = path.join(dir, newName);
  if (!newFullPath.startsWith(path.resolve(config.rootPath))) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  if (fs.existsSync(newFullPath)) {
    res.status(409).json({ error: 'Already exists' });
    return;
  }
  try {
    fs.renameSync(fullPath, newFullPath);
    res.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: `Failed to rename: ${msg}` });
  }
});

router.get('/content', (req: Request, res: Response): void => {
  const reqPath = req.query.path as string;
  if (!reqPath) {
    res.status(400).json({ error: 'path is required' });
    return;
  }
  const fullPath = resolveSafe(reqPath);
  if (!fullPath) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const allowedExtensions = ['.txt', '.js', '.ts', '.json', '.md', '.html', '.css', '.csv', '.xml', '.log'];
  const ext = path.extname(fullPath).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    res.status(400).json({ error: 'File type not supported for viewing' });
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  res.json({ content, name: path.basename(fullPath) });
});

router.get('/raw', (req: Request, res: Response): void => {
  const reqPath = req.query.path as string;
  if (!reqPath) {
    res.status(400).json({ error: 'path is required' });
    return;
  }
  const fullPath = resolveSafe(reqPath);
  if (!fullPath) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }

  if (config.proxyUrl) {
    const relative = path.relative(path.resolve(config.rootPath), fullPath).replace(/\\/g, '/');
    const targetUrl = `${config.proxyUrl.replace(/\/$/, '')}/${relative}`;
    const mod = targetUrl.startsWith('https://') ? https : http;
    const proxyReq = mod.get(targetUrl, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', () => {
      if (!res.headersSent) res.status(502).json({ error: 'Proxy error' });
    });
    return;
  }

  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.sendFile(fullPath);
});

router.get('/exif', async (req: Request, res: Response): Promise<void> => {
  const reqPath = req.query.path as string;
  if (!reqPath) {
    res.status(400).json({ error: 'path is required' });
    return;
  }
  const fullPath = resolveSafe(reqPath);
  if (!fullPath) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  try {
    const { default: exifr } = await esmImport('exifr');
    const data = await exifr.parse(fullPath, { tiff: true, exif: true, gps: true, iptc: true });
    res.json(data ?? {});
  } catch {
    res.status(422).json({ error: 'Failed to read EXIF data' });
  }
});

export default router;
