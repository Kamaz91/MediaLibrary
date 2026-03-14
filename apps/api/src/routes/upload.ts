import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

const router = Router();

const activeUploads = new Map<string, { req: Request; aborted: boolean }>();
const trackedFiles = new Map<string, string[]>(); // uploadId -> paths being written

function resolveSafe(requestedPath: string): string | null {
  const root = path.resolve(config.rootPath);
  const normalized = requestedPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const resolved = path.resolve(root, normalized);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function cleanupTracked(uploadId: string): void {
  const files = trackedFiles.get(uploadId) ?? [];
  for (const filePath of files) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // ignore errors during cleanup
    }
  }
  trackedFiles.delete(uploadId);
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const destPath = (req.query.path as string) || '/';
    const fullDest = resolveSafe(destPath);
    if (!fullDest) {
      cb(new Error('Invalid path'), '');
      return;
    }
    if (!fs.existsSync(fullDest)) {
      fs.mkdirSync(fullDest, { recursive: true });
    }
    cb(null, fullDest);
  },
  filename: (req, file, cb) => {
    const uploadId = (req as Request & { uploadId?: string }).uploadId;
    const destPath = (req.query.path as string) || '/';
    const fullDest = resolveSafe(destPath);
    const filename = file.originalname;

    if (uploadId && fullDest) {
      const list = trackedFiles.get(uploadId) ?? [];
      list.push(path.join(fullDest, filename));
      trackedFiles.set(uploadId, list);
    }

    cb(null, filename);
  },
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }); // 200 MB

router.post('/', (req: Request, res: Response): void => {
  const uploadId = uuidv4();
  (req as Request & { uploadId?: string }).uploadId = uploadId;

  activeUploads.set(uploadId, { req, aborted: false });
  trackedFiles.set(uploadId, []);

  req.on('close', () => {
    if (!req.complete) {
      // req.complete is false only when client disconnected before sending all data
      cleanupTracked(uploadId);
    }
    activeUploads.delete(uploadId);
  });

  res.setHeader('X-Upload-Id', uploadId);

  upload.array('files')(req, res, (err) => {
    activeUploads.delete(uploadId);

    if (err) {
      console.error(`[upload] Error for uploadId=${uploadId}:`, err.message);
      cleanupTracked(uploadId);
      if (!res.headersSent) res.status(500).json({ error: err.message });
      return;
    }

    trackedFiles.delete(uploadId);
    const files = req.files as Express.Multer.File[];
    console.log(`[upload] Done uploadId=${uploadId}, files:`, files.map(f => f.destination + '/' + f.filename));
    res.json({
      success: true,
      uploaded: files.map(f => ({ name: f.originalname, size: f.size })),
    });
  });
});

router.delete('/:uploadId', (req: Request, res: Response): void => {
  const { uploadId } = req.params;
  const activeUpload = activeUploads.get(uploadId);
  if (activeUpload) {
    activeUpload.aborted = true;
    cleanupTracked(uploadId);
    activeUpload.req.destroy();
    activeUploads.delete(uploadId);
    res.json({ success: true, message: 'Upload cancelled' });
  } else {
    res.status(404).json({ error: 'Upload not found' });
  }
});

export default router;
