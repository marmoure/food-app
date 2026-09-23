import { PLAN_RECIPE_IDS } from '../../domain/rotation';
import type { Recipe, RecipeKind } from '../../domain/types';

export const KIND_LABEL: Record<RecipeKind, string> = {
  stew: 'Multicooker stew',
  pot: 'Second batch',
  tray: 'Tray bake',
  breakfast: 'Breakfast',
  snack: 'Snack',
  basic: 'Basic',
};

/** "· Week 2" for rotation dishes, "· Extra" for recipes not in the plan yet. */
export function planLabel(r: Recipe): string {
  if (r.week) return ` · Week ${r.week}`;
  return PLAN_RECIPE_IDS.has(r.id) ? '' : ' · Extra';
}
