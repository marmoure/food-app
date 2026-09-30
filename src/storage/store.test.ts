import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseData } from './schema';
import { browserAdapter, CubeStore, STORAGE_KEY, type Adapter } from './store';
import { batch, meal, PROTEIN, stocked } from '../test/fixtures';
import { emptyData } from '../domain/types';
import { consumeMeal } from '../domain/planner';

afterEach(() => vi.unstubAllGlobals());

describe('persisted cube data', () => {
  it('roundtrips a consumed plan with batch allocations', () => {
    const data = consumeMeal(stocked(), 'meal-1', '2027-01-10');
    expect(parseData(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });
  it('rejects negative stock, broken dates, unknown recipes and duplicate slots', () => {
    expect(parseData(stocked({ batches: [batch({ remaining: -1 })] }))).toBeNull();
    expect(parseData(stocked({ batches: [batch({ useBy: '2027-02-31' })] }))).toBeNull();
    expect(parseData(stocked({ batches: [batch({ recipeId: 'no-recipe' })] }))).toBeNull();
    expect(parseData(stocked({ meals: [meal(), meal({ id: 'second' })] }))).toBeNull();
    expect(parseData({ version: 1, checklists: {} })).toBeNull();
  });
  it('cannot restore consumed cubes without undoing the recorded meal', () => {
    const data = consumeMeal(stocked(), 'meal-1', '2027-01-10');
    data.batches[0]!.remaining = 14;
    expect(parseData(data)).toBeNull();
  });
  it('serializes saves and recovers after a failed write', async () => {
    const saved: number[] = [];
    const adapter: Adapter = {
      async load() {
        return emptyData();
      },
      async save(data) {
        await Promise.resolve();
        saved.push(data.favorites.length);
        if (saved.length === 1) throw new Error('offline');
        return 'Saved';
      },
    };
    const store = new CubeStore(adapter);
    await store.load();
    store.update((data) => ({ ...data, favorites: [PROTEIN] }));
    store.update((data) => ({ ...data, favorites: [] }));
    await store.flush();
    expect(saved).toEqual([1, 0]);
    expect(store.getSnapshot().status).toBe('Saved');
    expect(store.getSnapshot().error).toBe('');
  });
  it('loads the latest valid copy and persists it locally', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: 10, data: emptyData() }));
    const remote = stocked();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ savedAt: 20, data: remote }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    expect(await browserAdapter().load()).toEqual(remote);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).savedAt).toBe(20);
  });
  it('preserves damaged saves instead of silently resetting them', async () => {
    const raw = '{bad json';
    localStorage.setItem(STORAGE_KEY, raw);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(browserAdapter().load()).rejects.toThrow('could not be read');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });
  it('pushes a newer offline device copy back to the project when reopened', async () => {
    const data = stocked();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: 20, data }));
    const doFetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ savedAt: 10, data: emptyData() }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', doFetch);
    expect(await browserAdapter().load()).toEqual(data);
    expect(doFetch).toHaveBeenLastCalledWith(
      '/api/cubes',
      expect.objectContaining({ method: 'PUT', body: expect.stringContaining('"savedAt":20') }),
    );
  });
  it('keeps working on a static host and reports only a device save', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<html>app</html>', { headers: { 'Content-Type': 'text/html' } }),
        ),
    );
    const adapter = browserAdapter();
    expect(await adapter.load()).toBeNull();
    expect(await adapter.save(stocked())).toBe('Saved on this device');
    expect(await adapter.load()).toEqual(stocked());
  });
  it('reports a project-only save if browser storage is blocked', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    expect(await browserAdapter().save(emptyData())).toBe('Saved to project');
    spy.mockRestore();
  });
});
