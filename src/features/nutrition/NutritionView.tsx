import { type FormEvent, useId, useState } from 'react';
import { PLAN_DAY_NAMES } from '../../domain/calendar';
import { dayNutrition } from '../../domain/nutrition/meals';
import { macroStatus, type MacroKey } from '../../domain/nutrition/status';
import {
  ACTIVITY_LABEL,
  type Activity,
  GOAL_LABEL,
  type Goal,
  type Profile,
  type Targets,
} from '../../domain/nutrition/targets';
import { planDay } from '../../domain/plan';
import type { PlanDay } from '../../domain/types';
import { WeekSwitcher } from '../../components/WeekSwitcher';
import { useSelectedWeek } from '../../hooks/usePlan';
import { useTargets } from '../../hooks/useTargets';
import { useAppData, useStore } from '../../storage/context';
import { isLightWeek, profileOf } from '../../storage/selectors';

const DAYS: readonly PlanDay[] = [2, 3, 4, 5, 6, 0, 1];
const COLS: readonly MacroKey[] = ['kcal', 'protein', 'carbs', 'fat', 'fiber'];
const fmt = (n: number) => Math.round(n).toLocaleString('en-GB');

export function NutritionView() {
  const targets = useTargets();
  return (
    <>
      <section className="card" aria-labelledby="targets-h">
        <div className="card-h">
          <div>
            <div className="eyebrow">Your daily targets</div>
            <h2 id="targets-h">
              {fmt(targets.kcal)} kcal · {targets.protein} g protein
            </h2>
          </div>
        </div>
        <div className="target-tiles">
          <Tile value={fmt(targets.kcal)} label="kcal a day" />
          <Tile value={`${targets.protein} g`} label="protein" />
          <Tile value={`${targets.carbs} g`} label="carbs" />
          <Tile value={`${targets.fat} g`} label="fat" />
          <Tile value={`${targets.fiber} g+`} label="fibre" />
          <Tile value={`${targets.waterLitres} L`} label="water" />
        </div>
        <p className="muted small" style={{ marginTop: 12 }}>
          Your body burns about {fmt(targets.maintenance)} kcal a day ({fmt(targets.bmr)} at rest).{' '}
          {targets.weeklyChangeKg < 0
            ? `Eating ${fmt(targets.kcal)} a day, you'd lose about ${Math.abs(targets.weeklyChangeKg)} kg a week: slow enough to keep muscle and not feel starved.`
            : targets.weeklyChangeKg > 0
              ? `Eating ${fmt(targets.kcal)} a day, you'd gain about ${targets.weeklyChangeKg} kg a week, mostly muscle if you train.`
              : 'Eating this much keeps your weight steady.'}{' '}
          Calculated with the Mifflin-St Jeor formula. Treat it as a starting point, not a verdict.
        </p>
      </section>

      <div className="grid2">
        <ProfileForm />
        <section className="card">
          <div className="card-h">
            <h3>Check it's working</h3>
          </div>
          <ul className="rules">
            <li>
              Weigh yourself <b>once a week</b>, same morning, before breakfast. Daily numbers jump
              around with water and salt.
            </li>
            <li>
              Aim for about <b>{Math.abs(targets.weeklyChangeKg) || 0.4} kg a week</b>. Nothing
              after 3 weeks? Update your weight here, or skip the bread at dinner.
            </li>
            <li>
              Losing more than 1 kg a week, or always hungry? Add a snack. Faster isn't better.
            </li>
            <li>
              A desk job burns little. <b>A 30-minute walk</b> a day (7–8k steps) does as much as
              cutting 200 kcal, and helps digestion and heartburn too.
            </li>
          </ul>
        </section>
      </div>

      <WeekTable targets={targets} />

      <section className="card" aria-labelledby="beyond-h">
        <div className="card-h">
          <h3 id="beyond-h">Beyond the numbers</h3>
          <span className="eyebrow">what the plan covers, and what to add</span>
        </div>
        <div className="grid2">
          <ul className="rules">
            <li>
              <b>Vegetables:</b> 400 g+ a day from the stews, trays and a salad at most meals.
            </li>
            <li>
              <b>Fruit:</b> 1–2 a day in the snacks and breakfasts.
            </li>
            <li>
              <b>Calcium:</b> milk, yogurt, lben and cheese every day cover it.
            </li>
            <li>
              <b>Iron and B12:</b> beef twice a week plus lentils and beans.
            </li>
          </ul>
          <ul className="rules">
            <li>
              <b>Omega-3:</b> the plan has little fish. Twice a week, have a tin of sardines in
              olive oil on a kesra wedge for a weekend lunch. It's cheap, quick and high in protein.
            </li>
            <li>
              <b>Vitamin D:</b> 15 minutes of midday sun on your arms most days. Working indoors all
              day, it's easy to run low, so ask a doctor for a blood test if you're tired all the
              time.
            </li>
            <li>
              <b>Water:</b> about {targets.waterLitres} L a day. Keep a 1.5 L bottle on your desk
              and finish it by 5 pm.
            </li>
          </ul>
        </div>
        <p className="muted small" style={{ marginTop: 12 }}>
          Nutrition numbers are calculated from each recipe's ingredients using standard food
          tables. Brands and cuts vary, so read them as ±10%.
        </p>
      </section>
    </>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function ProfileForm() {
  const store = useStore();
  const saved = profileOf(useAppData());
  const [draft, setDraft] = useState<Profile>(saved);
  const [status, setStatus] = useState<'idle' | 'saved'>('idle');
  const ids = {
    sex: useId(),
    age: useId(),
    height: useId(),
    weight: useId(),
    activity: useId(),
    goal: useId(),
  };
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setStatus('idle');
  };
  const num = (v: string, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    store.setProfile(draft);
    setStatus('saved');
  };

  return (
    <section className="card" aria-labelledby="profile-h">
      <div className="card-h">
        <h3 id="profile-h">About you</h3>
        {status === 'saved' && (
          <span className="small muted" role="status">
            Saved. Targets updated.
          </span>
        )}
      </div>
      <form className="profile-form" onSubmit={submit}>
        <label htmlFor={ids.weight}>
          Weight (kg)
          <input
            id={ids.weight}
            type="number"
            inputMode="decimal"
            min={35}
            max={250}
            step={0.1}
            value={draft.weightKg}
            onChange={(e) => set('weightKg', num(e.target.value, draft.weightKg))}
          />
        </label>
        <label htmlFor={ids.height}>
          Height (cm)
          <input
            id={ids.height}
            type="number"
            inputMode="numeric"
            min={120}
            max={230}
            value={draft.heightCm}
            onChange={(e) => set('heightCm', num(e.target.value, draft.heightCm))}
          />
        </label>
        <label htmlFor={ids.age}>
          Age
          <input
            id={ids.age}
            type="number"
            inputMode="numeric"
            min={14}
            max={100}
            value={draft.age}
            onChange={(e) => set('age', num(e.target.value, draft.age))}
          />
        </label>
        <label htmlFor={ids.sex}>
          Sex
          <select
            id={ids.sex}
            value={draft.sex}
            onChange={(e) => set('sex', e.target.value as Profile['sex'])}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label htmlFor={ids.activity}>
          Activity
          <select
            id={ids.activity}
            value={draft.activity}
            onChange={(e) => set('activity', e.target.value as Activity)}
          >
            {(Object.keys(ACTIVITY_LABEL) as Activity[]).map((a) => (
              <option key={a} value={a}>
                {ACTIVITY_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={ids.goal}>
          Goal
          <select
            id={ids.goal}
            value={draft.goal}
            onChange={(e) => set('goal', e.target.value as Goal)}
          >
            {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
              <option key={g} value={g}>
                {GOAL_LABEL[g]}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" type="submit">
          Save
        </button>
      </form>
    </section>
  );
}

function WeekTable({ targets }: { targets: Targets }) {
  const data = useAppData();
  const { rotation, planWeek } = useSelectedWeek();
  const light = isLightWeek(data, planWeek);
  const rows = DAYS.map((day) => ({
    day,
    ...dayNutrition(planDay({ rotation, day, light, planWeek })),
  }));

  return (
    <section className="card" aria-labelledby="week-numbers-h">
      <div className="card-h">
        <h3 id="week-numbers-h">How the plan adds up, day by day</h3>
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <WeekSwitcher />
      </div>
      <div className="table-wrap">
        <table className="week-table">
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">kcal</th>
              <th scope="col">Protein</th>
              <th scope="col">Carbs</th>
              <th scope="col">Fat</th>
              <th scope="col">Fibre</th>
              <th scope="col">Not counted</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Target</th>
              {COLS.map((k) => (
                <td key={k}>
                  {fmt(targets[k])}
                  {k !== 'kcal' && ' g'}
                </td>
              ))}
              <td />
            </tr>
            {rows.map((r) => (
              <tr key={r.day}>
                <th scope="row">{PLAN_DAY_NAMES[r.day]}</th>
                {COLS.map((k) => {
                  const partial = r.uncounted.length > 0;
                  const s = partial ? 'ok' : macroStatus(k, r.total[k], targets[k]);
                  return (
                    <td key={k} className={s === 'ok' ? '' : 'off'}>
                      {fmt(r.total[k])}
                      {k !== 'kcal' && ' g'}
                      {s !== 'ok' && ` (${s})`}
                    </td>
                  );
                })}
                <td className="note-cell">
                  {r.uncounted.length > 0
                    ? `${r.uncounted.join(', ')}: ~${fmt(Math.max(0, targets.kcal - r.total.kcal))} kcal left`
                    : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small" style={{ marginTop: 10 }}>
        Counted: every planned meal, snack and the sides on the plate (bread, salad, yogurt, lben).
        Free choices (Friday dinner, weekend freezer meals) show the calories left for them.
      </p>
    </section>
  );
}
