import type { FreezerItem } from '../domain/freezer';
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
  return data;
}
