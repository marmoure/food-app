import { UNIT_GRAMS } from './nutrition/foods';
import type { RecipeId, ServeGuide, Side } from './types';

// Shared sides. `amounts` is one serving, counted in the day's numbers when the side is on the plate.
const BREAD: Side = {
  name: 'Whole-wheat bread or a kesra wedge',
  note: '50 g, about the size of your palm. Toast it from frozen.',
  recipeId: 'kesra',
  amounts: [{ food: 'bread-ww', grams: UNIT_GRAMS.breadWedge }],
};
const SALAD: Side = {
  name: 'Cucumber & tomato salad',
  note: 'half a cucumber, a tomato, 1 tsp olive oil, pinch of salt. Nothing else.',
  amounts: [
    { food: 'cucumber', grams: 120 },
    { food: 'tomato', grams: 120 },
    { food: 'olive-oil', grams: 4 },
  ],
};
const CRUNCH: Side = {
  name: 'Lettuce & cucumber',
  note: 'no dressing needed with a saucy dish; shred the lettuce on the cutter',
  amounts: [
    { food: 'lettuce', grams: 60 },
    { food: 'cucumber', grams: 120 },
  ],
};
const SLAW: Side = {
  name: 'Yogurt cabbage slaw',
  note: 'cabbage and carrot shredded on the cutter, mixed with yogurt, salt and mint. Keeps 3 days.',
  amounts: [
    { food: 'cabbage', grams: 100 },
    { food: 'carrot', grams: 50 },
    { food: 'yogurt', grams: 50 },
  ],
};
const LBEN: Side = {
  name: 'A glass of lben',
  note: '250 ml. The classic drink with couscous, and 8 g of protein',
  amounts: [{ food: 'lben', grams: 250 }],
};
const YOGURT_MINT: Side = {
  name: 'Yogurt-mint sauce',
  note: 'half a pot of plain yogurt, pinch of salt, ½ tsp dried mint. No garlic.',
  amounts: [{ food: 'yogurt', grams: 60 }],
};
const YOGURT_SPOON: Side = {
  name: 'A spoon of yogurt on top',
  amounts: [{ food: 'yogurt', grams: 40 }],
};
const BOILED_EGG: Side = {
  name: 'A boiled egg',
  note: 'turns a soup into a full meal',
  recipeId: 'eggs',
  amounts: [{ food: 'egg', grams: UNIT_GRAMS.egg }],
};
const HALF_BANANA: Side = {
  name: 'Half a banana',
  amounts: [{ food: 'banana', grams: 60 }],
};
const FRUIT: Side = {
  name: 'A piece of fruit',
  amounts: [{ food: 'fruit', grams: UNIT_GRAMS.fruit }],
};
const AIR_FRIED_WEDGES: Side = {
  name: 'Air-fried potato wedges',
  note: '1 potato, 1 tsp oil, salt, sweet paprika: 200°C for 18 min, shake halfway. The everyday version of frites.',
};
const STEAMED_VEG: Side = {
  name: 'Air-fried green beans or carrot slices',
  note: 'air fryer 190°C for 10 min with 1 tsp oil',
};
const OLIVES: Side = { name: 'A few olives' };
const VEG_STICKS: Side = {
  name: 'Cucumber & carrot sticks',
  note: 'the big slicer makes quick work of them',
  amounts: [
    { food: 'cucumber', grams: 100 },
    { food: 'carrot', grams: 80 },
  ],
};
const TEA: Side = { name: 'Tea or coffee', note: 'after eating, not before' };

/**
 * Freezer to plate for stews and soups. Thawing in the fridge keeps the texture;
 * reheating from frozen is the fallback for nights you forgot.
 */
function thaw(nextDay: string): string {
  return `Night before: move it from the freezer to the fridge (the Wednesday and Thursday alarms cover this). Next day: ${nextDay} Forgot? Microwave on defrost for 5 minutes, stir, then 2–3 minutes on high until it's steaming in the middle. Never thaw on the counter, and don't refreeze once thawed.`;
}

