import { describe, expect, it } from 'vitest';
import { planDay, tasksFor } from './plan';
import type { PlanDay } from './types';

const week1 = (day: PlanDay, light = false, planWeek = 4) =>
  planDay({ rotation: 0, day, light, planWeek });
const lunch = (day: PlanDay, light = false) => week1(day, light).find((s) => s.slot === 'Lunch');
const dinner = (day: PlanDay, light = false) => week1(day, light).find((s) => s.slot === 'Dinner');

describe('planDay', () => {
  it('always returns breakfast, lunch, snack and dinner in order', () => {
    for (const d of [0, 1, 2, 3, 4, 5, 6] as PlanDay[]) {
      expect(week1(d).map((s) => s.slot)).toEqual(['Breakfast', 'Lunch', 'Snack', 'Dinner']);
    }
  });

  it('eats from the fridge Mon–Wed and the freezer Thu–Fri', () => {
    for (const d of [2, 3, 4] as PlanDay[]) {
      expect(lunch(d)?.source).toBe('fridge');
      expect(dinner(d)?.source).toBe('fridge');
    }
    expect(lunch(5)?.source).toBe('freezer');
    expect(dinner(5)?.source).toBe('freezer');
    expect(lunch(6)?.source).toBe('freezer');
  });

  it('keeps Friday dinner free', () => {
    expect(dinner(6)).toMatchObject({ dish: 'Free night', source: 'free' });
  });

  it('uses the tray bake four times: Sun dinner, Mon lunch, Tue dinner, Wed lunch', () => {
    const trayMeals = ([0, 1, 2, 3, 4, 5, 6] as PlanDay[])
      .flatMap((d) => week1(d))
      .filter((s) => s.recipeId === 'paprika-tray');
    expect(trayMeals).toHaveLength(4);
  });

  it('never serves a fridge meal later than 4 days after Sunday', () => {
    // Fridge meals are only allowed Mon–Wed.
    for (const d of [5, 6] as PlanDay[]) {
      const fridge = week1(d).filter((s) => s.source === 'fridge' && s.slot !== 'Breakfast');
      expect(fridge).toEqual([]);
    }
  });

  it('swaps stew and soup for freezer meals in a light week', () => {
    expect(dinner(2, true)?.source).toBe('freezer');
    expect(lunch(3, true)?.source).toBe('freezer');
    expect(lunch(2, true)?.recipeId).toBe('paprika-tray');
  });

  it('serves simple food on the first weekend, before the freezer has anything', () => {
    const sat = planDay({ rotation: 0, day: 0, light: false, planWeek: 0 });
    expect(sat.some((s) => s.source === 'freezer')).toBe(false);
  });

  it('takes Thu–Fri egg muffins from the freezer in muffin weeks', () => {
    const thu = planDay({ rotation: 1, day: 5, light: false, planWeek: 5 });
    expect(thu[0]).toMatchObject({ recipeId: 'muffins', source: 'freezer', thawNightBefore: true });
  });
});

describe('tasksFor', () => {
  const base = { isLight: () => false, freezerPortions: 8 };

  it('asks on Wednesday night to move Thursday meals to the fridge', () => {
    const tasks = tasksFor({ ...base, planWeek: 4, day: 4 });
    const move = tasks.find((t) => t.title.startsWith('Tonight, 30 seconds'));
    expect(move?.text).toMatch(/move 2 things/);
  });

  it('asks for nothing to move on a normal Sunday night', () => {
    const tasks = tasksFor({ ...base, planWeek: 4, day: 1 });
    expect(tasks.some((t) => t.title.startsWith('Tonight, 30 seconds'))).toBe(false);
  });

  it('asks to move Monday dinner on Sunday night in a light week', () => {
    const tasks = tasksFor({ ...base, isLight: () => true, planWeek: 4, day: 1 });
    expect(tasks.find((t) => t.title.startsWith('Tonight, 30 seconds'))?.text).toMatch(/1 thing/);
  });

  it('suggests a light week on Saturday when the freezer is full', () => {
    const tasks = tasksFor({ ...base, freezerPortions: 15, planWeek: 4, day: 0 });
    expect(tasks.some((t) => t.tone === 'freezer' && t.title.includes('15 portions'))).toBe(true);
  });

  it('warns on Saturday when the freezer is low', () => {
    const tasks = tasksFor({ ...base, freezerPortions: 2, planWeek: 4, day: 0 });
    expect(tasks.some((t) => t.tone === 'warn' && t.title.includes('low'))).toBe(true);
  });
});
