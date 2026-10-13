const DAY_MS = 86_400_000;

// Questions of form.json the tracking page is built on
export const TRACKING = {
  statusKey: 'status',
  startedValue: 'Started',
  startKey: 'creation_date',
  endKey: 'expiration_date',
};

export const TRACKING_STATES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  OVERDUE: 'overdue',       // past its expiration date and not finished
  DONE: 'done',
  DONE_LATE: 'done_late',   // finished after its expiration date
};

// Local calendar day as a UTC timestamp, to compare it with the YYYY-MM-DD answers
const dayOf = (date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
const parseDay = (value) => (typeof value === 'string' ? Date.parse(`${value}T00:00:00Z`) : NaN);

export const answerOf = (response, key) => response.answers.find((a) => a.questionKey === key)?.value;

export const isStarted = (response) => answerOf(response, TRACKING.statusKey) === TRACKING.startedValue;

// Where a response stands between its creation and expiration dates. Like the computed fields, it
// depends on today's date, so it is calculated on every read
export function trackingOf(response, now = new Date()) {
  const start = parseDay(answerOf(response, TRACKING.startKey));
  const end = parseDay(answerOf(response, TRACKING.endKey));
  const today = dayOf(now);
  const started = isStarted(response);
  const progress = started ? response.progress ?? 0 : 0;
  const completedAt = started ? response.completedAt ?? null : null;

  let state = TRACKING_STATES.NOT_STARTED;
  if (completedAt) {
    state = dayOf(completedAt) > end ? TRACKING_STATES.DONE_LATE : TRACKING_STATES.DONE;
  } else if (today > end) {
    state = TRACKING_STATES.OVERDUE;
  } else if (started) {
    state = TRACKING_STATES.IN_PROGRESS;
  }

  const days = (from, to) => (Number.isNaN(from) || Number.isNaN(to) ? null : (to - from) / DAY_MS);
  return {
    state,
    started,
    progress,
    completedAt,
    totalDays: days(start, end),       // from creation to expiration
    elapsedDays: days(start, today),   // negative before the creation date, above totalDays once expired
  };
}
