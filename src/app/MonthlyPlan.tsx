import { useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { daysInMonth, localDate, monthName, parseDate, shortDate } from '../domain/dates';
import { cookingNeeds, mealNutrition, projectPlan } from '../domain/planner';
import { recipeById } from '../domain/recipes';
import { SLOTS, SLOT_NAMES, type Meal } from '../domain/types';
import { useStore } from '../storage/context';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { useUI } from './ui-context';

export function MonthlyPlan() {
  const { data } = useStore();
  const { month, generate, editMeal, addBatch } = useUI();
  const [view, setView] = useState<'calendar' | 'agenda'>('calendar');
  const days = daysInMonth(month);
  const today = localDate();
  const meals = data.meals.filter((meal) => meal.date.startsWith(month));
  const projections = projectPlan(data).filter((entry) => entry.meal.date.startsWith(month));
  const covered = projections.filter((entry) => entry.missing.length === 0).length;
  const needs = cookingNeeds(data, month);
  const eaten = meals.filter((meal) => meal.eatenAt).length;
  const blanks = (parseDate(`${month}-01`).getDay() + 6) % 7;
  const plannedSlots = data.settings.slots.length * days.length;
  const status = (meal: Meal) =>
    meal.eatenAt
      ? 'eaten'
      : projections.find((entry) => entry.meal.id === meal.id)?.missing.length
        ? 'needs-cooking'
        : 'covered';
  function mealButton(meal: Meal) {
    const state = status(meal);
    return (
      <button
        className={`calendar-meal ${state}`}
        key={meal.id}
        onClick={() => editMeal(meal.date, meal.slot, meal.id)}
        aria-label={`${SLOT_NAMES[meal.slot]} ${shortDate(meal.date)}: ${recipeById(meal.components[0]!.recipeId).name}, ${state.replace('-', ' ')}`}
      >
        <span className="calendar-meal-label">
          {SLOT_NAMES[meal.slot]}
          {meal.eatenAt && <Icon name="check" size={11} />}
        </span>
        <strong>{recipeById(meal.components[0]!.recipeId).name}</strong>
        {meal.components.length > 1 && <small>+ {meal.components.length - 1} components</small>}
      </button>
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A MONTH OF MIX, HEAT & EAT</p>
          <h1>Your month, made easier.</h1>
          <p className="muted">Breakfast, lunch, dinner, and snacks. Planned around your cubes.</p>
        </div>
        <button className="button primary" onClick={generate}>
          <Icon name="sparkles" size={18} />
          Build monthly plan
        </button>
      </div>
      <div className="plan-overview">
        <div>
          <strong>
            {meals.length}
            <span> / {plannedSlots}</span>
          </strong>
          <p>eating slots planned</p>
        </div>
        <div>
          <strong>{covered}</strong>
          <p>covered by freezer stock</p>
        </div>
        <div>
          <strong>{projections.length - covered}</strong>
          <p>need some cooking</p>
        </div>
        <div>
          <strong>{eaten}</strong>
          <p>meals enjoyed</p>
        </div>
      </div>
      <section className="calendar-panel panel">
        <div className="calendar-toolbar">
          <MonthSwitcher />
          <div className="calendar-toolbar-right">
            <div className="view-switch" aria-label="Plan display">
              <button aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>
                Calendar
              </button>
              <button aria-pressed={view === 'agenda'} onClick={() => setView('agenda')}>
                Agenda
              </button>
            </div>
            <button
              className="button secondary small-button"
              onClick={() => editMeal(today.startsWith(month) ? today : `${month}-01`)}
            >
              <Icon name="plus" size={16} />
              Add meal
            </button>
          </div>
        </div>
        <div className="calendar-legend">
          <span>
            <i className="legend-dot covered" />
            In the freezer
          </span>
          <span>
            <i className="legend-dot needs-cooking" />
            Needs cooking
          </span>
          <span>
            <i className="legend-dot eaten" />
            Eaten
          </span>
          <small>Each cube is allocated once, in date order.</small>
        </div>
        {!meals.length && (
          <div className="calendar-empty">
            <Icon name="sparkles" size={20} />
            <p>
              <strong>A blank month is full of possibilities.</strong> Choose a few recipes and let
              us fill the calendar.
            </p>
            <button className="text-button" onClick={generate}>
              Build a plan <Icon name="arrow" size={15} />
            </button>
          </div>
        )}
        <div className={`month-calendar ${view === 'agenda' ? 'hide-calendar' : ''}`}>
          <div className="weekday-row">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: blanks }, (_, i) => (
              <div className="calendar-day outside-month" key={`blank-${i}`} />
            ))}
            {days.map((date) => {
              const dayMeals = meals
                .filter((meal) => meal.date === date)
                .sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));
              return (
                <div className={`calendar-day ${date === today ? 'is-today' : ''}`} key={date}>
                  <div className="calendar-date">
                    <span>{parseDate(date).getDate()}</span>
                    <button
                      className="icon-button"
                      aria-label={`Add meal for ${shortDate(date)}`}
                      onClick={() =>
                        editMeal(
                          date,
                          SLOTS.find((slot) => !dayMeals.some((m) => m.slot === slot)) ?? 'lunch',
                        )
                      }
                    >
                      <Icon name="plus" size={13} />
                    </button>
                  </div>
                  {dayMeals.map(mealButton)}
                  {dayMeals.length === 0 && (
                    <button
                      className="empty-day-button"
                      onClick={() => editMeal(date, 'breakfast')}
                    >
                      Plan a meal
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className={`agenda ${view === 'agenda' ? 'show-agenda' : ''}`}>
          {days.map((date) => {
            const dayMeals = meals
              .filter((m) => m.date === date)
              .sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));
            const total = dayMeals.reduce((sum, m) => sum + mealNutrition(m.components).kcal, 0);
            return (
              <section key={date} className={`agenda-day ${date === today ? 'is-today' : ''}`}>
                <header>
                  <strong>
                    {parseDate(date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </strong>
                  {dayMeals.length > 0 && <span>{Math.round(total)} kcal planned · estimated</span>}
                  <button
                    className="icon-button"
                    aria-label={`Add meal on ${date}`}
                    onClick={() =>
                      editMeal(
                        date,
                        SLOTS.find((slot) => !dayMeals.some((m) => m.slot === slot)) ?? 'lunch',
                      )
                    }
                  >
                    <Icon name="plus" size={17} />
                  </button>
                </header>
                <div>
                  {dayMeals.length ? (
                    dayMeals.map(mealButton)
                  ) : (
                    <p className="muted small">Nothing planned yet.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
      <section className="cooking-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TURN YOUR PLAN INTO A STOCKED FREEZER</p>
            <h2>Cook for {monthName(month).split(' ')[0]}</h2>
            <p>Shortages after allocating usable stock across your plans.</p>
          </div>
          <span className="count-label">{needs.length} recipes to cook</span>
        </div>
        {needs.length ? (
          <>
            <div className="cooking-grid">
              {needs.map(({ recipe, servings, batches }) => (
                <article className="cooking-card" key={recipe.id}>
                  <img src={recipe.image} alt="" loading="lazy" />
                  <div>
                    <h3>
                      <Link to={`/recipes/${recipe.id}`}>{recipe.name}</Link>
                    </h3>
                    <p>
                      <strong>{servings} servings needed</strong> · {batches} full{' '}
                      {batches === 1 ? 'batch' : 'batches'}
                    </p>
                    <small>
                      {recipe.portions} servings per recipe batch. Cube yield measured after
                      cooking.
                    </small>
                    <div>
                      <Link to={`/recipes/${recipe.id}`} className="text-button">
                        View recipe <Icon name="arrow" size={14} />
                      </Link>
                      <button className="text-button" onClick={() => addBatch(recipe.id)}>
                        <Icon name="plus" size={14} />
                        Log frozen batch
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="field-help">
              Full-batch counts round up and can leave extra servings. Log each batch with its
              actual freeze date and cube yield; the calendar will recalculate coverage.
            </p>
          </>
        ) : (
          <div className="cooking-empty">
            <Icon name={meals.length ? 'check' : 'book'} />
            <span>
              {meals.length
                ? 'All remaining meals in this month are covered by usable stock.'
                : 'Build your plan to see which recipes and how many servings to cook.'}
            </span>
          </div>
        )}
      </section>
    </>
  );
}
