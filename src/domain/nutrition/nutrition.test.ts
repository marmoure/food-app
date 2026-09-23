import { describe, expect, it } from 'vitest';
import { planDay } from '../plan';
import type { PlanDay, Rotation } from '../types';
import { macrosOf } from './macros';
import { dayNutrition, plateMacros, servingMacros, slotMacros } from './meals';
import { macroStatus } from './status';
import { DEFAULT_PROFILE, bmr, targetsFor } from './targets';

describe('targets', () => {
  it('uses Mifflin-St Jeor', () => {
    // 10×81 + 6.25×176 − 5×30 + 5
    expect(bmr(DEFAULT_PROFILE)).toBe(1765);
  });

  it('sets a moderate deficit and high protein for fat loss', () => {
    const t = targetsFor(DEFAULT_PROFILE);
    expect(t.maintenance).toBe(2118);
    expect(t.kcal).toBe(1700);
    expect(t.protein).toBe(130);
    expect(t.weeklyChangeKg).toBeCloseTo(-0.4, 1);
    // Macros add back up to the calories (within rounding).
    expect(t.protein * 4 + t.carbs * 4 + t.fat * 9).toBeGreaterThan(1680);
    expect(t.protein * 4 + t.carbs * 4 + t.fat * 9).toBeLessThan(1720);
  });

  it('caps the deficit at 500 kcal for bigger bodies', () => {
    const t = targetsFor({ ...DEFAULT_PROFILE, weightKg: 140, activity: 'active' });
    expect(t.maintenance - t.kcal).toBeLessThanOrEqual(525);
  });

  it('eats at maintenance or above for the other goals', () => {
    expect(targetsFor({ ...DEFAULT_PROFILE, goal: 'maintain' }).kcal).toBe(2100);
    expect(targetsFor({ ...DEFAULT_PROFILE, goal: 'gain' }).kcal).toBe(2350);
  });
});

describe('meal maths', () => {
  it('scales foods by weight', () => {
    expect(macrosOf([{ food: 'olive-oil', grams: 10 }]).kcal).toBeCloseTo(88.4);
  });

  it('divides a batch into servings and adds the plate', () => {
    const serving = servingMacros('loubia');
    expect(serving.kcal).toBeGreaterThan(350);
    expect(serving.kcal).toBeLessThan(550);
    expect(plateMacros('loubia').kcal).toBeGreaterThan(serving.kcal);
  });

  it('leaves free choices out of the day total', () => {
    const fri = dayNutrition(planDay({ rotation: 0, day: 6, light: false, planWeek: 4 }));
    expect(fri.uncounted).toEqual(['Dinner']);
  });

  it('counts two muffins as two servings', () => {
    const [breakfast] = planDay({ rotation: 1, day: 2, light: false, planWeek: 5 });
    const m = slotMacros(breakfast!);
    expect(m!.protein).toBeGreaterThan(2 * servingMacros('muffins').protein);
  });
});

describe('the plan meets the targets', () => {
  const t = targetsFor(DEFAULT_PROFILE);
  const rotations: Rotation[] = [0, 1, 2, 3];
  const fullDays: PlanDay[] = [1, 2, 3, 4, 5]; // Sun–Thu: every meal is planned

  for (const rotation of rotations) {
    it(`Week ${rotation + 1}, Sun–Thu: calories near target, protein and fibre high enough`, () => {
      for (const day of fullDays) {
        const { total, uncounted } = dayNutrition(
          planDay({ rotation, day, light: false, planWeek: 4 + rotation }),
        );
        const label = `W${rotation + 1} day ${day}`;
        expect(uncounted, label).toEqual([]);
        expect(total.kcal, label).toBeGreaterThan(t.kcal * 0.88);
        expect(total.kcal, label).toBeLessThan(t.kcal * 1.06);
        expect(macroStatus('protein', total.protein, t.protein), label).toBe('ok');
        expect(total.fiber, label).toBeGreaterThanOrEqual(20);
        expect(macroStatus('fat', total.fat, t.fat), label).toBe('ok');
      }
    });

    it(`Week ${rotation + 1}: leaves room for Friday's free dinner`, () => {
      const fri = dayNutrition(planDay({ rotation, day: 6, light: false, planWeek: 4 + rotation }));
      expect(t.kcal - fri.total.kcal).toBeGreaterThan(400);
    });
  }
});
