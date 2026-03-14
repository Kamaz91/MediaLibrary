export interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number | null;
  modifiedAt: string;
  path: string;
}

export interface ExifData {
  [key: string]: unknown;
}

export interface UploadTask {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'done' | 'error' | 'cancelled';
  cancel: () => void;
}
