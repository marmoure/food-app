import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { RecipeCard } from '../components/RecipeCard';
import { RECIPES, RECIPE_MAP, ROLE_NAMES } from '../domain/recipes';
import { useStore } from '../storage/context';
import { useUI } from './ui-context';

const PAGE_SIZE = 24;
export function Recipes() {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const query = params.get('q') ?? '';
  const filter = params.get('role') ?? 'all';
  const favorites = params.get('saved') === 'true';
  const category = params.get('category') ?? '';
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setLimit(PAGE_SIZE);
  }
  const recipes = RECIPES.filter(
    (r) =>
      (filter === 'all' || r.slot === filter) &&
      (!category || r.category === category) &&
      (!favorites || data.favorites.includes(r.id)) &&
      `${r.name} ${r.cuisine} ${r.bestWith} ${r.category}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE FROZEN GOODS COLLECTION</p>
          <h1>Cook something worth freezing.</h1>
          <p className="muted">
            {RECIPES.length} cube-ready recipes. Your next favorite is in here.
          </p>
        </div>
        <span className="library-badge">
          <Icon name="book" size={18} />
          Local recipe library
        </span>
      </div>
      <div className="library-banner">
        <div className="mini-cubes">
          <i />
          <i />
          <i />
        </div>
        <p>
          <strong>Made for your mix-and-match freezer.</strong>
          <span>
            Fully cook each dish, freeze in molds, and combine the labeled servings when you eat.
          </span>
        </p>
        <span className="tag">125 ml & 250 ml molds</span>
      </div>
      <div className="filter-toolbar">
        <label className="search-field">
          <Icon name="search" size={18} />
          <input
            aria-label="Search recipes"
            placeholder="Search a dish, cuisine, or ingredient in the title…"
            value={query}
            onChange={(event) => change('q', event.target.value)}
          />
        </label>
        <select
          aria-label="Recipe category"
          value={category}
          onChange={(event) => change('category', event.target.value)}
        >
          <option value="">All categories</option>
          {[...new Set(RECIPES.map((r) => r.category))].sort().map((c) => (
            <option key={c} value={c}>
              {c.replace('-', ' ')}
            </option>
          ))}
        </select>
        <button
          className={`button secondary ${favorites ? 'selected-button' : ''}`}
          aria-pressed={favorites}
          onClick={() => change('saved', favorites ? '' : 'true')}
        >
          <Icon name="heart" size={17} />
          Saved ({data.favorites.length})
        </button>
      </div>
      <div className="filter-pills">
        {[
          'all',
          'protein',
          'starch',
          'veg',
          'breakfast',
          'snack',
          'full-meal',
          'soup',
          'side',
          'basic',
        ].map((role) => (
          <button
            key={role}
            aria-pressed={filter === role}
            className={filter === role ? 'active' : ''}
            onClick={() => change('role', role)}
          >
            {role === 'all' ? 'All recipes' : ROLE_NAMES[role]}
          </button>
        ))}
      </div>
      <div className="result-count">
        <span>
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          {query ? ` for “${query}”` : ''}
        </span>
        <span>Nutrition per recipe serving</span>
      </div>
      {recipes.length ? (
        <>
          <div className="recipe-grid">
            {recipes.slice(0, limit).map((recipe) => (
              <RecipeCard recipe={recipe} key={recipe.id} />
            ))}
          </div>
          {recipes.length > limit && (
            <div className="load-more">
              <button className="button secondary" onClick={() => setLimit(limit + PAGE_SIZE)}>
                Show more recipes ({recipes.length - limit} remaining)
                <Icon name="plus" size={17} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state panel">
          <Icon name={favorites ? 'heart' : 'search'} size={32} />
          <h2>{favorites && !query ? 'Keep your favorites close.' : 'No recipes found.'}</h2>
          <p>
            {favorites && !query
              ? 'Tap a recipe’s heart to save it for your next batch.'
              : 'Try another dish, cuisine, or category.'}
          </p>
          <button
            className="button secondary"
            onClick={() => {
              setParams({});
              setLimit(PAGE_SIZE);
            }}
          >
            Browse all recipes
          </button>
        </div>
      )}
      <p className="source-caption">
        Adapted recipes from your frozen-goods library. Photos show the original source dishes;
        source credits are inside each recipe.
      </p>
    </>
  );
}

export function RecipeDetail() {
  const { id } = useParams();
  const recipe = RECIPE_MAP.get(id ?? '');
  const { data, update } = useStore();
  const { addBatch } = useUI();
  if (!recipe)
    return (
      <div className="empty-state">
        <h1>Recipe not found</h1>
        <Link to="/recipes" className="button primary">
          Browse the library
        </Link>
      </div>
    );
  const favorite = data.favorites.includes(recipe.id);
  const stock = data.batches
    .filter((batch) => batch.recipeId === recipe.id)
    .reduce((sum, b) => sum + b.remaining, 0);
  return (
    <>
      <Link className="back-link" to="/recipes">
        <Icon name="left" size={15} />
        Back to recipe library
      </Link>
      <div className="recipe-detail-hero">
        <div className="detail-image">
          {recipe.image && <img src={recipe.image} alt={recipe.photoTitle} />}
          <span className="photo-credit">
            Original-source photo
            {recipe.sourceUrl && (
              <>
                {' '}
                ·{' '}
                <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                  View source ↗
                </a>
              </>
            )}
          </span>
        </div>
        <div className="detail-intro">
          <span className={`tag role-${recipe.slot}`}>{ROLE_NAMES[recipe.slot]}</span>
          <p className="eyebrow">
            {recipe.cuisine} · {recipe.cooker}
          </p>
          <h1>{recipe.name}</h1>
          <p className="muted">{recipe.bestWith}</p>
          <div className="detail-nutrition">
            <div>
              <strong>{recipe.kcal}</strong>
              <span>kcal / serving</span>
            </div>
            <div>
              <strong>
                {recipe.protein}
                <small> g</small>
              </strong>
              <span>protein / serving</span>
            </div>
            <div>
              <strong>{recipe.portions}</strong>
              <span>servings / batch</span>
            </div>
          </div>
          <div className="detail-actions">
            <Link className="button primary" to={`/cook/${recipe.id}`}>
              <Icon name="book" size={17} />
              Cook step by step
            </Link>
            <button className="button secondary" onClick={() => addBatch(recipe.id)}>
              <Icon name="plus" size={17} />
              Log a frozen batch
            </button>
            <button
              className="button secondary"
              aria-pressed={favorite}
              onClick={() =>
                update((state) => ({
                  ...state,
                  favorites: favorite
                    ? state.favorites.filter((id) => id !== recipe.id)
                    : [...state.favorites, recipe.id],
                }))
              }
            >
              <Icon name="heart" size={17} />
              {favorite ? 'Saved' : 'Save recipe'}
            </button>
          </div>
          <p className="field-help">
            {stock} cubes in your freezer · {recipe.mouldMl} ml suggested mold
          </p>
        </div>
      </div>
      <div className="serving-note">
        <Icon name="cube" size={22} />
        <p>
          <strong>A serving and a cube are different things.</strong> This recipe makes{' '}
          {recipe.portions} servings. Weigh the finished batch, divide into servings, and count how
          many mold cavities each serving fills. The nutrition above is an ingredient estimate per
          serving.
        </p>
      </div>
      <div className="recipe-detail-layout">
        <div className="recipe-instructions">
          {recipe.sections
            .filter(
              (section) => !section.title.startsWith('Nutrition') && section.title !== 'Sources',
            )
            .map((section) => (
              <section className="instruction-section" key={section.title}>
                <h2>{section.title}</h2>
                <Markdown text={section.content} />
              </section>
            ))}
          <details className="nutrition-details">
            <summary>Nutrition calculation & ingredient estimates</summary>
            {recipe.sections
              .filter((section) => section.title.startsWith('Nutrition'))
              .map((section) => (
                <Markdown text={section.content} key={section.title} />
              ))}
          </details>
        </div>
        <aside className="recipe-sidebar">
          <div className="panel">
            <p className="eyebrow">THE CUBE ROUTINE</p>
            <h3>From batch to bowl.</h3>
            <ol className="routine-list">
              <li>
                <strong>Cook the whole recipe.</strong>
                <span>Use the method and adaptations on this page.</span>
              </li>
              <li>
                <strong>Portion & freeze.</strong>
                <span>Label the dish, freeze date, and cubes per serving.</span>
              </li>
              <li>
                <strong>Log your cubes.</strong>
                <span>Your monthly plan updates when you add stock.</span>
              </li>
              <li>
                <strong>Heat the labeled serving.</strong>
                <span>Follow this recipe’s reheating instructions.</span>
              </li>
            </ol>
            <button className="button primary full-width" onClick={() => addBatch(recipe.id)}>
              <Icon name="cube" size={17} />
              Add to my freezer
            </button>
          </div>
          <div className="panel source-panel">
            <h3>From your library</h3>
            <p>{recipe.source}</p>
            <a href={`/library/recipes/${recipe.source}`} download className="text-button">
              <Icon name="download" size={15} />
              Download recipe
            </a>
            {recipe.sourceUrl && (
              <a className="text-button" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                Original recipe & photo ↗
              </a>
            )}
            {recipe.videos.map((video, i) => (
              <a
                key={`${video.url}-${i}`}
                className="text-button"
                href={video.url}
                target="_blank"
                rel="noreferrer"
              >
                Watch: {video.title} ↗
              </a>
            ))}
            <p className="field-help">
              Source dishes and videos may differ from the adapted cube recipe.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
