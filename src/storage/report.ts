import {
  PLAN_START,
  daysBetween,
  formatDate,
  formatWeekRange,
  fromIsoDate,
  positionOf,
  rotationOf,
  weekKey,
} from '../domain/calendar';
import { ageInDays, freezerStatus, isStale, oldestFirst, totalPortions } from '../domain/freezer';
import { ACTIVITY_LABEL, GOAL_LABEL, targetsFor } from '../domain/nutrition/targets';
import { rotationWeek, shopItemId } from '../domain/rotation';
import { SETUP } from '../domain/setup';
import { sundaySession, sundayStepItemId } from '../domain/sunday';
import { type AppData, SETUP_SCOPE } from './schema';
import { isChecked, isLightWeek, profileOf } from './selectors';
import { BATCH_LOGGED_ITEM } from './store';

const box = (done: boolean, text: string) => `- [${done ? 'x' : ' '}] ${text}`;

function weekSection(data: AppData, planWeek: number): string[] {
  const key = weekKey(planWeek);
  const rotation = rotationOf(planWeek);
  const w = rotationWeek(rotation);
  const light = isLightWeek(data, planWeek);
  const lines = [
    `## Week ${rotation + 1} · ${formatWeekRange(planWeek)} (\`${key}\`)`,
    '',
    `Light week: ${light ? 'yes' : 'no'} · Freezer batch logged: ${isChecked(data, key, BATCH_LOGGED_ITEM) ? 'yes' : 'no'}`,
    '',
  ];

  const shopping = w.shopping.flatMap((sec, si) =>
    sec.items.map((item, ii) => ({
      done: isChecked(data, key, shopItemId(si, ii)),
      text: `${sec.title}: ${item.name} (${item.detail})`,
    })),
  );
  const bought = shopping.filter((i) => i.done).length;
  lines.push(`### Shopping: ${bought} of ${shopping.length} bought`, '');
  lines.push(...shopping.map((i) => box(i.done, i.text)), '');

  const { steps } = sundaySession(rotation, light);
  const stepsDone = steps.filter((s) => isChecked(data, key, sundayStepItemId(s))).length;
  lines.push(`### Sunday cook: ${stepsDone} of ${steps.length} steps done`, '');
  lines.push(...steps.map((s) => box(isChecked(data, key, sundayStepItemId(s)), s.title)), '');
  return lines;
}

/** Plan weeks that have anything saved, plus the current one, in order. */
function weeksToShow(data: AppData, today: Date): number[] {
  const weeks = new Set([positionOf(today).planWeek]);
  for (const key of Object.keys(data.checklists)) {
    const d = key === SETUP_SCOPE ? null : fromIsoDate(key);
    if (d) weeks.add(Math.round(daysBetween(PLAN_START, d) / 7));
  }
  return [...weeks].sort((a, b) => a - b);
}

/**
 * Everything the app has saved, as readable Markdown with real names instead of tick ids.
 * Written next to the JSON so the data can be read without the app.
 */
export function dataReport(data: AppData, now: Date): string {
  const profile = profileOf(data);
  const targets = targetsFor(profile);
  const lines = [
    '# Sunday Kitchen: saved data',
    '',
    `Written by the app on ${formatDate(now)} at ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}. Don't edit this file; the app rewrites it on every change.`,
    '',
  ];

  const portions = totalPortions(data.freezer);
  lines.push(`## Freezer: ${portions} portions (${freezerStatus(portions)})`, '');
  if (data.freezer.length === 0) lines.push('Empty.');
  for (const item of oldestFirst(data.freezer)) {
    const age = ageInDays(item, now);
    const ageText = age === null ? '' : `, ${age} days ago`;
    const stale = isStale(item, now) ? ' **(eat soon)**' : '';
    lines.push(`- ${item.portions} × ${item.name} (frozen ${item.frozenOn}${ageText})${stale}`);
  }
  lines.push('');

  for (const planWeek of weeksToShow(data, now)) lines.push(...weekSection(data, planWeek));

  const setup = SETUP.flatMap((g) =>
    g.items.map((i) => ({
      done: isChecked(data, SETUP_SCOPE, i.id),
      text: `${g.title}: ${i.label}`,
    })),
  );
  lines.push(`## Setup: ${setup.filter((i) => i.done).length} of ${setup.length} done`, '');
  lines.push(...setup.map((i) => box(i.done, i.text)), '');

  lines.push(
    `## Profile${data.profile ? '' : ' (default, not edited)'}`,
    '',
    `${profile.sex}, ${profile.age}, ${profile.heightCm} cm, ${profile.weightKg} kg · ${ACTIVITY_LABEL[profile.activity]} · ${GOAL_LABEL[profile.goal]}`,
    `Targets: ${targets.kcal} kcal, ${targets.protein} g protein, ${targets.fiber} g fibre a day`,
    '',
  );
  return lines.join('\n');
}
