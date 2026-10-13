import { AGE_BUCKETS, MANITA_COLORS, MONTHS, OTHER_COLOR, STATUSES, TOP_CHAMPIONS } from '../constants/dashboard.js';

const DAY_MS = 86_400_000;

// Questions of form.json the dashboard is built on
const KEYS = { color: 'color', champion: 'champion', created: 'creation_date' };

const parseDay = value => Date.parse(`${value}T00:00:00Z`);
// Local calendar day of a moment, comparable with parseDay
const dayOf = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

const percent = (part, total) => (total ? (part / total) * 100 : null);

// One flat row per manita, with what the charts count
export function toRows(responses) {
  return responses.map(response => {
    const answers = new Map(response.answers.map(a => [a.questionKey, a.value]));
    const { tracking } = response;
    const created = typeof answers.get(KEYS.created) === 'string' ? answers.get(KEYS.created) : null;
    const completed = tracking.completedAt != null;

    return {
      id: response.id,
      color: answers.get(KEYS.color) ?? null,
      champion: String(answers.get(KEYS.champion) ?? '').trim().replace(/\s+/g, ' '),
      created,                                  // YYYY-MM-DD
      status: completed ? 'completed' : tracking.started ? 'in_progress' : 'not_started',
      onTime: tracking.state === 'done',        // completed on or before its expiration date
      // From the creation date to the day it reached 100%
      daysToComplete: completed && created
        ? Math.max(0, (dayOf(new Date(tracking.completedAt)) - parseDay(created)) / DAY_MS)
        : null,
      ageDays: Math.max(0, tracking.elapsedDays ?? 0),   // since the creation date, up to today
    };
  });
}

// "from" and "to" are YYYY-MM-DD or empty; they are compared with the creation date of the manita
export function filterByDate(rows, from, to) {
  if (!from && !to) return rows;
  return rows.filter(r => r.created && (!from || r.created >= from) && (!to || r.created <= to));
}

const count = (rows, test) => rows.reduce((n, r) => n + (test(r) ? 1 : 0), 0);

export function summarize(rows) {
  const total = rows.length;
  const done = rows.filter(r => r.status === 'completed');
  const open = rows.filter(r => r.status !== 'completed');
  const timed = done.filter(r => r.daysToComplete != null);

  const byColor = MANITA_COLORS.map(c => ({ ...c, value: count(rows, r => r.color === c.key) }));
  const otherColors = count(rows, r => !MANITA_COLORS.some(c => c.key === r.color));
  if (otherColors > 0) byColor.push({ ...OTHER_COLOR, value: otherColors });

  // Same champion whatever the case and the accents; shown as it was written the first time
  const champions = new Map();
  for (const r of open) {
    if (!r.champion) continue;
    const key = r.champion.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const entry = champions.get(key) ?? { key, label: r.champion, value: 0 };
    entry.value += 1;
    champions.set(key, entry);
  }

  const ageOf = r => (r.ageDays > 30 ? 'old' : r.ageDays >= 8 ? 'medium' : 'recent');

  return {
    total,
    open: open.length,
    completed: done.length,
    completedPercent: percent(done.length, total),
    averageDays: timed.length ? timed.reduce((sum, r) => sum + r.daysToComplete, 0) / timed.length : null,
    compliancePercent: percent(count(done, r => r.onTime), done.length),
    byColor,
    byStatus: STATUSES.map(s => ({ ...s, value: count(rows, r => r.status === s.key) })),
    topChampions: [...champions.values()]
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es'))
      .slice(0, TOP_CHAMPIONS),
    aging: AGE_BUCKETS.map(b => ({ ...b, value: count(open, r => ageOf(r) === b.key) })),
    // By the month of the creation date: how many manitas, and how many of those are completed
    monthly: MONTHS.map((label, month) => {
      const inMonth = rows.filter(r => r.created && Number(r.created.slice(5, 7)) === month + 1);
      const completed = count(inMonth, r => r.status === 'completed');
      return { key: label, label, total: inMonth.length, completed, percent: percent(completed, inMonth.length) };
    }),
  };
}

export const formatPercent = value => (value == null ? '—' : `${Math.round(value)}%`);
