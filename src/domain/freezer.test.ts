import { describe, expect, it } from 'vitest';
import {
  type FreezerItem,
  ageInDays,
  batchEntries,
  freezerStatus,
  isStale,
  oldestFirst,
  totalPortions,
} from './freezer';

const item = (over: Partial<FreezerItem>): FreezerItem => ({
  id: 'x',
  name: 'Loubia',
  recipeId: 'loubia',
  portions: 2,
  frozenOn: '2026-09-27',
  ...over,
});

describe('freezer', () => {
  it('classifies stock levels', () => {
    expect(freezerStatus(0)).toBe('low');
    expect(freezerStatus(5)).toBe('low');
    expect(freezerStatus(6)).toBe('ok');
    expect(freezerStatus(13)).toBe('ok');
    expect(freezerStatus(14)).toBe('full');
  });

  it('totals portions and sorts oldest first', () => {
    const items = [item({ id: 'b', frozenOn: '2026-10-04' }), item({ id: 'a', portions: 3 })];
    expect(totalPortions(items)).toBe(5);
    expect(oldestFirst(items).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('flags items older than 75 days', () => {
    const f = item({ frozenOn: '2026-09-27' });
    expect(ageInDays(f, new Date(2026, 9, 7))).toBe(10);
    expect(isStale(f, new Date(2026, 11, 10))).toBe(false);
    expect(isStale(f, new Date(2026, 11, 12))).toBe(true);
    expect(ageInDays(item({ frozenOn: 'nonsense' }), new Date())).toBeNull();
  });

  it("builds the week's batch entries", () => {
    expect(batchEntries(0, '2026-09-27')).toEqual([
      { name: 'Loubia with beef', recipeId: 'loubia', portions: 4, frozenOn: '2026-09-27' },
      {
        name: 'Chorba frik with chicken',
        recipeId: 'chorba-frik',
        portions: 5,
        frozenOn: '2026-09-27',
      },
    ]);
  });
});
