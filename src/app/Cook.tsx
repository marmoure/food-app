import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { cookingSteps, ingredientRows } from '../domain/cooking';
import { localDate } from '../domain/dates';
import { RECIPES, RECIPE_MAP } from '../domain/recipes';
import type { Recipe } from '../domain/types';
import { useStore } from '../storage/context';
import { useUI } from './ui-context';

const LAST_RECIPE = 'cube-kitchen:last-cook';
const VIEWS = ['Ingredients', 'Method', 'Freeze', 'Reheat'] as const;
type View = (typeof VIEWS)[number];
interface Progress {
  step: number;
  checked: number[];
  view: View;
  finished: boolean;
}
const progressKey = (id: string) => `cube-kitchen:cook:${id}`;
function readProgress(id: string, stepCount: number, ingredientCount: number): Progress {
  const fresh: Progress = { step: 0, checked: [], view: 'Ingredients', finished: false };
  try {
    const saved = JSON.parse(
      localStorage.getItem(progressKey(id)) ?? 'null',
    ) as Partial<Progress> | null;
    if (!saved) return fresh;
    return {
      step:
        typeof saved.step === 'number' && Number.isInteger(saved.step)
          ? Math.max(0, Math.min(saved.step, stepCount - 1))
          : 0,
      checked: Array.isArray(saved.checked)
        ? saved.checked.filter(
            (index) => Number.isInteger(index) && index >= 0 && index < ingredientCount,
          )
        : [],
      view: VIEWS.includes(saved.view as View) ? (saved.view as View) : 'Ingredients',
      finished: saved.finished === true,
    };
  } catch {
    return fresh;
  }
}
function lastRecipe() {
  try {
    return RECIPE_MAP.get(localStorage.getItem(LAST_RECIPE) ?? '');
  } catch {
    return undefined;
  }
}

