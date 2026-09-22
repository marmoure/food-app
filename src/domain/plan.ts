import { nextDay, rotationOf } from './calendar';
import { freezerStatus } from './freezer';
import { RECIPES } from './recipes';
import { WEEKDAY_SNACKS, rotationWeek } from './rotation';
import type { MealSlot, PlanDay, RecipeId, Rotation } from './types';

const REHEAT_FROM_FREEZER =
  'Thawed in the fridge overnight? Microwave until steaming. Still frozen? Defrost 5 min, then high 2–3 min, stirring.';

export interface DayContext {
  rotation: Rotation;
  day: PlanDay;
  /** Light week: the freezer is full, so no stew or soup is cooked. */
  light: boolean;
  planWeek: number;
}

type Meal = Omit<MealSlot, 'slot'>;

/**
 * What to eat on a given day of the plan.
 *
 * Mon–Wed eat from the fridge (cooked Sunday); Thu–Fri eat from the freezer, moved to the
 * fridge the night before, because cooked food is only safe for 3–4 days in the fridge.
 * The tray bake never freezes (roast potatoes go grainy), so it covers Sun dinner to Wed lunch.
 */
export function planDay({ rotation, day, light, planWeek }: DayContext): MealSlot[] {
  const w = rotationWeek(rotation);
  const stew = RECIPES[w.stew];
  const pot = RECIPES[w.pot];
  const tray = RECIPES[w.tray];
  const breakfast = RECIPES[w.breakfast];
  const weekend = day <= 1;
  const firstWeekend = planWeek === 0 && weekend;

  const fromFridge = (id: RecipeId): Meal => ({
    dish: RECIPES[id].name,
    source: 'fridge',
    how: RECIPES[id].reheat,
    recipeId: id,
  });
  const fromFreezer = (id: RecipeId, suffix = ''): Meal => ({
    dish: RECIPES[id].name + suffix,
    source: 'freezer',
    thawNightBefore: true,
    how: RECIPES[id].reheat,
    recipeId: id,
  });
  // The freezer is empty until the first Sunday cook.
  const simplePlate: Meal = {
    dish: 'Simple plate: omelette, bread, cheese, cucumber & tomato with olive oil',
    source: 'fresh',
    how: 'Your freezer fills up on Sunday. Keep today simple.',
  };
  const anyFreezerMeal = (dish: string, thaw: boolean): Meal =>
    firstWeekend
      ? simplePlate
      : { dish, source: 'freezer', thawNightBefore: thaw, how: REHEAT_FROM_FREEZER };
  const lightSwap = anyFreezerMeal('Freezer meal (moved last night)', true);

  let breakfastSlot: Meal;
  if (weekend) {
    breakfastSlot = {
      dish: 'Weekend breakfast: eggs, bread, cheese, olive oil, fruit',
      source: 'fresh',
      how: 'You have time today, so cook it fresh.',
    };
  } else if (w.breakfast === 'oats') {
    breakfastSlot = fromFridge('oats');
  } else {
    // 6 muffins in the fridge for Mon–Wed, 6 frozen for Thu–Fri.
    const late = day >= 5;
    breakfastSlot = {
      dish: '2 egg muffins',
      source: late ? 'freezer' : 'fridge',
      thawNightBefore: late,
      how: breakfast.reheat,
      recipeId: 'muffins',
    };
  }

  const meals: Record<PlanDay, { lunch: Meal; dinner: Meal }> = {
    0: {
      lunch: anyFreezerMeal('Any freezer meal, oldest first', true),
      dinner: firstWeekend
        ? { dish: 'Eat out or with family', source: 'free', how: 'Enjoy it. Tomorrow you cook.' }
        : { dish: 'Freezer meal, family, or eat out', source: 'freezer', how: REHEAT_FROM_FREEZER },
    },
    1: {
      lunch: firstWeekend
        ? simplePlate
        : {
            dish: 'Omelette & bread, or a freezer meal',
            source: 'fresh',
            how: "Keep lunch light, you're cooking later.",
          },
      dinner: {
        dish: tray.name,
        source: 'fresh',
        how: "Straight out of the oven, the first portion of this week's tray.",
        recipeId: tray.id,
      },
    },
    2: { lunch: fromFridge(tray.id), dinner: light ? lightSwap : fromFridge(stew.id) },
    3: { lunch: light ? lightSwap : fromFridge(stew.id), dinner: fromFridge(tray.id) },
    4: { lunch: fromFridge(tray.id), dinner: light ? lightSwap : fromFridge(pot.id) },
    5: {
      lunch: light ? lightSwap : fromFreezer(pot.id),
      dinner: light ? lightSwap : fromFreezer(stew.id),
    },
    6: {
      lunch: light ? lightSwap : fromFreezer(pot.id, ' (or swap for any freezer meal)'),
      dinner: {
        dish: 'Free night',
        source: 'free',
        how: "Eat out, order in, or cook something fun. It's part of the plan, not a slip.",
      },
    },
  };

  const weekdaySnack = weekend ? null : WEEKDAY_SNACKS[day - 2];
  const snack: MealSlot = weekend
    ? { slot: 'Snack', dish: "Fruit, yogurt, nuts, whatever's left", source: 'grab', how: '' }
    : {
        slot: 'Snack',
        dish: weekdaySnack ?? (w.snack ? '2 energy balls' : '3 dates + a few almonds'),
        source: 'grab',
        how: "Mid-afternoon, so you're not starving at dinner.",
        ...(weekdaySnack === null && w.snack ? { recipeId: w.snack } : {}),
      };

  return [
    { slot: 'Breakfast', ...breakfastSlot },
    { slot: 'Lunch', ...meals[day].lunch },
    snack,
    { slot: 'Dinner', ...meals[day].dinner },
  ];
}

