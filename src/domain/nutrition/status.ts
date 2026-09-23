import type { Macros } from './macros';

export type MacroKey = keyof Macros;
export type MeterStatus = 'ok' | 'low' | 'high';

export const MACRO_LABEL: Record<MacroKey, string> = {
  kcal: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  fiber: 'Fibre',
};

export const MACRO_UNIT: Record<MacroKey, string> = {
  kcal: 'kcal',
  protein: 'g',
  carbs: 'g',
  fat: 'g',
  fiber: 'g',
};

/**
 * How a day's amount compares with its target. Protein and fibre are floors (more is fine);
 * calories are a ceiling with a little room; carbs and fat just need to be in the area.
 */
export function macroStatus(key: MacroKey, value: number, target: number): MeterStatus {
  const r = target > 0 ? value / target : 1;
  switch (key) {
    case 'protein':
    case 'fiber':
      return r >= 0.85 ? 'ok' : 'low';
    case 'kcal':
      return r > 1.08 ? 'high' : r < 0.8 ? 'low' : 'ok';
    default:
      return r > 1.2 ? 'high' : r < 0.7 ? 'low' : 'ok';
  }
}

export const STATUS_LABEL: Record<MeterStatus, string> = {
  ok: 'on target',
  low: 'low',
  high: 'high',
};
