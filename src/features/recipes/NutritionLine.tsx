import type { Macros } from '../../domain/nutrition/macros';

/** One line of numbers: kcal and grams of each macro. */
export function NutritionLine({ label, macros }: { label: string; macros: Macros }) {
  const g = (n: number) => `${Math.round(n)} g`;
  return (
    <div className="nutri-row" style={{ marginTop: 8 }}>
      <span>{label}:</span>
      <span>
        <b>{Math.round(macros.kcal)}</b> kcal
      </span>
      <span>
        protein <b>{g(macros.protein)}</b>
      </span>
      <span>carbs {g(macros.carbs)}</span>
      <span>fat {g(macros.fat)}</span>
      <span>fibre {g(macros.fiber)}</span>
    </div>
  );
}
