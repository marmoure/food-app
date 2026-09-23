import { addDays, formatDate, toIsoDate, weekStart } from '../../domain/calendar';
import { BATCH_TO_FREEZER } from '../../domain/freezer';
import { RECIPES } from '../../domain/recipes';
import { rotationWeek } from '../../domain/rotation';
import { storagePlan, sundaySession, sundayStepItemId as stepItemId } from '../../domain/sunday';
import { LightWeekToggle } from '../../components/LightWeekToggle';
import { Progress } from '../../components/Progress';
import { RecipeLink } from '../../components/RecipeLink';
import { WeekSwitcher } from '../../components/WeekSwitcher';
import { useSelectedWeek } from '../../hooks/usePlan';
import { useToday } from '../../hooks/useToday';
import { useAppData, useStore } from '../../storage/context';
import { countChecked, isChecked, isLightWeek } from '../../storage/selectors';
import { BATCH_LOGGED_ITEM } from '../../storage/store';

function formatClock(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

export function SundayView() {
  const store = useStore();
  const data = useAppData();
  const today = useToday();
  const { rotation, planWeek, weekKey } = useSelectedWeek();
  const light = isLightWeek(data, planWeek);
  const { steps, totalMinutes } = sundaySession(rotation, light);
  const where = storagePlan(rotation, light);
  const w = rotationWeek(rotation);
  const logged = isChecked(data, weekKey, BATCH_LOGGED_ITEM);
  const done = countChecked(data, weekKey, steps.map(stepItemId));
  const sunday = addDays(weekStart(planWeek), 1);

  return (
    <>
      <div className="row">
        <WeekSwitcher />
        <LightWeekToggle planWeek={planWeek} />
      </div>
      <section className="card" aria-labelledby="sunday-title">
        <div className="card-h">
          <div>
            <div className="eyebrow">
              Sunday {formatDate(sunday, { day: 'numeric', month: 'short' })} · about{' '}
              {Math.floor(totalMinutes / 60)} h {totalMinutes % 60} min
              {light && ' · light week'}
            </div>
            <h2 id="sunday-title">Cook session, Week {rotation + 1}</h2>
          </div>
          <Progress done={done} total={steps.length} />
        </div>
        <p className="muted small" style={{ marginBottom: 6 }}>
          Times are from when you start. The multicooker, stove and oven run at the same time, so
          you're never waiting for one thing.
        </p>
        <ol className="steps">
          {steps.map((s) => {
            const id = `step-${weekKey}-${s.id}`;
            return (
              <li className="step" key={s.id}>
                <span className="t">{formatClock(s.startsAt)}</span>
                <input
                  type="checkbox"
                  id={id}
                  checked={isChecked(data, weekKey, stepItemId(s))}
                  onChange={(e) => store.setChecked(weekKey, stepItemId(s), e.target.checked)}
                  aria-label={`${s.title} done`}
                />
                <div className="body">
                  <label htmlFor={id}>
                    <b>{s.title}</b>
                    <span className="muted">{s.body}</span>
                  </label>{' '}
                  {s.recipeId && <RecipeLink id={s.recipeId} />}
                  {s.cutter && (
                    <dl className="cutter-groups">
                      {s.cutter.map((g) => (
                        <div key={g.head}>
                          <dt>{g.label}</dt>
                          <dd>{g.items.join(' · ')}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {s.logsBatch && (
                    <div className="row" style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn"
                        disabled={logged}
                        onClick={() => store.logBatch(rotation, weekKey, toIsoDate(today))}
                      >
                        {logged
                          ? 'Logged in the freezer'
                          : `Add ${RECIPES[w.stew].short} ×${BATCH_TO_FREEZER.stew} and ${RECIPES[w.pot].short} ×${BATCH_TO_FREEZER.pot} to the freezer`}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      <section className="card" aria-labelledby="sunday-where">
        <div className="card-h">
          <h3 id="sunday-where">Where everything goes</h3>
        </div>
        <div className="where">
          <div className="f1">
            <h4>Fridge · eye-level shelf</h4>
            <ul>
              {where.fridge.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="f2">
            <h4>Freezer · top shelf</h4>
            <ul>
              {where.freezer.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
