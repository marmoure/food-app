import type { Rotation, RotationWeek } from './types';

const FRUIT = {
  title: 'Fruit',
  items: [
    { name: 'Bananas', detail: '6' },
    { name: 'Apples, oranges or seasonal fruit', detail: '8' },
  ],
};

export const ROTATION: readonly [RotationWeek, RotationWeek, RotationWeek, RotationWeek] = [
  {
    stew: 'loubia',
    pot: 'chorba-frik',
    tray: 'paprika-tray',
    breakfast: 'oats',
    snack: 'energy-balls',
    carb: null,
    carbFor: null,
    carbNote:
      'Bread this week. Slice a baguette, freeze it, and toast slices straight from the freezer.',
    saturdayNote:
      'Soak the 500 g white beans (and chickpeas, if dried) in a big bowl of water tonight.',
    shopping: [
      {
        title: 'Butcher',
        items: [
          { name: 'Beef chunks (épaule)', detail: '600 g · loubia' },
          { name: 'Chicken legs or thighs, bone-in', detail: '8 pieces, ~2 kg · 4 tray, 4 chorba' },
        ],
      },
      {
        title: 'Vegetables',
        items: [
          { name: 'Carrots', detail: '1 kg' },
          { name: 'Potatoes', detail: '1 kg' },
          { name: 'Zucchini', detail: '3' },
          { name: 'Sweet peppers (not hot)', detail: '2' },
          { name: 'Onions', detail: '2' },
          { name: 'Tomato', detail: '1' },
          { name: 'Coriander', detail: '1 bunch' },
          { name: 'Parsley', detail: '1 bunch' },
        ],
      },
      FRUIT,
      {
        title: 'Dairy & eggs',
        items: [
          { name: 'Milk', detail: '1 L' },
          { name: 'Plain yogurt', detail: '8 pots' },
          { name: 'Eggs', detail: '12' },
          { name: 'Cheese', detail: 'portions or a block' },
        ],
      },
      {
        title: 'Grocery',
        items: [
          { name: 'Dried white beans (loubia)', detail: '500 g · soak tonight' },
          { name: 'Frik', detail: '150 g' },
          { name: 'Chickpeas', detail: '1 small can (or 100 g dried)' },
          { name: 'Rolled oats', detail: '500 g' },
          { name: 'Dates (deglet nour)', detail: '500 g' },
          { name: 'Peanut butter or tahini', detail: '1 small jar' },
          { name: 'Almonds, walnuts or peanuts', detail: '250 g' },
        ],
      },
      {
        title: 'Bakery',
        items: [{ name: 'Bread', detail: '2 baguettes or 2 kesra · freeze half, sliced' }],
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
    carbNote: 'Couscous (360 g) for the tajine. It takes 5 minutes and needs no cooking.',
    saturdayNote: 'Using dried chickpeas? Soak 150 g in water tonight.',
    shopping: [
      {
        title: 'Butcher',
        items: [
          { name: 'Chicken legs', detail: '1.5 kg · tajine' },
          { name: 'Minced beef (viande hachée)', detail: '700 g · kefta' },
        ],
      },
      {
        title: 'Vegetables',
        items: [
          { name: 'Carrots', detail: '1 kg' },
          { name: 'Potatoes', detail: '1 kg' },
          { name: 'Zucchini', detail: '3' },
          { name: 'Sweet peppers (not hot)', detail: '3' },
          { name: 'Onions', detail: '3' },
          { name: 'Cucumber', detail: '1' },
          { name: 'Parsley', detail: '1 bunch' },
          { name: 'Coriander', detail: '1 bunch' },
        ],
      },
      FRUIT,
      {
        title: 'Dairy & eggs',
        items: [
          { name: 'Eggs', detail: '20 (a tray of 30 covers two weeks)' },
          { name: 'Milk', detail: '½ L' },
          { name: 'Plain yogurt', detail: '8 pots' },
          { name: 'Grated cheese', detail: '100 g' },
          { name: 'Cheese', detail: 'portions or a block' },
        ],
      },
      {
        title: 'Grocery',
        items: [
          { name: 'Red lentils', detail: '400 g' },
          { name: 'Medium couscous', detail: '500 g' },
          { name: 'Chickpeas', detail: '1 can (or 150 g dried)' },
          { name: 'Breadcrumbs (chapelure)', detail: 'small bag, or use oats' },
          { name: 'Chicken stock cubes', detail: '1 box' },
          { name: 'Cachir nature (not spicy)', detail: '100 g' },
          { name: 'Nuts', detail: 'top up' },
        ],
      },
      { title: 'Bakery', items: [{ name: 'Bread', detail: '1 baguette · for soup nights' }] },
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
    carbNote: 'Rice (300 g) for the tray bake. Spread it on a plate so it cools fast.',
    saturdayNote:
      'Using dried chickpeas? Soak 150 g tonight. Optional: marinate the chicken tonight (step 1 of the tray recipe).',
    shopping: [
      {
        title: 'Butcher',
        items: [
          { name: 'Beef chunks', detail: '600 g · jelbana' },
          { name: 'Chicken legs', detail: '~1 kg · chorba' },
          { name: 'Boneless chicken thighs', detail: '1 kg · tray' },
        ],
      },
      {
        title: 'Vegetables',
        items: [
          { name: 'Carrots', detail: '500 g' },
          { name: 'Sweet peppers (not hot)', detail: '3' },
          { name: 'Zucchini', detail: '2' },
          { name: 'Onions', detail: '2' },
          { name: 'Coriander', detail: '1 bunch' },
          { name: 'Parsley', detail: '1 bunch' },
        ],
      },
      { title: 'Frozen', items: [{ name: 'Frozen peas (petits pois)', detail: '800 g' }] },
      FRUIT,
      {
        title: 'Dairy & eggs',
        items: [
          { name: 'Plain yogurt', detail: '10 pots · 200 g for the marinade' },
          { name: 'Milk', detail: '1 L' },
          { name: 'Eggs', detail: "12 (or what's left of the tray)" },
          { name: 'Cheese', detail: 'portions or a block' },
        ],
      },
      {
        title: 'Grocery',
        items: [
          { name: 'Chickpeas', detail: '1 can (or 150 g dried)' },
          { name: "Vermicelli (cheveux d'ange)", detail: '100 g' },
          { name: 'Rice', detail: '1 kg' },
          { name: 'Rolled oats', detail: 'top up' },
          { name: 'Dates', detail: '500 g' },
          { name: 'Nuts, peanut butter', detail: 'top up' },
        ],
      },
      { title: 'Bakery', items: [{ name: 'Bread', detail: '2 baguettes · freeze half' }] },
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
    carbNote: 'Rice (360 g) for the tajine zitoune. Spread it on a plate so it cools fast.',
    saturdayNote: 'Nothing to soak this week. Check you have flour and butter for the béchamel.',
    shopping: [
      {
        title: 'Butcher',
        items: [
          { name: 'Chicken legs', detail: '1.5 kg · zitoune' },
          { name: 'Chicken breast', detail: '600 g · gratin' },
          { name: 'Chicken drumsticks', detail: '8, ~1.2 kg · tray' },
        ],
      },
      {
        title: 'Vegetables',
        items: [
          { name: 'Carrots', detail: '500 g' },
          { name: 'Mushrooms', detail: '450 g (or 2 cans)' },
          { name: 'Zucchini', detail: '2' },
          { name: 'Sweet potatoes (batata hlowa)', detail: '700 g' },
          { name: 'Green beans', detail: '400 g (fresh or frozen)' },
          { name: 'Sweet pepper', detail: '1 · muffins' },
          { name: 'Onions', detail: '2' },
          { name: 'Parsley', detail: '1 bunch' },
        ],
      },
      FRUIT,
      {
        title: 'Dairy & eggs',
        items: [
          { name: 'Milk', detail: '1.5 L' },
          { name: 'Butter', detail: '100 g' },
          { name: 'Grated cheese', detail: '300 g' },
          { name: 'Eggs', detail: '12' },
          { name: 'Plain yogurt', detail: '6 pots' },
        ],
      },
      {
        title: 'Grocery',
        items: [
          { name: 'Pitted green olives', detail: '250 g' },
          { name: 'Penne', detail: '500 g' },
          { name: 'Rice', detail: '500 g (if none left)' },
          { name: 'Flour', detail: '1 kg (if you have none)' },
          { name: 'Cachir nature (not spicy)', detail: '100 g' },
        ],
      },
      { title: 'Bakery', items: [{ name: 'Bread', detail: '1 baguette' }] },
    ],
  },
];

export function rotationWeek(rotation: Rotation): RotationWeek {
  return ROTATION[rotation];
}

/** Afternoon snacks Mon–Fri; `null` is replaced by the week's snack recipe (or dates). */
export const WEEKDAY_SNACKS: readonly (string | null)[] = [
  'Yogurt + a handful of nuts',
  'Boiled egg + a piece of fruit',
  null,
  'Cheese portion + fruit',
  'Yogurt + 3 dates',
];
