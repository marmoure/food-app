import { describe, expect, it } from 'vitest';
import { ROTATION } from './rotation';
import type { Rotation } from './types';
import {
  VEG_CARE,
  VEG_RUN_DAYS,
  daysItMustKeep,
  vegRunDate,
  vegRunOn,
  vegRuns,
} from './vegetables';

const rotations = [0, 1, 2, 3] as Rotation[];

describe('vegetable runs', () => {
  it('gives every vegetable a run day, and nothing else', () => {
    for (const w of ROTATION) {
      for (const sec of w.shopping) {
        for (const it of sec.items) {
          expect(Boolean(it.veg), `${sec.title}: ${it.name}`).toBe(sec.title === 'Vegetables');
        }
      }
    }
  });

  it('only buys vegetables that keep until they are used', () => {
    for (const r of rotations) {
      for (const run of vegRuns(r)) {
        expect(
          daysItMustKeep(run.day, run.veg),
          `Week ${r + 1}: ${run.item.name}`,
        ).toBeLessThanOrEqual(VEG_CARE[run.veg].keepsDays);
      }
    }
  });

  it('never has more than three vegetables on one run', () => {
    for (const r of rotations) {
      for (const day of VEG_RUN_DAYS) {
        const runs = vegRuns(r).filter((run) => run.day === day);
        expect(runs.length, `Week ${r + 1} ${day}`).toBeLessThanOrEqual(3);
      }
    }
  });

  it('dates Tue–Fri runs in the week before the Sunday cook', () => {
    expect(vegRunDate(1, 'tue')).toEqual(new Date(2026, 8, 29));
    expect(vegRunDate(1, 'sat')).toEqual(new Date(2026, 9, 3));
  });

  it("shows next week's vegetables on a Tuesday and catches up on Saturday", () => {
    const tue = vegRunOn(0, 3)!;
    expect(tue.planWeek).toBe(1);
    expect(tue.items.map((i) => i.item.name)).toContain('Carrots');
    expect(tue.earlier).toEqual([]);

    const sat = vegRunOn(1, 0)!;
    expect(sat.planWeek).toBe(1);
    expect(sat.items.every((i) => i.day === 'sat')).toBe(true);
    expect(sat.earlier.length + sat.items.length).toBe(vegRuns(1).length);
  });

  it('has no run on Sunday or Monday', () => {
    expect(vegRunOn(1, 1)).toBeNull();
    expect(vegRunOn(1, 2)).toBeNull();
  });
});
