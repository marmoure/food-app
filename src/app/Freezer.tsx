import { useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { daysBetween, localDate, shortDate } from '../domain/dates';
import { projectPlan } from '../domain/planner';
import { recipeById, ROLE_NAMES } from '../domain/recipes';
import { useStore } from '../storage/context';
import { useUI } from './ui-context';

export function Freezer() {
  const { data } = useStore();
  const { addBatch } = useUI();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [finished, setFinished] = useState(false);
  const today = localDate();
  const active = data.batches.filter((batch) => batch.remaining > 0);
  const reserved = new Map<string, number>();
  projectPlan(data).forEach((entry) =>
    entry.allocations.forEach((allocation) =>
      reserved.set(allocation.batchId, (reserved.get(allocation.batchId) ?? 0) + allocation.cubes),
    ),
  );
  const cubes = active.reduce((sum, batch) => sum + batch.remaining, 0);
  const attention = active.filter((batch) => daysBetween(today, batch.useBy) <= 7);
  const batches = data.batches
    .filter(
      (batch) =>
        (finished || batch.remaining > 0) &&
        (filter === 'all' || recipeById(batch.recipeId).slot === filter) &&
        `${recipeById(batch.recipeId).name} ${batch.location} ${batch.notes}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => a.useBy.localeCompare(b.useBy));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR READY-TO-HEAT RESERVE</p>
          <h1>Good things in store.</h1>
          <p className="muted">
            Every batch, every cube. Use the oldest first and keep dinner easy.
          </p>
        </div>
        <button className="button primary" onClick={() => addBatch()}>
          <Icon name="plus" />
          Freeze a batch
        </button>
      </div>
      <div className="inventory-summary">
        <div>
          <span className="stat-icon green">
            <Icon name="cube" />
          </span>
          <span>
            <strong>{cubes}</strong>
            <small>cubes in stock</small>
          </span>
        </div>
        <div>
          <span className="stat-icon blue">
            <Icon name="freezer" />
          </span>
          <span>
            <strong>{active.length}</strong>
            <small>active batches</small>
          </span>
        </div>
        <div>
          <span className="stat-icon purple">
            <Icon name="calendar" />
          </span>
          <span>
            <strong>{[...reserved.values()].reduce((sum, n) => sum + n, 0)}</strong>
            <small>cubes reserved in plans</small>
          </span>
        </div>
        <div>
          <span className="stat-icon orange">
            <Icon name="clock" />
          </span>
          <span>
            <strong>{attention.length}</strong>
            <small>batches to use or review</small>
          </span>
        </div>
      </div>
      {attention.length > 0 && (
        <div className="notice">
          <Icon name="clock" />
          <span>
            <strong>Check these first:</strong>{' '}
            {attention
              .slice(0, 3)
              .map((b) => recipeById(b.recipeId).name)
              .join(', ')}
            {attention.length > 3 ? ` + ${attention.length - 3} more` : ''}. Batches past their
            use-by date are excluded from meal coverage.
          </span>
        </div>
      )}
      <div className="filter-toolbar">
        <label className="search-field">
          <Icon name="search" size={18} />
          <input
            placeholder="Find a dish, drawer, or label…"
            aria-label="Search freezer"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={finished}
            onChange={(event) => setFinished(event.target.checked)}
          />
          Show finished batches
        </label>
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
            onClick={() => setFilter(role)}
          >
            {role === 'all' ? 'All cubes' : ROLE_NAMES[role]}
          </button>
        ))}
      </div>
      {batches.length ? (
        <div className="batch-grid">
          {batches.map((batch) => {
            const recipe = recipeById(batch.recipeId);
            const days = daysBetween(today, batch.useBy);
            return (
              <article
                className={`batch-card ${batch.remaining === 0 ? 'finished' : ''}`}
                key={batch.id}
              >
                <div className="batch-top">
                  <img src={recipe.image} alt="" loading="lazy" />
                  <div>
                    <span className={`tag role-${recipe.slot}`}>{ROLE_NAMES[recipe.slot]}</span>
                    <h2>
                      <Link to={`/recipes/${recipe.id}`}>{recipe.name}</Link>
                    </h2>
                    <span className="muted small">{batch.location || 'No location set'}</span>
                  </div>
                </div>
                <div className="batch-count">
                  <strong>
                    {batch.remaining}
                    <span> / {batch.total}</span>
                  </strong>
                  <span>cubes left</span>
                  <small>
                    {Math.floor(batch.remaining / batch.cubesPerServing)} whole recipe servings
                  </small>
                </div>
                <div className="stock-bar">
                  <span style={{ width: `${(batch.remaining / batch.total) * 100}%` }} />
                </div>
                <div className="batch-meta">
                  <span>
                    <Icon name="cube" size={15} />
                    {batch.mouldMl} ml · {batch.cubesPerServing} cubes / serving
                  </span>
                  <span>
                    <Icon name="calendar" size={15} />
                    Frozen {shortDate(batch.frozenOn)}
                  </span>
                  <span className={days < 0 ? 'danger' : days <= 7 ? 'amber-text' : ''}>
                    <Icon name="clock" size={15} />
                    {days < 0 ? 'Past use-by' : 'Use by'} {shortDate(batch.useBy)}
                  </span>
                </div>
                {batch.notes && <p className="batch-note">{batch.notes}</p>}
                <footer>
                  <span>{reserved.get(batch.id) ?? 0} cubes planned</span>
                  <button className="text-button" onClick={() => addBatch(recipe.id, batch.id)}>
                    Manage batch <Icon name="arrow" size={14} />
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="empty-state panel">
          <span className="empty-icon">
            <Icon name="freezer" size={32} />
          </span>
          <h2>{data.batches.length ? 'No batches match.' : 'Your next easy meal starts here.'}</h2>
          <p>
            {data.batches.length
              ? 'Try another search or include finished batches.'
              : 'Cook a recipe from your library, freeze it in molds, then log the cubes you packed.'}
          </p>
          <button className="button primary" onClick={() => addBatch()}>
            <Icon name="plus" size={17} />
            Add a frozen batch
          </button>
        </section>
      )}
    </>
  );
}
