import { type ReactNode, useId } from 'react';
import { isChecked } from '../storage/selectors';
import { useAppData, useStore } from '../storage/context';

interface Props {
  scope: string;
  itemId: string;
  label: string;
  detail?: string;
  /** Extra content under the item, outside the label so it doesn't toggle the tick. */
  children?: ReactNode;
}

export function CheckItem({ scope, itemId, label, detail, children }: Props) {
  const store = useStore();
  const checked = isChecked(useAppData(), scope, itemId);
  const id = useId();
  return (
    <li>
      <label className="ck" htmlFor={id}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => store.setChecked(scope, itemId, e.target.checked)}
        />
        <span>
          {label}
          {detail && <small>{detail}</small>}
        </span>
      </label>
      {children && <div className="ck-more">{children}</div>}
    </li>
  );
}
