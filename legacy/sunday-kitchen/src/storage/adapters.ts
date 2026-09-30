import { type AppData, parseAppData } from './schema';

/**
 * Where app data is persisted. Async so a remote backend can implement the same interface
 * later without touching the store or the UI.
 */
export interface StorageAdapter {
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
}

export const LOCAL_STORAGE_KEY = 'sunday-kitchen:v1';

/** Browser storage. Access can throw (private mode, blocked storage), so every call is guarded. */
export function localStorageAdapter(key = LOCAL_STORAGE_KEY): StorageAdapter {
  return {
    async load() {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? parseAppData(JSON.parse(raw)) : null;
      } catch {
        return null;
      }
    },
    async save(data) {
      window.localStorage.setItem(key, JSON.stringify(data));
    },
  };
}

export const DATA_URL = '/api/data';

interface Stamped {
  savedAt: number;
  data: AppData;
}

interface SyncOptions {
  key?: string;
  url?: string;
  /** Readable version of the data, saved next to it (data/status.md). */
  report?: (data: AppData) => string;
  fetch?: typeof fetch;
}

/**
 * Browser storage plus a copy in the project folder, through the dev/preview server's
 * /api/data endpoint (server/data-api.ts). The browser copy keeps the app working offline or
 * on a static host; whichever copy was saved last wins when the app opens.
 */
export function syncedAdapter(options: SyncOptions = {}): StorageAdapter {
  const key = options.key ?? LOCAL_STORAGE_KEY;
  const stampKey = `${key}:savedAt`;
  const url = options.url ?? DATA_URL;
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init));
  const local = localStorageAdapter(key);

  const localStamp = (): number => {
    try {
      return Number(window.localStorage.getItem(stampKey)) || 0;
    } catch {
      return 0;
    }
  };
  const saveLocal = async ({ savedAt, data }: Stamped) => {
    await local.save(data);
    window.localStorage.setItem(stampKey, String(savedAt));
  };

  /** The project-folder copy, or null when there's none or no server to ask. */
  async function pull(): Promise<Stamped | null> {
    try {
      const res = await doFetch(url, { cache: 'no-store' });
      // A static host answers with index.html instead of JSON.
      if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
      const body: unknown = await res.json();
      if (typeof body !== 'object' || body === null) return null;
      const { savedAt, data } = body as Record<string, unknown>;
      const parsed = parseAppData(data);
      return parsed && typeof savedAt === 'number' ? { savedAt, data: parsed } : null;
    } catch {
      return null;
    }
  }

  async function push(stamped: Stamped): Promise<void> {
    try {
      await doFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...stamped, report: options.report?.(stamped.data) ?? '' }),
      });
    } catch {
      // No server (static host, offline): the browser copy is enough, and it's pushed next time.
    }
  }

  return {
    async load() {
      const [mine, remote] = await Promise.all([local.load(), pull()]);
      const mineAt = localStamp();
      if (remote && (!mine || remote.savedAt >= mineAt)) {
        try {
          await saveLocal(remote);
        } catch {
          // Blocked storage: still use the project copy for this session.
        }
        return remote.data;
      }
      if (mine) await push({ savedAt: mineAt || Date.now(), data: mine });
      return mine;
    },
    async save(data) {
      const stamped = { savedAt: Date.now(), data };
      await saveLocal(stamped);
      await push(stamped);
    },
  };
}

/** In-memory storage for tests. */
export function memoryAdapter(initial: AppData | null = null): StorageAdapter & {
  saved: AppData | null;
} {
  const adapter = {
    saved: initial,
    async load() {
      return adapter.saved ? structuredClone(adapter.saved) : null;
    },
    async save(data: AppData) {
      adapter.saved = structuredClone(data);
    },
  };
  return adapter;
}
