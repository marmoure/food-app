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
