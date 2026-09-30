import { createContext, useContext, useEffect, useState } from 'react';
import { startOfDay } from '../domain/calendar';

/** Lets tests (and future "preview another day" features) pin the date. */
export const TodayContext = createContext<Date | null>(null);

/** Today at local midnight. Refreshes when the app comes back to the foreground on a new day. */
export function useToday(): Date {
  const fixed = useContext(TodayContext);
  const [today, setToday] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    if (fixed) return;
    const refresh = () => {
      const now = startOfDay(new Date());
      setToday((prev) => (prev.getTime() === now.getTime() ? prev : now));
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [fixed]);

  return fixed ?? today;
}
