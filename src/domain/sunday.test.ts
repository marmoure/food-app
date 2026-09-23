import { describe, expect, it } from 'vitest';
import { cutterPlan, storagePlan, sundaySession } from './sunday';
import type { Rotation } from './types';

describe('sundaySession', () => {
  it('fits a full session into about 2½ hours', () => {
    for (const r of [0, 1, 2, 3] as Rotation[]) {
      const { totalMinutes } = sundaySession(r, false);
      expect(totalMinutes).toBeGreaterThanOrEqual(120);
      expect(totalMinutes).toBeLessThanOrEqual(180);
    }
  });

  it('drops the stew and pot in a light week', () => {
    const ids = sundaySession(0, true).steps.map((s) => s.id);
    expect(ids).not.toContain('stew');
    expect(ids).not.toContain('pot');
    expect(ids).not.toContain('log');
  });

  it('skips the carb in a light week when it belongs to the stew', () => {
    const carb = sundaySession(1, true).steps.find((s) => s.id === 'carb');
    expect(carb?.recipeId).toBe('eggs');
  });

  it('starts each step when the previous one ends', () => {
    const { steps } = sundaySession(2, false);
    steps.slice(1).forEach((s, i) => {
      const prev = steps[i]!;
      expect(s.startsAt).toBe(prev.startsAt + prev.durationMinutes);
    });
  });
});

describe('cutterPlan', () => {
  it('groups the week by cutter head, slicers before graters, onion last', () => {
    const groups = cutterPlan(['loubia', 'bolognese', 'paprika-tray']);
    expect(groups.map((g) => g.head)).toEqual([
      'slice-thick',
      'slice-thin',
      'grate-coarse',
      'grate-fine',
    ]);
    const fine = groups.find((g) => g.head === 'grate-fine')!;
    expect(fine.items.at(-1)).toMatch(/onion/);
  });

  it('adds one cutter step to the session, without stew or pot vegetables in a light week', () => {
    const full = sundaySession(0, false).steps.find((s) => s.id === 'cutter');
    const light = sundaySession(0, true).steps.find((s) => s.id === 'cutter');
    expect(full?.cutter?.flatMap((g) => g.items).join(' ')).toMatch(/Loubia/);
    expect(light?.cutter?.flatMap((g) => g.items).join(' ')).not.toMatch(/Loubia|Bolognese/);
  });
});

describe('storagePlan', () => {
  it('freezes 4 stew and 5 soup portions on a full week', () => {
    expect(storagePlan(0, false).freezer.join(' ')).toMatch(/×4.*×5/);
  });
});
