import { Link } from 'react-router';
import { Icon, type IconName } from '../components/Icon';
import { RecipeCard } from '../components/RecipeCard';
import { daysInMonth, localDate, monthName } from '../domain/dates';
import { cookingNeeds, projectPlan } from '../domain/planner';
import { FEATURED, recipeById } from '../domain/recipes';
import { SLOT_NAMES } from '../domain/types';
import { useStore } from '../storage/context';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { useUI } from './ui-context';

export function Dashboard() {
  const { data } = useStore();
  const { month, generate, editMeal, addBatch } = useUI();
  const cubes = data.batches.reduce((sum, b) => sum + b.remaining, 0);
  const monthly = data.meals.filter((meal) => meal.date.startsWith(month));
  const ready = projectPlan(data).filter(
    (entry) => entry.meal.date.startsWith(month) && !entry.missing.length,
  ).length;
  const needs = cookingNeeds(data, month);
  const today = localDate();
  const meals = data.meals.filter((meal) => meal.date === today);
  const days = new Set(monthly.map((meal) => meal.date)).size;
  const stats: { title: string; value: number; detail: string; icon: IconName; color: string }[] = [
    {
      title: 'Cubes in the freezer',
      value: cubes,
      detail: `${data.batches.filter((b) => b.remaining > 0).length} stocked batches`,
      icon: 'cube',
      color: 'green',
    },
    {
      title: 'Days on the calendar',
      value: days,
      detail: `of ${daysInMonth(month).length} days in ${monthName(month).split(' ')[0]}`,
      icon: 'calendar',
      color: 'blue',
    },
    {
      title: 'Meals covered by stock',
      value: ready,
      detail: `${monthly.filter((m) => !m.eatenAt).length} upcoming eating slots`,
      icon: 'check',
      color: 'orange',
    },
    {
      title: 'Servings still to cook',
      value: needs.reduce((n, need) => n + need.servings, 0),
      detail: `across ${needs.length} recipes`,
      icon: 'book',
      color: 'purple',
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A LITTLE PLANNING GOES A LONG WAY</p>
          <h1>Your kitchen, on autopilot.</h1>
          <p className="muted">Good food in the freezer. One less thing on your mind.</p>
        </div>
        <MonthSwitcher />
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span />
            THE MIX & MATCH WAY
          </span>
          <h2>
            Small cubes.
            <br />
            Big peace of mind.
          </h2>
          <p>
            Batch your favorites, fill your freezer, and build a month of meals you’ll look forward
            to.
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={generate}>
              <Icon name="calendar" size={18} />
              Plan my month
            </button>
            <Link className="text-button" to="/recipes">
              Explore recipes <Icon name="arrow" size={16} />
            </Link>
          </div>
          <span className="hero-footnote">
            1 protein + 1 starch + 1 vegetable serving. Heat & enjoy.
          </span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="food-tile tile-protein">
            <img src={recipeById('chicken-chicken-karahi').image} alt="" />
            <span>PROTEIN</span>
          </div>
          <span className="art-plus plus-one">+</span>
          <div className="food-tile tile-starch">
            <img src={recipeById('starches-lime-coriander-rice').image} alt="" />
            <span>STARCH</span>
          </div>
          <span className="art-plus plus-two">+</span>
          <div className="food-tile tile-veg">
            <img src={recipeById('veg-ratatouille').image} alt="" />
            <span>VEGETABLES</span>
          </div>
          <div className="art-label">
            <Icon name="cube" size={18} />
            <span>YOUR EVERYDAY BOWL, SORTED.</span>
          </div>
          <span className="art-spark spark-one">✳</span>
          <span className="art-spark spark-two">✳</span>
        </div>
      </section>
      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.title}>
            <div className={`stat-icon ${stat.color}`}>
              <Icon name={stat.icon} />
            </div>
            <p>{stat.title}</p>
            <strong>
              {stat.value}
              <span>{stat.title === 'Cubes in the freezer' ? 'cubes' : ''}</span>
            </strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>On the menu today</h2>
              <p>
                {new Date().toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
            <Link className="text-button" to="/plan">
              Full calendar <Icon name="arrow" size={15} />
            </Link>
          </div>
          {meals.length ? (
            <div className="today-meals">
              {meals.map((meal) => (
                <button
                  key={meal.id}
                  className="today-meal"
                  aria-label={`${SLOT_NAMES[meal.slot]}${meal.eatenAt ? ' · Eaten' : ''} ${recipeById(meal.components[0]!.recipeId).name}`}
                  onClick={() => editMeal(meal.date, meal.slot, meal.id)}
                >
                  <span className={`meal-slot-icon ${meal.slot}`}>
                    <Icon
                      name={
                        meal.slot === 'dinner' ? 'moon' : meal.slot === 'snacks' ? 'leaf' : 'sun'
                      }
                      size={18}
                    />
                  </span>
                  <span>
                    <small>
                      {SLOT_NAMES[meal.slot]}
                      {meal.eatenAt ? ' · Eaten' : ''}
                    </small>
                    <strong>{recipeById(meal.components[0]!.recipeId).name}</strong>
                    <span>
                      {meal.components.length > 1
                        ? `+ ${meal.components.length - 1} other components`
                        : `${meal.components[0]!.servings} recipe serving(s)`}
                    </span>
                  </span>
                  <Icon name={meal.eatenAt ? 'check' : 'right'} size={17} />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-menu">
              <div className="empty-icon">
                <Icon name="calendar" size={27} />
              </div>
              <h3>A fresh start for your routine.</h3>
              <p>
                Plan breakfast, lunch, dinner, and snacks.
                <br />
                Your daily menu will be waiting right here.
              </p>
              <button className="button secondary" onClick={() => editMeal(today, 'breakfast')}>
                Add today’s first meal <Icon name="plus" size={16} />
              </button>
            </div>
          )}
        </section>
        <section className="panel getting-started">
          <div className="section-heading">
            <div>
              <h2>{cubes ? 'Your freezer rhythm' : 'Make future you happy'}</h2>
              <p>Three little steps to easier days.</p>
            </div>
            <Icon name="sparkles" />
          </div>
          <button className="step-row" onClick={() => addBatch()}>
            <span className={`step-number ${cubes ? 'done' : ''}`}>
              {cubes ? <Icon name="check" size={16} /> : '01'}
            </span>
            <span>
              <strong>Cook it. Cube it. Freeze it.</strong>
              <small>Log your first batch with actual cube counts.</small>
            </span>
            <Icon name="right" size={17} />
          </button>
          <button className="step-row" onClick={generate}>
            <span className={`step-number ${monthly.length ? 'done' : ''}`}>
              {monthly.length ? <Icon name="check" size={16} /> : '02'}
            </span>
            <span>
              <strong>Give your month a little structure.</strong>
              <small>Rotate your favorites and spot what’s missing.</small>
            </span>
            <Icon name="right" size={17} />
          </button>
          <Link className="step-row" to="/plan">
            <span className="step-number">03</span>
            <span>
              <strong>Mix, heat, eat. Repeat.</strong>
              <small>Mark meals eaten to keep your stock in sync.</small>
            </span>
            <Icon name="right" size={17} />
          </Link>
          <div className="small-note">
            <Icon name="leaf" size={16} />
            <p>Start with a few dishes you love. Build your freezer over time.</p>
          </div>
        </section>
      </div>
      <section className="recipe-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FROM YOUR FROZEN GOODS LIBRARY</p>
            <h2>Your next batch starts here</h2>
          </div>
          <Link className="text-button" to="/recipes">
            View all recipes <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="recipe-grid featured-grid">
          {FEATURED.map((id) => (
            <RecipeCard key={id} recipe={recipeById(id)} />
          ))}
        </div>
        <p className="source-caption">
          Original-source photos. Follow the adapted cube recipe inside. Nutrition is per recipe
          serving, not per cube.
        </p>
      </section>
    </>
  );
}
