import { Link } from 'react-router';
import { plateMacros } from '../../domain/nutrition/meals';
import { serveGuide } from '../../domain/serving';
import type { Recipe, Side } from '../../domain/types';
import { NutritionLine } from './NutritionLine';

function SideList({ sides, recipe }: { sides: readonly Side[]; recipe: Recipe }) {
  return (
    <ul className="sides">
      {sides.map((s) => (
        <li key={s.name}>
          {s.recipeId && s.recipeId !== recipe.id ? (
            <Link className="linkbtn" to={`/recipes/${s.recipeId}`}>
              {s.name}
            </Link>
          ) : (
            <b>{s.name}</b>
          )}
          {s.note && <span className="muted">: {s.note}</span>}
        </li>
      ))}
    </ul>
  );
}

/** How to eat a dish: the plate, what goes with it, and freezer-to-plate steps. */
export function ServeSection({ recipe }: { recipe: Recipe }) {
  const guide = serveGuide(recipe.id);
  if (!guide) return null;
  return (
    <section className="card serve" aria-labelledby="serve-h">
      <h3 id="serve-h">How to eat it</h3>
      <p>{guide.howToEat}</p>
      <div className="serve-cols">
        <div className="stack" style={{ gap: 14 }}>
          {guide.plate.length > 0 && (
            <div>
              <h4>On the plate</h4>
              <SideList sides={guide.plate} recipe={recipe} />
              <NutritionLine label="Whole plate" macros={plateMacros(recipe.id)} />
            </div>
          )}
          {guide.sides.length > 0 && (
            <div>
              <h4>{guide.plate.length > 0 ? 'Also good with' : 'Goes well with'}</h4>
              <SideList sides={guide.sides} recipe={recipe} />
            </div>
          )}
        </div>
        {guide.thaw ? (
          <div className="note frost">
            <h4>From the freezer</h4>
            <p className="small">{guide.thaw}</p>
          </div>
        ) : (
          recipe.kind === 'tray' && (
            <div className="note">
              <h4>Fridge only</h4>
              <p className="small">
                Tray bakes don't go in the freezer. They live in the fridge and are finished by
                Wednesday lunch.
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
