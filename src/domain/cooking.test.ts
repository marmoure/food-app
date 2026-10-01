import { describe, expect, it } from 'vitest';
import { cookingSteps, ingredientRows } from './cooking';
import { RECIPES } from './recipes';

describe('cooking instructions', () => {
  it('preserves every method instruction and note in the imported library', () => {
    const normalize = (text: string) =>
      text
        .replace(/^\d+\.\s/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
    for (const recipe of RECIPES) {
      const method = recipe.sections.find((section) => section.title === 'Method')!.content;
      const steps = cookingSteps(method);
      expect(steps.length, recipe.id).toBeGreaterThan(0);
      expect(normalize(steps.join('\n')), recipe.id).toBe(normalize(method));
    }
  });
  it('keeps pressure-cooker guidance before the numbered steps and packing notes after', () => {
    expect(
      cookingSteps('Read the pressure guide.\n\n1. Chop.\n2. Cook.\n\nPack into cubes.'),
    ).toEqual(['Read the pressure guide.', 'Chop.', 'Cook.', 'Pack into cubes.']);
  });
  it('keeps ingredient quantities and preparation, falling back for unfamiliar formats', () => {
    expect(
      ingredientRows('| Ingredient | Amount | Prep |\n|---|---|---|\n| Onion | 1 | diced |'),
    ).toEqual([{ name: 'Onion', amount: '1', prep: 'diced' }]);
    expect(ingredientRows('1 onion, diced')).toBeNull();
    expect(ingredientRows('| Ingredient | Amount |\n|---|---|\n| Onion | 1 |')).toBeNull();
  });
});
