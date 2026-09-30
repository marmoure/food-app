import { monthName, shiftMonth } from '../domain/dates';
import { useUI } from '../app/ui-context';
import { Icon } from './Icon';

export function MonthSwitcher() {
  const { month, setMonth } = useUI();
  return (
    <div className="month-switcher">
      <button
        className="icon-button"
        aria-label="Previous month"
        onClick={() => setMonth(shiftMonth(month, -1))}
      >
        <Icon name="left" size={17} />
      </button>
      <label>
        <Icon name="calendar" size={17} />
        <span>{monthName(month)}</span>
        <input
          type="month"
          aria-label="Plan month"
          value={month}
          onChange={(event) => {
            if (/^\d{4}-\d{2}$/.test(event.target.value)) setMonth(event.target.value);
          }}
        />
      </label>
      <button
        className="icon-button"
        aria-label="Next month"
        onClick={() => setMonth(shiftMonth(month, 1))}
      >
        <Icon name="right" size={17} />
      </button>
    </div>
  );
}
