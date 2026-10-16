const DAY_MS = 86_400_000;

// With this many days left or fewer, "expiration_status" warns that the date is close
export const EXPIRING_SOON_DAYS = 7;

const daysUntil = (date, today) => (date - today) / DAY_MS;

function expirationStatus(date, today) {
  const days = daysUntil(date, today);
  if (days < 0) return 'Vencida';
  if (days === 0) return 'Vence hoy';
  if (days <= EXPIRING_SOON_DAYS) return 'Por vencer';
  return 'En tiempo';
}

// Number of days for days_since / days_until, a text for expiration_status
const OPS = {
  days_since: (date, today) => (today - date) / DAY_MS,
  days_until: daysUntil,
  expiration_status: expirationStatus,
};

// In a "template", {folio} is the number of the response instead of an answer
export const FOLIO_KEY = 'folio';
const PLACEHOLDER = /\{([^{}]+)\}/g;

// Keys a template uses: "{folio}_{a|b}" -> ['folio', 'a', 'b']
export const templateKeys = template =>
  [...template.matchAll(PLACEHOLDER)].flatMap(m => m[1].split('|').map(k => k.trim()));

// Each {a|b} becomes the first of those answers that is not empty, or nothing
function fillTemplate(template, byKey) {
  return template.replace(PLACEHOLDER, (_, keys) => {
    const value = keys.split('|').map(k => byKey.get(k.trim())).find(v => v != null && v !== '' && !(Array.isArray(v) && !v.length));
    return value == null ? '' : Array.isArray(value) ? value.join(', ') : String(value);
  });
}

// Resolves the "computed" fields of a form against the answers (and folio) of one response.
// Some depend on today's date, so they are calculated on every read instead of being stored
export function computeFields(form, answers, { folio = null, now = new Date() } = {}) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const byKey = new Map(answers.map(a => [a.questionKey, a.value]));
  byKey.set(FOLIO_KEY, folio);

  return form.sections.flatMap(s => s.computed ?? []).map(c => {
    if (c.op === 'template') return { key: c.key, text: c.text, value: fillTemplate(c.template, byKey) };
    const source = byKey.get(c.source);
    const value = source ? OPS[c.op](Date.parse(`${source}T00:00:00Z`), today) : null;
    return { key: c.key, text: c.text, value };
  });
}
