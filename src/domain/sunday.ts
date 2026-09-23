import { RECIPES } from './recipes';
import { rotationWeek } from './rotation';
import { BATCH_TO_FREEZER } from './freezer';
import { CUTTER_HEADS, type CutterHead, type RecipeId, type Rotation } from './types';

export const CUTTER_HEAD_LABEL: Record<CutterHead, string> = {
  'slice-thick': 'Big slicer',
  'slice-thin': 'Small slicer',
  shred: 'Shredder',
  'grate-coarse': 'Big grater',
  'grate-fine': 'Small grater',
};

export interface CutterGroup {
  head: CutterHead;
  label: string;
  items: string[];
}

/**
 * Every vegetable the session's recipes send through the cutter, grouped by head in the
 * order to use them: slicers first, graters last, onion at the very end so its smell
 * doesn't carry into everything else. One clean-up at the end.
 */
export function cutterPlan(recipeIds: readonly RecipeId[]): CutterGroup[] {
  return CUTTER_HEADS.map((head) => ({
    head,
    label: CUTTER_HEAD_LABEL[head],
    items: recipeIds.flatMap((id) =>
      (RECIPES[id].cutter ?? [])
        .filter((j) => j.head === head)
        .map((j) => `${j.what} (${RECIPES[id].short})`),
    ),
  }))
    .filter((g) => g.items.length > 0)
    .map((g) => ({
      ...g,
      // Onion last within its head.
      items: [...g.items].sort((a, b) => Number(/onion/i.test(a)) - Number(/onion/i.test(b))),
    }));
}

export interface SundayStep {
  id: string;
  title: string;
  body: string;
  /** Minutes from the start of the session. */
  startsAt: number;
  durationMinutes: number;
  recipeId?: RecipeId;
  /** This step offers the "log the batch to the freezer" action. */
  logsBatch?: boolean;
  /** For the cutter step: what goes through which head. */
  cutter?: CutterGroup[];
}

/** Persisted tick id for a Sunday step. */
export function sundayStepItemId(step: SundayStep): string {
  return `sun-${step.id}`;
}

export interface SundaySession {
  steps: SundayStep[];
  totalMinutes: number;
}

type StepInput = Omit<SundayStep, 'startsAt'>;

/**
 * The Sunday session in order. Multicooker, stove and oven run in parallel, so steps are
 * staggered starts rather than one-after-another cooking time.
 */
