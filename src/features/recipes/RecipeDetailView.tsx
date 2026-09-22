import { Link, useNavigate, useParams } from 'react-router';
import { RECIPES, isRecipeId } from '../../domain/recipes';
import { KIND_LABEL } from './labels';

export function RecipeDetailView() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  if (!isRecipeId(id)) {
    return (
      <div className="card">
        <h2>Recipe not found</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          That link doesn't match any recipe.{' '}
          <Link className="linkbtn" to="/recipes">
            See all recipes
          </Link>
        </p>
      </div>
    );
  }

  const r = RECIPES[id];
  return (
    <>
      <div className="row">
        <button
          type="button"
          className="btn ghost"
          // react-router keeps a history index; opened from a shared link there's nothing to go back to.
          onClick={() =>
            (window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/recipes')
          }
        >
          ← Back
        </button>
      </div>
      <article className="card recipe-detail">
        <div className="kind">
          {KIND_LABEL[r.kind]}
          {r.week && ` · Week ${r.week}`}
        </div>
        <h2>{r.name}</h2>
        {r.local && <div className="local">{r.local}</div>}
        <div className="meta">
          <span>
            <b>{r.serves}</b> {r.yieldUnit}
          </span>
          <span>{r.time}</span>
          <span>{r.where}</span>
          {r.temp && <span>Oven {r.temp}</span>}
        </div>
        <div className="note frost small">
          <b>Keeps:</b> {r.keeps}
          <br />
          <b>Reheat:</b> {r.reheat}
        </div>
        <div className="detail-cols">
          <section aria-labelledby="ing-h">
            <h3 id="ing-h">Ingredients</h3>
            <ul className="ing">
              {r.ingredients.map((i) => (
                <li key={i.qty + i.item}>
                  <span className="q">{i.qty}</span>
                  <span>{i.item}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="steps-h">
            <h3 id="steps-h">Steps</h3>
            <ol className="rsteps">
              {r.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {r.alternative && <p className="note small">{r.alternative}</p>}
          </section>
        </div>
      </article>
    </>
  );
}
