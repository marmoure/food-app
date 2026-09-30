import { daysInMonth, localDate } from './dates';
import { recipeById } from './recipes';
import {
  SLOTS,
  type Allocation,
  type Batch,
  type Component,
  type CubeData,
  type Settings,
} from './types';

export function mealNutrition(components: Component[]) {
  return components.reduce(
    (total, component) => {
      const recipe = recipeById(component.recipeId);
      return {
        kcal: total.kcal + recipe.kcal * component.servings,
        protein: total.protein + recipe.protein * component.servings,
      };
    },
    { kcal: 0, protein: 0 },
  );
}
export function allocateMeal(batches: Batch[], components: Component[], date: string) {
  const remaining = new Map(batches.map((batch) => [batch.id, batch.remaining]));
  const allocations: Allocation[] = [];
  const missing: Component[] = [];
  for (const component of components) {
    let needed = component.servings;
    const eligible = batches
      .filter(
        (batch) =>
          batch.recipeId === component.recipeId && batch.frozenOn <= date && batch.useBy >= date,
      )
      .sort(
        (a, b) =>
          a.useBy.localeCompare(b.useBy) ||
          a.frozenOn.localeCompare(b.frozenOn) ||
          a.id.localeCompare(b.id),
      );
    for (const batch of eligible) {
      const available = remaining.get(batch.id) ?? 0;
      const servings = Math.min(needed, Math.floor(available / batch.cubesPerServing));
      if (servings <= 0) continue;
      const cubes = servings * batch.cubesPerServing;
      allocations.push({ batchId: batch.id, cubes });
      remaining.set(batch.id, available - cubes);
      needed -= servings;
      if (needed === 0) break;
    }
    if (needed > 0) missing.push({ recipeId: component.recipeId, servings: needed });
  }
  return { allocations, missing };
}

/** Allocate chronologically across all months, so a cube cannot cover two meals. */
export function projectPlan(data: CubeData, asOf = localDate()) {
  let batches = data.batches.map((batch) => ({ ...batch }));
  return [...data.meals]
    .filter((meal) => !meal.eatenAt)
    .sort((a, b) => a.date.localeCompare(b.date) || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot))
    .map((meal) => {
      const result = allocateMeal(batches, meal.components, meal.date < asOf ? asOf : meal.date);
      batches = deduct(batches, result.allocations);
      return { meal, ...result };
    });
}
function deduct(batches: Batch[], allocations: Allocation[]): Batch[] {
  return batches.map((batch) => ({
    ...batch,
    remaining:
      batch.remaining -
      allocations.filter((a) => a.batchId === batch.id).reduce((n, a) => n + a.cubes, 0),
  }));
}
export function consumeMeal(data: CubeData, id: string, date: string): CubeData {
  const meal = data.meals.find((entry) => entry.id === id);
  if (!meal || meal.eatenAt) throw new Error('This meal has already been eaten or removed.');
  if (meal.date > date) throw new Error('You can mark this meal eaten on its planned day.');
  const { allocations, missing } = allocateMeal(data.batches, meal.components, date);
  if (missing.length)
    throw new Error(
      `Not enough usable stock: ${missing.map((c) => `${c.servings} serving(s) of ${recipeById(c.recipeId).name}`).join(', ')}. Log a batch or edit the meal first.`,
    );
  return {
    ...data,
    batches: deduct(data.batches, allocations),
    meals: data.meals.map((entry) =>
      entry.id === id ? { ...entry, eatenAt: date, allocations } : entry,
    ),
  };
}
export function undoMeal(data: CubeData, id: string): CubeData {
  const meal = data.meals.find((entry) => entry.id === id);
  if (!meal?.eatenAt) return data;
  const batches = data.batches.map((batch) => ({
    ...batch,
    remaining:
      batch.remaining +
      (meal.allocations ?? [])
        .filter((a) => a.batchId === batch.id)
        .reduce((n, a) => n + a.cubes, 0),
  }));
  if (batches.some((batch) => batch.remaining > batch.total))
    throw new Error('Stock was changed after this meal. Adjust the batch before undoing.');
  return {
    ...data,
    batches,
    meals: data.meals.map((entry) =>
      entry.id === id
        ? { id: entry.id, date: entry.date, slot: entry.slot, components: entry.components }
        : entry,
    ),
  };
}
export function cookingNeeds(data: CubeData, month: string) {
  const counts = new Map<string, number>();
  for (const entry of projectPlan(data).filter((entry) => entry.meal.date.startsWith(month))) {
    for (const missing of entry.missing)
      counts.set(missing.recipeId, (counts.get(missing.recipeId) ?? 0) + missing.servings);
  }
  return [...counts].map(([recipeId, servings]) => ({
    recipe: recipeById(recipeId),
    servings,
    batches: Math.ceil(servings / recipeById(recipeId).portions),
  }));
}
export interface Palette {
  protein: string[];
  starch: string[];
  veg: string[];
  breakfast: string[];
  snack: string[];
}
export function generateMonth(
  data: CubeData,
  month: string,
  start: string,
  settings: Settings,
  palette: Palette,
): CubeData {
  if (!settings.slots.length) throw new Error('Choose at least one meal each day.');
  const hasMains = settings.slots.some((slot) => slot === 'lunch' || slot === 'dinner');
  if (
    (hasMains && (!palette.protein.length || !palette.starch.length || !palette.veg.length)) ||
    (settings.slots.includes('breakfast') && !palette.breakfast.length) ||
    (settings.slots.includes('snacks') && !palette.snack.length)
  )
    throw new Error('Choose at least one recipe for each included component.');
  const meals = [...data.meals];
  const pick = (ids: string[], index: number, servings: number): Component => ({
    recipeId: ids[index % ids.length]!,
    servings,
  });
  daysInMonth(month)
    .filter((date) => date >= start)
    .forEach((date, day) => {
      settings.slots.forEach((slot) => {
        if (meals.some((meal) => meal.date === date && meal.slot === slot)) return;
        const index = day * 2 + (slot === 'dinner' ? 1 : 0);
        const components =
          slot === 'breakfast'
            ? [pick(palette.breakfast, day, settings.people)]
            : slot === 'snacks'
              ? [pick(palette.snack, day, settings.people * settings.snackServings)]
              : [
                  pick(palette.protein, index, settings.people),
                  pick(palette.starch, day + (slot === 'dinner' ? 1 : 0), settings.people),
                  pick(palette.veg, day + (slot === 'dinner' ? 1 : 0), settings.people),
                ];
        meals.push({ id: crypto.randomUUID(), date, slot, components });
      });
    });
  return { ...data, settings, meals };
}
