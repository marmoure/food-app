import { nextDay, rotationOf } from './calendar';
import { freezerStatus } from './freezer';
import { RECIPES } from './recipes';
import { vegRunOn } from './vegetables';
import {
  SARDINE_PLATE,
  SIMPLE_PLATE,
  type SimpleMeal,
  WEEKDAY_SNACKS,
  WEEKEND_BREAKFAST,
  WEEKEND_SNACK,
  WEEK_SNACK_FALLBACK,
  WEEK_SNACK_SIDE,
  rotationWeek,
  shopItemId,
} from './rotation';
import type { MealSlot, PlanDay, RecipeId, Rotation, ShoppingItem } from './types';

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

const simple = (m: SimpleMeal, how: string, source: Meal['source'] = 'fresh'): Meal => ({
  dish: m.name,
  source,
  how,
  extras: m.amounts,
});

/**
 * What to eat on a given day of the plan.
 *
 * Mon–Wed eat from the fridge (cooked Sunday); Thu–Fri eat from the freezer, moved to the
 * fridge the night before, because cooked food is only safe for 3–4 days in the fridge.
 * The tray bake never freezes (roast potatoes go grainy), so it covers Sun dinner to Wed lunch.
 * Slots with a recipe or `extras` are counted in the day's nutrition; free choices aren't.
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
  const simplePlate = simple(SIMPLE_PLATE, 'Your freezer fills up on Sunday. Keep today simple.');
  const anyFreezerMeal = (dish: string, thaw: boolean): Meal =>
    firstWeekend
      ? simplePlate
      : { dish, source: 'freezer', thawNightBefore: thaw, how: REHEAT_FROM_FREEZER };
  const lightSwap = anyFreezerMeal('Freezer meal (moved last night)', true);

  let breakfastSlot: Meal;
  if (weekend) {
    breakfastSlot = simple(WEEKEND_BREAKFAST, 'You have time today, so cook it fresh.');
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
      servings: 2,
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
        : simple(
            SARDINE_PLATE,
            "Two minutes, no cooking: you're cooking later. Drain the oil, mash the sardines onto the toast, grate the carrot on the cutter.",
          ),
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

  let snack: MealSlot;
  const snackHow = "Mid-afternoon, so you're not starving at dinner.";
  if (weekend) {
    // The week's boiled eggs come out of the Sunday cook, so the first weekend boils its own.
    const how = firstWeekend ? 'Boil the egg today (10 min): the batch is boiled on Sunday.' : '';
    snack = { slot: 'Snack', ...simple(WEEKEND_SNACK, how, 'grab') };
  } else {
    const idea = WEEKDAY_SNACKS[day - 2] ?? WEEK_SNACK_FALLBACK;
    if (idea !== 'week-snack') {
      snack = { slot: 'Snack', ...simple(idea, snackHow, 'grab') };
    } else if (w.snack) {
      snack = {
        slot: 'Snack',
        ...simple(WEEK_SNACK_SIDE, snackHow, 'grab'),
        recipeId: w.snack,
        servings: 1,
      };
    } else {
      snack = { slot: 'Snack', ...simple(WEEK_SNACK_FALLBACK, snackHow, 'grab') };
    }
  }

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
  /** Whether an item of a plan week's shopping list is ticked. */
  bought: (planWeek: number, itemId: string) => boolean;
}

/** A plan week's shopping items that aren't ticked yet, in list order. */
export function stillToBuy(
  planWeek: number,
  bought: TaskContext['bought'],
): { itemId: string; item: ShoppingItem }[] {
  return rotationWeek(rotationOf(planWeek)).shopping.flatMap((sec, si) =>
    sec.items.flatMap((item, ii) => {
      const itemId = shopItemId(si, ii);
      if (bought(planWeek, itemId) || (planWeek === 0 && item.skipFirstWeek)) return [];
      return [{ itemId, item }];
    }),
  );
}

/**
 * Jobs for a day: shopping, vegetable runs, cooking, and moving tomorrow's frozen meals to
 * the fridge.
 */
export function tasksFor({ planWeek, day, isLight, freezerPortions, bought }: TaskContext): Task[] {
  const rotation = rotationOf(planWeek);
  const w = rotationWeek(rotation);
  const tasks: Task[] = [];
  const missing = day <= 1 ? stillToBuy(planWeek, bought) : [];
  const listLink = { to: `/shopping?week=${rotation + 1}`, label: 'Open the list' };

  if (day === 0) {
    tasks.push({
      tone: 'fresh',
      title: `Shop for Week ${rotation + 1}.`,
      text: "Everything on the list except the vegetables: those are today's vegetable run below.",
      link: listLink,
    });
    tasks.push({
      tone: 'default',
      title: 'Clear the fridge.',
      text: 'Eat or bin anything cooked more than 4 days ago.',
    });
    tasks.push({ tone: 'default', title: 'Tonight:', text: w.saturdayNote });
    for (const { item } of missing) {
      if (item.lateSwap) {
        tasks.push({
          tone: 'warn',
          title: `No ${item.name.toLowerCase()} yet?`,
          text: `Then there's nothing to soak tonight: buy ${item.lateSwap} tomorrow instead.`,
        });
      }
    }
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
  const veg = vegRunOn(planWeek, day);
  if (veg && day !== 0 && veg.items.length > 0) {
    tasks.push({
      tone: 'fresh',
      title: 'Vegetable run:',
      text: `${veg.items.map((i) => i.item.name.toLowerCase()).join(' and ')} for Sunday. One at a time: buy, clean, put away.`,
    });
  }
  if (day === 1) {
    if (missing.length > 0) {
      const names = missing.map(({ item }) =>
        item.lateSwap
          ? `${item.lateSwap} (not dried: no time to soak them)`
          : item.name.toLowerCase(),
      );
      const veg = missing.some(({ item }) => item.veg);
      tasks.push({
        tone: 'warn',
        title: `First, buy the ${missing.length} ${missing.length === 1 ? 'thing' : 'things'} still on the list:`,
        text: `${names.join(' · ')}.${veg ? ' Clean and put away each vegetable as soon as you get home.' : ''}`,
        link: listLink,
      });
    }
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
