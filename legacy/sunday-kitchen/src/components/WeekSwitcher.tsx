import { addDays, formatDate, planWeekForRotation, weekStart } from '../domain/calendar';
import type { Rotation } from '../domain/types';
import { usePosition, useSelectedWeek } from '../hooks/usePlan';

const ROTATIONS: readonly Rotation[] = [0, 1, 2, 3];
const short = { day: 'numeric', month: 'short' } as const;

export function WeekSwitcher() {
  const position = usePosition();
  const { rotation, select } = useSelectedWeek();
  return (
    <div className="switch" role="group" aria-label="Rotation week">
      {ROTATIONS.map((r) => {
        const start = weekStart(planWeekForRotation(r, position));
        const now = position.started && r === position.rotation;
        return (
          <button
            key={r}
            type="button"
            className="wk"
            aria-pressed={r === rotation}
            onClick={() => select(r)}
          >
            <b>
              Week {r + 1}
              {now && ' · now'}
            </b>
            <span>
              {formatDate(start, short)} – {formatDate(addDays(start, 6), short)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
