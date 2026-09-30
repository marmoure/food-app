export type Slot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
export const SLOTS: Slot[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
export const SLOT_NAMES: Record<Slot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export interface Recipe {
  id: string;
  name: string;
  label: string;
  category: string;
  slot: string;
  portions: number;
  portion: string;
  kcal: number;
  protein: number;
  mouldMl: number;
  cuisine: string;
  cooker: string;
  bestWith: string;
  image: string;
  source: string;
  sourceUrl: string;
  photoTitle: string;
  videos: { title: string; url: string }[];
  sections: { title: string; content: string }[];
}
export interface Batch {
  id: string;
  recipeId: string;
  total: number;
  remaining: number;
  cubesPerServing: number;
  mouldMl: number;
  frozenOn: string;
  useBy: string;
  location: string;
  notes: string;
}
export interface Component {
  recipeId: string;
  servings: number;
}
export interface Allocation {
  batchId: string;
  cubes: number;
}
export interface Meal {
  id: string;
  date: string;
  slot: Slot;
  components: Component[];
  eatenAt?: string;
  allocations?: Allocation[];
}
export interface Settings {
  people: number;
  slots: Slot[];
  snackServings: number;
}
export interface CubeData {
  version: 1;
  batches: Batch[];
  meals: Meal[];
  favorites: string[];
  settings: Settings;
}
export function emptyData(): CubeData {
  return {
    version: 1,
    batches: [],
    meals: [],
    favorites: [],
    settings: { people: 1, slots: [...SLOTS], snackServings: 2 },
  };
}
