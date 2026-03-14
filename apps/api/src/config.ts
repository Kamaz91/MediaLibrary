import path from 'path';
import fs from 'fs';

export interface Config {
  password: string;
  rootPath: string;
  serverUrl: string;
  port: number;
  /** Public base URL of the CDN/static file server where rootPath is exposed.
   *  E.g. "https://cdn.nekobot.pl" — the frontend will use this to build direct
   *  image URLs without going through the API. */
  cdnUrl?: string;
  /** When true, the frontend fetches files through /api/files/raw (with auth)
   *  instead of using cdnUrl. Useful when files are not publicly accessible. */
  serveFilesLocally?: boolean;
  /** @deprecated use cdnUrl */
  proxyUrl?: string;
}

const configPath = path.join(__dirname, '..', 'config.json');

if (!fs.existsSync(configPath)) {
  console.error('ERROR: config.json not found. Copy config.template.json to config.json and fill in the values.');
  process.exit(1);
}

const raw = fs.readFileSync(configPath, 'utf-8');
export const config: Config = JSON.parse(raw);