export type TaskTone = 'default' | 'fresh' | 'freezer' | 'warn';

export interface Task {
  tone: TaskTone;
  title: string;
  text?: string;
  link?: { to: string; label: string };
}

export interface TaskContext {
  planWeek: number;
  day: PlanDay;
  isLight: (planWeek: number) => boolean;
  freezerPortions: number;
}

/** Jobs for a day: shopping, cooking, and moving tomorrow's frozen meals to the fridge. */
export function tasksFor({ planWeek, day, isLight, freezerPortions }: TaskContext): Task[] {
  const rotation = rotationOf(planWeek);
  const w = rotationWeek(rotation);
  const tasks: Task[] = [];

  if (day === 0) {
    tasks.push({
      tone: 'fresh',
      title: `Shop for Week ${rotation + 1}.`,
      link: { to: `/shopping?week=${rotation + 1}`, label: 'Open the list' },
    });
    tasks.push({
      tone: 'default',
      title: 'Clear the fridge.',
      text: 'Eat or bin anything cooked more than 4 days ago.',
    });
    tasks.push({ tone: 'default', title: 'Tonight:', text: w.saturdayNote });
    if (planWeek > 0) {
      const status = freezerStatus(freezerPortions);
      if (status === 'full') {
        tasks.push({
          tone: 'freezer',
          title: `Your freezer holds ${freezerPortions} portions.`,
          text: 'Make this a light week: only the tray bake and breakfasts tomorrow.',
          link: { to: `/sunday?week=${rotation + 1}`, label: 'Switch it on' },
        });
      } else if (status === 'low') {
        tasks.push({
          tone: 'warn',
          title: `The freezer is low (${freezerPortions}).`,
          text: 'Cook the full week tomorrow.',
        });
      }
    }
  }
  if (day === 1) {
    tasks.push({
      tone: 'default',
      title: 'Sunday cook, about 2½ hours.',
      link: { to: `/sunday?week=${rotation + 1}`, label: 'Open the step-by-step' },
    });
  }
  if (day === 6) {
    tasks.push({
      tone: 'warn',
      title: 'Fridge check:',
      text: "anything from last Sunday that's still there, eat it today or bin it.",
    });
  }

  const tomorrow = nextDay(planWeek, day);
  const toMove = planDay({
    rotation: rotationOf(tomorrow.planWeek),
    day: tomorrow.day,
    light: isLight(tomorrow.planWeek),
    planWeek: tomorrow.planWeek,
  }).filter((s) => s.source === 'freezer' && s.thawNightBefore);
  if (toMove.length > 0) {
    const what = toMove
      .map((s) => `${s.slot.toLowerCase()} (${s.dish.replace(/ \(.*\)$/, '')})`)
      .join(', ');
    tasks.push({
      tone: 'freezer',
      title: 'Tonight, 30 seconds:',
      text: `move ${toMove.length === 1 ? '1 thing' : `${toMove.length} things`} from the freezer to the fridge for tomorrow: ${what}.`,
    });
  }
  return tasks;
}
