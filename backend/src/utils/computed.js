const DAY_MS = 86_400_000;

const OPS = {
  days_since: (date, today) => (today - date) / DAY_MS,
  days_until: (date, today) => (date - today) / DAY_MS,
};

// Resolves the "computed" fields of a form against the answers of one response.
// They depend on today's date, so they are calculated on every read instead of being stored
export function computeFields(form, answers, now = new Date()) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const byKey = new Map(answers.map(a => [a.questionKey, a.value]));

  return form.sections.flatMap(s => s.computed ?? []).map(c => {
    const source = byKey.get(c.source);
    const value = source ? OPS[c.op](Date.parse(`${source}T00:00:00Z`), today) : null;
    return { key: c.key, text: c.text, value };
  });
}
