import imported from '../data/recipes.json';
import type { Recipe } from './types';

export const RECIPES: Recipe[] = imported;
export const RECIPE_MAP = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));
export const recipeById = (id: string): Recipe => {
  const recipe = RECIPE_MAP.get(id);
  if (!recipe) throw new Error(`Recipe not found: ${id}`);
  return recipe;
};
export const ROLE_NAMES: Record<string, string> = {
  protein: 'Protein',
  starch: 'Starch',
  veg: 'Vegetables',
  'full-meal': 'Full meal',
  breakfast: 'Breakfast',
  snack: 'Snack',
  soup: 'Soup',
  side: 'Side',
  basic: 'Basics',
};
export const FEATURED = [
  'chicken-chicken-karahi',
  'beef-beef-goulash',
  'veg-ratatouille',
  'starches-lime-coriander-rice',
];
