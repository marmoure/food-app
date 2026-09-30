import type { FreezerItem } from '../domain/freezer';
import type { Activity, Goal, Profile, Sex } from '../domain/nutrition/targets';
import { isRecipeId } from '../domain/recipes';

/** Ticks for one checklist scope: a plan week (keyed by its Saturday) or "setup". */
export interface ChecklistState {
  items: Record<string, true>;
  /** Only meaningful on plan weeks. */
  light?: boolean;
}

export interface AppData {
  version: 1;
  checklists: Record<string, ChecklistState>;
  freezer: FreezerItem[];
  /** Body details for nutrition targets. Absent until edited: DEFAULT_PROFILE applies. */
  profile?: Profile;
}

export const SETUP_SCOPE = 'setup';

export function emptyData(): AppData {
  return { version: 1, checklists: {}, freezer: [] };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function parseChecklist(v: unknown): ChecklistState | null {
  if (!isObject(v) || !isObject(v.items)) return null;
  const items: Record<string, true> = {};
  for (const [k, val] of Object.entries(v.items)) if (val === true) items[k] = true;
  return v.light === true ? { items, light: true } : { items };
}

function parseFreezerItem(v: unknown): FreezerItem | null {
  if (!isObject(v)) return null;
  const { id, name, recipeId, portions, frozenOn } = v;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof frozenOn !== 'string') {
    return null;
  }
  if (typeof portions !== 'number' || !Number.isFinite(portions) || portions <= 0) return null;
  return {
    id,
    name,
    recipeId: typeof recipeId === 'string' && isRecipeId(recipeId) ? recipeId : null,
    portions: Math.round(portions),
    frozenOn,
  };
}

const SEXES: readonly Sex[] = ['male', 'female'];
const ACTIVITIES: readonly Activity[] = ['sedentary', 'light', 'moderate', 'active'];
const GOALS: readonly Goal[] = ['lose', 'maintain', 'gain'];

const inRange = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

export function parseProfile(v: unknown): Profile | null {
  if (!isObject(v)) return null;
  const { sex, age, heightCm, weightKg, activity, goal } = v;
  if (!SEXES.includes(sex as Sex) || !ACTIVITIES.includes(activity as Activity)) return null;
  if (!GOALS.includes(goal as Goal)) return null;
  if (!inRange(age, 14, 100) || !inRange(heightCm, 120, 230) || !inRange(weightKg, 35, 250)) {
    return null;
  }
  return {
    sex: sex as Sex,
    age,
    heightCm,
    weightKg,
    activity: activity as Activity,
    goal: goal as Goal,
  };
}

/**
 * Validates untrusted stored data. Drops anything malformed instead of throwing,
 * so one bad entry can't lock someone out of the app.
 */
export function parseAppData(raw: unknown): AppData | null {
  if (!isObject(raw) || raw.version !== 1) return null;
  const data = emptyData();
  if (isObject(raw.checklists)) {
    for (const [key, value] of Object.entries(raw.checklists)) {
      const parsed = parseChecklist(value);
      if (parsed) data.checklists[key] = parsed;
    }
  }
  if (Array.isArray(raw.freezer)) {
    for (const entry of raw.freezer) {
      const parsed = parseFreezerItem(entry);
      if (parsed) data.freezer.push(parsed);
    }
  }
  const profile = parseProfile(raw.profile);
  if (profile) data.profile = profile;
  return data;
}
