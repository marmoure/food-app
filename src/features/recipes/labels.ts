import type { RecipeKind } from '../../domain/types';

export const KIND_LABEL: Record<RecipeKind, string> = {
  stew: 'Multicooker stew',
  pot: 'Second batch',
  tray: 'Tray bake',
  breakfast: 'Breakfast',
  snack: 'Snack',
  basic: 'Basic',
};
