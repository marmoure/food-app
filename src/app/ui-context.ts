import { createContext, useContext } from 'react';
import type { Slot } from '../domain/types';

interface UI {
  month: string;
  setMonth: (month: string) => void;
  addBatch: (recipeId?: string, batchId?: string) => void;
  editMeal: (date: string, slot?: Slot, mealId?: string) => void;
  generate: () => void;
}
export const UIContext = createContext<UI | null>(null);
export function useUI() {
  const ui = useContext(UIContext);
  if (!ui) throw new Error('Missing UI context');
  return ui;
}
