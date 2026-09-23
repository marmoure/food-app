import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE } from '../domain/nutrition/targets';
import { memoryAdapter } from './adapters';
import { emptyData, parseAppData } from './schema';
import { AppStore, BATCH_LOGGED_ITEM } from './store';

function setup() {
  const adapter = memoryAdapter();
  let n = 0;
  const store = new AppStore(adapter, () => `id-${++n}`);
  return { adapter, store };
}

describe('AppStore', () => {
  it('loads stored data', async () => {
    const data = emptyData();
    data.checklists.setup = { items: { 'eq-micro': true } };
    const store = new AppStore(memoryAdapter(data));
    await store.load();
    expect(store.getSnapshot()).toMatchObject({ loaded: true, data });
  });

  it('ticks and unticks items and persists them', async () => {
    const { store, adapter } = setup();
    store.setChecked('2026-09-26', 'shop-0-0', true);
    store.setChecked('2026-09-26', 'shop-0-1', true);
    store.setChecked('2026-09-26', 'shop-0-0', false);
    await store.flush();
    expect(adapter.saved?.checklists['2026-09-26']?.items).toEqual({ 'shop-0-1': true });
    expect(store.getSnapshot().saveState).toBe('saved');
  });

  it('produces a new snapshot object on every change', () => {
    const { store } = setup();
    const before = store.getSnapshot();
    store.setChecked('setup', 'a', true);
    expect(store.getSnapshot()).not.toBe(before);
  });

  it('clears only items with the prefix', () => {
    const { store } = setup();
    store.setChecked('w', 'shop-0-0', true);
    store.setChecked('w', 'sun-stew', true);
    store.clearChecked('w', 'shop-');
    expect(store.getSnapshot().data.checklists.w?.items).toEqual({ 'sun-stew': true });
  });

  it('toggles a light week without touching ticks', () => {
    const { store } = setup();
    store.setChecked('w', 'sun-stew', true);
    store.setLightWeek('w', true);
    expect(store.getSnapshot().data.checklists.w).toEqual({
      items: { 'sun-stew': true },
      light: true,
    });
    store.setLightWeek('w', false);
    expect(store.getSnapshot().data.checklists.w).toEqual({ items: { 'sun-stew': true } });
  });

  it('logs a week batch only once', () => {
    const { store } = setup();
    expect(store.logBatch(0, 'w', '2026-09-27')).toBe(true);
    expect(store.logBatch(0, 'w', '2026-09-27')).toBe(false);
    const { data } = store.getSnapshot();
    expect(data.freezer.map((f) => f.portions)).toEqual([4, 5]);
    expect(data.checklists.w?.items[BATCH_LOGGED_ITEM]).toBe(true);
  });

  it('removes a freezer item when its portions reach zero', () => {
    const { store } = setup();
    const f = store.addFreezerItem({
      name: 'Soup',
      recipeId: null,
      portions: 1,
      frozenOn: '2026-09-27',
    });
    store.adjustFreezerItem(f.id, 1);
    expect(store.getSnapshot().data.freezer[0]?.portions).toBe(2);
    store.adjustFreezerItem(f.id, -2);
    expect(store.getSnapshot().data.freezer).toEqual([]);
  });

  it('saves the profile', async () => {
    const { store, adapter } = setup();
    store.setProfile({ ...DEFAULT_PROFILE, weightKg: 79 });
    await store.flush();
    expect(adapter.saved?.profile?.weightKg).toBe(79);
  });

  it('reports a failed save', async () => {
    const store = new AppStore({
      load: async () => null,
      save: async () => {
        throw new Error('quota');
      },
    });
    store.setChecked('setup', 'a', true);
    await store.flush();
    expect(store.getSnapshot().saveState).toBe('error');
  });
});

describe('parseAppData', () => {
  it('keeps a valid profile and drops an invalid one', () => {
    expect(parseAppData({ version: 1, profile: DEFAULT_PROFILE })?.profile).toEqual(
      DEFAULT_PROFILE,
    );
    expect(
      parseAppData({ version: 1, profile: { ...DEFAULT_PROFILE, weightKg: -5 } })?.profile,
    ).toBeUndefined();
  });

  it('rejects unknown versions and non-objects', () => {
    expect(parseAppData(null)).toBeNull();
    expect(parseAppData({ version: 2 })).toBeNull();
  });

  it('drops malformed entries instead of failing', () => {
    const parsed = parseAppData({
      version: 1,
      checklists: { ok: { items: { a: true, b: 'yes' }, light: true }, bad: 3 },
      freezer: [
        { id: '1', name: 'Soup', recipeId: 'nope', portions: 2, frozenOn: '2026-09-27' },
        { id: '2', name: 'Stew', portions: -1, frozenOn: '2026-09-27' },
        'junk',
      ],
    });
    expect(parsed).toEqual({
      version: 1,
      checklists: { ok: { items: { a: true }, light: true } },
      freezer: [{ id: '1', name: 'Soup', recipeId: null, portions: 2, frozenOn: '2026-09-27' }],
    });
  });
});
