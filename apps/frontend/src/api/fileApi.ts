import axios from 'axios';
import type { FileItem, UploadTask } from '@/types';
import { useUserStore } from '@/stores/userStore';

let _cdnUrl = '';
let _serveFilesLocally = false;
export function setCdnUrl(url: string) { _cdnUrl = url.replace(/\/$/, ''); }
export function getCdnUrl() { return _cdnUrl; }
export function setServeFilesLocally(val: boolean) { _serveFilesLocally = val; }

function getHeaders() {
  const userStore = useUserStore();
  return { 'x-password': userStore.password };
}

export async function listFiles(dirPath: string): Promise<{ items: FileItem[]; currentPath: string }> {
  const res = await axios.get('/api/files', {
    headers: getHeaders(),
    params: { path: dirPath },
  });
  return res.data;
}

export async function createFolder(dirPath: string, name: string): Promise<void> {
  await axios.post('/api/files/folder', { path: dirPath, name }, { headers: getHeaders() });
}

export async function deleteItem(itemPath: string): Promise<void> {
  await axios.delete('/api/files', {
    headers: getHeaders(),
    params: { path: itemPath },
  });
}

export async function renameItem(itemPath: string, newName: string): Promise<void> {
  await axios.patch('/api/files/rename', { path: itemPath, newName }, { headers: getHeaders() });
}

export async function getFileContent(filePath: string): Promise<{ content: string; name: string }> {
  const res = await axios.get('/api/files/content', {
    headers: getHeaders(),
    params: { path: filePath },
  });
  return res.data;
}

export function getRawUrl(filePath: string): string {
  if (!_serveFilesLocally && _cdnUrl) return `${_cdnUrl}${filePath}`;
  const base = `/api/files/raw?path=${encodeURIComponent(filePath)}`;
  if (_serveFilesLocally) {
    const userStore = useUserStore();
    return `${base}&pass=${encodeURIComponent(userStore.password)}`;
  }
  return base;
}

export async function fetchAuthBlob(filePath: string): Promise<string> {
  if (!_serveFilesLocally && _cdnUrl) {
    // CDN is public – return direct URL, no auth headers needed
    return `${_cdnUrl}${filePath}`;
  }
  if (_serveFilesLocally) {
    // Password is embedded in URL – return directly, no blob needed
    return getRawUrl(filePath);
  }
  // Fallback: fetch with auth header and create blob URL
  const userStore = useUserStore();
  const res = await fetch(`/api/files/raw?path=${encodeURIComponent(filePath)}`, {
    headers: { 'x-password': userStore.password },
  });
  if (!res.ok) throw new Error('Fetch failed');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function uploadFiles(
  dirPath: string,
  files: File[],
  onProgress: (progress: number) => void,
  uploadTaskRef: { uploadId: string | null }
): { promise: Promise<void>; cancel: () => void } {
  const controller = new AbortController();
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const userStore = useUserStore();

  const promise = axios.post(`/api/upload?path=${encodeURIComponent(dirPath)}`, formData, {
    headers: {
      'x-password': userStore.password,
      'Content-Type': 'multipart/form-data',
    },
    signal: controller.signal,
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  }).then(res => {
    uploadTaskRef.uploadId = res.headers['x-upload-id'] ?? null;
  }).catch(err => {
    if (!axios.isCancel(err)) throw err;
  });

  return {
    promise: promise as Promise<void>,
    cancel: () => controller.abort(),
  };
}
