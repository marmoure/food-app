import { describe, expect, it } from 'vitest';
import { RECIPES } from './recipes';
import { SERVE_GUIDES } from './serving';
import { ROTATION } from './rotation';
import { SETUP_ITEM_IDS } from './setup';
import { RECIPE_IDS } from './types';

describe('recipe data', () => {
  it('has one recipe per id, keyed by its own id', () => {
    expect(Object.keys(RECIPES).sort()).toEqual([...RECIPE_IDS].sort());
    for (const [key, r] of Object.entries(RECIPES)) expect(r.id).toBe(key);
  });

  it('gives every recipe ingredients and steps', () => {
    for (const r of Object.values(RECIPES)) {
      expect(r.ingredients.length, r.id).toBeGreaterThan(0);
      expect(r.steps.length, r.id).toBeGreaterThan(0);
    }
  });

  it('links the main ingredients of every recipe to nutrition data', () => {
    for (const r of Object.values(RECIPES)) {
      if (r.id === 'rice') continue; // amounts live on the dishes it's served with
      expect(
        r.ingredients.some((i) => i.amount),
        r.id,
      ).toBe(true);
    }
  });

  it('only sends vegetables through the cutter that the recipe lists', () => {
    for (const r of Object.values(RECIPES)) {
      for (const job of r.cutter ?? []) {
        const listed = r.ingredients.some((i) => /cutter/.test(i.item));
        expect(listed, `${r.id}: ${job.what}`).toBe(true);
      }
    }
  });

  it('gives every oven recipe a temperature', () => {
    for (const r of Object.values(RECIPES)) {
      if (r.appliance === 'oven') expect(r.temp, r.id).toBeTruthy();
    }
  });

  // House rules from CLAUDE.md: no vinegar, nothing spicy, halal.
  it('never calls for vinegar, hot spices or pork', () => {
    const banned =
      /vinegar|vinaigre|harissa|chil[li]|piment|cayenne|hot sauce|pork|ham\b|bacon|lard|wine/i;
    for (const r of Object.values(RECIPES)) {
      for (const i of r.ingredients) expect(i.item, `${r.id}: ${i.item}`).not.toMatch(banned);
    }
  });

  it('never uses raw onion or garlic as a finishing ingredient', () => {
    for (const r of Object.values(RECIPES)) {
      for (const i of r.ingredients) {
        if (/onion|garlic/i.test(i.item) && !/\bno garlic\b/i.test(i.item)) {
          expect(
            i.item,
            `${r.id}: onion/garlic must be grated or chopped into the cooking`,
          ).toMatch(/grated|chopped/i);
        }
      }
    }
  });
});

describe('serving guides', () => {
  const banned =
    /vinegar|vinaigre|harissa|chil[li]|piment|cayenne|hot sauce|pork|ham\b|bacon|lard|wine/i;

  it('covers every dish on the weekly plan', () => {
    for (const w of ROTATION) {
      for (const id of [w.stew, w.pot, w.tray, w.breakfast]) {
        expect(SERVE_GUIDES[id], id).toBeDefined();
      }
    }
  });

  it('gives every counted plate side an amount', () => {
    for (const [id, g] of Object.entries(SERVE_GUIDES)) {
      for (const side of g.plate) expect(side.amounts?.length, `${id}: ${side.name}`).toBeTruthy();
    }
  });

  it('explains thawing for every stew and soup, since those get frozen', () => {
    for (const r of Object.values(RECIPES)) {
      if (r.kind === 'stew' || r.kind === 'pot')
        expect(SERVE_GUIDES[r.id]?.thaw, r.id).toBeTruthy();
    }
  });

  it('never suggests vinegary or spicy sides', () => {
    for (const [id, g] of Object.entries(SERVE_GUIDES)) {
      for (const side of [...g.plate, ...g.sides]) {
        expect(`${side.name} ${side.note ?? ''}`, id).not.toMatch(banned);
      }
    }
  });
});

describe('rotation data', () => {
  it('uses recipes of the right kind in each slot', () => {
    ROTATION.forEach((w, i) => {
      const week = i + 1;
      expect(RECIPES[w.stew]).toMatchObject({ kind: 'stew', week });
      expect(RECIPES[w.pot]).toMatchObject({ kind: 'pot', week });
      expect(RECIPES[w.tray]).toMatchObject({ kind: 'tray', week });
      expect(RECIPES[w.breakfast].kind).toBe('breakfast');
      if (w.snack) expect(RECIPES[w.snack].kind).toBe('snack');
      expect(w.carb === null).toBe(w.carbFor === null);
    });
  });

  it('has a non-empty shopping list with unique item names per section', () => {
    for (const w of ROTATION) {
      expect(w.shopping.length).toBeGreaterThan(0);
      for (const sec of w.shopping) {
        const names = sec.items.map((i) => i.name);
        expect(new Set(names).size, sec.title).toBe(names.length);
      }
    }
  });

  it('has unique setup ids (they are persisted)', () => {
    expect(new Set(SETUP_ITEM_IDS).size).toBe(SETUP_ITEM_IDS.length);
  });
});
