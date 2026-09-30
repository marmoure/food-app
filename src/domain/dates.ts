export const localDate = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const parseDate = (date: string): Date => new Date(`${date}T12:00:00`);
export const validDate = (date: unknown): date is string =>
  typeof date === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(parseDate(date).getTime()) &&
  localDate(parseDate(date)) === date;
export function daysInMonth(month: string): string[] {
  const date = parseDate(`${month}-01`);
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from(
    { length: count },
    (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`,
  );
}
export function shiftMonth(month: string, offset: number): string {
  const date = parseDate(`${month}-01`);
  date.setMonth(date.getMonth() + offset);
  return localDate(date).slice(0, 7);
}
export function nextMonthDate(day: string): string {
  const date = parseDate(day);
  const next = shiftMonth(day.slice(0, 7), 1);
  return `${next}-${String(Math.min(date.getDate(), daysInMonth(next).length)).padStart(2, '0')}`;
}
export const monthName = (month: string): string =>
  parseDate(`${month}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
export const shortDate = (day: string): string =>
  parseDate(day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export const daysBetween = (a: string, b: string): number =>
  Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
