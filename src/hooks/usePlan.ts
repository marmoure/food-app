import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { type PlanPosition, planWeekForRotation, positionOf, weekKey } from '../domain/calendar';
import type { Rotation } from '../domain/types';
import { useToday } from './useToday';

export function usePosition(): PlanPosition {
  const today = useToday();
  return useMemo(() => positionOf(today), [today]);
}

export interface SelectedWeek {
  rotation: Rotation;
  planWeek: number;
  weekKey: string;
  isCurrent: boolean;
  select: (rotation: Rotation) => void;
}

function parseWeekParam(value: string | null): Rotation | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 4 ? ((n - 1) as Rotation) : null;
}

/** The rotation week being viewed, from `?week=1..4`, defaulting to the current one. */
export function useSelectedWeek(): SelectedWeek {
  const position = usePosition();
  const [params, setParams] = useSearchParams();
  const rotation = parseWeekParam(params.get('week')) ?? position.rotation;
  const planWeek = planWeekForRotation(rotation, position);
  return {
    rotation,
    planWeek,
    weekKey: weekKey(planWeek),
    isCurrent: position.started && rotation === position.rotation,
    select: (r) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('week', String(r + 1));
          return next;
        },
        { replace: true },
      ),
  };
}
