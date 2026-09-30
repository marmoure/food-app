import { addDays, rotationOf, weekStart } from './calendar';
import { rotationWeek, shopItemId } from './rotation';
import type { PlanDay, Rotation, ShoppingItem } from './types';

/*
 * Vegetables are never bought in bulk: bulk bags hide bad ones and leave a mountain to wash.
 * Instead, from the Tuesday before the Sunday cook, one or two a day: pick them yourself,
 * clean them at home, put them away, and only then buy the next one. Hardy vegetables come
 * first, delicate ones last, and salad vegetables late enough to last until Friday.
 */

export const VEG_IDS = [
  'carrot',
  'onion',
  'potato',
  'sweet-potato',
  'pepper',
  'zucchini',
  'green-beans',
  'mushroom',
  'cucumber',
  'tomato',
  'lettuce',
  'herbs',
] as const;
export type VegId = (typeof VEG_IDS)[number];

export interface VegCare {
  /** What a good one looks like at the stall. */
  pick: string;
  /** What to do as soon as you get home. */
  clean: string;
  /** Where it waits until Sunday (or until eaten). */
  store: string;
  /** How long it keeps, cleaned and stored as above. */
  keepsDays: number;
  /** Eaten raw on the week's plates, so it has to last until Friday, not just Sunday. */
  raw?: boolean;
}

export const VEG_CARE: Record<VegId, VegCare> = {
  carrot: {
    pick: 'Firm and bright orange, no cracks, soft tips or sprouting tops.',
    clean: 'Cut off the tops, peel, rinse and dry with a towel.',
    store: 'Fridge, in a lidded box lined with kitchen paper.',
    keepsDays: 7,
  },
  onion: {
    pick: 'Hard, with dry papery skin. No soft spots, sprouts or black dust.',
    clean: 'Nothing to do: peel them on Sunday.',
    store: 'Not the fridge: a dry basket in a dark cupboard, away from the potatoes.',
    keepsDays: 21,
  },
  potato: {
    pick: 'Firm, no green patches, sprouts or soft spots.',
    clean: "Brush off loose soil only. Don't wash: wet potatoes rot. Wash and peel on Sunday.",
    store: 'A paper bag in a dark cupboard (or the fridge drawer if the kitchen is warm).',
    keepsDays: 14,
  },
  'sweet-potato': {
    pick: 'Firm with smooth skin, no wrinkles, soft ends or dark spots.',
    clean: 'Brush off loose soil only. Wash them on Sunday.',
    store: 'Not the fridge (it hardens them): a paper bag in a dark cupboard.',
    keepsDays: 14,
  },
  pepper: {
    pick: 'Glossy, firm and heavy for its size, with a green stem. Check it says sweet, not hot.',
    clean: 'Wash, dry well. Keep it whole: cut peppers go soft in 2–3 days.',
    store: 'Fridge vegetable drawer, whole.',
    keepsDays: 7,
  },
  zucchini: {
    pick: 'Small to medium, firm and shiny. Skip any that bend or have soft ends.',
    clean: 'Wash, dry well, cut off both ends.',
    store: 'Fridge, whole and dry, in a box lined with kitchen paper.',
    keepsDays: 5,
  },
  'green-beans': {
    pick: 'Bright green and snap cleanly. No brown marks or limp beans.',
    clean: 'Wash, dry, snap off both ends.',
    store: 'Fridge, in a box lined with kitchen paper.',
    keepsDays: 5,
  },
  mushroom: {
    pick: 'White and firm with closed caps. Not slimy, not dark underneath.',
    clean: "Wipe off any dirt with damp kitchen paper. Don't wash them yet: they go slimy.",
    store: 'Fridge, in a paper bag (never a closed plastic box). Quick rinse on Sunday.',
    keepsDays: 4,
  },
  cucumber: {
    pick: 'Firm from end to end, dark green, no yellow patches.',
    clean: 'Wash and dry.',
    store: 'Fridge, each one wrapped in kitchen paper, away from the tomatoes.',
    keepsDays: 7,
    raw: true,
  },
  tomato: {
    pick: 'Red and firm, just ripe. No cracks or soft spots.',
    clean: 'Wash and dry.',
    store: 'Fridge, in a box. Take one out an hour before you eat it.',
    keepsDays: 7,
    raw: true,
  },
  lettuce: {
    pick: 'Crisp, with no brown edges or slimy outer leaves.',
    clean:
      'Separate the leaves, soak them in a big bowl of water, lift them out (the grit stays behind), then dry them completely on a clean towel.',
    store: 'Fridge, in a lidded box lined with kitchen paper. Change the paper when it gets damp.',
    keepsDays: 7,
    raw: true,
  },
  herbs: {
    pick: 'Bright green and perky, no yellow or black leaves.',
    clean: 'Soak in a bowl of water, lift out, shake and pat dry. Cut off the thick stems.',
    store: 'Fridge, standing in a jar with a little water, a plastic bag loosely over the top.',
    keepsDays: 10,
    raw: true,
  },
};

