import { Link, useSearchParams } from 'react-router';
import { RECIPES } from '../../domain/recipes';
import { PLAN_RECIPE_IDS, rotationWeek } from '../../domain/rotation';
import type { Recipe, RecipeId, RecipeKind } from '../../domain/types';
import { WeekSwitcher } from '../../components/WeekSwitcher';
import { useSelectedWeek } from '../../hooks/usePlan';
import { KIND_LABEL, planLabel } from './labels';

type Filter = 'week' | 'all' | 'extra' | Exclude<RecipeKind, 'snack'>;

const FILTERS: readonly { value: Filter; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'stew', label: 'Stews' },
  { value: 'pot', label: 'Soups & bakes' },
  { value: 'tray', label: 'Tray bakes' },
  { value: 'breakfast', label: 'Breakfast & snacks' },
  { value: 'basic', label: 'Basics' },
  { value: 'extra', label: 'Extras' },
  { value: 'all', label: 'All' },
];

function parseFilter(value: string | null): Filter {
  return FILTERS.some((f) => f.value === value) ? (value as Filter) : 'week';
}

const ALL = Object.values(RECIPES);

export function RecipesView() {
  const [params, setParams] = useSearchParams();
  const { rotation } = useSelectedWeek();
  const filter = parseFilter(params.get('filter'));
  const w = rotationWeek(rotation);

  let recipes: Recipe[];
  if (filter === 'week') {
    const ids: RecipeId[] = [w.stew, w.pot, w.tray, w.breakfast];
    if (w.snack) ids.push(w.snack);
    if (w.carb) ids.push(w.carb);
    recipes = ids.map((id) => RECIPES[id]);
  } else if (filter === 'all') {
    recipes = ALL;
  } else if (filter === 'extra') {
    recipes = ALL.filter((r) => !PLAN_RECIPE_IDS.has(r.id));
  } else {
    recipes = ALL.filter(
      (r) => r.kind === filter || (filter === 'breakfast' && r.kind === 'snack'),
    );
  }

  const setFilter = (value: Filter) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('filter', value);
        return next;
      },
      { replace: true },
    );

  return (
    <>
      <div className="row">
        <WeekSwitcher />
      </div>
      <div className="card">
        <div className="card-h">
          <h2>Recipes</h2>
          <div className="filters" role="group" aria-label="Filter recipes">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className="fchip"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
              >
                {f.value === 'week' ? `Week ${rotation + 1}` : f.label}
              </button>
            ))}
          </div>
        </div>
        <p className="muted small">
          Every recipe uses sweet paprika and nothing hot. Onion and garlic only go into things that
          cook for a long time, where they melt away. Leave them out if you like. Stews list
          pressure-cooker times, with slow-cooker and stove times underneath.
        </p>
        {filter === 'extra' && (
          <p className="muted small">
            Extras aren't in the 4-week plan yet. Each one is portioned like the plan dish of the
            same kind, so it can take that dish's place.
          </p>
        )}
      </div>
      <div className="rgrid">
        {recipes.map((r) => (
          <article className="recipe" key={r.id}>
            <div>
              <div className="kind">
                {KIND_LABEL[r.kind]}
                {planLabel(r)}
              </div>
              <h3>
                <Link className="recipe-title" to={`/recipes/${r.id}`}>
                  {r.name}
                </Link>
              </h3>
              {r.local && <div className="local">{r.local}</div>}
            </div>
            <div className="meta">
              <span>
                <b>{r.serves}</b> {r.yieldUnit}
              </span>
              <span>{r.time}</span>
              <span>{r.where}</span>
            </div>
            <div className="note frost small">
              <b>Keeps:</b> {r.keeps}
            </div>
            <Link className="linkbtn" to={`/recipes/${r.id}`}>
              Ingredients & steps
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
