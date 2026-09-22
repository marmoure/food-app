import type { Source } from '../domain/types';

const LABELS: Record<Source, string> = {
  fridge: 'Fridge',
  freezer: 'Freezer',
  fresh: 'Cook fresh',
  free: 'Free',
  grab: 'Grab',
};

export function SourceChip({ source }: { source: Source }) {
  return <span className={`src src-${source}`}>{LABELS[source]}</span>;
}
