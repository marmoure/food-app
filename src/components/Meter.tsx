import {
  MACRO_LABEL,
  MACRO_UNIT,
  type MacroKey,
  STATUS_LABEL,
  macroStatus,
} from '../domain/nutrition/status';

interface Props {
  macro: MacroKey;
  value: number;
  target: number;
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-GB');

/** One value against its target: a same-hue track and fill, with the numbers and status in text. */
export function Meter({ macro, value, target }: Props) {
  const status = macroStatus(macro, value, target);
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  const unit = MACRO_UNIT[macro];
  return (
    <div className={`meter-row m-${status}`}>
      <div className="meter-top">
        <span className="meter-label">{MACRO_LABEL[macro]}</span>
        <span className="meter-value">
          <b>{fmt(value)}</b> / {fmt(target)} {unit}
        </span>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-label={`${MACRO_LABEL[macro]}: ${fmt(value)} of ${fmt(target)} ${unit}, ${STATUS_LABEL[status]}`}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(target)}
      >
        <span className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
      {status !== 'ok' && <span className="meter-status">{STATUS_LABEL[status]}</span>}
    </div>
  );
}
