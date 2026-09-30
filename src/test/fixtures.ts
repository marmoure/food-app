import { emptyData, type Batch, type CubeData, type Meal } from '../domain/types';

export const PROTEIN = 'chicken-chicken-karahi';
export const STARCH = 'starches-lime-coriander-rice';
export const VEG = 'veg-ratatouille';
export function batch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 'batch-1',
    recipeId: PROTEIN,
    total: 14,
    remaining: 14,
    cubesPerServing: 2,
    mouldMl: 250,
    frozenOn: '2027-01-01',
    useBy: '2027-02-01',
    location: 'Top drawer',
    notes: '',
    ...overrides,
  };
}
export function meal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: 'meal-1',
    date: '2027-01-10',
    slot: 'lunch',
    components: [{ recipeId: PROTEIN, servings: 1 }],
    ...overrides,
  };
}
export function stocked(overrides: Partial<CubeData> = {}): CubeData {
  return { ...emptyData(), batches: [batch()], meals: [meal()], ...overrides };
}
