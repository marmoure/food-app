import { SETUP, SETUP_ITEM_IDS } from '../../domain/setup';
import { CheckItem } from '../../components/CheckItem';
import { Progress } from '../../components/Progress';
import { useAppData } from '../../storage/context';
import { SETUP_SCOPE } from '../../storage/schema';
import { countChecked } from '../../storage/selectors';

const RHYTHM = [
  { day: 'Sat', text: 'Shop', cls: 'r-shop' },
  { day: 'Sun', text: 'Cook ~2½ h', cls: 'r-cook' },
  { day: 'Mon', text: 'Fridge', cls: 'r-fridge' },
  { day: 'Tue', text: 'Fridge', cls: 'r-fridge' },
  { day: 'Wed', text: 'Fridge · move Thu meals at night', cls: 'r-fridge' },
  { day: 'Thu', text: 'Freezer', cls: 'r-freezer' },
  { day: 'Fri', text: 'Freezer · free dinner', cls: 'r-free' },
] as const;

const PREFERENCES = [
  'Halal',
  'No raw onion or garlic',
  'No vinegar',
  'Mild, never spicy',
  'About 1,700 kcal a day',
  '130 g protein',
  'Electric cutter for prep',
  'Works from home',
];

export function StartView() {
  const done = countChecked(useAppData(), SETUP_SCOPE, SETUP_ITEM_IDS);
  return (
    <>
      <section className="card">
        <div className="card-h">
          <div>
            <div className="eyebrow">How it works</div>
            <h2>Cook once a week and reheat the rest.</h2>
          </div>
        </div>
        <div className="rhythm">
          {RHYTHM.map((r) => (
            <div className={r.cls} key={r.day}>
              <b>{r.day}</b>
              <span>{r.text}</span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 14 }}>
          Every Sunday you make three things at the same time: a stew in the multicooker, a soup or
          bake on the stove or in the oven, and a tray bake in the oven. You also make breakfasts
          and snacks. The electric cutter slices and grates all the vegetables in one go. Stews and
          soups make 6 portions each. You eat some this week, and the rest builds up a freezer stock
          that gives you variety and the odd week off. The plan repeats every four weeks.
        </p>
      </section>
      <div className="grid2">
        <section className="card" aria-labelledby="setup-h">
          <div className="card-h">
            <h3 id="setup-h">Setup checklist</h3>
            <Progress done={done} total={SETUP_ITEM_IDS.length} />
          </div>
          {SETUP.map((g) => (
            <div key={g.title}>
              <div className="eyebrow" style={{ margin: '14px 0 2px' }}>
                {g.title}
              </div>
              <ul className="checks">
                {g.items.map((i) => (
                  <CheckItem
                    key={i.id}
                    scope={SETUP_SCOPE}
                    itemId={i.id}
                    label={i.label}
                    detail={i.detail}
                  />
                ))}
              </ul>
            </div>
          ))}
        </section>
        <div className="stack">
          <section className="card">
            <div className="card-h">
              <h3>Built around you</h3>
            </div>
            <div className="prefs">
              {PREFERENCES.map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
            <p className="muted small" style={{ marginTop: 10 }}>
              Salads are cucumber, tomato and pepper with olive oil and salt, or a yogurt-mint
              sauce. No vinaigrette anywhere.
            </p>
          </section>
          <section className="card">
            <div className="card-h">
              <h3>Food safety, the short version</h3>
            </div>
            <ul className="rules">
              <li>
                Cooked food lasts <b>4 days</b> in the fridge at most. That's why Thursday and
                Friday meals come from the freezer.
              </li>
              <li>
                Cool food within <b>2 hours</b> (rice within 1). Spread it out in open containers. A
                hot pot in the fridge warms everything around it.
              </li>
              <li>
                Thaw in the <b>fridge overnight</b>, never on the counter.
              </li>
              <li>Reheat until it's steaming all the way through, and only reheat once.</li>
              <li>
                Label every freezer box and eat it within <b>3 months</b>.
              </li>
            </ul>
          </section>
          <section className="card">
            <div className="card-h">
              <h3>Easy on heartburn</h3>
            </div>
            <ul className="rules">
              <li>Sweet paprika only. No harissa, no chili, no spicy cachir.</li>
              <li>Tomato is kept low because it's acidic, and carrots in the stews soften it.</li>
              <li>Roasted and baked, not deep-fried.</li>
              <li>
                Try to finish dinner 2–3 hours before bed. With the side hustle, set a fixed dinner
                time and keep late snacks small (yogurt, banana).
              </li>
              <li>Have coffee after food, not on an empty stomach.</li>
              <li>
                If heartburn happens several times a week, see a doctor. It's common and treatable.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
