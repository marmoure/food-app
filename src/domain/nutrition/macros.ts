import { FOODS, type FoodAmount } from './foods';

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export const MACRO_KEYS = ['kcal', 'protein', 'carbs', 'fat', 'fiber'] as const;

export function addMacros(...items: readonly Macros[]): Macros {
  const out = { ...ZERO };
  for (const m of items) for (const k of MACRO_KEYS) out[k] += m[k];
  return out;
}

export function scaleMacros(m: Macros, factor: number): Macros {
  const out = { ...ZERO };
  for (const k of MACRO_KEYS) out[k] = m[k] * factor;
  return out;
}

export function macrosOf(amounts: readonly FoodAmount[]): Macros {
  return addMacros(...amounts.map((a) => scaleMacros(FOODS[a.food], a.grams / 100)));
}

export function roundMacros(m: Macros): Macros {
  return {
    kcal: Math.round(m.kcal),
    protein: Math.round(m.protein),
    carbs: Math.round(m.carbs),
    fat: Math.round(m.fat),
    fiber: Math.round(m.fiber),
  };
}
