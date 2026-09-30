import { validDate } from '../domain/dates';
import { RECIPE_MAP } from '../domain/recipes';
import { SLOTS, type CubeData } from '../domain/types';

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown, min = 1, max = 100000): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 5000;
const id = (value: unknown): value is string =>
  text(value) && value.length > 0 && value.length <= 200;
const recipeId = (value: unknown): value is string =>
  typeof value === 'string' && RECIPE_MAP.has(value);
const slot = (value: unknown) => SLOTS.includes(value as (typeof SLOTS)[number]);

export function parseData(value: unknown): CubeData | null {
  if (
    !object(value) ||
    value.version !== 1 ||
    !Array.isArray(value.batches) ||
    !Array.isArray(value.meals) ||
    !Array.isArray(value.favorites) ||
    !object(value.settings)
  )
    return null;
  const settings = value.settings;
  if (
    !integer(settings.people, 1, 20) ||
    !integer(settings.snackServings, 1, 10) ||
    !Array.isArray(settings.slots) ||
    !settings.slots.length ||
    !settings.slots.every(slot) ||
    new Set(settings.slots).size !== settings.slots.length
  )
    return null;
  if (!value.favorites.every(recipeId)) return null;
  if (
    !value.batches.every(
      (b: unknown) =>
        object(b) &&
        id(b.id) &&
        recipeId(b.recipeId) &&
        integer(b.total) &&
        integer(b.remaining, 0) &&
        b.remaining <= b.total &&
        integer(b.cubesPerServing, 1, 100) &&
        integer(b.mouldMl, 1, 2000) &&
        validDate(b.frozenOn) &&
        validDate(b.useBy) &&
        b.useBy >= b.frozenOn &&
        text(b.location) &&
        text(b.notes),
    )
  )
    return null;
  if (
    !value.meals.every(
      (m: unknown) =>
        object(m) &&
        id(m.id) &&
        validDate(m.date) &&
        slot(m.slot) &&
        Array.isArray(m.components) &&
        m.components.length > 0 &&
        m.components.length <= 20 &&
        m.components.every(
          (c: unknown) => object(c) && recipeId(c.recipeId) && integer(c.servings, 1, 200),
        ) &&
        (m.eatenAt === undefined
          ? m.allocations === undefined
          : validDate(m.eatenAt) &&
            m.eatenAt >= m.date &&
            Array.isArray(m.allocations) &&
            m.allocations.length > 0 &&
            m.allocations.every((a: unknown) => object(a) && id(a.batchId) && integer(a.cubes))),
    )
  )
    return null;
  const data = value as unknown as CubeData;
  if (
    new Set(data.batches.map((b) => b.id)).size !== data.batches.length ||
    new Set(data.meals.map((m) => m.id)).size !== data.meals.length ||
    new Set(data.meals.map((m) => `${m.date}-${m.slot}`)).size !== data.meals.length
  )
    return null;
  const used = new Map<string, number>();
  for (const meal of data.meals) {
    for (const allocation of meal.allocations ?? []) {
      const batch = data.batches.find((b) => b.id === allocation.batchId);
      if (!batch || !meal.components.some((c) => c.recipeId === batch.recipeId)) return null;
      used.set(batch.id, (used.get(batch.id) ?? 0) + allocation.cubes);
    }
  }
  if (data.batches.some((b) => b.remaining + (used.get(b.id) ?? 0) > b.total)) return null;
  return structuredClone(data);
}