export function sundaySession(rotation: Rotation, light: boolean): SundaySession {
  const w = rotationWeek(rotation);
  const stew = RECIPES[w.stew];
  const pot = RECIPES[w.pot];
  const tray = RECIPES[w.tray];
  const breakfast = RECIPES[w.breakfast];
  const potInOven = pot.appliance === 'oven';
  const carbOn = w.carb !== null && !(light && w.carbFor === 'stew');

  const input: StepInput[] = [
    {
      id: 'setup',
      durationMinutes: 10,
      title: 'Set up',
      body: `Oven on to ${tray.temp ?? '210°C'}. Take out every ingredient, wash and peel the vegetables, fill the sink with hot soapy water. Put on a podcast.`,
    },
  ];
  const cooked: RecipeId[] = light
    ? [tray.id, breakfast.id]
    : [stew.id, pot.id, tray.id, breakfast.id];
  const cutter = cutterPlan(cooked);
  if (cutter.length > 0) {
    input.push({
      id: 'cutter',
      durationMinutes: 15,
      title: 'Vegetable cutter: prep everything at once',
      body: 'Run the heads in this order into bowls, one bowl per dish. Rinse the machine only once, at the end.',
      cutter,
    });
  }
  if (!light) {
    input.push({
      id: 'stew',
      durationMinutes: 15,
      title: `Multicooker: ${stew.short}`,
      body: 'Sauté, then pressure. After that it looks after itself.',
      recipeId: stew.id,
    });
    input.push({
      id: 'pot',
      durationMinutes: 15,
      title: `${potInOven ? 'Second oven dish' : 'Big pot'}: ${pot.short}`,
      body: potInOven
        ? 'Get it ready while the tray roasts, then bake it on the lower rack.'
        : 'On the stove, while the multicooker runs.',
      recipeId: pot.id,
    });
  }
  input.push({
    id: 'tray',
    durationMinutes: 10,
    title: `Oven: ${tray.short}`,
    body: 'Into the oven. Set a timer.',
    recipeId: tray.id,
  });
  input.push({
    id: 'carb',
    durationMinutes: 15,
    title: `Stove: ${carbOn && w.carb ? `${RECIPES[w.carb].short} + eggs` : 'boiled eggs'}`,
    body: `${carbOn ? `${w.carbNote} ` : ''}Boil 6 eggs for snacks and soups: 10 minutes, then cold water.`,
    recipeId: carbOn && w.carb ? w.carb : 'eggs',
  });
  input.push({
    id: 'bf',
    durationMinutes: 15,
    title: `Breakfasts: ${breakfast.short}`,
    body:
      w.breakfast === 'oats'
        ? 'Fill 5 jars. No cooking.'
        : 'When the oven is free: 180°C, 22 minutes.',
    recipeId: breakfast.id,
  });
  if (w.snack) {
    input.push({
      id: 'snack',
      durationMinutes: 15,
      title: `Snack: ${RECIPES[w.snack].short}`,
      body: 'Blend and roll. Makes about 16.',
      recipeId: w.snack,
    });
  }
  input.push({
    id: 'cool',
    durationMinutes: 35,
    title: 'Cool down',
    body: 'Spoon everything into open containers and let the steam go (30–45 min, never more than 2 hours out). Wash up meanwhile. Never put a hot pot straight in the fridge.',
  });
  input.push({
    id: 'portion',
    durationMinutes: 15,
    title: 'Portion & label',
    body: "Follow the fridge and freezer plan below. Write the dish and today's date on masking tape for every freezer box.",
  });
  if (!light) {
    input.push({
      id: 'log',
      durationMinutes: 2,
      title: 'Log the freezer',
      body: 'One tap so the freezer tracker stays right.',
      logsBatch: true,
    });
  }
  input.push({
    id: 'eat',
    durationMinutes: 0,
    title: 'Dinner',
    body: `Eat the first portion of ${tray.short}. You're done until Saturday.`,
  });

  let t = 0;
  const steps = input.map((s) => {
    const step = { ...s, startsAt: t };
    t += s.durationMinutes;
    return step;
  });
  return { steps, totalMinutes: t };
}

export interface StoragePlan {
  fridge: string[];
  freezer: string[];
}

/** Where each portion goes at the end of the Sunday session. */
export function storagePlan(rotation: Rotation, light: boolean): StoragePlan {
  const w = rotationWeek(rotation);
  const stew = RECIPES[w.stew].short;
  const pot = RECIPES[w.pot].short;
  const tray = RECIPES[w.tray].short;
  const muffins = w.breakfast === 'muffins';
  const breakfasts = `Breakfasts (${muffins ? '6 muffins' : '5 jars'})`;

  if (light) {
    return {
      fridge: [`${tray} ×3`, breakfasts, '6 boiled eggs'],
      freezer: [
        muffins ? '6 egg muffins' : 'Nothing new this week',
        "Tonight: move Monday's dinner to the fridge",
      ],
    };
  }
  return {
    fridge: [
      `${tray} ×3`,
      `${stew} ×2`,
      `${pot} ×1`,
      breakfasts,
      '6 boiled eggs',
      ...(w.snack ? ['Energy balls'] : []),
    ],
    freezer: [
      `${stew} ×${BATCH_TO_FREEZER.stew} (Thursday dinner + 3 spare)`,
      `${pot} ×${BATCH_TO_FREEZER.pot} (Thursday + Friday lunch + 3 spare)`,
      ...(muffins ? ['6 egg muffins'] : []),
    ],
  };
}
