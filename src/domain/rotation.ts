import { type FoodAmount, UNIT_GRAMS } from './nutrition/foods';
import type { RecipeId, Rotation, RotationWeek, ShoppingItem } from './types';

/*
 * Shopping lists cover Mon–Fri plus the weekend: the three batches, breakfasts, snacks,
 * the counted sides on each plate (bread, salad, yogurt sauce, lben) and weekend breakfasts.
 */

const dairy = (items: readonly ShoppingItem[]) => ({
  title: 'Dairy & eggs',
  items: [
    ...items,
    { name: 'Cheese portions', detail: '1 box of 8 (lasts two weeks)' },
    { name: 'Lben', detail: '1 L · snacks' },
  ],
});

export const ROTATION: readonly [RotationWeek, RotationWeek, RotationWeek, RotationWeek] = [
  {
    stew: 'loubia',
    pot: 'bolognese',
    tray: 'paprika-tray',
    breakfast: 'oats',
    snack: 'energy-balls',
    carb: null,
    carbFor: null,
    carbNote:
      'The whole-wheat pasta is cooked with the bolognese. For the loubia: pain complet if the bakery has it, or homemade kesra. Freeze it sliced and toast from frozen.',
    saturdayNote: 'Soak the 400 g white beans in a big bowl of water tonight.',
    shopping: [
      {
        title: 'Butcher',
        items: [
          { name: 'Lean beef chunks (épaule)', detail: '600 g · loubia' },
          { name: 'Lean beef mince', detail: '600 g · bolognese' },
          { name: 'Chicken legs, skin removed', detail: '1.2 kg (4 pieces) · tray' },
        ],
      },
      {
        title: 'Vegetables',
        items: [
          { name: 'Carrots', detail: '1 kg' },
          { name: 'Potatoes', detail: '600 g' },
          { name: 'Zucchini', detail: '3' },
          { name: 'Mushrooms', detail: '200 g' },
          { name: 'Sweet pepper (not hot)', detail: '1' },
          { name: 'Onions', detail: '2' },
          { name: 'Cucumbers', detail: '6 · salads and snacks' },
          { name: 'Tomatoes', detail: '3 · salads' },
          { name: 'Lettuce', detail: '1 large' },
          { name: 'Parsley', detail: '1 bunch' },
        ],
      },
      {
        title: 'Fruit',
        items: [
          { name: 'Bananas', detail: '3 · half a banana on each oats jar' },
          { name: 'Apples, oranges or seasonal fruit', detail: '6 · snacks and weekend' },
        ],
      },
      dairy([
        { name: 'Semi-skimmed milk', detail: '1 L · oats' },
        { name: 'Plain yogurt', detail: '6 pots' },
        { name: 'Eggs', detail: '12 · 6 boiled + weekend' },
      ]),
      {
        title: 'Grocery',
        items: [
          { name: 'Sardines in olive oil', detail: '1 tin · Sunday lunch' },
          { name: 'Dried white beans (loubia)', detail: '400 g · soak tonight' },
          { name: 'Red lentils', detail: '500 g bag (200 g this week)' },
          { name: 'Tomato passata', detail: '1 bottle, 500 g' },
          { name: 'Whole-wheat pasta', detail: '500 g' },
          { name: 'Rolled oats', detail: '500 g' },
          { name: 'Dates (deglet nour)', detail: '500 g' },
          { name: 'Peanut butter or tahini', detail: '1 small jar' },
          { name: 'Almonds, walnuts or peanuts', detail: '200 g' },
        ],
      },
      {
        title: 'Bakery',
        items: [
          { name: 'Pain complet or pain au son', detail: '1 loaf, ~400 g · slice and freeze' },
        ],
      },
    ],
  },
  {
    stew: 'tajine-chickpea',
    pot: 'lentil-soup',
    tray: 'kefta-tray',
    breakfast: 'muffins',
    snack: null,
    carb: 'couscous',
    carbFor: 'stew',
    carbNote: 'Whole-wheat couscous (240 g) for the tajine. 7 minutes with a kettle, no cooking.',
    saturdayNote: 'Using dried chickpeas? Soak 150 g in water tonight.',
    shopping: [
      {
        title: 'Butcher',
        items: [
          { name: 'Chicken legs, skin removed', detail: '1.2 kg (6 small pieces) · tajine' },
          { name: 'Lean beef mince', detail: '600 g · kefta' },
        ],
      },
      {
        title: 'Vegetables',
        items: [
          { name: 'Carrots', detail: '800 g' },
          { name: 'Potatoes', detail: '1 kg' },
          { name: 'Zucchini', detail: '4' },
          { name: 'Sweet peppers (not hot)', detail: '3' },
          { name: 'Onions', detail: '3' },
          { name: 'Cucumbers', detail: '4 · sauce, salads, snacks' },
          { name: 'Tomatoes', detail: '4 · salads' },
          { name: 'Parsley', detail: '1 bunch' },
          { name: 'Coriander', detail: '1 bunch' },
        ],
      },
      {
        title: 'Fruit',
        items: [
          { name: 'Apples, oranges or seasonal fruit', detail: '10 · breakfasts, snacks, weekend' },
        ],
      },
      dairy([
        { name: 'Eggs', detail: 'a tray of 30 (covers this week and next)' },
        { name: 'Plain yogurt', detail: '6 pots' },
        { name: 'Lben (extra)', detail: '1 L · a glass with each tajine' },
        { name: 'Milk', detail: '½ L · muffins' },
        { name: 'Grated cheese', detail: '40 g' },
        { name: 'Turkey breast slices (blanc de dinde)', detail: '100 g · muffins' },
      ]),
      {
        title: 'Grocery',
        items: [
          { name: 'Sardines in olive oil', detail: '1 tin · Sunday lunch' },
          { name: 'Red lentils', detail: '400 g (top up the Week 1 bag)' },
          { name: 'Whole-wheat couscous (couscous complet)', detail: '500 g' },
          { name: 'Chickpeas', detail: '1 can (or 150 g dried)' },
          { name: 'Chicken stock cubes', detail: '1 box' },
          { name: 'Dates', detail: 'top up · snacks' },
        ],
      },
      {
        title: 'Bakery',
        items: [{ name: 'Pain complet or pain au son', detail: '2 loaves · freeze sliced' }],
      },
    ],
  },
  {
    stew: 'jelbana',
    pot: 'chorba-beida',
    tray: 'yogurt-tray',
    breakfast: 'oats',
    snack: 'energy-balls',
    carb: 'rice',
    carbFor: 'tray',
    carbNote: 'Rice (200 g) for the tray bake. Spread it on a plate so it cools fast.',
    saturdayNote:
      'Using dried chickpeas? Soak 150 g tonight. Optional: marinate the chicken tonight (step 1 of the tray recipe).',
    shopping: [
      {
        title: 'Butcher',
        items: [
          { name: 'Lean beef chunks', detail: '700 g · jelbana' },
          { name: 'Chicken legs, skin removed', detail: '1.4 kg · chorba' },
          { name: 'Boneless skinless chicken thighs', detail: '800 g · tray' },
        ],
      },
      {
        title: 'Vegetables',
        items: [
          { name: 'Carrots', detail: '400 g' },
          { name: 'Sweet peppers (not hot)', detail: '3' },
          { name: 'Zucchini', detail: '3' },
          { name: 'Onions', detail: '2' },
          { name: 'Cucumbers', detail: '5 · salads and snacks' },
          { name: 'Tomatoes', detail: '3' },
          { name: 'Lettuce', detail: '1' },
          { name: 'Coriander', detail: '1 bunch' },
          { name: 'Parsley', detail: '1 bunch' },
        ],
      },
      { title: 'Frozen', items: [{ name: 'Frozen peas (petits pois)', detail: '800 g' }] },
      {
        title: 'Fruit',
        items: [
          { name: 'Bananas', detail: '3' },
          { name: 'Apples, oranges or seasonal fruit', detail: '6 · snacks and weekend' },
        ],
      },
      dairy([
        { name: 'Plain yogurt', detail: '8 pots · 200 g for the marinade' },
        { name: 'Semi-skimmed milk', detail: '1 L · oats' },
        { name: 'Eggs', detail: "what's left of the tray" },
      ]),
      {
        title: 'Grocery',
        items: [
          { name: 'Sardines in olive oil', detail: '1 tin · Sunday lunch' },
          { name: 'Chickpeas', detail: '1 can (or 150 g dried)' },
          { name: "Vermicelli (cheveux d'ange)", detail: '100 g' },
          { name: 'Rice', detail: '1 kg bag (200 g this week)' },
          { name: 'Rolled oats', detail: 'top up to 350 g' },
          { name: 'Dates', detail: '500 g' },
          { name: 'Nuts, peanut butter', detail: 'top up' },
        ],
      },
      {
        title: 'Bakery',
        items: [{ name: 'Pain complet or pain au son', detail: '1 large loaf · freeze sliced' }],
      },
    ],
  },
  {
    stew: 'zitoune',
    pot: 'gratin',
    tray: 'herb-tray',
    breakfast: 'muffins',
    snack: null,
    carb: 'rice',
    carbFor: 'stew',
    carbNote: 'Rice (300 g) for the tajine zitoune. Spread it on a plate so it cools fast.',
    saturdayNote: 'Nothing to soak this week. Check you have flour and butter for the béchamel.',
    shopping: [
      {
        title: 'Butcher',
        items: [
          { name: 'Chicken legs, skin removed', detail: '1.5 kg · zitoune' },
          { name: 'Chicken breast', detail: '700 g · gratin' },
          { name: 'Chicken drumsticks, skin removed', detail: '1.4 kg (about 10) · tray' },
        ],
      },
      {
        title: 'Vegetables',
        items: [
          { name: 'Carrots', detail: '400 g' },
          { name: 'Mushrooms', detail: '450 g (or 2 cans)' },
          { name: 'Zucchini', detail: '2' },
          { name: 'Sweet potatoes (batata hlowa)', detail: '600 g' },
          { name: 'Green beans', detail: '400 g (fresh or frozen)' },
          { name: 'Sweet pepper', detail: '1 · muffins' },
          { name: 'Onion', detail: '1' },
          { name: 'Cucumbers', detail: '4' },
          { name: 'Tomatoes', detail: '3' },
          { name: 'Lettuce', detail: '1' },
          { name: 'Parsley', detail: '1 bunch' },
        ],
      },
      {
        title: 'Fruit',
        items: [
          { name: 'Apples, oranges or seasonal fruit', detail: '10 · breakfasts, snacks, weekend' },
        ],
      },
      dairy([
        { name: 'Semi-skimmed milk', detail: '1 L · béchamel + muffins' },
        { name: 'Butter', detail: '30 g' },
        { name: 'Grated cheese', detail: '200 g' },
        { name: 'Eggs', detail: 'a new tray of 30 if you ran out' },
        { name: 'Plain yogurt', detail: '4 pots' },
        { name: 'Turkey breast slices (blanc de dinde)', detail: '100 g · muffins' },
      ]),
      {
        title: 'Grocery',
        items: [
          { name: 'Sardines in olive oil', detail: '1 tin · Sunday lunch' },
          { name: 'Pitted green olives', detail: '200 g' },
          { name: 'Whole-wheat penne', detail: '500 g' },
          { name: 'Rice', detail: '300 g (you have some from Week 3)' },
          { name: 'Flour', detail: '1 kg (if you have none)' },
          { name: 'Dates', detail: 'top up · snacks' },
        ],
      },
      {
        title: 'Bakery',
        items: [{ name: 'Pain complet or pain au son', detail: '1 loaf · freeze sliced' }],
      },
    ],
  },
];

