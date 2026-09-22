import { useId } from 'react';
import { weekKey } from '../domain/calendar';
import { useAppData, useStore } from '../storage/context';
import { isLightWeek } from '../storage/selectors';

export function LightWeekToggle({ planWeek }: { planWeek: number }) {
  const store = useStore();
  const light = isLightWeek(useAppData(), planWeek);
  const id = useId();
  return (
    <label className="toggle" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={light}
        onChange={(e) => store.setLightWeek(weekKey(planWeek), e.target.checked)}
      />
      Light week: freezer is full, skip the stew and soup
    </label>
  );
}
