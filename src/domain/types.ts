import type { FoodAmount } from './nutrition/foods';

export const RECIPE_IDS = [
  'loubia',
  'bolognese',
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
  'kesra',
] as const;

export type RecipeId = (typeof RECIPE_IDS)[number];

/**
 * stew: multicooker batch · pot: second batch (soup or oven bake) · tray: oven tray bake
 * eaten Sun–Wed from the fridge · breakfast/snack/basic: supporting recipes.
 */
export type RecipeKind = 'stew' | 'pot' | 'tray' | 'breakfast' | 'snack' | 'basic';

export type Appliance = 'multicooker' | 'stove' | 'oven' | 'none';

export type YieldUnit = 'portions' | 'jars' | 'muffins' | 'balls' | 'rounds';

/** Something to eat alongside a dish. */
export interface Side {
  name: string;
  note?: string;
  /** Links to the side's own recipe when there is one. */
  recipeId?: RecipeId;
  /** What a serving of the side weighs, for the day's nutrition numbers. */
  amounts?: readonly FoodAmount[];
}

/** How a dish goes from container to plate. */
export interface ServeGuide {
  /** How it's eaten and what a sensible plate looks like. */
  howToEat: string;
  /** What the plan puts next to the dish. Counted in the day's nutrition numbers. */
  plate: readonly Side[];
  /** Other good options. Healthier first. */
  sides: readonly Side[];
  /** Freezer to plate. Absent for dishes that shouldn't be frozen. */
  thaw?: string;
}

export interface Ingredient {
  qty: string;
  item: string;
  /** Links the line to nutrition data. Herbs, spices and water are left out. */
  amount?: FoodAmount;
}

/** Heads of the electric vegetable cutter, in the order to use them (clean once). */
export const CUTTER_HEADS = [
  'slice-thick',
  'slice-thin',
  'shred',
  'grate-coarse',
  'grate-fine',
] as const;
export type CutterHead = (typeof CUTTER_HEADS)[number];

export interface CutterJob {
  head: CutterHead;
  /** What goes through it, e.g. "3 carrots". */
  what: string;
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
  /** Vegetables to run through the electric cutter before cooking. */
  cutter?: readonly CutterJob[];
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
  /** Recipe servings eaten, e.g. 2 muffins. Defaults to 1. */
  servings?: number;
  /** Foods eaten on top of (or instead of) a recipe, for the nutrition numbers. */
  extras?: readonly FoodAmount[];
}