/**
 * Recipes the 4-week plan cooks, plus the basics every week uses (boiled eggs, kesra).
 * Everything else in RECIPES is an extra, ready to swap in.
 */
export const PLAN_RECIPE_IDS: ReadonlySet<RecipeId> = new Set<RecipeId>([
  ...ROTATION.flatMap((w) =>
    [w.stew, w.pot, w.tray, w.breakfast, w.snack, w.carb].filter((id) => id !== null),
  ),
  'eggs',
  'kesra',
]);

export const SHOP_ITEM_PREFIX = 'shop-';

/** Persisted tick id for a shopping item: section and item index in the week's list. */
export function shopItemId(section: number, item: number): string {
  return `${SHOP_ITEM_PREFIX}${section}-${item}`;
}

export function rotationWeek(rotation: Rotation): RotationWeek {
  return ROTATION[rotation];
}

/** A simple meal or snack that isn't a recipe, with amounts for the nutrition numbers. */
export interface SimpleMeal {
  name: string;
  amounts: readonly FoodAmount[];
}

/**
 * Afternoon snacks Mon–Fri, protein first: they carry you from lunch to a late dinner.
 * `'week-snack'` is Wednesday's slot for the week's snack recipe, or the fallback below.
 */
export const WEEKDAY_SNACKS: readonly (SimpleMeal | 'week-snack')[] = [
  {
    name: 'A glass of lben + a piece of fruit',
    amounts: [
      { food: 'lben', grams: 250 },
      { food: 'fruit', grams: UNIT_GRAMS.fruit },
    ],
  },
  {
    name: 'Boiled egg + a piece of fruit',
    amounts: [
      { food: 'egg', grams: UNIT_GRAMS.egg },
      { food: 'fruit', grams: UNIT_GRAMS.fruit },
    ],
  },
  'week-snack',
  {
    name: 'Boiled egg + a cheese portion + cucumber sticks',
    amounts: [
      { food: 'egg', grams: UNIT_GRAMS.egg },
      { food: 'cheese-portion', grams: UNIT_GRAMS.cheesePortion },
      { food: 'cucumber', grams: 100 },
    ],
  },
  {
    name: 'A glass of lben + 3 dates',
    amounts: [
      { food: 'lben', grams: 250 },
      { food: 'dates', grams: 3 * UNIT_GRAMS.date },
    ],
  },
];

