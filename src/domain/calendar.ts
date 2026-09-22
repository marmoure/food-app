import type { PlanDay, Rotation } from './types';

/** Saturday 26 Sep 2026: the first shopping day of Week 1. */
export const PLAN_START = new Date(2026, 8, 26);

const DAY_MS = 86_400_000;

export const PLAN_DAY_NAMES = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Whole days from a to b. Rounds so DST shifts don't produce off-by-one. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

/** Local calendar date as YYYY-MM-DD (no timezone conversion). */
export function toIsoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Parses YYYY-MM-DD as a local date; returns null for anything else. */
export function fromIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function rotationOf(planWeek: number): Rotation {
  return (((planWeek % 4) + 4) % 4) as Rotation;
}

export function weekStart(planWeek: number, start = PLAN_START): Date {
  return addDays(start, planWeek * 7);
}

/** Stable storage key for a plan week: the ISO date of its Saturday. */
export function weekKey(planWeek: number, start = PLAN_START): string {
  return toIsoDate(weekStart(planWeek, start));
}

export interface PlanPosition {
  /** Days since PLAN_START; negative before the plan begins. */
  dayIndex: number;
  started: boolean;
  /** 0-based count of plan weeks since the start (0 before the start). */
  planWeek: number;
  rotation: Rotation;
  day: PlanDay;
}

export function positionOf(date: Date, start = PLAN_START): PlanPosition {
  const dayIndex = daysBetween(start, date);
  const started = dayIndex >= 0;
  const planWeek = started ? Math.floor(dayIndex / 7) : 0;
  return {
    dayIndex,
    started,
    planWeek,
    rotation: rotationOf(planWeek),
    day: (started ? dayIndex % 7 : 0) as PlanDay,
  };
}

/** The current or next plan week that uses the given rotation. */
export function planWeekForRotation(rotation: Rotation, current: PlanPosition): number {
  return current.planWeek + ((rotation - current.rotation + 4) % 4);
}

export function nextDay(planWeek: number, day: PlanDay): { planWeek: number; day: PlanDay } {
  return day === 6 ? { planWeek: planWeek + 1, day: 0 } : { planWeek, day: (day + 1) as PlanDay };
}

const shortDate: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
const withWeekday: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
};

export function formatDate(d: Date, options: Intl.DateTimeFormatOptions = withWeekday): string {
  return d.toLocaleDateString('en-GB', options);
}

export function formatWeekRange(planWeek: number, options = withWeekday): string {
  const s = weekStart(planWeek);
  return `${formatDate(s, options)} – ${formatDate(addDays(s, 6), options)}`;
}

export function formatShortRange(planWeek: number): string {
  return formatWeekRange(planWeek, shortDate);
}
