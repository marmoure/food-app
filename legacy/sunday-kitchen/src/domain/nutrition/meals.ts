import { RECIPES } from '../recipes';
import { serveGuide } from '../serving';
import type { FoodAmount } from './foods';
import type { MealSlot, RecipeId, SlotName } from '../types';
import { type Macros, ZERO, addMacros, macrosOf, scaleMacros } from './macros';

/** Whole batch, from the ingredient lines linked to foods. */
export function batchMacros(id: RecipeId): Macros {
  const amounts: FoodAmount[] = [];
  for (const i of RECIPES[id].ingredients) if (i.amount) amounts.push(i.amount);
  return macrosOf(amounts);
}

/** One serving (one portion, jar, muffin, wedge…). */
export function servingMacros(id: RecipeId): Macros {
  return scaleMacros(batchMacros(id), 1 / RECIPES[id].serves);
}

/** The sides the plan puts next to the dish. */
export function plateSidesMacros(id: RecipeId): Macros {
  const guide = serveGuide(id);
  if (!guide) return ZERO;
  return addMacros(...guide.plate.map((s) => macrosOf(s.amounts ?? [])));
}

/** A serving plus its plate sides: what actually gets eaten at that meal. */
export function plateMacros(id: RecipeId, servings = 1): Macros {
  return addMacros(scaleMacros(servingMacros(id), servings), plateSidesMacros(id));
}

/** A slot's nutrition, or null when it's a free choice the plan can't count. */
export function slotMacros(slot: MealSlot): Macros | null {
  if (!slot.recipeId && !slot.extras) return null;
  const parts: Macros[] = [];
  if (slot.recipeId) parts.push(plateMacros(slot.recipeId, slot.servings ?? 1));
  if (slot.extras) parts.push(macrosOf(slot.extras));
  return addMacros(...parts);
}

export interface DayNutrition {
  total: Macros;
  /** Slots left to your choice (free night, any freezer meal), not in the total. */
  uncounted: SlotName[];
}

export function dayNutrition(slots: readonly MealSlot[]): DayNutrition {
  const counted: Macros[] = [];
  const uncounted: SlotName[] = [];
  for (const s of slots) {
    const m = slotMacros(s);
    if (m) counted.push(m);
    else uncounted.push(s.slot);
  }
  return { total: addMacros(...counted), uncounted };
}
