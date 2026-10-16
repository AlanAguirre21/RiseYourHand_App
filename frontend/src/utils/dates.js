// Dates are shown as in the UK, day first: 16/10/2026. They travel and are stored as YYYY-MM-DD

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' });
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'short' });

// "2026-10-16" -> "16/10/2026" ("" for no date). Read from the text, so no time zone can move the day
export function formatDay(iso) {
  const [year, month, day] = String(iso ?? '').split('-');
  return year && month && day ? `${day}/${month}/${year}` : '';
}

// "16/10/2026" -> "2026-10-16", or "" if it is not complete or not a real day (31/02/2026)
export function parseDay(text) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(text).trim());
  if (!match) return '';
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso) ? iso : '';
}

// A moment as "16/10/2026", its local day
export const formatDate = date => dateFormat.format(new Date(date));

// A moment (e.g. when a response was sent) as "16/10/2026, 10:30", in local time
export const formatDateTime = date => dateTimeFormat.format(new Date(date));
