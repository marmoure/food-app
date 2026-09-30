import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { formatDate, weekStart } from '../../domain/calendar';
import { SHOP_ITEM_PREFIX, rotationWeek, shopItemId as itemId } from '../../domain/rotation';
import { VEG_RUN_DAYS, VEG_RUN_DAY_LABEL, vegRunDate, vegRuns } from '../../domain/vegetables';
import { CheckItem } from '../../components/CheckItem';
import { VegCheckItem } from '../../components/VegCheckItem';
import { Progress } from '../../components/Progress';
import { WeekSwitcher } from '../../components/WeekSwitcher';
import { useSelectedWeek } from '../../hooks/usePlan';
import { useAppData, useStore } from '../../storage/context';
import { countChecked } from '../../storage/selectors';

export function ShoppingView() {
  const store = useStore();
  const data = useAppData();
  const { rotation, planWeek, weekKey } = useSelectedWeek();
  const w = rotationWeek(rotation);
  const ids = w.shopping.flatMap((sec, si) => sec.items.map((_, ii) => itemId(si, ii)));
  const done = countChecked(data, weekKey, ids);
  const veg = vegRuns(rotation);

  return (
    <>
      <div className="row">
        <WeekSwitcher />
      </div>
      <div className="card">
        <div className="card-h">
          <div>
            <div className="eyebrow">
              Saturday {formatDate(weekStart(planWeek), { day: 'numeric', month: 'short' })} · Week{' '}
              {rotation + 1}
            </div>
            <h2>Shopping list</h2>
          </div>
          <Progress done={done} total={ids.length} />
        </div>
        <p className="muted small">
          For one person, Monday to Friday plus the weekend. Spices and oil come from the pantry
          list in{' '}
          <Link className="linkbtn" to="/start">
            Start here
          </Link>
          . <b>Tonight:</b> {w.saturdayNote}
        </p>
        <p className="muted small">
          <b>Vegetables are never bought in bulk.</b> They come in one or two at a time from the
          Tuesday before: pick them yourself, clean them at home and put them away before you buy
          the next one. On Sunday they're ready for the cutter.
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          <ClearButton
            key={weekKey}
            onConfirm={() => store.clearChecked(weekKey, SHOP_ITEM_PREFIX)}
          />
        </div>
      </div>
      <div className="rgrid">
        {w.shopping.map((sec, si) =>
          sec.items.every((it) => it.veg) ? (
            <section className="card shopsec" key={sec.title} aria-label={sec.title}>
              <h3>
                {sec.title} <span className="prog">one at a time</span>
              </h3>
              {VEG_RUN_DAYS.map((day) => {
                const runs = veg.filter((r) => r.day === day);
                if (runs.length === 0) return null;
                return (
                  <div key={day}>
                    <div className="eyebrow veg-day">
                      {VEG_RUN_DAY_LABEL[day]}{' '}
                      {formatDate(vegRunDate(planWeek, day), { day: 'numeric', month: 'short' })}
                    </div>
                    <ul className="checks">
                      {runs.map((r) => (
                        <VegCheckItem key={r.itemId} planWeek={planWeek} scope={weekKey} run={r} />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
          ) : (
            <section className="card shopsec" key={sec.title} aria-label={sec.title}>
              <h3>{sec.title}</h3>
              <ul className="checks">
                {sec.items.map((it, ii) => (
                  <CheckItem
                    key={it.name}
                    scope={weekKey}
                    itemId={itemId(si, ii)}
                    label={it.name}
                    detail={it.detail}
                  />
                ))}
              </ul>
            </section>
          ),
        )}
      </div>
    </>
  );
}

/** Two-tap confirm instead of a blocking confirm() dialog. */
function ClearButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      className="btn ghost"
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else setArmed(true);
      }}
    >
      {armed ? 'Tap again to untick all' : 'Untick everything'}
    </button>
  );
}
