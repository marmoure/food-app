import { formatDate } from '../domain/calendar';
import { VEG_CARE, type VegRunItem, vegRunDate } from '../domain/vegetables';
import { CheckItem } from './CheckItem';

interface Props {
  /** The plan week whose list the vegetable belongs to. */
  planWeek: number;
  scope: string;
  run: VegRunItem;
  /** Show the run's date next to the amount. */
  showDate?: boolean;
}

/** A vegetable to buy on its run, with how to pick, clean and store it. */
export function VegCheckItem({ planWeek, scope, run, showDate = false }: Props) {
  const care = VEG_CARE[run.veg];
  const date = formatDate(vegRunDate(planWeek, run.day));
  return (
    <CheckItem
      scope={scope}
      itemId={run.itemId}
      label={run.item.name}
      detail={showDate ? `${run.item.detail} · ${date}` : run.item.detail}
    >
      <details className="veg-care">
        <summary>Pick, clean, store</summary>
        <dl>
          <dt>Pick</dt>
          <dd>{care.pick}</dd>
          <dt>Clean</dt>
          <dd>{care.clean}</dd>
          <dt>Store</dt>
          <dd>
            {care.store} Keeps about {care.keepsDays} days.
          </dd>
        </dl>
      </details>
    </CheckItem>
  );
}
