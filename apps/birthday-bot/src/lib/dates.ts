export interface Birthday {
  name: string;
  date: string; // "MM-DD"
  message: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function isValidMonthDay(month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Feb allows 29 (leap-safe)
  return day >= 1 && day <= daysInMonth[month - 1];
}

export function toDateString(month: number, day: number): string {
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatPretty(dateStr: string): string {
  const [m, d] = dateStr.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}`;
}

/** Days from `today` (inclusive of today = 0) until the next occurrence of MM-DD. */
export function daysUntilNext(dateStr: string, today: Date = new Date()): number {
  const [m, d] = dateStr.split('-').map(Number);
  const year = today.getFullYear();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let next = new Date(year, m - 1, d);
  if (next < todayMidnight) {
    next = new Date(year + 1, m - 1, d);
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((next.getTime() - todayMidnight.getTime()) / msPerDay);
}

export function sortByUpcoming(entries: Birthday[], today: Date = new Date()): Birthday[] {
  return [...entries].sort((a, b) => daysUntilNext(a.date, today) - daysUntilNext(b.date, today));
}

export function sortByCalendar(entries: Birthday[]): Birthday[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

export function relativeLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'Today 🎉';
  if (daysUntil === 1) return 'Tomorrow';
  return `In ${daysUntil} days`;
}