/** Run days, in order. Tue–Fri fall in the week before the Sunday cook; Sat is shopping day. */
export const VEG_RUN_DAYS = ['tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type VegRunDay = (typeof VEG_RUN_DAYS)[number];

/** Days from the Saturday of the week the list belongs to. */
const RUN_OFFSET: Record<VegRunDay, number> = { tue: -4, wed: -3, thu: -2, fri: -1, sat: 0 };

export const VEG_RUN_DAY_LABEL: Record<VegRunDay, string> = {
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

/** The date of a run for the given plan week's list. */
export function vegRunDate(planWeek: number, day: VegRunDay): Date {
  return addDays(weekStart(planWeek), RUN_OFFSET[day]);
}

/** Days a vegetable bought on this run has to last: to the Sunday cook, or to Friday if eaten raw. */
export function daysItMustKeep(day: VegRunDay, veg: VegId): number {
  const lastDay = VEG_CARE[veg].raw ? 6 : 1;
  return lastDay - RUN_OFFSET[day];
}

export interface VegRunItem {
  /** Persisted tick id in the week's shopping list. */
  itemId: string;
  item: ShoppingItem;
  veg: VegId;
  day: VegRunDay;
}

/** Every vegetable in a rotation week's list, in run order. */
export function vegRuns(rotation: Rotation): VegRunItem[] {
  const items = rotationWeek(rotation).shopping.flatMap((sec, si) =>
    sec.items.flatMap((item, ii) =>
      item.veg ? [{ itemId: shopItemId(si, ii), item, veg: item.veg.id, day: item.veg.run }] : [],
    ),
  );
  return VEG_RUN_DAYS.flatMap((d) => items.filter((i) => i.day === d));
}

export interface VegRunToday {
  /** The plan week whose shopping list the vegetables belong to (and are ticked in). */
  planWeek: number;
  day: VegRunDay;
  items: VegRunItem[];
  /** On Saturday: earlier runs of the same list, to catch up on anything not bought yet. */
  earlier: VegRunItem[];
}

const RUN_DAY_OF: Partial<Record<PlanDay, VegRunDay>> = {
  3: 'tue',
  4: 'wed',
  5: 'thu',
  6: 'fri',
  0: 'sat',
};

/** The vegetable run for a day of the plan, or null on days without one (Sun, Mon). */
export function vegRunOn(planWeek: number, day: PlanDay): VegRunToday | null {
  const runDay = RUN_DAY_OF[day];
  if (!runDay) return null;
  // Tue–Fri buy for next Sunday's cook, which belongs to the next plan week.
  const forWeek = runDay === 'sat' ? planWeek : planWeek + 1;
  const all = vegRuns(rotationOf(forWeek));
  const idx = VEG_RUN_DAYS.indexOf(runDay);
  return {
    planWeek: forWeek,
    day: runDay,
    items: all.filter((i) => i.day === runDay),
    earlier: runDay === 'sat' ? all.filter((i) => VEG_RUN_DAYS.indexOf(i.day) < idx) : [],
  };
}
