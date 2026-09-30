import { emptyData, type CubeData } from '../domain/types';
import { recipeById } from '../domain/recipes';
import { parseData } from './schema';

export const STORAGE_KEY = 'cube-kitchen:v1';
export const DATA_URL = '/api/cubes';
interface Saved {
  savedAt: number;
  data: CubeData;
}
export interface Adapter {
  load(): Promise<CubeData | null>;
  save(data: CubeData): Promise<string>;
}
function saved(value: unknown): Saved | null {
  if (!value || typeof value !== 'object') return null;
  const stamp = value as Partial<Saved>;
  const data = parseData(stamp.data);
  return data && typeof stamp.savedAt === 'number' && Number.isFinite(stamp.savedAt)
    ? { savedAt: stamp.savedAt, data }
    : null;
}
function report(data: CubeData): string {
  return [
    '# Cube Kitchen',
    '',
    '## Freezer',
    ...data.batches.map(
      (b) =>
        `- ${recipeById(b.recipeId).name}: ${b.remaining}/${b.total} cubes; ${b.cubesPerServing} cubes/serving; frozen ${b.frozenOn}; use by ${b.useBy}; ${b.location}`,
    ),
    '',
    '## Consumption plan',
    ...[...data.meals]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(
        (m) =>
          `- ${m.date} ${m.slot}${m.eatenAt ? ' [eaten]' : ''}: ${m.components.map((c) => `${c.servings} × ${recipeById(c.recipeId).name}`).join(' + ')}`,
      ),
    '',
  ].join('\n');
}
export function browserAdapter(): Adapter {
  return {
    async load() {
      let local: Saved | null = null;
      let damaged = false;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          local = saved(JSON.parse(raw));
          damaged = !local;
        }
      } catch {
        damaged = true;
      }
      let remote: Saved | null = null;
      try {
        const response = await fetch(DATA_URL, {
          cache: 'no-store',
          signal: AbortSignal.timeout(4000),
        });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          remote = saved(await response.json());
          if (!remote) damaged = true;
        }
      } catch {
        /* Offline: use the device copy. */
      }
      const newest = remote && (!local || remote.savedAt > local.savedAt) ? remote : local;
      if (!newest && damaged)
        throw new Error(
          'Saved data could not be read. Your files have been kept. Restore a valid Cube Kitchen backup to continue.',
        );
      if (newest) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newest));
        } catch {
          /* A project copy can still be read. */
        }
        if (newest === local && (!remote || local.savedAt > remote.savedAt)) {
          try {
            await fetch(DATA_URL, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...local, report: report(local.data) }),
              signal: AbortSignal.timeout(4000),
            });
          } catch {
            /* Keep the newer device copy until the project is available again. */
          }
        }
      }
      return newest?.data ?? null;
    },
    async save(data) {
      const stamped = { savedAt: Date.now(), data };
      let device = false;
      let project = false;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
        device = true;
      } catch {
        /* Try the project copy too. */
      }
      try {
        const response = await fetch(DATA_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...stamped, report: report(data) }),
          signal: AbortSignal.timeout(4000),
        });
        project = response.status === 204;
      } catch {
        /* The static/offline app keeps a device copy. */
      }
      if (!device && !project) throw new Error('Could not save. Export a backup before closing.');
      return project
        ? device
          ? 'Saved to device & project'
          : 'Saved to project'
        : 'Saved on this device';
    },
  };
}
export function memoryAdapter(initial: CubeData | null = null): Adapter {
  let data = initial;
  return {
    async load() {
      return data;
    },
    async save(next) {
      data = next;
      return 'Saved';
    },
  };
}
export class CubeStore {
  private snapshot = { data: emptyData(), status: 'Ready', error: '' };
  private listeners = new Set<() => void>();
  private writing: Promise<void> = Promise.resolve();
  private revision = 0;
  constructor(privateAdapter: Adapter) {
    this.adapter = privateAdapter;
  }
  private adapter: Adapter;
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit() {
    this.listeners.forEach((listener) => listener());
  }
  async load() {
    const data = await this.adapter.load();
    this.snapshot = {
      data: data ?? emptyData(),
      status: data ? 'Saved data loaded' : 'Ready',
      error: '',
    };
    this.emit();
  }
  update = (change: (data: CubeData) => CubeData) => {
    const data = parseData(change(this.snapshot.data));
    if (!data)
      throw new Error('Please check the quantities and dates. This change cannot be saved.');
    const revision = ++this.revision;
    this.snapshot = { data, status: 'Saving…', error: '' };
    this.emit();
    this.writing = this.writing
      .catch(() => {})
      .then(async () => {
        try {
          const status = await this.adapter.save(data);
          if (revision === this.revision) this.snapshot = { data, status, error: '' };
        } catch (error) {
          if (revision === this.revision)
            this.snapshot = {
              data,
              status: 'Not saved',
              error: error instanceof Error ? error.message : 'Could not save.',
            };
        }
        this.emit();
      });
  };
  flush = () => this.writing;
}
