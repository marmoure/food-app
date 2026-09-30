import { describe, expect, it } from 'vitest';
import { dataReport } from './report';
import { emptyData } from './schema';

describe('dataReport', () => {
  const data = emptyData();
  data.checklists['2026-09-26'] = { items: { 'shop-0-0': true, 'sun-setup': true } };
  data.checklists.setup = { items: { 'eq-micro': true } };
  data.freezer.push({
    id: 'a',
    name: 'Loubia with beef',
    recipeId: 'loubia',
    portions: 4,
    frozenOn: '2026-09-27',
  });
  const report = dataReport(data, new Date(2026, 9, 1, 18, 30));

  it('names ticked and unticked shopping items', () => {
    expect(report).toContain('### Shopping: 1 of 30 bought');
    expect(report).toContain('- [x] Butcher: Lean beef chunks (épaule) (600 g · loubia)');
    expect(report).toContain('- [ ] Butcher: Lean beef mince (600 g · bolognese)');
  });

  it('lists Sunday steps, setup items and the freezer', () => {
    expect(report).toContain('- [x] Set up');
    expect(report).toContain('## Setup: 1 of');
    expect(report).toMatch(/- \[x\] Buy: equipment: .*/);
    expect(report).toContain('## Freezer: 4 portions (low)');
    expect(report).toContain('- 4 × Loubia with beef (frozen 2026-09-27, 4 days ago)');
  });

  it('shows the targets from the profile', () => {
    expect(report).toContain('Targets: 1700 kcal, 130 g protein');
  });
});
