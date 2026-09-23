// @vitest-environment node
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { type Server, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DATA_FILE, DATA_ROUTE, REPORT_FILE, dataHandler, parseSaveRequest } from './data-api';

describe('parseSaveRequest', () => {
  it('accepts a stamped save and rejects anything else', () => {
    expect(parseSaveRequest({ savedAt: 1, data: {}, report: '# hi' })).toEqual({
      savedAt: 1,
      data: {},
      report: '# hi',
    });
    expect(parseSaveRequest({ savedAt: 1, data: {} })?.report).toBe('');
    expect(parseSaveRequest({ data: {} })).toBeNull();
    expect(parseSaveRequest({ savedAt: 1, data: [] })).toBeNull();
    expect(parseSaveRequest('nope')).toBeNull();
  });
});

describe('the /api/data endpoint', () => {
  let dir: string;
  let server: Server;
  let url: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'sunday-kitchen-'));
    const handle = dataHandler(dir);
    server = createServer((req, res) => {
      void handle(req, res, () => {
        res.statusCode = 404;
        res.end();
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}${DATA_ROUTE}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  });

  it('has nothing to load before the first save', async () => {
    expect((await fetch(url)).status).toBe(404);
  });

  it('writes the JSON and the readable report, and serves the JSON back', async () => {
    const put = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedAt: 1000, data: { version: 1 }, report: '# Report' }),
    });
    expect(put.status).toBe(204);

    const got = await fetch(url);
    expect(got.headers.get('content-type')).toContain('application/json');
    expect(await got.json()).toMatchObject({ savedAt: 1000, data: { version: 1 } });
    expect(await readFile(path.join(dir, DATA_FILE), 'utf8')).toContain('"savedAtIso"');
    expect(await readFile(path.join(dir, REPORT_FILE), 'utf8')).toBe('# Report');
  });

  it('rejects bad saves without touching the file', async () => {
    const bad = await fetch(url, { method: 'PUT', body: '{not json' });
    expect(bad.status).toBe(400);
    expect((await fetch(url)).status).toBe(404);
    expect((await fetch(url, { method: 'DELETE' })).status).toBe(405);
  });
});
