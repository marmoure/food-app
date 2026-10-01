import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { localDate, parseDate, shortDate, validDate } from '../domain/dates';
import { allocateMeal, consumeMeal, mealNutrition, undoMeal } from '../domain/planner';
import { recipeById } from '../domain/recipes';
import { SLOTS, SLOT_NAMES, type Meal } from '../domain/types';
import { useStore } from '../storage/context';
import { useUI } from './ui-context';

function MealCard({ meal, next }: { meal: Meal; next: boolean }) {
  const { data, update } = useStore();
  const { editMeal } = useUI();
  const [error, setError] = useState('');
  const nutrition = mealNutrition(meal.components);
  const available = allocateMeal(data.batches, meal.components, localDate());
  const future = meal.date > localDate();
  function toggleEaten() {
    try {
      update((state) =>
        meal.eatenAt ? undoMeal(state, meal.id) : consumeMeal(state, meal.id, localDate()),
      );
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not update this meal.');
    }
  }
  return (
    <article
      className={`day-meal ${next ? 'next-meal' : ''} ${meal.eatenAt ? 'meal-eaten' : ''}`}
      aria-label={`${SLOT_NAMES[meal.slot]} ${shortDate(meal.date)}`}
    >
      <header className="day-meal-heading">
        <span className={`meal-slot-icon ${meal.slot}`}>
          <Icon name={meal.slot === 'dinner' ? 'moon' : meal.slot === 'snacks' ? 'leaf' : 'sun'} />
        </span>
        <h3>{SLOT_NAMES[meal.slot]}</h3>
        <span className="day-meal-badge">
          {meal.eatenAt ? 'Eaten' : next ? 'Up next' : 'Planned'}
        </span>
      </header>
      <div className="day-components">
        {meal.components.map((component) => {
          const recipe = recipeById(component.recipeId);
          const reheat = recipe.sections.find((section) => section.title === 'Reheat');
          return (
            <div className="day-component" key={component.recipeId}>
              <div className="day-component-title">
                {recipe.image && <img src={recipe.image} alt="" loading="lazy" />}
                <div>
                  <Link to={`/recipes/${recipe.id}`}>{recipe.name}</Link>
                  <p>
                    {component.servings} recipe {component.servings === 1 ? 'serving' : 'servings'}
                  </p>
                </div>
              </div>
              <div className="day-component-actions">
                {reheat && (
                  <details>
                    <summary>Reheat / serve</summary>
                    <Markdown text={reheat.content} />
                  </details>
                )}
                <Link className="text-button" to={`/cook/${recipe.id}`}>
                  Cook recipe <Icon name="right" size={15} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      <p className="day-nutrition">
        {Math.round(nutrition.kcal)} kcal · {Math.round(nutrition.protein)} g protein · estimated
        meal total
      </p>
      {!meal.eatenAt &&
        !future &&
        (available.missing.length ? (
          <p className="stock-note">
            Needs cooking:{' '}
            {available.missing
              .map((item) => `${item.servings} serving(s) of ${recipeById(item.recipeId).name}`)
              .join(', ')}
            .
          </p>
        ) : (
          <p className="stock-note ready">
            <Icon name="cube" size={16} /> Available now:{' '}
            {available.allocations.reduce((sum, allocation) => sum + allocation.cubes, 0)} cubes in
            the freezer.
          </p>
        ))}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <footer className="day-meal-actions">
        {!future && (
          <button
            className={`button ${meal.eatenAt ? 'secondary' : 'primary'}`}
            onClick={toggleEaten}
            disabled={!meal.eatenAt && available.missing.length > 0}
          >
            <Icon name="check" size={18} />
            {meal.eatenAt ? 'Undo eaten' : 'Mark eaten'}
          </button>
        )}
        <button
          className="button secondary"
          onClick={() => editMeal(meal.date, meal.slot, meal.id)}
        >
          {meal.eatenAt ? 'Meal details' : 'Edit meal'}
        </button>
      </footer>
    </article>
  );
}

export function Today() {
  const { data, status } = useStore();
  const { editMeal } = useUI();
  const [params, setParams] = useSearchParams();
  const [today, setToday] = useState(localDate);
  useEffect(() => {
    const refreshDate = () => setToday(localDate());
    const timer = window.setInterval(refreshDate, 60_000);
    window.addEventListener('focus', refreshDate);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshDate);
    };
  }, []);
  const requested = params.get('date');
  const date = validDate(requested) ? requested : today;
  const sorted = [...data.meals].sort(
    (a, b) => a.date.localeCompare(b.date) || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot),
  );
  const next = sorted.find((meal) => !meal.eatenAt && meal.date >= today);
  const meals = sorted.filter((meal) => meal.date === date);
  const eaten = meals.filter((meal) => meal.eatenAt).length;
  function selectDate(value: string) {
    setParams(value === today ? {} : { date: value });
  }
  function shiftDay(offset: number) {
    const day = parseDate(date);
    day.setDate(day.getDate() + offset);
    selectDate(localDate(day));
  }
  return (
    <div className="phone-page today-page">
      <div className="phone-heading">
        <p className="eyebrow">YOUR DAILY MENU</p>
        <h1>What’s on the menu?</h1>
        <p className="muted">A little less deciding. A little more enjoying.</p>
      </div>
      <section className="next-up" aria-label="Next meal">
        <span className="next-up-icon">
          <Icon name="clock" size={24} />
        </span>
        <div>
          <p className="eyebrow">NEXT UNEATEN MEAL</p>
          {next ? (
            <>
              <h2>
                {SLOT_NAMES[next.slot]} · {next.date === today ? 'today' : shortDate(next.date)}
              </h2>
              <p>
                {next.components
                  .map((component) => recipeById(component.recipeId).name)
                  .join(' + ')}
              </p>
              <button
                className="text-button"
                onClick={() => {
                  selectDate(next.date);
                  window.setTimeout(
                    () =>
                      document.getElementById(`day-${next.id}`)?.scrollIntoView({ block: 'start' }),
                    0,
                  );
                }}
              >
                View meal <Icon name="arrow" size={16} />
              </button>
            </>
          ) : (
            <>
              <h2>
                {meals.length && eaten === meals.length && date === today
                  ? 'All done for today.'
                  : 'Your next meal is a fresh start.'}
              </h2>
              <p>Add a meal to your plan and it will appear here.</p>
              <button className="text-button" onClick={() => editMeal(today)}>
                Plan a meal <Icon name="plus" size={16} />
              </button>
            </>
          )}
        </div>
      </section>
      <div className="day-picker">
        <button className="icon-button" aria-label="Previous day" onClick={() => shiftDay(-1)}>
          <Icon name="left" />
        </button>
        <label>
          <span>
            {date === today
              ? 'Today'
              : parseDate(date).toLocaleDateString('en-GB', { weekday: 'long' })}
          </span>
          <input
            aria-label="Menu date"
            type="date"
            value={date}
            onChange={(event) => {
              if (validDate(event.target.value)) selectDate(event.target.value);
            }}
          />
        </label>
        <button className="icon-button" aria-label="Next day" onClick={() => shiftDay(1)}>
          <Icon name="right" />
        </button>
      </div>
      <div className="day-summary">
        <span>
          {meals.length} {meals.length === 1 ? 'meal' : 'meals'} planned · {eaten} eaten
        </span>
        {date !== today && (
          <button className="text-button" onClick={() => selectDate(today)}>
            Back to today
          </button>
        )}
      </div>
      <div className="day-menu">
        {meals.map((meal) => (
          <div key={meal.id} id={`day-${meal.id}`}>
            <MealCard meal={meal} next={next?.id === meal.id} />
          </div>
        ))}
        {!meals.length && (
          <div className="panel empty-state">
            <Icon name="calendar" size={32} />
            <h2>Nothing planned for this day yet.</h2>
            <p>Pick something good from your recipe library.</p>
            <button className="button primary" onClick={() => editMeal(date)}>
              Add a meal
            </button>
          </div>
        )}
      </div>
      <div className="phone-page-actions">
        {meals.length > 0 && (
          <button
            className="button secondary"
            onClick={() =>
              editMeal(
                date,
                SLOTS.find((slot) => !meals.some((meal) => meal.slot === slot)),
              )
            }
          >
            Add a meal
          </button>
        )}
        <Link className="button secondary" to="/plan">
          Monthly plan <Icon name="arrow" size={16} />
        </Link>
      </div>
      <p className="phone-save-status" role="status">
        {status}. Reload to pick up changes from another device.
      </p>
    </div>
  );
}
