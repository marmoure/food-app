import { NavLink, Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';
import { formatWeekRange } from '../domain/calendar';
import { usePosition } from '../hooks/usePlan';
import { useStoreSnapshot } from '../storage/context';
import { isLightWeek } from '../storage/selectors';

const TABS = [
  { to: '/', label: 'Today' },
  { to: '/week', label: 'Week plan' },
  { to: '/sunday', label: 'Sunday cook' },
  { to: '/shopping', label: 'Shopping' },
  { to: '/recipes', label: 'Recipes' },
  { to: '/nutrition', label: 'Nutrition' },
  { to: '/freezer', label: 'Freezer' },
  { to: '/start', label: 'Start here' },
] as const;

/** Tabs that show a rotation week keep the selected `?week=` when switching between them. */
const WEEK_AWARE = new Set(['/week', '/sunday', '/shopping', '/recipes', '/nutrition']);

export function Layout() {
  const { data, saveState } = useStoreSnapshot();
  const position = usePosition();
  const { pathname, search } = useLocation();
  const week = new URLSearchParams(search).get('week');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const daysToStart = -position.dayIndex;
  return (
    <div className="wrap">
      <header className="top">
        <div>
          <div className="eyebrow">Weekly food system · one person</div>
          <h1>Sunday Kitchen</h1>
          <p className="tag">
            Shop on Saturday, cook for about 2½ hours on Sunday, then only reheat Monday to Friday.
            Halal, mild, and no raw onion or garlic.
          </p>
        </div>
        <div className="weekpill">
          {position.started ? (
            <>
              <b>Week {position.rotation + 1} of 4</b>
              <span className="muted small">
                {formatWeekRange(position.planWeek)}
                {isLightWeek(data, position.planWeek) && ' · light week'}
              </span>
            </>
          ) : (
            <>
              <b>Starts Saturday 26 September</b>
              <span className="muted small">
                {daysToStart} day{daysToStart === 1 ? '' : 's'} to get set up
              </span>
            </>
          )}
          <span className="sync" role="status">
            {saveState === 'error'
              ? "Couldn't save. Is storage full or blocked?"
              : 'Saved on this device'}
          </span>
        </div>
      </header>

      <nav className="tabs" aria-label="Sections">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={week && WEEK_AWARE.has(t.to) ? `${t.to}?week=${week}` : t.to}
            end={t.to === '/'}
            className="tab"
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <main className="panel">
        <Outlet />
      </main>
    </div>
  );
}
