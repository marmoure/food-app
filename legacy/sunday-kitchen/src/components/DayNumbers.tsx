import { Link } from 'react-router';
import { MACRO_KEYS } from '../domain/nutrition/macros';
import { dayNutrition } from '../domain/nutrition/meals';
import type { MealSlot } from '../domain/types';
import { useTargets } from '../hooks/useTargets';
import { Meter } from './Meter';

/** A day's planned nutrition against the targets, plus the budget left for free choices. */
export function DayNumbers({
  slots,
  title = "Today's numbers",
}: {
  slots: readonly MealSlot[];
  title?: string;
}) {
  const targets = useTargets();
  const { total, uncounted } = dayNutrition(slots);
  const left = Math.round(targets.kcal - total.kcal);
  return (
    <section className="card" aria-labelledby="day-numbers-h">
      <div className="card-h">
        <h3 id="day-numbers-h">{title}</h3>
        <Link className="linkbtn" to="/nutrition">
          Your targets
        </Link>
      </div>
      <div className="meters">
        {MACRO_KEYS.map((k) => (
          <Meter key={k} macro={k} value={total[k]} target={targets[k]} />
        ))}
      </div>
      {uncounted.length > 0 && (
        <p className="muted small" style={{ marginTop: 12 }}>
          Not counted: {uncounted.join(' and ').toLowerCase()} (your choice).{' '}
          {left > 150 ? (
            <>
              That leaves about <b>{left.toLocaleString('en-GB')} kcal</b> for{' '}
              {uncounted.length > 1 ? 'them' : 'it'}.
            </>
          ) : (
            <>The planned meals already reach today's calories, so keep it light.</>
          )}
        </p>
      )}
    </section>
  );
}
