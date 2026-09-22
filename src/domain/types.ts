export const RECIPE_IDS = [
  'loubia',
  'chorba-frik',
  'paprika-tray',
  'tajine-chickpea',
  'lentil-soup',
  'kefta-tray',
  'jelbana',
  'chorba-beida',
  'yogurt-tray',
  'zitoune',
  'gratin',
  'herb-tray',
  'oats',
  'muffins',
  'energy-balls',
  'couscous',
  'rice',
  'eggs',
] as const;

export type RecipeId = (typeof RECIPE_IDS)[number];

/**
 * stew: multicooker batch · pot: second batch (soup or oven bake) · tray: oven tray bake
 * eaten Sun–Wed from the fridge · breakfast/snack/basic: supporting recipes.
 */
export type RecipeKind = 'stew' | 'pot' | 'tray' | 'breakfast' | 'snack' | 'basic';

export type Appliance = 'multicooker' | 'stove' | 'oven' | 'none';

export type YieldUnit = 'portions' | 'jars' | 'muffins' | 'balls';

export interface Ingredient {
  qty: string;
  item: string;
}

export interface Recipe {
  id: RecipeId;
  name: string;
  /** Used where space is tight: week grid, Sunday steps, freezer plan. */
  short: string;
  /** Local/Algerian name when it differs from the English one. */
  local?: string;
  kind: RecipeKind;
  /** Rotation week (1–4) the recipe belongs to; absent for recipes used every week. */
  week?: 1 | 2 | 3 | 4;
  serves: number;
  yieldUnit: YieldUnit;
  appliance: Appliance;
  where: string;
  /** Oven temperature, for recipes that use the oven. */
  temp?: string;
  time: string;
  keeps: string;
  reheat: string;
  ingredients: readonly Ingredient[];
  steps: readonly string[];
  /** Fallback method, e.g. stove times when not using the multicooker. */
  alternative?: string;
}

/** 0-based index into the four-week rotation. Shown to people as Week 1–4. */
export type Rotation = 0 | 1 | 2 | 3;

/** Day within a plan week, which runs Saturday (shopping) to Friday. */
export type PlanDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ShoppingItem {
  name: string;
  detail: string;
}

export interface ShoppingSection {
  title: string;
  items: readonly ShoppingItem[];
}

export interface RotationWeek {
  stew: RecipeId;
  pot: RecipeId;
  tray: RecipeId;
  breakfast: 'oats' | 'muffins';
  snack: 'energy-balls' | null;
  carb: 'couscous' | 'rice' | null;
  /** Which batch the carb is portioned with; decides whether a light week still needs it. */
  carbFor: 'stew' | 'tray' | null;
  carbNote: string;
  saturdayNote: string;
  shopping: readonly ShoppingSection[];
}

/** Where a meal comes from on the day. */
export type Source = 'fridge' | 'freezer' | 'fresh' | 'free' | 'grab';

export type SlotName = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';

export interface MealSlot {
  slot: SlotName;
  dish: string;
  source: Source;
  how: string;
  recipeId?: RecipeId;
  /** Must move from freezer to fridge the night before. */
  thawNightBefore?: boolean;
}
