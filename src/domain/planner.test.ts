import { describe, expect, it } from 'vitest';
import {
  allocateMeal,
  consumeMeal,
  cookingNeeds,
  generateMonth,
  projectPlan,
  undoMeal,
  type Palette,
} from './planner';
import { emptyData } from './types';
import { batch, meal, PROTEIN, STARCH, stocked, VEG } from '../test/fixtures';
import { daysInMonth, nextMonthDate, shiftMonth, validDate } from './dates';

describe('local calendar dates', () => {
  it('handles leap years and December rollover without shifting days', () => {
    expect(daysInMonth('2028-02')).toHaveLength(29);
    expect(daysInMonth('2027-02')).toHaveLength(28);
    expect(nextMonthDate('2027-01-31')).toBe('2027-02-28');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(validDate('2027-02-30')).toBe(false);
  });
});
describe('stock allocation', () => {
  it('uses the soonest use-by date first and respects each batch’s cube yield', () => {
    const result = allocateMeal(
      [
        batch({ id: 'new', cubesPerServing: 3 }),
        batch({ id: 'old', remaining: 2, useBy: '2027-01-11' }),
      ],
      [{ recipeId: PROTEIN, servings: 2 }],
      '2027-01-10',
    );
    expect(result).toEqual({
      allocations: [
        { batchId: 'old', cubes: 2 },
        { batchId: 'new', cubes: 3 },
      ],
      missing: [],
    });
  });
  it('excludes expired and not-yet-frozen batches and incomplete servings', () => {
    const result = allocateMeal(
      [
        batch({ id: 'expired', useBy: '2027-01-09' }),
        batch({ id: 'future', frozenOn: '2027-01-11' }),
        batch({ id: 'partial', remaining: 1 }),
      ],
      [{ recipeId: PROTEIN, servings: 1 }],
      '2027-01-10',
    );
    expect(result.allocations).toHaveLength(0);
    expect(result.missing).toEqual([{ recipeId: PROTEIN, servings: 1 }]);
  });
  it('does not allocate the same cubes to duplicate components', () => {
    const result = allocateMeal(
      [batch({ remaining: 2 })],
      [
        { recipeId: PROTEIN, servings: 1 },
        { recipeId: PROTEIN, servings: 1 },
      ],
      '2027-01-10',
    );
    expect(result.missing).toEqual([{ recipeId: PROTEIN, servings: 1 }]);
  });
  it('reserves across months in chronological order without changing physical stock', () => {
    const data = stocked({
      batches: [batch({ remaining: 2 })],
      meals: [meal({ id: 'later', date: '2027-02-01' }), meal()],
    });
    const projected = projectPlan(data, '2027-01-10');
    expect(projected[0]?.missing).toEqual([]);
    expect(projected[1]?.missing).toHaveLength(1);
    expect(data.batches[0]?.remaining).toBe(2);
    expect(cookingNeeds(data, '2027-02')[0]?.servings).toBe(1);
  });
  it('does not count now-expired stock as coverage for overdue meals', () => {
    expect(
      projectPlan(stocked({ batches: [batch({ useBy: '2027-01-11' })] }), '2027-01-12')[0]?.missing,
    ).toHaveLength(1);
  });
});
describe('eating and undo', () => {
  it('deducts an entire mixed bowl with different cube counts for each component', () => {
    const data = stocked({
      batches: [
        batch(),
        batch({ id: 'rice', recipeId: STARCH, cubesPerServing: 3 }),
        batch({ id: 'veg', recipeId: VEG, cubesPerServing: 1 }),
      ],
      meals: [
        meal({
          components: [
            { recipeId: PROTEIN, servings: 1 },
            { recipeId: STARCH, servings: 1 },
            { recipeId: VEG, servings: 1 },
          ],
        }),
      ],
    });
    const eaten = consumeMeal(data, 'meal-1', '2027-01-10');
    expect(eaten.batches.map((batch) => batch.remaining)).toEqual([12, 11, 13]);
    expect(undoMeal(eaten, 'meal-1')).toEqual(data);
  });
  it('deducts cubes exactly once and restores the original batches on undo', () => {
    const original = stocked();
    const eaten = consumeMeal(original, 'meal-1', '2027-01-10');
    expect(eaten.batches[0]?.remaining).toBe(12);
    expect(original.batches[0]?.remaining).toBe(14);
    expect(() => consumeMeal(eaten, 'meal-1', '2027-01-10')).toThrow('already');
    expect(undoMeal(eaten, 'meal-1')).toEqual(original);
  });
  it('never partially deducts a meal when one component is missing', () => {
    const data = stocked({
      meals: [
        meal({
          components: [
            { recipeId: PROTEIN, servings: 1 },
            { recipeId: VEG, servings: 1 },
          ],
        }),
      ],
    });
    expect(() => consumeMeal(data, 'meal-1', '2027-01-10')).toThrow('Not enough');
    expect(data.batches[0]?.remaining).toBe(14);
    expect(data.meals[0]?.eatenAt).toBeUndefined();
  });
  it('rejects future meals and currently expired stock', () => {
    expect(() => consumeMeal(stocked(), 'meal-1', '2027-01-09')).toThrow('planned day');
    expect(() => consumeMeal(stocked(), 'meal-1', '2027-02-02')).toThrow('Not enough');
  });
});
describe('monthly consumption plan', () => {
  const palette: Palette = {
    protein: [PROTEIN, 'beef-beef-goulash'],
    starch: [STARCH],
    veg: [VEG],
    breakfast: ['breakfast-baked-oatmeal'],
    snack: ['snacks-carrot-halwa'],
  };
  it('plans one person’s three meals plus two daily snack servings for every day', () => {
    const data = emptyData();
    const generated = generateMonth(data, '2027-01', '2027-01-01', data.settings, palette);
    expect(generated.meals).toHaveLength(124);
    expect(generated.meals.filter((m) => m.slot === 'snacks')).toHaveLength(31);
    expect(generated.meals.find((m) => m.slot === 'snacks')?.components[0]?.servings).toBe(2);
    expect(
      generated.meals.find((m) => m.slot === 'lunch')?.components.map((c) => c.recipeId),
    ).toEqual([PROTEIN, STARCH, VEG]);
    expect(generated.batches).toEqual([]);
  });
  it('only fills empty slots, preserving edits when generated again', () => {
    const data = stocked();
    const generated = generateMonth(data, '2027-01', '2027-01-10', data.settings, palette);
    const repeated = generateMonth(generated, '2027-01', '2027-01-10', data.settings, palette);
    expect(repeated.meals).toEqual(generated.meals);
    expect(repeated.meals.find((m) => m.id === 'meal-1')).toEqual(meal());
    expect(repeated.meals.every((m) => m.date >= '2027-01-10')).toBe(true);
  });
  it('scales household portions and respects excluded slots', () => {
    const data = emptyData();
    const generated = generateMonth(
      data,
      '2027-02',
      '2027-02-01',
      { people: 2, slots: ['dinner'], snackServings: 1 },
      palette,
    );
    expect(generated.meals).toHaveLength(28);
    expect(generated.meals[0]?.components.every((c) => c.servings === 2)).toBe(true);
  });
  it('requires a palette for included meal roles', () => {
    expect(() =>
      generateMonth(emptyData(), '2027-01', '2027-01-01', emptyData().settings, {
        ...palette,
        starch: [],
      }),
    ).toThrow('Choose at least');
  });
});
