import { Link } from 'react-router';
import { PLAN_DAY_NAMES, formatDate, nextDay, rotationOf } from '../../domain/calendar';
import { totalPortions } from '../../domain/freezer';
import { type Task, planDay, tasksFor } from '../../domain/plan';
import { RECIPES } from '../../domain/recipes';
import { serveGuide } from '../../domain/serving';
import { rotationWeek } from '../../domain/rotation';
import { SETUP_ITEM_IDS } from '../../domain/setup';
import type { PlanDay, RecipeId } from '../../domain/types';
import { DayNumbers } from '../../components/DayNumbers';
import { RecipeLink } from '../../components/RecipeLink';
import { SourceChip } from '../../components/SourceChip';
import { usePosition } from '../../hooks/usePlan';
import { useToday } from '../../hooks/useToday';
import { useAppData } from '../../storage/context';
import { SETUP_SCOPE } from '../../storage/schema';
import { countChecked, isLightWeek } from '../../storage/selectors';

const DAY_TITLES: Record<PlanDay, string> = {
  0: 'Shopping day',
  1: 'Cook day',
  2: 'Monday: just reheat',
  3: 'Tuesday: just reheat',
  4: 'Wednesday: just reheat',
  5: 'Thursday: from the freezer',
  6: 'Friday: free night',
};

const TONE_CLASS: Record<Task['tone'], string> = {
  default: '',
  fresh: 'fresh',
  freezer: 'frost',
  warn: 'warn',
};

const longDate = { weekday: 'long', day: 'numeric', month: 'long' } as const;

export function TodayView() {
  const position = usePosition();
  return position.started ? <PlanDayView /> : <BeforeStartView />;
}

function BeforeStartView() {
  const today = useToday();
  const data = useAppData();
  const done = countChecked(data, SETUP_SCOPE, SETUP_ITEM_IDS);
  const w = rotationWeek(0);
  return (
    <>
      <div className="card hero">
        <div className="eyebrow">{formatDate(today, longDate)}</div>
        <h2>Week 1 starts Saturday. This week you get set up.</h2>
        <p className="muted">
          Buy the equipment and stock the pantry.{' '}
          <span className="mono">
            {done}/{SETUP_ITEM_IDS.length}
          </span>{' '}
          setup items done.
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          <Link className="btn" to="/start">
            Open the setup checklist
          </Link>
          <Link className="btn ghost" to="/week?week=1">
            See Week 1
          </Link>
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <div className="card-h">
            <h3>Your first weekend</h3>
            <span className="eyebrow">26–27 Sep</span>
          </div>
          <ul className="tasks">
            <li>
              <span className="dot fresh" />
              <span>
                <b>Saturday:</b> shop for Week 1 (
                <Link className="linkbtn" to="/shopping?week=1">
                  list
                </Link>
                ), then soak the white beans tonight.
              </span>
            </li>
            <li>
              <span className="dot" />
              <span>
                <b>Sunday:</b> cook {RECIPES[w.stew].short}, {RECIPES[w.pot].short},{' '}
                {RECIPES[w.tray].short} and overnight oats.{' '}
                <Link className="linkbtn" to="/sunday?week=1">
                  Step-by-step
                </Link>
              </span>
            </li>
            <li>
              <span className="dot frost" />
              <span>
                <b>Monday:</b> open the fridge and eat. No cooking until next Sunday.
              </span>
            </li>
          </ul>
        </div>
        <div className="card">
          <div className="card-h">
            <h3>Until then</h3>
          </div>
          <p className="muted">
            Don't aim for perfect this week. Eggs, bread, cheese, yogurt, fruit and a rotisserie
            chicken are fine. The system starts on Saturday.
          </p>
        </div>
      </div>
    </>
  );
}

function PlanDayView() {
  const today = useToday();
  const data = useAppData();
  const { planWeek, rotation, day } = usePosition();
  const isLight = (pw: number) => isLightWeek(data, pw);
  const light = isLight(planWeek);
  const slots = planDay({ rotation, day, light, planWeek });
  const tasks = tasksFor({ planWeek, day, isLight, freezerPortions: totalPortions(data.freezer) });
  const tm = nextDay(planWeek, day);
  const tomorrow = planDay({
    rotation: rotationOf(tm.planWeek),
    day: tm.day,
    light: isLight(tm.planWeek),
    planWeek: tm.planWeek,
  }).filter((s) => s.slot !== 'Snack');

  return (
    <>
      <div className="card hero">
        <div className="eyebrow">
          {formatDate(today, longDate)} · Week {rotation + 1}
          {light && ' · light week'}
        </div>
        <h2>{DAY_TITLES[day]}</h2>
      </div>
      <div className="grid2">
        <section className="card" aria-labelledby="today-meals">
          <div className="card-h">
            <h3 id="today-meals">What you eat today</h3>
          </div>
          <div className="slots">
            {slots.map((s) => (
              <div className="slot" key={s.slot}>
                <div className="when">{s.slot}</div>
                <div className="what">
                  <span className="dish">{s.dish}</span>
                  <SourceChip source={s.source} />
                  {s.recipeId && <RecipeLink id={s.recipeId} />}
                </div>
                {s.how && <div className="how">{s.how}</div>}
                {s.recipeId && s.slot !== 'Snack' && <SidesHint recipeId={s.recipeId} />}
              </div>
            ))}
          </div>
        </section>
        <div className="stack">
          <DayNumbers slots={slots} />
          <section className="card" aria-labelledby="today-jobs">
            <div className="card-h">
              <h3 id="today-jobs">Jobs today</h3>
            </div>
            {tasks.length > 0 ? (
              <ul className="tasks">
                {tasks.map((t) => (
                  <li key={t.title + (t.text ?? '')}>
                    <span className={`dot ${TONE_CLASS[t.tone]}`} />
                    <span>
                      <b>{t.title}</b> {t.text}{' '}
                      {t.link && (
                        <Link className="linkbtn" to={t.link.to}>
                          {t.link.label}
                        </Link>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Nothing. Eat, work, and don't think about food.</p>
            )}
          </section>
          <section className="card" aria-labelledby="today-tomorrow">
            <div className="card-h">
              <h3 id="today-tomorrow">Tomorrow</h3>
              <span className="eyebrow">{PLAN_DAY_NAMES[tm.day]}</span>
            </div>
            <div className="slots">
              {tomorrow.map((s) => (
                <div className="slot" key={s.slot}>
                  <div className="when">{s.slot}</div>
                  <div className="what">
                    <span>{s.dish}</span>
                    <SourceChip source={s.source} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function SidesHint({ recipeId }: { recipeId: RecipeId }) {
  const plate = serveGuide(recipeId)?.plate;
  if (!plate?.length) return null;
  return <div className="with">With: {plate.map((x) => x.name).join(' · ')}</div>;
}
