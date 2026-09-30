import { describe, expect, it } from 'vitest';
import { LOCAL_STORAGE_KEY, syncedAdapter } from './adapters';
import { type AppData, emptyData } from './schema';

const withTick = (id: string): AppData => ({
  ...emptyData(),
  checklists: { setup: { items: { [id]: true } } },
});

/** A pretend /api/data: `stored` is the project-folder copy, `up` false means no server. */
interface Stamped {
  savedAt: number;
  data: AppData;
}
interface FakeServer {
  stored: Stamped | null;
  puts: (Stamped & { report: string })[];
  fetch: typeof fetch;
}

function fakeServer(stored: Stamped | null, up = true): FakeServer {
  const server: FakeServer = {
    stored,
    puts: [],
    fetch: (async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (!up) throw new TypeError('Failed to fetch');
      if (init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as FakeServer['puts'][number];
        server.puts.push(body);
        server.stored = { savedAt: body.savedAt, data: body.data };
        return new Response(null, { status: 204 });
      }
      return server.stored ? Response.json(server.stored) : new Response(null, { status: 404 });
    }) as typeof fetch,
  };
  return server;
}

function saveLocally(data: AppData, savedAt: number) {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  window.localStorage.setItem(`${LOCAL_STORAGE_KEY}:savedAt`, String(savedAt));
}

describe('syncedAdapter', () => {
  it('loads the project copy when it is newer, and keeps it in the browser too', async () => {
    saveLocally(withTick('old'), 100);
    const server = fakeServer({ savedAt: 200, data: withTick('new') });
    const loaded = await syncedAdapter({ fetch: server.fetch }).load();
    expect(loaded?.checklists.setup?.items).toEqual({ new: true });
    expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toContain('"new"');
  });

  it('keeps the browser copy when it is newer and sends it to the project folder', async () => {
    saveLocally(withTick('offline-tick'), 300);
    const server = fakeServer({ savedAt: 200, data: withTick('old') });
    const loaded = await syncedAdapter({ fetch: server.fetch }).load();
    expect(loaded?.checklists.setup?.items).toEqual({ 'offline-tick': true });
    expect(server.stored?.data.checklists.setup?.items).toEqual({ 'offline-tick': true });
  });

  it('moves existing browser data into an empty project folder', async () => {
    saveLocally(withTick('eq-micro'), 0);
    const server = fakeServer(null);
    await syncedAdapter({ fetch: server.fetch }).load();
    expect(server.stored?.data.checklists.setup?.items).toEqual({ 'eq-micro': true });
  });

  it('works from the browser alone when there is no server', async () => {
    saveLocally(withTick('eq-micro'), 100);
    const adapter = syncedAdapter({ fetch: fakeServer(null, false).fetch });
    expect((await adapter.load())?.checklists.setup?.items).toEqual({ 'eq-micro': true });
    await expect(adapter.save(withTick('eq-jars'))).resolves.toBeUndefined();
    expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toContain('eq-jars');
  });

  it('ignores a static host that answers with the HTML page', async () => {
    saveLocally(withTick('eq-micro'), 100);
    const html = (async () =>
      new Response('<!doctype html>', {
        headers: { 'Content-Type': 'text/html' },
      })) as typeof fetch;
    const loaded = await syncedAdapter({ fetch: html }).load();
    expect(loaded?.checklists.setup?.items).toEqual({ 'eq-micro': true });
  });

  it('saves to both places, with the readable report', async () => {
    const server = fakeServer(null);
    const adapter = syncedAdapter({ fetch: server.fetch, report: () => '# Report' });
    await adapter.save(withTick('eq-jars'));
    expect(server.puts).toHaveLength(1);
    expect(server.puts[0]).toMatchObject({ report: '# Report', data: withTick('eq-jars') });
    expect(Number(window.localStorage.getItem(`${LOCAL_STORAGE_KEY}:savedAt`))).toBe(
      server.puts[0]?.savedAt,
    );
  });
});
