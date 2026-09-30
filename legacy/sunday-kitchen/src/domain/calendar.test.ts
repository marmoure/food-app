import { describe, expect, it } from 'vitest';
import {
  PLAN_START,
  addDays,
  daysBetween,
  fromIsoDate,
  nextDay,
  planWeekForRotation,
  positionOf,
  rotationOf,
  toIsoDate,
  weekKey,
} from './calendar';

describe('positionOf', () => {
  it('is not started before the first Saturday', () => {
    const p = positionOf(new Date(2026, 8, 22));
    expect(p).toMatchObject({ started: false, dayIndex: -4, planWeek: 0, rotation: 0, day: 0 });
  });

  it('starts on Saturday 26 Sep 2026 as week 1, day 0', () => {
    expect(positionOf(PLAN_START)).toMatchObject({ started: true, planWeek: 0, day: 0 });
  });

  it('maps weekdays onto plan days (Mon = 2, Fri = 6)', () => {
    expect(positionOf(new Date(2026, 8, 28)).day).toBe(2);
    expect(positionOf(new Date(2026, 9, 2)).day).toBe(6);
  });

  it('cycles the rotation every four weeks', () => {
    expect(positionOf(addDays(PLAN_START, 7 * 3)).rotation).toBe(3);
    expect(positionOf(addDays(PLAN_START, 7 * 4)).rotation).toBe(0);
    expect(positionOf(addDays(PLAN_START, 7 * 4)).planWeek).toBe(4);
  });

  it('ignores the time of day', () => {
    expect(positionOf(new Date(2026, 8, 28, 23, 59)).day).toBe(2);
  });
});

describe('date helpers', () => {
  it('counts days across the late-October DST change', () => {
    expect(daysBetween(new Date(2026, 9, 24), new Date(2026, 9, 26))).toBe(2);
  });

  it('round-trips ISO dates in local time', () => {
    const d = new Date(2026, 0, 5);
    expect(toIsoDate(d)).toBe('2026-01-05');
    expect(fromIsoDate('2026-01-05')?.getTime()).toBe(d.getTime());
    expect(fromIsoDate('05/01/2026')).toBeNull();
  });

  it('keys plan weeks by their Saturday', () => {
    expect(weekKey(0)).toBe('2026-09-26');
    expect(weekKey(1)).toBe('2026-10-03');
  });

  it('wraps negative plan weeks into the rotation', () => {
    expect(rotationOf(-1)).toBe(3);
  });

  it('rolls Friday over to the next plan week', () => {
    expect(nextDay(2, 6)).toEqual({ planWeek: 3, day: 0 });
    expect(nextDay(2, 3)).toEqual({ planWeek: 2, day: 4 });
  });

  it('finds the current or next plan week for a rotation', () => {
    const now = positionOf(addDays(PLAN_START, 7 * 5)); // plan week 5, rotation 1
    expect(planWeekForRotation(1, now)).toBe(5);
    expect(planWeekForRotation(0, now)).toBe(8);
    expect(planWeekForRotation(3, now)).toBe(7);
  });
});
