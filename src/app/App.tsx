import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router';
import { Icon, type IconName } from '../components/Icon';
import { ThemePicker } from '../components/ThemePicker';
import { localDate } from '../domain/dates';
import { RECIPES } from '../domain/recipes';
import type { Slot } from '../domain/types';
import { useStore } from '../storage/context';
import { BatchForm, GenerateForm, MealForm, SettingsForm } from './Forms';
import { Dashboard } from './Dashboard';
import { Freezer } from './Freezer';
import { MonthlyPlan } from './MonthlyPlan';
import { RecipeDetail, Recipes } from './Recipes';
import { UIContext } from './ui-context';
import { Today } from './Today';
import { Cook } from './Cook';

type Dialog =
  | { type: 'batch'; recipeId?: string; batchId?: string }
  | { type: 'meal'; date: string; slot?: Slot; mealId?: string }
  | { type: 'generate' }
  | { type: 'settings' };
const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/today', label: 'Today', icon: 'sun' },
  { to: '/cook', label: 'Cook', icon: 'book' },
  { to: '/overview', label: 'Overview', icon: 'home' },
  { to: '/freezer', label: 'My freezer', icon: 'freezer' },
  { to: '/plan', label: 'Monthly plan', icon: 'calendar' },
  { to: '/recipes', label: 'Recipe library', icon: 'book' },
];

function Home() {
  return window.matchMedia?.('(max-width: 700px)').matches ? (
    <Navigate to="/today" replace />
  ) : (
    <Navigate to="/overview" replace />
  );
}

export function App() {
  const { data, status, error } = useStore();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = useCallback(() => setDialog(null), []);
  const cubes = data.batches.reduce((sum, batch) => sum + batch.remaining, 0);
  const current = NAV.find((item) =>
    item.to === '/' ? pathname === '/' : pathname.startsWith(item.to),
  );
  const ui = {
    month,
    setMonth,
    addBatch: (recipeId?: string, batchId?: string) =>
      setDialog({ type: 'batch', recipeId, batchId }),
    editMeal: (date: string, slot?: Slot, mealId?: string) =>
      setDialog({ type: 'meal', date, slot, mealId }),
    generate: () => setDialog({ type: 'generate' }),
  };
  return (
    <UIContext.Provider value={ui}>
      <div className="app-shell">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <aside className="sidebar">
          <Link to="/" className="brand">
            <span className="brand-icon">
              <Icon name="cube" size={27} />
            </span>
            <span>
              cube<span className="brand-light">kitchen</span>
              <small>COOK ONCE. EAT WELL.</small>
            </span>
          </Link>
          <p className="nav-label">YOUR KITCHEN</p>
          <nav aria-label="Main navigation">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} aria-label={item.label}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.to === '/freezer' && <span className="nav-count">{cubes}</span>}
                {item.to === '/recipes' && <span className="nav-count">{RECIPES.length}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-note">
            <div className="mini-cubes">
              <i />
              <i />
              <i />
            </div>
            <h3>
              A little prep.
              <br />A month of possibilities.
            </h3>
            <p>Make your favorites. Freeze in cubes. Mix, heat, eat.</p>
            <Link to="/recipes">
              Find your next batch <Icon name="arrow" size={15} />
            </Link>
          </div>
          <div className="sidebar-bottom">
            <button className="kitchen-profile" onClick={() => setDialog({ type: 'settings' })}>
              <span className="avatar">K</span>
              <span>
                <strong>My kitchen</strong>
                <small>
                  {data.settings.people} {data.settings.people === 1 ? 'person' : 'people'} ·{' '}
                  {data.settings.slots.length} daily slots
                </small>
              </span>
              <Icon name="settings" size={18} />
            </button>
            <span className={`save-status ${error ? 'save-error' : ''}`} role="status">
              <i />
              {status}
            </span>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              My kitchen <span>/</span>
              <strong>{current?.label ?? 'Recipe'}</strong>
            </div>
            <div className="topbar-right">
              <span className="today-date">
                {new Date().toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <ThemePicker />
              <button className="button primary small-button" onClick={() => ui.addBatch()}>
                <Icon name="plus" size={17} />
                Add batch
              </button>
            </div>
          </header>
          <main id="main" className="main-content">
            {error && (
              <div className="error-message" role="alert">
                {error}{' '}
                <button className="text-button" onClick={() => setDialog({ type: 'settings' })}>
                  Export backup
                </button>
              </div>
            )}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/overview" element={<Dashboard />} />
              <Route path="/today" element={<Today />} />
              <Route path="/cook" element={<Cook />} />
              <Route path="/cook/:id" element={<Cook />} />
              <Route path="/freezer" element={<Freezer />} />
              <Route path="/plan" element={<MonthlyPlan />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/recipes/:id" element={<RecipeDetail />} />
              <Route
                path="*"
                element={
                  <div className="empty-state">
                    <h1>Let’s get back to the kitchen.</h1>
                    <Link className="button primary" to="/">
                      Go to overview
                    </Link>
                  </div>
                }
              />
            </Routes>
            <footer className="page-footer">
              <span>
                <Icon name="cube" size={14} />A well-stocked freezer. An easier everyday.
              </span>
              <button onClick={() => setDialog({ type: 'settings' })}>Backup & restore</button>
            </footer>
          </main>
        </div>
      </div>
      {dialog?.type === 'batch' && (
        <BatchForm recipeId={dialog.recipeId} batchId={dialog.batchId} close={close} />
      )}
      {dialog?.type === 'meal' && (
        <MealForm date={dialog.date} slot={dialog.slot} mealId={dialog.mealId} close={close} />
      )}
      {dialog?.type === 'generate' && <GenerateForm month={month} close={close} />}
      {dialog?.type === 'settings' && <SettingsForm close={close} />}
    </UIContext.Provider>
  );
}
