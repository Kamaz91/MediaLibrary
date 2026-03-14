import path from 'path';
import fs from 'fs';

export interface Config {
  password: string;
  rootPath: string;
  serverUrl: string;
  port: number;
  /** Optional: proxy /raw requests to this base URL instead of serving from disk.
   *  E.g. "http://localhost" if nginx serves rootPath at that address.
   *  Leave empty or omit to serve files directly from disk. */
  proxyUrl?: string;
}

const configPath = path.join(__dirname, '..', 'config.json');

if (!fs.existsSync(configPath)) {
  console.error('ERROR: config.json not found. Copy config.template.json to config.json and fill in the values.');
  process.exit(1);
}

const raw = fs.readFileSync(configPath, 'utf-8');
export const config: Config = JSON.parse(raw);
