export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
}

/** The person this plan was built for (Sep 2026). Editable in the app. */
export const DEFAULT_PROFILE: Profile = {
  sex: 'male',
  age: 30,
  heightCm: 176,
  weightKg: 81,
  activity: 'sedentary',
  goal: 'lose',
};

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export const ACTIVITY_LABEL: Record<Activity, string> = {
  sedentary: 'Desk job, little exercise',
  light: 'Walk daily or exercise 1–2×/week',
  moderate: 'Exercise 3–5×/week',
  active: 'Hard training most days',
};

export const GOAL_LABEL: Record<Goal, string> = {
  lose: 'Lose fat slowly',
  maintain: 'Keep my weight',
  gain: 'Build muscle',
};

/** Protein per kg of body weight: higher in a deficit to keep muscle. */
const PROTEIN_PER_KG: Record<Goal, number> = { lose: 1.6, maintain: 1.4, gain: 1.8 };
const FAT_SHARE = 0.28;

export interface Targets {
  bmr: number;
  maintenance: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterLitres: number;
  /** Expected weekly weight change in kg (negative = loss). */
  weeklyChangeKg: number;
}

/** Mifflin-St Jeor resting energy. */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return base + (p.sex === 'male' ? 5 : -161);
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function targetsFor(p: Profile): Targets {
  const resting = bmr(p);
  const maintenance = resting * ACTIVITY_FACTOR[p.activity];
  // A deficit of ~20%, capped at 500 kcal, loses fat without constant hunger.
  let kcal = maintenance;
  if (p.goal === 'lose') kcal = maintenance - Math.min(500, maintenance * 0.2);
  if (p.goal === 'gain') kcal = maintenance + 250;
  kcal = roundTo(kcal, 50);
  const protein = Math.round(p.weightKg * PROTEIN_PER_KG[p.goal]);
  const fat = Math.round((kcal * FAT_SHARE) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return {
    bmr: Math.round(resting),
    maintenance: Math.round(maintenance),
    kcal,
    protein,
    carbs,
    fat,
    fiber: p.sex === 'male' ? 30 : 25,
    waterLitres: Math.round(p.weightKg * 0.033 * 10) / 10,
    // ~7700 kcal per kg of body fat.
    weeklyChangeKg: Math.round((((kcal - maintenance) * 7) / 7700) * 10) / 10,
  };
}
