import { type FormEvent, useId, useState } from 'react';
import { toIsoDate, weekKey } from '../../domain/calendar';
import {
  BATCH_TO_FREEZER,
  FREEZER_FULL_AT,
  FREEZER_LOW_BELOW,
  FREEZER_METER_MAX,
  ageInDays,
  freezerStatus,
  isStale,
  oldestFirst,
  totalPortions,
} from '../../domain/freezer';
import { RECIPES, isRecipeId } from '../../domain/recipes';
import { rotationWeek } from '../../domain/rotation';
import { usePosition } from '../../hooks/usePlan';
import { useToday } from '../../hooks/useToday';
import { useAppData, useStore } from '../../storage/context';
import { isChecked } from '../../storage/selectors';
import { BATCH_LOGGED_ITEM } from '../../storage/store';

const STATUS_TEXT = {
  low: 'Low: cook the full week',
  ok: 'Healthy',
  full: 'Full: take a light week',
} as const;

const FREEZABLE = Object.values(RECIPES).filter((r) => r.kind === 'stew' || r.kind === 'pot');
const OTHER = '_other';

export function FreezerView() {
  const store = useStore();
  const data = useAppData();
  const today = useToday();
  const { planWeek, rotation } = usePosition();
  const n = totalPortions(data.freezer);
  const status = freezerStatus(n);
  const key = weekKey(planWeek);
  const w = rotationWeek(rotation);
  const logged = isChecked(data, key, BATCH_LOGGED_ITEM);
  const zones = `${FREEZER_LOW_BELOW}fr ${FREEZER_FULL_AT - FREEZER_LOW_BELOW}fr ${FREEZER_METER_MAX - FREEZER_FULL_AT}fr`;

  return (
    <>
      <div className="grid2">
        <section className="card meter" aria-labelledby="fz-count">
          <div className="eyebrow" id="fz-count">
            Ready meals in the freezer
          </div>
          <div className="row" style={{ alignItems: 'baseline' }}>
            <span className="big mono">{n}</span>
            <span className="muted">portions</span>
            <span className={`status ${status}`}>{STATUS_TEXT[status]}</span>
          </div>
          <div
            className="meter-bar"
            style={{ gridTemplateColumns: zones }}
            role="img"
            aria-label={`${n} portions on a scale of 0 to ${FREEZER_METER_MAX}`}
          >
            <span className="z1" />
            <span className="z2" />
            <span className="z3" />
            <span
              className="meter-mark"
              style={{ left: `${(Math.min(n, FREEZER_METER_MAX) / FREEZER_METER_MAX) * 100}%` }}
            />
          </div>
          <div className="meter-scale" style={{ gridTemplateColumns: zones }}>
            <span>0–{FREEZER_LOW_BELOW - 1} low</span>
            <span>
              {FREEZER_LOW_BELOW}–{FREEZER_FULL_AT - 1} healthy
            </span>
            <span>{FREEZER_FULL_AT}+ light week</span>
          </div>
          <p className="muted small">
            A full week adds about 9 portions and you eat about 6, so the freezer slowly fills up.
            When it reaches {FREEZER_FULL_AT}, take a light week: cook only the tray bake and
            breakfasts, which takes about an hour.
          </p>
        </section>
        <section className="card" aria-labelledby="fz-add">
          <div className="card-h">
            <h3 id="fz-add">Add to the freezer</h3>
          </div>
          <div className="row" style={{ marginBottom: 14 }}>
            <button
              type="button"
              className="btn"
              disabled={logged}
              onClick={() => store.logBatch(rotation, key, toIsoDate(today))}
            >
              {logged
                ? `Week ${rotation + 1} batch logged`
                : `Log Week ${rotation + 1} batch: ${RECIPES[w.stew].short} ×${BATCH_TO_FREEZER.stew}, ${RECIPES[w.pot].short} ×${BATCH_TO_FREEZER.pot}`}
            </button>
          </div>
          <AddForm today={today} />
        </section>
      </div>
      <section className="card" aria-labelledby="fz-list">
        <div className="card-h">
          <h3 id="fz-list">What's in there</h3>
          <span className="eyebrow">oldest first, eat from the top</span>
        </div>
        {data.freezer.length > 0 ? (
          <ul className="fz-list">
            {oldestFirst(data.freezer).map((f) => {
              const age = ageInDays(f, today);
              const stale = isStale(f, today);
              return (
                <li key={f.id}>
                  <div>
                    <div className="fz-name">{f.name}</div>
                    <div className={`fz-age${stale ? ' old' : ''}`}>
                      frozen {f.frozenOn}
                      {age !== null &&
                        ` · ${age <= 0 ? 'today' : `${age} day${age === 1 ? '' : 's'} ago`}`}
                      {stale && ' · eat this soon'}
                    </div>
                  </div>
                  <div className="stepper">
                    <button
                      type="button"
                      aria-label={`Took one ${f.name} out`}
                      onClick={() => store.adjustFreezerItem(f.id, -1)}
                    >
                      −
                    </button>
                    <output>{f.portions}</output>
                    <button
                      type="button"
                      aria-label={`Add one ${f.name}`}
                      onClick={() => store.adjustFreezerItem(f.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty">
            Empty for now. After your first Sunday cook, tap <b>Log batch</b> and your stew and soup
            portions show up here.
          </div>
        )}
      </section>
    </>
  );
}

function AddForm({ today }: { today: Date }) {
  const store = useStore();
  const ids = { dish: useId(), other: useId(), n: useId(), date: useId() };
  const [dish, setDish] = useState<string>(FREEZABLE[0]?.id ?? OTHER);
  const [other, setOther] = useState('');
  const [portions, setPortions] = useState('2');
  const [date, setDate] = useState(() => toIsoDate(today));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const recipeId = isRecipeId(dish) ? dish : null;
    const name = recipeId ? RECIPES[recipeId].name : other.trim();
    if (!name) return;
    store.addFreezerItem({
      name,
      recipeId,
      portions: Math.max(1, Math.min(20, Math.round(Number(portions)) || 1)),
      frozenOn: date || toIsoDate(today),
    });
    setOther('');
  };

  return (
    <form className="form" onSubmit={submit}>
      <label htmlFor={ids.dish}>
        Dish
        <select id={ids.dish} value={dish} onChange={(e) => setDish(e.target.value)}>
          {FREEZABLE.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
          <option value={OTHER}>Something else…</option>
        </select>
      </label>
      {dish === OTHER && (
        <label htmlFor={ids.other}>
          Name
          <input
            id={ids.other}
            value={other}
            required
            placeholder="e.g. Mum's couscous"
            onChange={(e) => setOther(e.target.value)}
          />
        </label>
      )}
      <label htmlFor={ids.n}>
        Portions
        <input
          id={ids.n}
          type="number"
          min={1}
          max={20}
          value={portions}
          onChange={(e) => setPortions(e.target.value)}
        />
      </label>
      <label htmlFor={ids.date}>
        Frozen on
        <input id={ids.date} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <button className="btn" type="submit">
        Add
      </button>
    </form>
  );
}