function CookPicker() {
  const { data } = useStore();
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(12);
  const [recent] = useState(lastRecipe);
  const planned = new Set(
    data.meals
      .filter((meal) => !meal.eatenAt && meal.date >= localDate())
      .flatMap((meal) => meal.components.map((component) => component.recipeId)),
  );
  const score = (recipe: Recipe) =>
    (planned.has(recipe.id) ? 2 : 0) + (data.favorites.includes(recipe.id) ? 1 : 0);
  const recipes = RECIPES.filter((recipe) =>
    `${recipe.name} ${recipe.cuisine} ${recipe.category}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  ).sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
  return (
    <div className="phone-page">
      <div className="phone-heading">
        <p className="eyebrow">ONE STEP AT A TIME</p>
        <h1>Let’s get cooking.</h1>
        <p className="muted">Choose your recipe. We’ll keep your place.</p>
      </div>
      {recent && (
        <Link className="resume-cooking" to={`/cook/${recent.id}`}>
          <Icon name="book" size={26} />
          <div>
            <p className="eyebrow">LAST OPENED</p>
            <h2>{recent.name}</h2>
            <p>
              Resume recipe <Icon name="arrow" size={16} />
            </p>
          </div>
        </Link>
      )}
      <label className="cook-search">
        <Icon name="search" />
        <input
          type="search"
          aria-label="Find a recipe to cook"
          placeholder="Find a recipe to cook…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setLimit(12);
          }}
        />
      </label>
      <p className="cook-list-caption">
        {query
          ? `${recipes.length} recipes found`
          : 'Your planned meals and saved recipes come first.'}
      </p>
      <div className="cook-recipe-list">
        {recipes.slice(0, limit).map((recipe) => (
          <Link className="cook-recipe-option" key={recipe.id} to={`/cook/${recipe.id}`}>
            {recipe.image && <img src={recipe.image} alt="" loading="lazy" />}
            <div>
              <h2>{recipe.name}</h2>
              <p>
                {recipe.portions} servings · {recipe.cooker}
              </p>
              {planned.has(recipe.id) && <span>On your menu</span>}
            </div>
            <Icon name="right" size={18} />
          </Link>
        ))}
      </div>
      {!recipes.length && (
        <div className="empty-state panel">
          <h2>No recipes found.</h2>
          <p>Try a dish, ingredient in the name, or cuisine.</p>
          <button className="button secondary" onClick={() => setQuery('')}>
            Show all recipes
          </button>
        </div>
      )}
      {recipes.length > limit && (
        <button
          className="button secondary full-width cook-show-more"
          onClick={() => setLimit(limit + 12)}
        >
          Show more recipes
        </button>
      )}
    </div>
  );
}

function CookRecipe({ recipe }: { recipe: Recipe }) {
  const { addBatch } = useUI();
  const ingredients = recipe.sections.find((section) => section.title.startsWith('Ingredients'));
  const rows = ingredients ? ingredientRows(ingredients.content) : null;
  const method = recipe.sections.find((section) => section.title === 'Method')?.content ?? '';
  const steps = cookingSteps(method);
  const [progress, setProgress] = useState(() =>
    readProgress(recipe.id, steps.length, rows?.length ?? 0),
  );
  const [saveMessage, setSaveMessage] = useState('Your place is remembered on this device.');
  useEffect(() => {
    try {
      localStorage.setItem(LAST_RECIPE, recipe.id);
    } catch {
      /* Cooking works without storage. */
    }
  }, [recipe.id]);
  function save(next: Progress) {
    setProgress(next);
    try {
      localStorage.setItem(progressKey(recipe.id), JSON.stringify(next));
      setSaveMessage('Progress saved on this device.');
    } catch {
      setSaveMessage('Progress stays open here, but could not be saved on this device.');
    }
  }
  function goToStep(step: number) {
    save({ ...progress, step, finished: false });
    document.getElementById('cooking-instructions')?.scrollIntoView({ block: 'start' });
  }
  const section = recipe.sections.find((section) => section.title === progress.view);
  return (
    <div className="phone-page cook-page">
      <Link className="back-link" to="/cook">
        <Icon name="left" size={16} />
        Change recipe
      </Link>
      <header className="cook-recipe-header">
        <div>
          <p className="eyebrow">IN YOUR KITCHEN</p>
          <h1>{recipe.name}</h1>
          <p>
            {recipe.portions} servings per batch · {recipe.cooker}
          </p>
        </div>
        {recipe.image && <img src={recipe.image} alt={recipe.photoTitle} />}
      </header>
      <div className="cook-source-line">
        <Link className="text-button" to={`/recipes/${recipe.id}`}>
          Full recipe & source credits <Icon name="arrow" size={14} />
        </Link>
      </div>
      <div className="cook-tabs" aria-label="Recipe sections">
        {VIEWS.map((view) => (
          <button
            key={view}
            aria-pressed={progress.view === view}
            onClick={() => save({ ...progress, view })}
          >
            {view}
          </button>
        ))}
      </div>
      <section id="cooking-instructions" className="cook-instructions" aria-label={progress.view}>
        {progress.view === 'Ingredients' && (
          <>
            <div className="cook-section-heading">
              <div>
                <h2>Get everything ready.</h2>
                <p>Amounts for one full batch · {recipe.portions} servings</p>
              </div>
              <Icon name="check" />
            </div>
            {rows ? (
              <>
                <p className="ingredient-count" role="status">
                  {progress.checked.length} of {rows.length} ingredients ready
                </p>
                <div className="ingredient-checklist">
                  {rows.map((row, index) => (
                    <label
                      key={index}
                      className={progress.checked.includes(index) ? 'is-checked' : ''}
                    >
                      <input
                        type="checkbox"
                        checked={progress.checked.includes(index)}
                        onChange={() =>
                          save({
                            ...progress,
                            checked: progress.checked.includes(index)
                              ? progress.checked.filter((item) => item !== index)
                              : [...progress.checked, index],
                          })
                        }
                      />
                      <span>
                        <Markdown text={row.name} />
                        <strong className="ingredient-amount">{row.amount}</strong>
                        {row.prep && <small>{row.prep}</small>}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <Markdown text={ingredients?.content ?? 'See the full recipe for ingredients.'} />
            )}
            {recipe.sections
              .filter((section) => section.title === 'Local supplies and substitutions')
              .map((section) => (
                <details className="cook-notes" key={section.title}>
                  <summary>{section.title}</summary>
                  <Markdown text={section.content} />
                </details>
              ))}
            <button
              className="button primary full-width"
              onClick={() => save({ ...progress, view: 'Method' })}
            >
              Start cooking <Icon name="arrow" size={18} />
            </button>
          </>
        )}
        {progress.view === 'Method' && (
          <>
            <div className="cook-section-heading">
              <h2>{progress.finished ? 'Cooking complete.' : 'Follow along.'}</h2>
              <span>
                {progress.finished ? steps.length : progress.step + 1} / {steps.length}
              </span>
            </div>
            <progress
              className="cook-progress"
              aria-label="Recipe progress"
              value={progress.finished ? steps.length : progress.step}
              max={steps.length || 1}
            />
            {progress.finished ? (
              <div className="cooking-complete">
                <Icon name="check" size={36} />
                <h2>Time to portion & freeze.</h2>
                <p>Follow the freezing instructions, then log the cubes you actually made.</p>
                <button
                  className="button primary"
                  onClick={() => save({ ...progress, view: 'Freeze' })}
                >
                  See freezing instructions <Icon name="arrow" size={18} />
                </button>
                <button className="text-button" onClick={() => goToStep(steps.length - 1)}>
                  Back to last step
                </button>
              </div>
            ) : (
              <>
                <div className="cook-step" aria-live="polite" aria-atomic="true">
                  <p className="eyebrow">
                    STEP {progress.step + 1} OF {steps.length}
                  </p>
                  <Markdown text={steps[progress.step] ?? method} />
                </div>
                <div className="cook-step-actions">
                  <button
                    className="button secondary"
                    disabled={progress.step === 0}
                    onClick={() => goToStep(progress.step - 1)}
                  >
                    <Icon name="left" size={18} />
                    Previous
                  </button>
                  <button
                    className="button primary"
                    onClick={() => {
                      if (progress.step < steps.length - 1) goToStep(progress.step + 1);
                      else save({ ...progress, finished: true });
                    }}
                  >
                    {progress.step === steps.length - 1 ? 'Finish cooking' : 'Next step'}
                    <Icon name="right" size={18} />
                  </button>
                </div>
              </>
            )}
            <details className="cook-notes">
              <summary>See all instructions</summary>
              <Markdown text={method} />
            </details>
          </>
        )}
        {(progress.view === 'Freeze' || progress.view === 'Reheat') && (
          <>
            <div className="cook-section-heading">
              <h2>
                {progress.view === 'Freeze' ? 'Save some for later.' : 'From freezer to table.'}
              </h2>
              <Icon name={progress.view === 'Freeze' ? 'cube' : 'sun'} />
            </div>
            <Markdown text={section?.content ?? 'See the full recipe for instructions.'} />
            {progress.view === 'Freeze' && (
              <button className="button primary full-width" onClick={() => addBatch(recipe.id)}>
                <Icon name="plus" size={18} />
                Log a frozen batch
              </button>
            )}
            {progress.view === 'Reheat' && (
              <Link className="button primary full-width" to="/today">
                See today’s menu <Icon name="arrow" size={18} />
              </Link>
            )}
          </>
        )}
      </section>
      <div className="cook-progress-footer">
        <p role="status">{saveMessage}</p>
        <button
          className="text-button"
          onClick={() => save({ step: 0, checked: [], view: 'Ingredients', finished: false })}
        >
          Start a new batch
        </button>
      </div>
    </div>
  );
}

export function Cook() {
  const { id } = useParams();
  if (!id) return <CookPicker />;
  const recipe = RECIPE_MAP.get(id);
  if (!recipe)
    return (
      <div className="phone-page empty-state">
        <h1>Recipe not found</h1>
        <Link className="button primary" to="/cook">
          Choose a recipe
        </Link>
      </div>
    );
  return <CookRecipe key={recipe.id} recipe={recipe} />;
}
