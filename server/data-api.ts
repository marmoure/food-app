import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin } from 'vite';

/*
 * Saves the app's data into the project folder while it runs from `npm run dev` or
 * `npm run preview`, so it can be read outside the browser:
 *   data/sunday-kitchen.json  what the app loads back ({ savedAt, data })
 *   data/status.md            the same data as a readable report
 * A static host has no such endpoint; the app then keeps its data in the browser only.
 */

export const DATA_ROUTE = '/api/data';
export const DATA_FILE = 'sunday-kitchen.json';
export const REPORT_FILE = 'status.md';
const MAX_BODY_BYTES = 1_000_000;

export interface SaveRequest {
  savedAt: number;
  data: Record<string, unknown>;
  report: string;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Shape check only; the app validates the data itself when it loads it. */
export function parseSaveRequest(body: unknown): SaveRequest | null {
  if (!isObject(body) || !isObject(body.data)) return null;
  if (typeof body.savedAt !== 'number' || !Number.isFinite(body.savedAt)) return null;
  return {
    savedAt: body.savedAt,
    data: body.data,
    report: typeof body.report === 'string' ? body.report : '',
  };
}

/** Write-then-rename, so a crash mid-save never leaves half a file. */
async function writeAtomic(file: string, content: string): Promise<void> {
  const tmp = `${file}.tmp`;
  await writeFile(tmp, content, 'utf8');
  await rename(tmp, file);
}

export async function readSaved(dir: string): Promise<string | null> {
  try {
    return await readFile(path.join(dir, DATA_FILE), 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeSaved(dir: string, req: SaveRequest): Promise<void> {
  await mkdir(dir, { recursive: true });
  const file = {
    savedAt: req.savedAt,
    savedAtIso: new Date(req.savedAt).toISOString(),
    data: req.data,
  };
  await writeAtomic(path.join(dir, DATA_FILE), `${JSON.stringify(file, null, 2)}\n`);
  if (req.report) await writeAtomic(path.join(dir, REPORT_FILE), req.report);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('too large'));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body?: string): void {
  res.statusCode = status;
  if (body !== undefined) res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

export function dataHandler(dir: string) {
  // Saves arrive in order from the app; chaining keeps two writes from overlapping.
  let writing: Promise<void> = Promise.resolve();

  return async (req: IncomingMessage, res: ServerResponse, next: () => void): Promise<void> => {
    if (req.url?.split('?')[0] !== DATA_ROUTE) return next();
    try {
      if (req.method === 'GET') {
        await writing;
        const saved = await readSaved(dir);
        return saved === null ? send(res, 404) : send(res, 200, saved);
      }
      if (req.method === 'PUT') {
        let body: unknown;
        try {
          body = JSON.parse(await readBody(req));
        } catch {
          return send(res, 400);
        }
        const parsed = parseSaveRequest(body);
        if (!parsed) return send(res, 400);
        writing = writing.catch(() => {}).then(() => writeSaved(dir, parsed));
        await writing;
        return send(res, 204);
      }
      res.setHeader('Allow', 'GET, PUT');
      return send(res, 405);
    } catch {
      return send(res, 500);
    }
  };
}

export function dataApi(dir = 'data'): Plugin {
  return {
    name: 'sunday-kitchen-data',
    configureServer(server) {
      server.middlewares.use(dataHandler(path.resolve(server.config.root, dir)));
    },
    configurePreviewServer(server) {
      server.middlewares.use(dataHandler(path.resolve(server.config.root, dir)));
    },
  };
}
