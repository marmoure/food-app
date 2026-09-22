import { daysBetween, fromIsoDate } from './calendar';
import { RECIPES } from './recipes';
import { rotationWeek } from './rotation';
import type { RecipeId, Rotation } from './types';

export interface FreezerItem {
  id: string;
  name: string;
  recipeId: RecipeId | null;
  portions: number;
  /** YYYY-MM-DD */
  frozenOn: string;
}

export type NewFreezerItem = Omit<FreezerItem, 'id'>;

/** Below this, cook a full week. */
export const FREEZER_LOW_BELOW = 6;
/** At or above this, suggest a light week. */
export const FREEZER_FULL_AT = 14;
export const FREEZER_METER_MAX = 20;
/** Frozen meals are best within ~3 months; flag them a bit before. */
export const FREEZER_STALE_AFTER_DAYS = 75;

/** How many portions of each batch go into the freezer on a full Sunday. */
export const BATCH_TO_FREEZER = { stew: 4, pot: 5 } as const;

export type FreezerStatus = 'low' | 'ok' | 'full';

export function freezerStatus(portions: number): FreezerStatus {
  if (portions < FREEZER_LOW_BELOW) return 'low';
  if (portions >= FREEZER_FULL_AT) return 'full';
  return 'ok';
}

export function totalPortions(items: readonly FreezerItem[]): number {
  return items.reduce((sum, item) => sum + item.portions, 0);
}

export function oldestFirst(items: readonly FreezerItem[]): FreezerItem[] {
  return [...items].sort((a, b) => a.frozenOn.localeCompare(b.frozenOn));
}

export function ageInDays(item: FreezerItem, today: Date): number | null {
  const frozen = fromIsoDate(item.frozenOn);
  return frozen ? daysBetween(frozen, today) : null;
}

export function isStale(item: FreezerItem, today: Date): boolean {
  const age = ageInDays(item, today);
  return age !== null && age > FREEZER_STALE_AFTER_DAYS;
}

/** The entries a full Sunday cook adds to the freezer. */
export function batchEntries(rotation: Rotation, frozenOn: string): NewFreezerItem[] {
  const w = rotationWeek(rotation);
  return [
    { name: RECIPES[w.stew].name, recipeId: w.stew, portions: BATCH_TO_FREEZER.stew, frozenOn },
    { name: RECIPES[w.pot].name, recipeId: w.pot, portions: BATCH_TO_FREEZER.pot, frozenOn },
  ];
}
