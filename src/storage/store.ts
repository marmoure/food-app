import { batchEntries, type FreezerItem, type NewFreezerItem } from '../domain/freezer';
import type { Rotation } from '../domain/types';
import type { StorageAdapter } from './adapters';
import { type AppData, type ChecklistState, emptyData } from './schema';

export type SaveState = 'idle' | 'saved' | 'error';

export interface StoreSnapshot {
  data: AppData;
  loaded: boolean;
  saveState: SaveState;
}

/** crypto.randomUUID only exists in secure contexts; `vite --host` on a LAN IP isn't one. */
function defaultId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Marks the week's freezer batch as logged so it can't be added twice. */
export const BATCH_LOGGED_ITEM = 'logged';

/**
 * Holds app data in memory, persists every change through the adapter, and exposes
 * `subscribe`/`getSnapshot` for React's useSyncExternalStore. Snapshots are immutable:
 * every change produces a new object.
 */
export class AppStore {
  private snapshot: StoreSnapshot = { data: emptyData(), loaded: false, saveState: 'idle' };
  private readonly listeners = new Set<() => void>();
  private readonly adapter: StorageAdapter;
  private readonly newId: () => string;
  private saveChain: Promise<void> = Promise.resolve();

  constructor(adapter: StorageAdapter, newId: () => string = defaultId) {
    this.adapter = adapter;
    this.newId = newId;
  }

  async load(): Promise<void> {
    const stored = await this.adapter.load();
    this.set({ ...this.snapshot, data: stored ?? this.snapshot.data, loaded: true });
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): StoreSnapshot => this.snapshot;

  /** Resolves once every pending save has finished (for tests and future sync). */
  flush(): Promise<void> {
    return this.saveChain;
  }

  // Checklists -------------------------------------------------------------

  setChecked(scope: string, itemId: string, checked: boolean): void {
    this.updateChecklist(scope, (c) => {
      const items = { ...c.items };
      if (checked) items[itemId] = true;
      else delete items[itemId];
      return { ...c, items };
    });
  }

  /** Unticks every item in the scope whose id starts with the prefix. */
  clearChecked(scope: string, prefix: string): void {
    this.updateChecklist(scope, (c) => ({
      ...c,
      items: Object.fromEntries(
        Object.entries(c.items).filter(([id]) => !id.startsWith(prefix)),
      ) as Record<string, true>,
    }));
  }

  setLightWeek(weekKey: string, light: boolean): void {
    this.updateChecklist(weekKey, (c) => {
      const next: ChecklistState = { items: c.items };
      if (light) next.light = true;
      return next;
    });
  }

  // Freezer ----------------------------------------------------------------

  addFreezerItem(entry: NewFreezerItem): FreezerItem {
    const item: FreezerItem = { ...entry, id: this.newId() };
    this.updateData((d) => ({ ...d, freezer: [...d.freezer, item] }));
    return item;
  }

  /** Changes portions by delta; the item is removed when it reaches zero. */
  adjustFreezerItem(id: string, delta: number): void {
    this.updateData((d) => ({
      ...d,
      freezer: d.freezer
        .map((f) => (f.id === id ? { ...f, portions: f.portions + delta } : f))
        .filter((f) => f.portions > 0),
    }));
  }

  /** Adds a full Sunday batch to the freezer once per plan week. Returns false if already logged. */
  logBatch(rotation: Rotation, weekKey: string, frozenOn: string): boolean {
    if (this.snapshot.data.checklists[weekKey]?.items[BATCH_LOGGED_ITEM]) return false;
    const items = batchEntries(rotation, frozenOn).map((e) => ({ ...e, id: this.newId() }));
    this.updateData((d) => {
      const current = d.checklists[weekKey] ?? { items: {} };
      return {
        ...d,
        freezer: [...d.freezer, ...items],
        checklists: {
          ...d.checklists,
          [weekKey]: { ...current, items: { ...current.items, [BATCH_LOGGED_ITEM]: true } },
        },
      };
    });
    return true;
  }

  // Internals --------------------------------------------------------------

  private updateChecklist(scope: string, fn: (c: ChecklistState) => ChecklistState): void {
    this.updateData((d) => ({
      ...d,
      checklists: { ...d.checklists, [scope]: fn(d.checklists[scope] ?? { items: {} }) },
    }));
  }

  private updateData(fn: (d: AppData) => AppData): void {
    const data = fn(this.snapshot.data);
    this.set({ ...this.snapshot, data });
    // Saves run in order so an older state can never overwrite a newer one.
    this.saveChain = this.saveChain
      .then(() => this.adapter.save(data))
      .then(
        () => this.setSaveState('saved'),
        () => this.setSaveState('error'),
      );
  }

  private setSaveState(saveState: SaveState): void {
    if (this.snapshot.saveState !== saveState) this.set({ ...this.snapshot, saveState });
  }

  private set(next: StoreSnapshot): void {
    this.snapshot = next;
    for (const l of this.listeners) l();
  }
}
