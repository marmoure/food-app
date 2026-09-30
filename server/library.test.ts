// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RECIPES } from '../src/domain/recipes';

describe('frozen-goods import', () => {
  it('includes the complete active cube collection with distinct stable IDs', () => {
    expect(RECIPES).toHaveLength(294);
    expect(new Set(RECIPES.map((recipe) => recipe.id)).size).toBe(294);
    for (const recipe of RECIPES) {
      expect(recipe.portions).toBeGreaterThan(0);
      expect(recipe.mouldMl).toBeGreaterThan(0);
      expect(recipe.sections.some((section) => section.title.startsWith('Ingredients'))).toBe(true);
      expect(recipe.sections.some((section) => section.title === 'Method')).toBe(true);
      expect(
        recipe.sections.some((section) => section.title === 'Freeze' && section.content.length > 0),
      ).toBe(true);
      expect(
        recipe.sections.some((section) => section.title === 'Reheat' && section.content.length > 0),
      ).toBe(true);
      expect(existsSync(`public${recipe.image}`)).toBe(true);
      expect(readFileSync(`public/library/recipes/${recipe.source}`, 'utf8')).toContain(
        'freezer_format: cubes',
      );
    }
  });
});