/** Eaten with one energy ball on weeks that make them. */
export const WEEK_SNACK_SIDE: SimpleMeal = {
  name: '1 energy ball + a plain yogurt',
  amounts: [{ food: 'yogurt', grams: UNIT_GRAMS.yogurtPot }],
};

export const WEEK_SNACK_FALLBACK: SimpleMeal = {
  name: 'Plain yogurt + a boiled egg',
  amounts: [
    { food: 'yogurt', grams: UNIT_GRAMS.yogurtPot },
    { food: 'egg', grams: UNIT_GRAMS.egg },
  ],
};

export const WEEKEND_BREAKFAST: SimpleMeal = {
  name: 'Weekend breakfast: 2 eggs (dry non-stick pan), bread, fruit, a glass of lben',
  amounts: [
    { food: 'egg', grams: 2 * UNIT_GRAMS.egg },
    { food: 'bread-ww', grams: UNIT_GRAMS.breadWedge },
    { food: 'fruit', grams: UNIT_GRAMS.fruit },
    { food: 'lben', grams: 250 },
  ],
};

/** Sunday lunch: quick, high in protein, and the plan's weekly omega-3. */
export const SARDINE_PLATE: SimpleMeal = {
  name: 'Sardines on toast with grated carrot & cucumber',
  amounts: [
    { food: 'sardines', grams: 100 },
    { food: 'bread-ww', grams: UNIT_GRAMS.breadWedge },
    { food: 'carrot', grams: 100 },
    { food: 'cucumber', grams: 120 },
  ],
};

export const WEEKEND_SNACK: SimpleMeal = {
  name: 'Plain yogurt + a boiled egg + an apple',
  amounts: [
    { food: 'yogurt', grams: UNIT_GRAMS.yogurtPot },
    { food: 'egg', grams: UNIT_GRAMS.egg },
    { food: 'fruit', grams: UNIT_GRAMS.fruit },
  ],
};

export const SIMPLE_PLATE: SimpleMeal = {
  name: 'Omelette (2 eggs), bread, cucumber & tomato',
  amounts: [
    { food: 'egg', grams: 2 * UNIT_GRAMS.egg },
    { food: 'olive-oil', grams: 5 },
    { food: 'bread-ww', grams: UNIT_GRAMS.breadWedge },
    { food: 'cucumber', grams: 120 },
    { food: 'tomato', grams: 120 },
  ],
};
