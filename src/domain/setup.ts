export interface SetupItem {
  id: string;
  label: string;
  detail?: string;
}

export interface SetupGroup {
  title: string;
  items: readonly SetupItem[];
}

/** One-time checklist before the first week. Item ids are persisted; don't rename them. */
export const SETUP: readonly SetupGroup[] = [
  {
    title: 'Buy: equipment',
    items: [
      {
        id: 'eq-micro',
        label: 'Microwave',
        detail:
          'The biggest upgrade. Every reheat becomes 2 minutes. Without one everything still works on the stove, it just takes 5–7 minutes.',
      },
      {
        id: 'eq-cont',
        label: '15 food containers, all the same size (~750 ml)',
        detail:
          'Freezer- and microwave-safe, with lids. Matching sizes stack neatly on the freezer shelves.',
      },
      {
        id: 'eq-jars',
        label: '5 jars with lids (~400 ml)',
        detail: 'For overnight oats. Clean jam jars work.',
      },
      {
        id: 'eq-label',
        label: 'Masking tape + permanent marker',
        detail: 'Every freezer box gets the dish name and date.',
      },
      { id: 'eq-trays', label: '2 baking trays + baking paper' },
      {
        id: 'eq-muffin',
        label: '12-cup muffin tin',
        detail: 'Silicone is easiest to get the muffins out of.',
      },
      { id: 'eq-pot', label: 'Big pot, about 8 L (marmite)', detail: 'For the soups.' },
      {
        id: 'eq-blender',
        label: 'Hand blender with a chopper bowl (mixeur plongeant)',
        detail: 'For lentil soup and energy balls.',
      },
      { id: 'eq-knife', label: "Sharp chef's knife, large cutting board, peeler, grater" },
      {
        id: 'eq-spoons',
        label: 'Measuring spoons + a 1 L measuring jug',
        detail: 'The recipes use tsp, tbsp and ml.',
      },
    ],
  },
  {
    title: 'Stock once: pantry',
    items: [
      { id: 'pa-oil', label: 'Olive oil, 1 L' },
      {
        id: 'pa-spices',
        label: 'Spices',
        detail:
          'Salt, black pepper, cumin, sweet paprika (paprika douce, not "fort"), turmeric, cinnamon, ginger powder, dried thyme, dried mint, bay leaves.',
      },
      { id: 'pa-basics', label: 'Tomato paste, chicken stock cubes, honey, flour' },
    ],
  },
  {
    title: 'Get the kitchen ready',
    items: [
      {
        id: 'ki-freezer',
        label: 'Empty and wipe the freezer, then give each shelf a job',
        detail:
          'Top: ready meals. Middle: bread & breakfasts. Bottom: raw meat & frozen vegetables.',
      },
      {
        id: 'ki-fridge',
        label: "Clean the fridge and keep one eye-level shelf for this week's meals",
      },
      {
        id: 'ki-alarms',
        label: 'Set repeating phone alarms',
        detail: 'Sat 10:00 "Shop" · Sun 15:00 "Cook" · Wed & Thu 21:00 "Move freezer meals".',
      },
    ],
  },
];

export const SETUP_ITEM_IDS: readonly string[] = SETUP.flatMap((g) => g.items.map((i) => i.id));
