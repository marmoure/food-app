import { weekKey } from '../domain/calendar';
import type { AppData } from './schema';

export function isChecked(data: AppData, scope: string, itemId: string): boolean {
  return data.checklists[scope]?.items[itemId] === true;
}

export function countChecked(data: AppData, scope: string, itemIds: readonly string[]): number {
  return itemIds.filter((id) => isChecked(data, scope, id)).length;
}

export function isLightWeek(data: AppData, planWeek: number): boolean {
  return data.checklists[weekKey(planWeek)]?.light === true;
}