export const SERVE_GUIDES: Partial<Record<RecipeId, ServeGuide>> = {
  loubia: {
    howToEat:
      'The Algerian way: a deep bowl, with bread to tear and dip. The beans are already a carb, so one palm-sized piece of bread is the whole bread ration. The salad adds crunch and vegetables.',
    plate: [BREAD, SALAD],
    sides: [SLAW, OLIVES],
    thaw: thaw(
      'add 2–3 tbsp water (the beans soak up the sauce), cover, microwave 3 min and stir halfway.',
    ),
  },
  bolognese: {
    howToEat:
      "A big bowl of pasta with the sauce stirred through. The sauce is half vegetables and lentils, so it's filling without a huge amount of pasta. A crunchy side balances the soft texture.",
    plate: [CRUNCH],
    sides: [SLAW, { name: 'A little grated cheese on top', note: '1 tbsp, not a handful' }],
    thaw: thaw(
      'add a splash of water, lid ajar, microwave 3 min and stir. Pasta frozen with the sauce reheats fine because it was cooked slightly firm.',
    ),
  },
  'paprika-tray': {
    howToEat:
      'A full plate on its own: chicken, potatoes and vegetables. No bread needed. Crisp it in the air fryer instead of the microwave when you have 6 extra minutes. It makes a big difference.',
    plate: [YOGURT_MINT, CRUNCH],
    sides: [SLAW],
  },
  'tajine-chickpea': {
    howToEat:
      'On whole-wheat couscous, packed in the same container, with a glass of lben as they do at home. Chickpeas plus couscous are enough carbs, so no bread with this one.',
    plate: [LBEN],
    sides: [SALAD, SLAW],
    thaw: thaw(
      'sprinkle 1 tbsp water over the couscous, lid ajar, microwave 3 min. The couscous thaws fine with the tajine.',
    ),
  },
  'lentil-soup': {
    howToEat:
      'A big bowl with a pinch of cumin on top. Lentils are filling but a bit low in protein on their own, so the egg and the glass of lben are part of the meal, not optional.',
    plate: [BOILED_EGG, BREAD, LBEN],
    sides: [YOGURT_SPOON, { name: 'A cheese portion', note: 'instead of the egg' }],
    thaw: thaw(
      'add a splash of water and stir well, because blended soups separate a little when frozen.',
    ),
  },
  'kefta-tray': {
    howToEat:
      'On a plate with the potatoes, peppers and yogurt-cucumber sauce, or as a wrap: 3 kefta, a few potato slices and sauce rolled in a warm kesra wedge (count the wedge as your bread).',
    plate: [SALAD],
    sides: [BREAD],
  },
  jelbana: {
    howToEat:
      'A bowl with bread, like loubia. Peas are starchy, so one piece of bread is plenty. Rice instead of bread works too. Pick one, not both.',
    plate: [BREAD, SALAD],
    sides: [SLAW, { name: 'Rice instead of the bread', note: '50 g dry per portion' }],
    thaw: thaw('microwave 3 min with 1 tbsp water, stirring halfway so the peas heat evenly.'),
  },
  'chorba-beida': {
    howToEat:
      'A soup bowl with parsley on top. Gentle on the stomach, so it suits heartburn days or late dinners after the side hustle.',
    plate: [BREAD],
    sides: [BOILED_EGG, SLAW],
    thaw: thaw(
      'the vermicelli will have drunk the broth. Add a good splash of water (up to ¼ of the bowl), then microwave 3 min.',
    ),
  },
  'yogurt-tray': {
    howToEat:
      'As a rice plate with the vegetables and yogurt-mint sauce, or as a mild shawarma-style wrap: skip the rice and roll it in a warm kesra wedge with sauce and cucumber.',
    plate: [YOGURT_MINT, CRUNCH],
    sides: [SLAW],
  },
  zitoune: {
    howToEat:
      'Over rice, packed in the same container, with the sauce and olives on top. In Algeria it often comes with frites. Use the air fryer version instead of the rice when you want a treat.',
    plate: [SALAD],
    sides: [AIR_FRIED_WEDGES, SLAW],
    thaw: thaw('1 tbsp water over the rice, lid ajar, microwave 3 min.'),
  },
  gratin: {
    howToEat:
      "It's the richest dish in the rotation (pasta, béchamel, cheese), so it's the whole meal. Put something fresh and crunchy next to it rather than bread.",
    plate: [CRUNCH],
    sides: [STEAMED_VEG, SLAW],
    thaw: thaw(
      'cover and add a splash of milk, then microwave 3 min. Straight from frozen: oven at 180°C for 30 min covered with foil, then 5 min uncovered.',
    ),
  },
  'herb-tray': {
    howToEat:
      'A complete plate: drumsticks, sweet potato and green beans. Eat the drumsticks with your hands, nobody is watching.',
    plate: [YOGURT_MINT],
    sides: [CRUNCH, SLAW],
  },
  oats: {
    howToEat:
      'Straight from the jar at your desk. Top it in the morning so the fruit stays fresh. Hungry by 11? Add a boiled egg on the side rather than more oats.',
    plate: [HALF_BANANA],
    sides: [BOILED_EGG, { name: 'Tea or coffee', note: 'after eating, not before' }],
  },
  muffins: {
    howToEat:
      "Two muffins with a piece of bread and a piece of fruit. It's a savoury, high-protein breakfast that keeps you full until lunch.",
    plate: [BREAD, FRUIT],
    sides: [{ name: 'Tea or coffee', note: 'after eating, not before' }],
    thaw: 'Night before: move 2 to the fridge. Morning: microwave 30–45 s, or air fryer 170°C for 4 min. Straight from frozen: microwave 90 s, or air fryer 170°C for 8 min.',
  },
  'energy-balls': {
    howToEat:
      "One with tea or coffee in the afternoon, next to a yogurt. They're sweet from the dates, so they replace biscuits rather than adding to them.",
    plate: [],
    sides: [{ name: 'Tea or coffee' }],
  },
  kesra: {
    howToEat:
      "One wedge per meal is a portion. Warm is best: toast frozen wedges in the air fryer or a dry pan. On the weekend it's great with eggs, olive oil or cheese.",
    plate: [],
    sides: [{ name: 'Eggs or cheese' }, { name: 'A drizzle of olive oil' }],
  },

  // Extras (not in the rotation yet) ----------------------------------------
  goulash: {
    howToEat:
      'A deep bowl, pasta underneath and goulash on top, with a spoon of yogurt stirred in (the Hungarian way uses sour cream). The pasta is the carb, so no bread.',
    plate: [YOGURT_SPOON, SALAD],
    sides: [CRUNCH, SLAW],
    thaw: thaw('add 1 tbsp water over the pasta, lid ajar, microwave 3 min and stir halfway.'),
  },
  'chicken-curry': {
    howToEat:
      "Over rice, packed in the same container. It's mild and creamy from the yogurt and almonds. Something crunchy on the side stops it feeling heavy.",
    plate: [CRUNCH],
    sides: [
      YOGURT_MINT,
      { name: 'Bulgur instead of the rice', note: 'more fibre', recipeId: 'bulgur' },
    ],
    thaw: thaw(
      'sprinkle 1 tbsp water over the rice, lid ajar, microwave 3 min. If the sauce looks split, a good stir brings it back.',
    ),
  },
  'chicken-barley': {
    howToEat:
      'A big bowl, like a thick soup. The barley is the carb and very filling, so bread is optional.',
    plate: [YOGURT_SPOON, SALAD],
    sides: [BREAD, SLAW],
    thaw: thaw('add 2–3 tbsp water (the barley soaks up the sauce), cover, microwave 3 min.'),
  },
  'beef-bean-stew': {
    howToEat:
      'A bowl with a spoon of yogurt on top and something crunchy on the side. The beans and corn are already the carb, so bread is optional.',
    plate: [YOGURT_SPOON, CRUNCH],
    sides: [BREAD, { name: 'Rice instead of the bread', note: '50 g dry per portion' }],
    thaw: thaw('microwave 3 min with 1 tbsp water, stirring halfway.'),
  },
  'split-pea-soup': {
    howToEat:
      "A big bowl with bread. Split peas are very high in fibre and the chicken makes it a full meal, so nothing else is needed. It's gentle on the stomach.",
    plate: [BREAD],
    sides: [YOGURT_SPOON, CRUNCH],
    thaw: thaw('it will be very thick. Add a good splash of water, microwave 3 min and stir well.'),
  },
  'shepherds-pie': {
    howToEat:
      'A square on a plate with something fresh and crunchy next to it. The mash is the carb, so no bread.',
    plate: [CRUNCH],
    sides: [STEAMED_VEG, SLAW],
    thaw: thaw(
      'cover and microwave 3 min. Straight from frozen: oven 180°C for 30 min covered with foil, then 5 min uncovered.',
    ),
  },
  minestrone: {
    howToEat:
      'A soup bowl with bread on the side. Pasta, beans and chicken are all in it, so a small piece of bread is enough.',
    plate: [BREAD],
    sides: [{ name: 'A little grated cheese on top', note: '1 tbsp, not a handful' }, BOILED_EGG],
    thaw: thaw('add a good splash of water (the pasta drinks the broth), then microwave 3 min.'),
  },
  moussaka: {
    howToEat:
      "A square on a plate, with something crunchy next to it. It's rich, so it's the whole meal.",
    plate: [CRUNCH],
    sides: [SLAW],
    thaw: thaw(
      'cover and microwave 3 min. Straight from frozen: oven 180°C for 30 min covered with foil.',
    ),
  },
  'fish-tray': {
    howToEat:
      "Fish, potatoes and vegetables with the yogurt-mint sauce. It's the lightest tray bake, so eat it first: Sunday dinner and Monday lunch.",
    plate: [YOGURT_MINT, SALAD],
    sides: [SLAW],
  },
  'turkey-tray': {
    howToEat:
      'A full plate: turkey, roast vegetables and chickpeas, with the yogurt sauce. Or roll it in a warm kesra wedge with the sauce.',
    plate: [YOGURT_MINT, CRUNCH],
    sides: [BREAD, SLAW],
  },
  'fajita-tray': {
    howToEat:
      'Two wraps: warm filling, yogurt sauce (it stands in for sour cream) and shredded lettuce and cucumber. Roll them at the table, not in advance, so they stay soft.',
    plate: [YOGURT_MINT, CRUNCH],
    sides: [SLAW],
  },
  'stuffed-peppers': {
    howToEat:
      'Two peppers with the sauce from the dish and yogurt-mint on the side. The rice is inside, so no bread needed.',
    plate: [YOGURT_MINT],
    sides: [BREAD, CRUNCH],
  },
  'baked-oats': {
    howToEat:
      'A square with a spoon of yogurt, at your desk. Cold is fine; warm is nicer in winter.',
    plate: [YOGURT_SPOON],
    sides: [BOILED_EGG, TEA],
    thaw: 'Night before: move a square to the fridge. Morning: microwave 40 s. Straight from frozen: microwave 90 s.',
  },
  pancakes: {
    howToEat:
      "Three pancakes. They're sweet from the banana, so no syrup needed. A little honey if you really want it.",
    plate: [],
    sides: [{ name: 'A teaspoon of honey' }, TEA],
    thaw: 'Straight from frozen: air fryer 170°C for 5 min, or microwave 60 s.',
  },
  'chia-jars': {
    howToEat: 'Straight from the jar, topped with a chopped piece of fruit in the morning.',
    plate: [FRUIT],
    sides: [TEA],
  },
  'breakfast-wraps': {
    howToEat:
      "One wrap and a piece of fruit. It's a savoury, high-protein breakfast you can eat with one hand at your desk.",
    plate: [FRUIT],
    sides: [TEA],
    thaw: 'Night before: move one to the fridge. Morning: air fryer 180°C for 4 min. Straight from frozen: microwave 90 s or air fryer 180°C for 8 min.',
  },
  hummus: {
    howToEat: 'Three spoons with vegetable sticks, mid-afternoon.',
    plate: [VEG_STICKS],
    sides: [BREAD, BOILED_EGG],
  },
  'roasted-chickpeas': {
    howToEat: 'A handful from the jar when you want something crunchy and salty.',
    plate: [],
    sides: [{ name: 'A glass of lben' }],
  },
  'tuna-dip': {
    howToEat: 'With vegetable sticks, or on a slice of bread as a small meal.',
    plate: [VEG_STICKS],
    sides: [BREAD],
  },
  bulgur: {
    howToEat:
      'Use it anywhere the plan says rice: 50 g dry per portion, packed in the same container as the stew.',
    plate: [],
    sides: [],
  },
};

export function serveGuide(id: RecipeId): ServeGuide | undefined {
  return SERVE_GUIDES[id];
}
