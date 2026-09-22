import { Link } from 'react-router';
import {
  PLAN_DAY_NAMES,
  addDays,
  formatDate,
  formatWeekRange,
  weekStart,
} from '../../domain/calendar';
import { planDay } from '../../domain/plan';
import { RECIPES } from '../../domain/recipes';
import { rotationWeek } from '../../domain/rotation';
import type { PlanDay } from '../../domain/types';
import { LightWeekToggle } from '../../components/LightWeekToggle';
import { SourceChip } from '../../components/SourceChip';
import { WeekSwitcher } from '../../components/WeekSwitcher';
import { usePosition, useSelectedWeek } from '../../hooks/usePlan';
import { useAppData } from '../../storage/context';
import { isLightWeek } from '../../storage/selectors';

const DAYS: readonly PlanDay[] = [0, 1, 2, 3, 4, 5, 6];

export function WeekView() {
  const position = usePosition();
  const { rotation, planWeek } = useSelectedWeek();
  const light = isLightWeek(useAppData(), planWeek);
  const w = rotationWeek(rotation);
  const todayDay = position.started && planWeek === position.planWeek ? position.day : null;

  return (
    <>
      <div className="row">
        <WeekSwitcher />
        <LightWeekToggle planWeek={planWeek} />
      </div>
      <div className="card">
        <div className="card-h">
          <div>
            <div className="eyebrow">
              Week {rotation + 1} · {formatWeekRange(planWeek)}
            </div>
            <h2>
              {RECIPES[w.stew].short} · {RECIPES[w.pot].short} · {RECIPES[w.tray].short}
            </h2>
          </div>
        </div>
        <div className="legend">
          <SourceChip source="fridge" />
          <span className="small muted">cooked Sunday, reheat</span>
          <SourceChip source="freezer" />
          <span className="small muted">moved to the fridge the night before</span>
          <SourceChip source="fresh" />
          <span className="small muted">cook on the day</span>
          <SourceChip source="free" />
          <span className="small muted">planned night off</span>
        </div>
      </div>
      <div className="days">
        {DAYS.map((day) => (
          <div className={`day${day === todayDay ? ' is-today' : ''}`} key={day}>
            <div className="day-h">
              <b>{PLAN_DAY_NAMES[day]}</b>
              <span>
                {formatDate(addDays(weekStart(planWeek), day), { day: 'numeric', month: 'short' })}
              </span>
            </div>
            {planDay({ rotation, day, light, planWeek }).map((s) => (
              <div className={`cell ${s.source}`} key={s.slot}>
                <i>{s.slot}</i>
                {s.recipeId ? (
                  <Link className="cell-link" to={`/recipes/${s.recipeId}`}>
                    {s.dish}
                  </Link>
                ) : (
                  s.dish
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Why it's arranged this way</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            Cooked food is safe in the fridge for 3–4 days, so Monday to Wednesday eat from the
            fridge. Thursday and Friday meals go into the freezer on Sunday and move to the fridge
            on Wednesday and Thursday nights. The tray bake only goes in the fridge because roasted
            potatoes don't freeze well.
          </p>
        </div>
        <div className="card">
          <h3>This week's carbs</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            {w.carbNote}
          </p>
        </div>
      </div>
    </>
  );
}
